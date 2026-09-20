import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import { checkLeagueStageStatus, generateKnockoutStages, advanceKnockoutWinner } from '@/lib/engine';
import { toCleanLogoUrl } from '@/lib/logoUrl';
import { invalidateTournamentCache } from '@/lib/tournamentCache';

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
        primaryColor: true,
      },
      orderBy: { name: 'asc' },
    });

    const knockoutMatches = await prisma.knockoutMatch.findMany({
      where: { match: { tournamentId: tournament.id } },
      include: {
        match: {
          include: {
            teamA: {
              select: { id: true, name: true, shortName: true, primaryColor: true },
            },
            teamB: {
              select: { id: true, name: true, shortName: true, primaryColor: true },
            },
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
      orderBy: [{ stage: 'desc' }, { bracketOrder: 'asc' }],
    });

    const cleanedTeams = teams.map((t) => ({
      ...t,
      logo: `/api/public/teams/${t.id}/logo`,
    }));

    const cleanedKnockoutMatches = knockoutMatches.map((k) => ({
      ...k,
      match: {
        ...k.match,
        teamA: k.match.teamA
          ? { ...k.match.teamA, logo: `/api/public/teams/${k.match.teamA.id}/logo` }
          : null,
        teamB: k.match.teamB
          ? { ...k.match.teamB, logo: `/api/public/teams/${k.match.teamB.id}/logo` }
          : null,
      },
    }));

    return NextResponse.json({
      knockoutMatches: cleanedKnockoutMatches,
      tournament,
      leagueStatus,
      teams: cleanedTeams,
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
    const { knockoutMatchId, teamAId, teamBId } = body;

    if (!knockoutMatchId) {
      return NextResponse.json({ error: 'Knockout Match ID is required.' }, { status: 400 });
    }

    if (!teamAId || !teamBId) {
      return NextResponse.json({ error: 'Both Team A and Team B must be selected.' }, { status: 400 });
    }

    if (teamAId === teamBId) {
      return NextResponse.json({ error: 'A team cannot play against itself.' }, { status: 400 });
    }

    const knockoutMatch = await prisma.knockoutMatch.findUnique({
      where: { id: knockoutMatchId },
      include: { match: true },
    });

    if (!knockoutMatch) {
      return NextResponse.json({ error: 'Knockout match not found.' }, { status: 404 });
    }

    const teamA = await prisma.team.findUnique({ where: { id: teamAId } });
    const teamB = await prisma.team.findUnique({ where: { id: teamBId } });

    if (!teamA || !teamB) {
      return NextResponse.json({ error: 'One or both selected teams could not be found.' }, { status: 404 });
    }

    let winnerId = knockoutMatch.match.winnerId;
    if (winnerId && winnerId !== teamAId && winnerId !== teamBId) {
      if (knockoutMatch.match.teamAScore > knockoutMatch.match.teamBScore) {
        winnerId = teamAId;
      } else if (knockoutMatch.match.teamBScore > knockoutMatch.match.teamAScore) {
        winnerId = teamBId;
      } else {
        winnerId = null;
      }
    }

    const updatedMatch = await prisma.match.update({
      where: { id: knockoutMatch.matchId },
      data: {
        teamAId,
        teamBId,
        winnerId,
        notes: knockoutMatch.match.notes
          ? `${knockoutMatch.match.notes.replace(/\s*\[MANUAL_SEED\].*$/, '')} [MANUAL_SEED]`
          : `[MANUAL_SEED] Custom fixture: ${teamA.name} vs ${teamB.name}`,
      },
    });

    const updatedKnockout = await prisma.knockoutMatch.update({
      where: { id: knockoutMatchId },
      data: {
        seedLabelA: teamA.name,
        seedLabelB: teamB.name,
      },
    });

    if (updatedMatch.status === 'COMPLETED') {
      try {
        await advanceKnockoutWinner(updatedMatch.id);
      } catch (e) {
        console.warn('Knockout progression warning:', e);
      }
    }

    await logActivity(
      auth.admin.email,
      'EDIT_KNOCKOUT_TEAMS',
      `Updated teams for Match #${knockoutMatch.match.matchNumber} (${knockoutMatch.stage}): ${teamA.name} vs ${teamB.name}`
    );

    invalidateTournamentCache('matches');

    return NextResponse.json({
      success: true,
      knockoutMatch: updatedKnockout,
      match: updatedMatch,
    });
  } catch (error: any) {
    console.error('Error updating knockout match teams:', error);
    return NextResponse.json({ error: error.message || 'Failed to update knockout teams' }, { status: 500 });
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

    invalidateTournamentCache('matches');
    invalidateTournamentCache('tournament');

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
