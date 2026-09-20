import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncKnockoutSeeds, checkLeagueStageStatus } from '@/lib/engine';
import { toCleanLogoUrl } from '@/lib/logoUrl';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tournament = await prisma.tournament.findFirst();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const leagueStatus = await checkLeagueStageStatus(tournament.id);
    const knockoutCount = await prisma.knockoutMatch.count({
      where: { match: { tournamentId: tournament.id } },
    });

    const isKnockoutActive =
      leagueStatus.isComplete &&
      knockoutCount > 0 &&
      [
        'KNOCKOUT',
        'QUARTER_FINALS',
        'SEMI_FINALS',
        'FINAL',
        'COMPLETED',
      ].includes(tournament.currentStage);

    if (!isKnockoutActive) {
      return NextResponse.json({
        tournament,
        tournamentStage: tournament.currentStage,
        format: tournament.format,
        qualificationCount: tournament.qualificationCount,
        knockoutMatches: [],
        isKnockoutActive: false,
        message: 'Playoffs pending league completion and administrator activation.',
      });
    }

    try {
      await syncKnockoutSeeds(tournament.id);
    } catch {
      // ignore sync errors if any
    }

    const knockoutMatches = await prisma.knockoutMatch.findMany({
      where: { match: { tournamentId: tournament.id } },
      include: {
        match: {
          include: {
            teamA: {
              select: {
                id: true,
                name: true,
                shortName: true,
                primaryColor: true,
              },
            },
            teamB: {
              select: {
                id: true,
                name: true,
                shortName: true,
                primaryColor: true,
              },
            },
            events: {
              where: { type: 'GOAL' },
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
      tournament,
      tournamentStage: tournament.currentStage,
      format: tournament.format,
      qualificationCount: tournament.qualificationCount,
      knockoutMatches: cleanedKnockoutMatches,
      isKnockoutActive: true,
    });
  } catch (error: any) {
    console.error('Error fetching knockout bracket:', error);
    return NextResponse.json({ error: 'Failed to fetch knockout stage' }, { status: 500 });
  }
}
