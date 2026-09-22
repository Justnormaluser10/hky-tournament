import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import {
  calculateTopScorers,
  calculateTopGoalkeepers,
  calculateBestDefenders,
  calculateManOfTheMatches,
} from '@/lib/engine';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const tournament = await prisma.tournament.findFirst();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    const [topScorers, topGoalkeepers, bestDefenders, manOfTheMatches, statOverrides, players, teams] =
      await Promise.all([
        calculateTopScorers(tournament.id),
        calculateTopGoalkeepers(tournament.id),
        calculateBestDefenders(tournament.id),
        calculateManOfTheMatches(tournament.id),
        prisma.playerStatOverride.findMany({
          where: { tournamentId: tournament.id },
          include: { player: { include: { team: true } } },
        }),
        prisma.player.findMany({
          where: { team: { tournamentId: tournament.id } },
          include: { team: { select: { id: true, name: true, shortName: true } } },
          orderBy: [{ team: { name: 'asc' } }, { jerseyNumber: 'asc' }],
        }),
        prisma.team.findMany({
          where: { tournamentId: tournament.id },
          select: { id: true, name: true, shortName: true, logo: true },
        }),
      ]);

    return NextResponse.json({
      topScorers,
      topGoalkeepers,
      bestDefenders,
      manOfTheMatches,
      statOverrides,
      players,
      teams,
    });
  } catch (error: any) {
    console.error('Error fetching admin statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      playerId,
      goals,
      goalsConceded,
      cleanSheets,
      matchesPlayed,
      bestDefenderAwards,
      motmAwards,
      notes,
    } = body;

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required.' }, { status: 400 });
    }

    const tournament = await prisma.tournament.findFirst();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: true },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found.' }, { status: 404 });
    }

    const parseNum = (val: any) =>
      val !== undefined && val !== null && val !== '' ? Number(val) : null;

    const dataPayload = {
      goals: parseNum(goals),
      goalsConceded: parseNum(goalsConceded),
      cleanSheets: parseNum(cleanSheets),
      matchesPlayed: parseNum(matchesPlayed),
      bestDefenderAwards: parseNum(bestDefenderAwards),
      motmAwards: parseNum(motmAwards),
      notes: notes ? String(notes).trim() : null,
    };

    const override = await prisma.playerStatOverride.upsert({
      where: { playerId },
      create: {
        tournamentId: tournament.id,
        playerId,
        ...dataPayload,
      },
      update: {
        ...dataPayload,
      },
      include: { player: { include: { team: true } } },
    });

    const changedParts: string[] = [];
    if (dataPayload.goals !== null) changedParts.push(`Goals: ${dataPayload.goals}`);
    if (dataPayload.goalsConceded !== null) changedParts.push(`GA: ${dataPayload.goalsConceded}`);
    if (dataPayload.cleanSheets !== null) changedParts.push(`Clean Sheets: ${dataPayload.cleanSheets}`);
    if (dataPayload.bestDefenderAwards !== null) changedParts.push(`Best Defender: ${dataPayload.bestDefenderAwards}`);
    if (dataPayload.motmAwards !== null) changedParts.push(`MOTM: ${dataPayload.motmAwards}`);

    await logActivity(
      auth.admin.email,
      'STATISTICS_OVERRIDE_UPDATED',
      `Manual statistics correction for #${player.jerseyNumber} ${player.name} (${player.team.shortName}): ${changedParts.join(', ') || 'Updated'}`
    );

    const [topScorers, topGoalkeepers, bestDefenders, manOfTheMatches] = await Promise.all([
      calculateTopScorers(tournament.id),
      calculateTopGoalkeepers(tournament.id),
      calculateBestDefenders(tournament.id),
      calculateManOfTheMatches(tournament.id),
    ]);

    return NextResponse.json({
      success: true,
      override,
      topScorers,
      topGoalkeepers,
      bestDefenders,
      manOfTheMatches,
    });
  } catch (error: any) {
    console.error('Error saving statistics override:', error);
    return NextResponse.json({ error: 'Failed to save statistics correction' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');
    const field = searchParams.get('field'); // Optional: 'goals', 'goalkeeper', 'bestDefender', 'motm'
    const resetAll = searchParams.get('resetAll') === 'true';

    const tournament = await prisma.tournament.findFirst();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    if (resetAll) {
      await prisma.playerStatOverride.deleteMany({
        where: { tournamentId: tournament.id },
      });

      await logActivity(
        auth.admin.email,
        'STATISTICS_OVERRIDE_RESET_ALL',
        'All manual statistics corrections were reset to automatic match records.'
      );
    } else if (playerId) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: { team: true },
      });

      if (field) {
        // Clear specific field on existing override
        const existing = await prisma.playerStatOverride.findUnique({ where: { playerId } });
        if (existing) {
          const updateData: any = {};
          if (field === 'goals') updateData.goals = null;
          if (field === 'goalkeeper') {
            updateData.goalsConceded = null;
            updateData.cleanSheets = null;
            updateData.matchesPlayed = null;
          }
          if (field === 'bestDefender') updateData.bestDefenderAwards = null;
          if (field === 'motm') updateData.motmAwards = null;

          await prisma.playerStatOverride.update({
            where: { playerId },
            data: updateData,
          });
        }
      } else {
        await prisma.playerStatOverride.deleteMany({
          where: { playerId },
        });
      }

      await logActivity(
        auth.admin.email,
        'STATISTICS_OVERRIDE_RESET',
        `Statistics correction for ${player?.name || playerId} reset to automatic match calculation.`
      );
    } else {
      return NextResponse.json({ error: 'playerId or resetAll=true is required.' }, { status: 400 });
    }

    const [topScorers, topGoalkeepers, bestDefenders, manOfTheMatches] = await Promise.all([
      calculateTopScorers(tournament.id),
      calculateTopGoalkeepers(tournament.id),
      calculateBestDefenders(tournament.id),
      calculateManOfTheMatches(tournament.id),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Statistics successfully reset to automatic match results.',
      topScorers,
      topGoalkeepers,
      bestDefenders,
      manOfTheMatches,
    });
  } catch (error: any) {
    console.error('Error resetting statistics override:', error);
    return NextResponse.json({ error: 'Failed to reset statistics' }, { status: 500 });
  }
}
