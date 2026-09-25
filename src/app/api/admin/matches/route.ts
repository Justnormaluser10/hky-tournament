import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import { syncKnockoutSeeds, advanceKnockoutWinner, checkLeagueStageStatus, generateKnockoutStages } from '@/lib/engine';
import { parseIstDate } from '@/lib/dateUtils';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const matches = await prisma.match.findMany({
      include: {
        teamA: { select: { id: true, name: true, shortName: true, logo: true, primaryColor: true } },
        teamB: { select: { id: true, name: true, shortName: true, logo: true, primaryColor: true } },
        events: {
          include: {
            player: { select: { id: true, name: true, jerseyNumber: true } },
            team: { select: { id: true, shortName: true } },
          },
          orderBy: { minute: 'asc' },
        },
        bestDefender: { select: { id: true, name: true, jerseyNumber: true, teamId: true } },
        motm: { select: { id: true, name: true, jerseyNumber: true, teamId: true } },
        knockout: true,
      },
      orderBy: [{ matchNumber: 'asc' }, { date: 'asc' }],
    });

    return NextResponse.json({ matches });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { round, teamAId, teamBId, date, time, venue, status, notes, bestDefenderId, motmId } = body;

    if (!teamAId || !teamBId) {
      return NextResponse.json({ error: 'Both teams are required.' }, { status: 400 });
    }

    if (teamAId === teamBId) {
      return NextResponse.json({ error: 'A team cannot play against itself.' }, { status: 400 });
    }

    const tournament = await prisma.tournament.findFirst();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    const lastMatch = await prisma.match.findFirst({
      where: { tournamentId: tournament.id },
      orderBy: { matchNumber: 'desc' },
    });

    const matchNumber = (lastMatch?.matchNumber || 0) + 1;

    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        matchNumber,
        round: round || 'LEAGUE',
        teamAId,
        teamBId,
        teamAScore: 0,
        teamBScore: 0,
        date: date ? new Date(date) : new Date(),
        time: time || '17:30',
        venue: venue || 'Pitch 1 - Main Turf',
        status: status || 'UPCOMING',
        notes: notes?.trim() || null,
        bestDefenderId: bestDefenderId || null,
        motmId: motmId || null,
      },
      include: {
        teamA: { select: { name: true, shortName: true } },
        teamB: { select: { name: true, shortName: true } },
        bestDefender: { select: { id: true, name: true, jerseyNumber: true, teamId: true } },
        motm: { select: { id: true, name: true, jerseyNumber: true, teamId: true } },
      },
    });

    await logActivity(
      auth.admin.email,
      'CREATE_MATCH',
      `Scheduled Match #${match.matchNumber}: ${match.teamA?.name || 'TBD'} vs ${match.teamB?.name || 'TBD'}`
    );

    return NextResponse.json({ success: true, match });
  } catch (error: any) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Failed to schedule match' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      id,
      teamAScore,
      teamBScore,
      status,
      round,
      date,
      time,
      venue,
      notes,
      teamAId,
      teamBId,
      bestDefenderId,
      motmId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Match ID is required.' }, { status: 400 });
    }

    const currentMatch = await prisma.match.findUnique({
      where: { id },
      include: { teamA: true, teamB: true },
    });

    if (!currentMatch) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const finalTeamAId = teamAId !== undefined ? teamAId : currentMatch.teamAId;
    const finalTeamBId = teamBId !== undefined ? teamBId : currentMatch.teamBId;

    if (finalTeamAId && finalTeamBId && finalTeamAId === finalTeamBId) {
      return NextResponse.json(
        { error: 'Home team and away team cannot be the same team.' },
        { status: 400 }
      );
    }

    if (finalTeamAId) {
      const teamA = await prisma.team.findUnique({ where: { id: finalTeamAId } });
      if (!teamA) {
        return NextResponse.json({ error: 'Home team not found.' }, { status: 404 });
      }
    }
    if (finalTeamBId) {
      const teamB = await prisma.team.findUnique({ where: { id: finalTeamBId } });
      if (!teamB) {
        return NextResponse.json({ error: 'Away team not found.' }, { status: 404 });
      }
    }

    const teamsChanged =
      (teamAId !== undefined && teamAId !== currentMatch.teamAId) ||
      (teamBId !== undefined && teamBId !== currentMatch.teamBId);

    if (teamsChanged) {
      // Remove any events belonging to teams that are no longer part of this match
      const validTeamIds = [finalTeamAId, finalTeamBId].filter(Boolean) as string[];
      await prisma.matchEvent.deleteMany({
        where: {
          matchId: id,
          teamId: { notIn: validTeamIds },
        },
      });

      // Clean up any event where playerId no longer matches the event's team
      const remainingEvents = await prisma.matchEvent.findMany({
        where: { matchId: id },
        include: { player: true },
      });

      for (const ev of remainingEvents) {
        if (ev.playerId && ev.player && ev.player.teamId !== ev.teamId) {
          await prisma.matchEvent.update({
            where: { id: ev.id },
            data: { playerId: null },
          });
        }
      }
    }

    // Recalculate score from goal events if events exist, otherwise use submitted scores
    const goalEvents = await prisma.matchEvent.findMany({
      where: { matchId: id, type: 'GOAL' },
    });

    let newTeamAScore: number;
    let newTeamBScore: number;

    if (goalEvents.length > 0) {
      newTeamAScore = finalTeamAId
        ? goalEvents.filter((e) => e.teamId === finalTeamAId).length
        : 0;
      newTeamBScore = finalTeamBId
        ? goalEvents.filter((e) => e.teamId === finalTeamBId).length
        : 0;
    } else {
      newTeamAScore = teamAScore !== undefined ? Number(teamAScore) : currentMatch.teamAScore;
      newTeamBScore = teamBScore !== undefined ? Number(teamBScore) : currentMatch.teamBScore;
    }

    const newStatus = status !== undefined ? status : currentMatch.status;

    let winnerId: string | null = null;
    if (newStatus === 'COMPLETED') {
      if (newTeamAScore > newTeamBScore) {
        winnerId = finalTeamAId || currentMatch.teamAId;
      } else if (newTeamBScore > newTeamAScore) {
        winnerId = finalTeamBId || currentMatch.teamBId;
      }
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        teamAId: finalTeamAId || null,
        teamBId: finalTeamBId || null,
        teamAScore: newTeamAScore,
        teamBScore: newTeamBScore,
        status: newStatus,
        winnerId,
        round: round || undefined,
        date: date
          ? (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)
              ? parseIstDate(date, time !== undefined ? time : currentMatch.time)
              : new Date(date))
          : undefined,
        scheduledAt: date
          ? (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)
              ? parseIstDate(date, time !== undefined ? time : currentMatch.time)
              : new Date(date))
          : (date === null ? null : undefined),
        time: time !== undefined ? time : undefined,
        venue: venue !== undefined ? venue : undefined,
        notes: notes !== undefined ? notes : undefined,
        bestDefenderId: bestDefenderId !== undefined ? (bestDefenderId || null) : undefined,
        motmId: motmId !== undefined ? (motmId || null) : undefined,
      },
      include: {
        teamA: { select: { id: true, name: true, shortName: true } },
        teamB: { select: { id: true, name: true, shortName: true } },
        events: {
          include: {
            player: { select: { id: true, name: true, jerseyNumber: true } },
            team: { select: { id: true, shortName: true } },
          },
          orderBy: { minute: 'asc' },
        },
        bestDefender: { select: { id: true, name: true, jerseyNumber: true, teamId: true } },
        motm: { select: { id: true, name: true, jerseyNumber: true, teamId: true } },
      },
    });


    // Automatically advance knockout winners or trigger seeding recalculation
    try {
      await advanceKnockoutWinner(updated.id);
      await syncKnockoutSeeds(updated.tournamentId);
    } catch (e) {
      console.warn('Knockout sync/progression warning:', e);
    }

    // Automatically check league stage completion to manage persistent LEAGUE <-> KNOCKOUT state
    try {
      if (updated.round === 'LEAGUE') {
        const tournament = await prisma.tournament.findUnique({
          where: { id: updated.tournamentId },
        });

        if (tournament) {
          const leagueStatus = await checkLeagueStageStatus(tournament.id);

          if (leagueStatus.isComplete) {
            // Once all required league matches are completed, activate knockout stage and lock top 4
            const knockoutCount = await prisma.knockoutMatch.count({
              where: { match: { tournamentId: tournament.id } },
            });

            if (knockoutCount === 0) {
              await generateKnockoutStages(tournament.id);
              await logActivity(
                auth.admin.email,
                'LEAGUE_COMPLETED_KNOCKOUT_ACTIVATED',
                `All ${leagueStatus.completedMatches}/${leagueStatus.expectedMatches} league fixtures finished! Officially activated IPL-style knockout stage for top 4 teams.`
              );
            } else if (tournament.currentStage === 'LEAGUE' || tournament.currentStage === 'LEAGUE_COMPLETE') {
              await prisma.tournament.update({
                where: { id: tournament.id },
                data: { currentStage: 'KNOCKOUT' },
              });
            }
          } else if (!leagueStatus.isComplete) {
            // If a completed league score was reverted or modified so league is incomplete again
            if (['KNOCKOUT', 'LEAGUE_COMPLETE'].includes(tournament.currentStage)) {
              // Check if any knockout match was already played
              const playedKnockouts = await prisma.knockoutMatch.count({
                where: {
                  match: {
                    tournamentId: tournament.id,
                    status: { in: ['COMPLETED', 'LIVE'] },
                  },
                },
              });

              if (playedKnockouts === 0) {
                // Safely remove unplayed knockout matches and reset to LEAGUE
                const pendingKnockoutMatches = await prisma.knockoutMatch.findMany({
                  where: { match: { tournamentId: tournament.id } },
                  select: { id: true, matchId: true },
                });
                const matchIds = pendingKnockoutMatches.map((k) => k.matchId);
                await prisma.knockoutMatch.deleteMany({
                  where: { id: { in: pendingKnockoutMatches.map((k) => k.id) } },
                });
                await prisma.matchEvent.deleteMany({
                  where: { matchId: { in: matchIds } },
                });
                await prisma.match.deleteMany({
                  where: { id: { in: matchIds } },
                });

                await prisma.tournament.update({
                  where: { id: tournament.id },
                  data: { currentStage: 'LEAGUE' },
                });
              } else {
                await prisma.tournament.update({
                  where: { id: tournament.id },
                  data: { currentStage: 'LEAGUE' },
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('League completion check warning:', e);
    }

    // Comprehensive Activity Logging
    if (teamsChanged) {
      await logActivity(
        auth.admin.email,
        'MATCH_TEAMS_CHANGED',
        `Admin changed Match #${updated.matchNumber} teams to ${updated.teamA?.name || 'TBD'} vs ${updated.teamB?.name || 'TBD'}.`
      );
    }

    const scoreChanged =
      currentMatch.teamAScore !== updated.teamAScore || currentMatch.teamBScore !== updated.teamBScore;

    if (currentMatch.bestDefenderId !== updated.bestDefenderId) {
      const awardWinner = updated.bestDefender ? `${updated.bestDefender.name} (#${updated.bestDefender.jerseyNumber})` : 'Cleared';
      await logActivity(
        auth.admin.email,
        'BEST_DEFENDER_AWARDED',
        `Best Defender for Match #${updated.matchNumber} set to: ${awardWinner}`
      );
    }

    if (currentMatch.motmId !== updated.motmId) {
      const awardWinner = updated.motm ? `${updated.motm.name} (#${updated.motm.jerseyNumber})` : 'Cleared';
      await logActivity(
        auth.admin.email,
        'MOTM_AWARDED',
        `Man of the Match for Match #${updated.matchNumber} set to: ${awardWinner}`
      );
    }

    if (scoreChanged) {
      await logActivity(
        auth.admin.email,
        'SCORE_EDITED',
        `Admin changed Match #${updated.matchNumber} (${updated.teamA?.name || 'TBD'} vs ${updated.teamB?.name || 'TBD'}) score from ${currentMatch.teamAScore}–${currentMatch.teamBScore} to ${updated.teamAScore}–${updated.teamBScore}. (Status: ${updated.status})`
      );
    } else if (!teamsChanged && currentMatch.bestDefenderId === updated.bestDefenderId && currentMatch.motmId === updated.motmId) {
      await logActivity(
        auth.admin.email,
        'MATCH_UPDATED',
        `Updated Match #${updated.matchNumber}: ${updated.teamA?.name || 'TBD'} vs ${updated.teamB?.name || 'TBD'}`
      );
    }

    return NextResponse.json({ success: true, match: updated });
  } catch (error: any) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Match ID is required.' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: { teamA: true, teamB: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    await prisma.match.delete({ where: { id } });

    await logActivity(
      auth.admin.email,
      'DELETE_MATCH',
      `Deleted Match #${match.matchNumber}: ${match.teamA?.name || 'TBD'} vs ${match.teamB?.name || 'TBD'}`
    );

    return NextResponse.json({ success: true, message: 'Match deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}
