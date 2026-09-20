import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import { advanceKnockoutWinner, syncKnockoutSeeds, checkLeagueStageStatus } from '@/lib/engine';
import { invalidateTournamentCache } from '@/lib/tournamentCache';

async function syncMatchScoreFromEvents(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      tournamentId: true,
      teamAId: true,
      teamBId: true,
      status: true,
      round: true,
      matchNumber: true,
    },
  });

  if (!match) return null;

  const goalEvents = await prisma.matchEvent.findMany({
    where: { matchId, type: 'GOAL' },
  });

  const newScoreA = match.teamAId
    ? goalEvents.filter((e) => e.teamId === match.teamAId).length
    : 0;
  const newScoreB = match.teamBId
    ? goalEvents.filter((e) => e.teamId === match.teamBId).length
    : 0;

  let winnerId: string | null = null;
  if (match.status === 'COMPLETED') {
    if (newScoreA > newScoreB) {
      winnerId = match.teamAId;
    } else if (newScoreB > newScoreA) {
      winnerId = match.teamBId;
    }
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      teamAScore: newScoreA,
      teamBScore: newScoreB,
      winnerId,
    },
    include: {
      teamA: { select: { id: true, name: true, shortName: true } },
      teamB: { select: { id: true, name: true, shortName: true } },
    },
  });

  try {
    await advanceKnockoutWinner(updated.id);
    await syncKnockoutSeeds(updated.tournamentId);
  } catch (e) {
    console.warn('Knockout sync error:', e);
  }

  try {
    if (updated.round === 'LEAGUE') {
      const leagueStatus = await checkLeagueStageStatus(updated.tournamentId);
      const tournament = await prisma.tournament.findUnique({
        where: { id: updated.tournamentId },
      });
      if (tournament) {
        if (tournament.currentStage === 'LEAGUE' && leagueStatus.isComplete) {
          await prisma.tournament.update({
            where: { id: tournament.id },
            data: { currentStage: 'LEAGUE_COMPLETE' },
          });
        } else if (tournament.currentStage === 'LEAGUE_COMPLETE' && !leagueStatus.isComplete) {
          await prisma.tournament.update({
            where: { id: tournament.id },
            data: { currentStage: 'LEAGUE' },
          });
        }
      }
    }
  } catch (e) {
    console.warn('League status error:', e);
  }

  invalidateTournamentCache('matches');

  return updated;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: matchId } = params;
    const body = await req.json();
    const { teamId, playerId, type, minute, notes } = body;

    if (!teamId || !type || minute === undefined) {
      return NextResponse.json(
        { error: 'Team, event type, and minute are required.' },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { teamA: true, teamB: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (teamId !== match.teamAId && teamId !== match.teamBId) {
      return NextResponse.json(
        { error: 'Event team must be one of the match teams.' },
        { status: 400 }
      );
    }

    if (playerId) {
      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (!player || player.teamId !== teamId) {
        return NextResponse.json(
          { error: 'Player does not belong to the selected team.' },
          { status: 400 }
        );
      }
    }

    const event = await prisma.matchEvent.create({
      data: {
        matchId,
        teamId,
        playerId: playerId || null,
        type,
        minute: Number(minute),
        notes: notes?.trim() || null,
      },
      include: {
        player: { select: { id: true, name: true, jerseyNumber: true } },
        team: { select: { id: true, name: true, shortName: true } },
      },
    });

    const updatedMatch = await syncMatchScoreFromEvents(matchId);

    if (type === 'GOAL') {
      await logActivity(
        auth.admin.email,
        'MATCH_EVENT_GOAL',
        `Goal recorded in Match #${match.matchNumber} by ${
          event.player ? event.player.name : event.team.name
        } at ${event.minute}'. Updated score: ${updatedMatch?.teamAScore ?? match.teamAScore}–${updatedMatch?.teamBScore ?? match.teamBScore}`
      );
    } else {
      await logActivity(
        auth.admin.email,
        'MATCH_EVENT_CARD',
        `${type} recorded for ${event.player ? event.player.name : event.team.name} in Match #${
          match.matchNumber
        } (${event.minute}')`
      );
    }

    return NextResponse.json({ success: true, event, match: updatedMatch });
  } catch (error: any) {
    console.error('Error recording match event:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: matchId } = params;
    const body = await req.json();
    const { eventId, id: bodyEventId, teamId, playerId, type, minute, notes } = body;
    const targetEventId = eventId || bodyEventId;

    if (!targetEventId) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    if (!teamId || !type || minute === undefined) {
      return NextResponse.json(
        { error: 'Team, event type, and minute are required.' },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { teamA: true, teamB: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (teamId !== match.teamAId && teamId !== match.teamBId) {
      return NextResponse.json(
        { error: 'Event team must be one of the match teams.' },
        { status: 400 }
      );
    }

    const existingEvent = await prisma.matchEvent.findUnique({
      where: { id: targetEventId },
    });

    if (!existingEvent || existingEvent.matchId !== matchId) {
      return NextResponse.json({ error: 'Event not found on this match.' }, { status: 404 });
    }

    if (playerId) {
      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (!player || player.teamId !== teamId) {
        return NextResponse.json(
          { error: 'Player does not belong to the selected team.' },
          { status: 400 }
        );
      }
    }

    const updatedEvent = await prisma.matchEvent.update({
      where: { id: targetEventId },
      data: {
        teamId,
        playerId: playerId || null,
        type,
        minute: Number(minute),
        notes: notes !== undefined ? notes?.trim() || null : undefined,
      },
      include: {
        player: { select: { id: true, name: true, jerseyNumber: true } },
        team: { select: { id: true, name: true, shortName: true } },
      },
    });

    const updatedMatch = await syncMatchScoreFromEvents(matchId);

    await logActivity(
      auth.admin.email,
      'MATCH_EVENT_EDITED',
      `Match #${match.matchNumber} event updated: ${updatedEvent.type} at ${updatedEvent.minute}' (${updatedEvent.player?.name ?? updatedEvent.team.shortName}). Updated score: ${updatedMatch?.teamAScore ?? match.teamAScore}–${updatedMatch?.teamBScore ?? match.teamBScore}`
    );

    return NextResponse.json({ success: true, event: updatedEvent, match: updatedMatch });
  } catch (error: any) {
    console.error('Error editing match event:', error);
    return NextResponse.json({ error: 'Failed to edit event' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: matchId } = params;
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId },
      include: { player: true, team: true },
    });

    if (!event || event.matchId !== matchId) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });

    await prisma.matchEvent.delete({ where: { id: eventId } });

    const updatedMatch = await syncMatchScoreFromEvents(matchId);

    await logActivity(
      auth.admin.email,
      'DELETE_MATCH_EVENT',
      `Event (${event.type}) by ${event.player ? event.player.name : event.team.name} removed from Match #${
        match?.matchNumber ?? ''
      }. Score: ${updatedMatch?.teamAScore ?? 0}–${updatedMatch?.teamBScore ?? 0}`
    );

    return NextResponse.json({ success: true, message: 'Event deleted successfully.', match: updatedMatch });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}

