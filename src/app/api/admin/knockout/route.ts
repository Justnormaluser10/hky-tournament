import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import { checkLeagueStageStatus, generateKnockoutStages, advanceKnockoutWinner, getKnockoutData } from '@/lib/engine';
import { saveKnockoutOverride, getKnockoutOverrides } from '@/lib/knockoutOverrides';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const tournament = await prisma.tournament.findFirst();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const leagueStatus = await checkLeagueStageStatus(tournament.id);

    const teams = await prisma.team.findMany({
      where: { tournamentId: tournament.id },
      select: {
        id: true,
        name: true,
        shortName: true,
        logo: true,
        primaryColor: true,
      },
      orderBy: { name: 'asc' },
    });

    const knockoutMatches = await prisma.knockoutMatch.findMany({
      where: { match: { tournamentId: tournament.id } },
      include: {
        match: {
          include: {
            teamA: true,
            teamB: true,
            events: {
              include: {
                player: { select: { id: true, name: true, jerseyNumber: true } },
                team: { select: { id: true, shortName: true } },
              },
              orderBy: { minute: 'asc' },
            },
          },
        },
      },
      orderBy: { bracketOrder: 'asc' },
    });

    let previewMatches: any[] = [];
    if (knockoutMatches.length === 0) {
      const koData = await getKnockoutData(tournament.id);
      previewMatches = koData.knockoutMatches;
    }

    return NextResponse.json({
      knockoutMatches,
      previewMatches,
      isPreview: knockoutMatches.length === 0,
      tournament,
      leagueStatus,
      teams,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch knockout data' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { knockoutMatchId, teamAId, teamBId, teamAScore, teamBScore, status } = body;

    if (!knockoutMatchId) {
      return NextResponse.json({ error: 'Knockout Match ID is required.' }, { status: 400 });
    }

    const tournament = await prisma.tournament.findFirst();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    // 1. PREVIEW MATCH HANDLING (When league is incomplete or knockouts not yet generated in DB)
    if (knockoutMatchId.startsWith('preview-')) {
      let stage = 'QUALIFIER_1';
      if (knockoutMatchId.includes('elim')) stage = 'ELIMINATOR';
      else if (knockoutMatchId.includes('q2')) stage = 'QUALIFIER_2';
      else if (knockoutMatchId.includes('final')) stage = 'FINAL';

      // Validation: Same team check
      if (
        teamAId &&
        teamBId &&
        teamAId !== 'NO_TEAM' &&
        teamBId !== 'NO_TEAM' &&
        teamAId === teamBId
      ) {
        return NextResponse.json(
          { error: 'A team cannot play against itself. Please select two distinct teams.' },
          { status: 400 }
        );
      }

      const overrideData: any = {};

      if (teamAId !== undefined) {
        if (teamAId === 'NO_TEAM' || teamAId === '' || teamAId === null) {
          overrideData.teamAId = 'NO_TEAM';
          overrideData.seedLabelA = 'NO TEAM';
          overrideData.isManualSeedA = true;
        } else {
          const teamA = await prisma.team.findUnique({ where: { id: teamAId } });
          overrideData.teamAId = teamAId;
          overrideData.seedLabelA = teamA ? teamA.name : 'Team A';
          overrideData.isManualSeedA = true;
        }
      }

      if (teamBId !== undefined) {
        if (teamBId === 'NO_TEAM' || teamBId === '' || teamBId === null) {
          overrideData.teamBId = 'NO_TEAM';
          overrideData.seedLabelB = 'NO TEAM';
          overrideData.isManualSeedB = true;
        } else {
          const teamB = await prisma.team.findUnique({ where: { id: teamBId } });
          overrideData.teamBId = teamBId;
          overrideData.seedLabelB = teamB ? teamB.name : 'Team B';
          overrideData.isManualSeedB = true;
        }
      }

      if (teamAScore !== undefined) overrideData.teamAScore = Number(teamAScore);
      if (teamBScore !== undefined) overrideData.teamBScore = Number(teamBScore);
      if (status !== undefined) overrideData.status = status;

      saveKnockoutOverride(stage, overrideData);

      const koData = await getKnockoutData(tournament.id);
      const updatedKoMatch = koData.knockoutMatches.find((k: any) => k.stage === stage);

      await logActivity(
        auth.admin.email,
        'EDIT_KNOCKOUT_PREVIEW',
        `Updated Projected Playoff ${stage}: ${updatedKoMatch?.match?.teamA?.name || updatedKoMatch?.seedLabelA || 'TBD'} vs ${updatedKoMatch?.match?.teamB?.name || updatedKoMatch?.seedLabelB || 'TBD'}`
      );

      return NextResponse.json({
        success: true,
        isPreview: true,
        knockoutMatch: updatedKoMatch,
      });
    }

    // 2. REAL DATABASE KNOCKOUT MATCH HANDLING
    const knockoutMatch = await prisma.knockoutMatch.findUnique({
      where: { id: knockoutMatchId },
      include: { match: true },
    });

    if (!knockoutMatch) {
      return NextResponse.json({ error: 'Knockout match not found.' }, { status: 404 });
    }

    // Determine final team A
    let finalTeamAId: string | null = knockoutMatch.match.teamAId;
    let finalSeedLabelA: string | null = knockoutMatch.seedLabelA;
    if (teamAId !== undefined) {
      if (teamAId === 'NO_TEAM' || teamAId === '' || teamAId === null) {
        finalTeamAId = null;
        finalSeedLabelA = 'NO TEAM';
      } else {
        const teamA = await prisma.team.findUnique({ where: { id: teamAId } });
        finalTeamAId = teamA ? teamA.id : null;
        finalSeedLabelA = teamA ? teamA.name : knockoutMatch.seedLabelA;
      }
    }

    // Determine final team B
    let finalTeamBId: string | null = knockoutMatch.match.teamBId;
    let finalSeedLabelB: string | null = knockoutMatch.seedLabelB;
    if (teamBId !== undefined) {
      if (teamBId === 'NO_TEAM' || teamBId === '' || teamBId === null) {
        finalTeamBId = null;
        finalSeedLabelB = 'NO TEAM';
      } else {
        const teamB = await prisma.team.findUnique({ where: { id: teamBId } });
        finalTeamBId = teamB ? teamB.id : null;
        finalSeedLabelB = teamB ? teamB.name : knockoutMatch.seedLabelB;
      }
    }

    // Same-team check (only applies if both are real teams)
    if (finalTeamAId && finalTeamBId && finalTeamAId === finalTeamBId) {
      return NextResponse.json({ error: 'A team cannot play against itself. Please select two distinct teams.' }, { status: 400 });
    }

    const newScoreA = teamAScore !== undefined ? Number(teamAScore) : knockoutMatch.match.teamAScore;
    const newScoreB = teamBScore !== undefined ? Number(teamBScore) : knockoutMatch.match.teamBScore;
    const newStatus = status !== undefined ? status : knockoutMatch.match.status;

    let winnerId: string | null = null;
    if (newStatus === 'COMPLETED') {
      if (newScoreA > newScoreB) {
        winnerId = finalTeamAId;
      } else if (newScoreB > newScoreA) {
        winnerId = finalTeamBId;
      } else {
        winnerId = knockoutMatch.match.winnerId || finalTeamAId;
      }
    }

    const teamsChanged =
      (teamAId !== undefined && teamAId !== knockoutMatch.match.teamAId) ||
      (teamBId !== undefined && teamBId !== knockoutMatch.match.teamBId);

    const updatedMatch = await prisma.match.update({
      where: { id: knockoutMatch.matchId },
      data: {
        teamAId: finalTeamAId,
        teamBId: finalTeamBId,
        teamAScore: newScoreA,
        teamBScore: newScoreB,
        status: newStatus,
        winnerId,
        notes: teamsChanged
          ? `${(knockoutMatch.match.notes || '').replace(/\s*\[MANUAL_SEED\].*$/, '')} [MANUAL_SEED]`
          : undefined,
      },
    });

    const updatedKnockout = await prisma.knockoutMatch.update({
      where: { id: knockoutMatchId },
      data: {
        seedLabelA: finalSeedLabelA,
        seedLabelB: finalSeedLabelB,
      },
    });

    try {
      await advanceKnockoutWinner(updatedMatch.id);
    } catch (e) {
      console.warn('Knockout progression warning:', e);
    }

    await logActivity(
      auth.admin.email,
      'EDIT_KNOCKOUT_MATCH',
      `Updated Match #${knockoutMatch.match.matchNumber} (${knockoutMatch.stage}): ${finalSeedLabelA || 'TBD'} vs ${finalSeedLabelB || 'TBD'} (Score: ${newScoreA}-${newScoreB}, Status: ${newStatus})`
    );

    return NextResponse.json({
      success: true,
      knockoutMatch: updatedKnockout,
      match: updatedMatch,
    });
  } catch (error: any) {
    console.error('Error updating knockout match teams:', error);
    return NextResponse.json({ error: error.message || 'Failed to update knockout match' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const tournament = await prisma.tournament.findFirst();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    // Optional confirmation check from body
    let body = {};
    try {
      body = await req.json();
    } catch {}

    // STRICT REQUIREMENT 20: Prevent invalid activation by validating league completion on backend
    const leagueStatus = await checkLeagueStageStatus(tournament.id);
    if (!leagueStatus.isComplete) {
      const pendingTeams = leagueStatus.teamsStatus
        .filter((t) => !t.isComplete)
        .map((t) => `${t.name} (${t.completedMatches}/${t.requiredMatches})`)
        .join(', ');

      return NextResponse.json(
        {
          error: `Cannot activate knockout stage. League stage is not complete yet (${leagueStatus.completedMatches}/${leagueStatus.expectedMatches} matches completed). Pending teams: ${pendingTeams || 'None'}. All teams must finish all required league matches before knockout activation.`,
          leagueStatus,
        },
        { status: 400 }
      );
    }

    const result = await generateKnockoutStages(tournament.id);

    await logActivity(
      auth.admin.email,
      'MOVE_TO_KNOCKOUT',
      `Advanced tournament to Knockout Stage: Generated ${result.matchesCount} fixtures for Top ${tournament.qualificationCount || 4} qualifying teams.`
    );

    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id },
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      tournament: updatedTournament,
    });
  } catch (error: any) {
    console.error('Error generating knockout stages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate knockout bracket' },
      { status: 500 }
    );
  }
}
