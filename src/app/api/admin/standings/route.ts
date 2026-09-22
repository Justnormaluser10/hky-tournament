import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import { calculateStandings } from '@/lib/engine';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const tournament = await prisma.tournament.findFirst();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    const [standingsResult, overrides] = await Promise.all([
      calculateStandings(tournament.id),
      prisma.standingOverride.findMany({
        where: { tournamentId: tournament.id },
        include: { team: { select: { id: true, name: true, shortName: true } } },
      }),
    ]);

    return NextResponse.json({
      standings: standingsResult.standings,
      tournament: standingsResult.tournament,
      overrides,
    });
  } catch (error: any) {
    console.error('Error fetching admin standings:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      teamId,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      position,
      notes,
    } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required.' }, { status: 400 });
    }

    const tournament = await prisma.tournament.findFirst();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    const parseNum = (val: any) =>
      val !== undefined && val !== null && val !== '' ? Number(val) : null;

    const dataPayload = {
      played: parseNum(played),
      won: parseNum(won),
      drawn: parseNum(drawn),
      lost: parseNum(lost),
      goalsFor: parseNum(goalsFor),
      goalsAgainst: parseNum(goalsAgainst),
      goalDifference: parseNum(goalDifference),
      points: parseNum(points),
      position: parseNum(position),
      notes: notes ? String(notes).trim() : null,
    };

    const override = await prisma.standingOverride.upsert({
      where: { teamId },
      create: {
        tournamentId: tournament.id,
        teamId,
        ...dataPayload,
      },
      update: {
        ...dataPayload,
      },
      include: { team: true },
    });

    await logActivity(
      auth.admin.email,
      'STANDINGS_OVERRIDE_UPDATED',
      `Manual standings correction applied for ${team.name}: Pts=${dataPayload.points ?? 'Auto'}, Pos=${dataPayload.position ?? 'Auto'}, P=${dataPayload.played ?? 'Auto'}, W=${dataPayload.won ?? 'Auto'}, D=${dataPayload.drawn ?? 'Auto'}, L=${dataPayload.lost ?? 'Auto'}, GF=${dataPayload.goalsFor ?? 'Auto'}, GA=${dataPayload.goalsAgainst ?? 'Auto'}, GD=${dataPayload.goalDifference ?? 'Auto'}`
    );

    const updatedStandings = await calculateStandings(tournament.id);

    return NextResponse.json({
      success: true,
      override,
      standings: updatedStandings.standings,
    });
  } catch (error: any) {
    console.error('Error saving standings override:', error);
    return NextResponse.json({ error: 'Failed to save standings correction' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const resetAll = searchParams.get('resetAll') === 'true';

    const tournament = await prisma.tournament.findFirst();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    if (resetAll) {
      await prisma.standingOverride.deleteMany({
        where: { tournamentId: tournament.id },
      });

      await logActivity(
        auth.admin.email,
        'STANDINGS_OVERRIDE_RESET_ALL',
        'All manual standings corrections were reset to automatic match calculation.'
      );
    } else if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      await prisma.standingOverride.deleteMany({
        where: { teamId },
      });

      await logActivity(
        auth.admin.email,
        'STANDINGS_OVERRIDE_RESET',
        `Standings correction for ${team?.name || teamId} reset to automatic match calculation.`
      );
    } else {
      return NextResponse.json({ error: 'teamId or resetAll=true is required.' }, { status: 400 });
    }

    const updatedStandings = await calculateStandings(tournament.id);

    return NextResponse.json({
      success: true,
      message: 'Standings successfully reset to automatic match results.',
      standings: updatedStandings.standings,
    });
  } catch (error: any) {
    console.error('Error resetting standings override:', error);
    return NextResponse.json({ error: 'Failed to reset standings' }, { status: 500 });
  }
}
