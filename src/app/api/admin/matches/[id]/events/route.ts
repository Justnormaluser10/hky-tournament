import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';

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

    // Create event
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
        player: true,
        team: true,
      },
    });

    // If GOAL, update the match score automatically
    if (type === 'GOAL') {
      const isTeamA = teamId === match.teamAId;
      const newScoreA = isTeamA ? match.teamAScore + 1 : match.teamAScore;
      const newScoreB = !isTeamA ? match.teamBScore + 1 : match.teamBScore;

      await prisma.match.update({
        where: { id: matchId },
        data: {
          teamAScore: newScoreA,
          teamBScore: newScoreB,
        },
      });

      await logActivity(
        auth.admin.email,
        'MATCH_EVENT_GOAL',
        `Goal recorded in Match #${match.matchNumber} by ${
          event.player ? event.player.name : event.team.name
        } at ${event.minute}'. New score: ${newScoreA}–${newScoreB}`
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

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Error recording match event:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
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

    // If GOAL was deleted, decrement score
    if (event.type === 'GOAL' && match) {
      const isTeamA = event.teamId === match.teamAId;
      const newScoreA = isTeamA ? Math.max(0, match.teamAScore - 1) : match.teamAScore;
      const newScoreB = !isTeamA ? Math.max(0, match.teamBScore - 1) : match.teamBScore;

      await prisma.match.update({
        where: { id: matchId },
        data: {
          teamAScore: newScoreA,
          teamBScore: newScoreB,
        },
      });

      await logActivity(
        auth.admin.email,
        'DELETE_MATCH_EVENT',
        `Goal by ${event.player ? event.player.name : event.team.name} removed from Match #${
          match.matchNumber
        }. Score updated: ${newScoreA}–${newScoreB}`
      );
    }

    return NextResponse.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
