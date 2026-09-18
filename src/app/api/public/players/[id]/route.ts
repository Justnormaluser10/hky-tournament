import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            primaryColor: true,
            coach: true,
          },
        },
        matchEvents: {
          include: {
            match: {
              include: {
                teamA: { select: { shortName: true } },
                teamB: { select: { shortName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const teamMatchesCount = await prisma.match.count({
      where: {
        status: 'COMPLETED',
        OR: [{ teamAId: player.teamId }, { teamBId: player.teamId }],
      },
    });

    const goals = player.matchEvents.filter((e) => e.type === 'GOAL').length;
    const yellowCards = player.matchEvents.filter((e) => e.type === 'YELLOW_CARD').length;
    const redCards = player.matchEvents.filter((e) => e.type === 'RED_CARD').length;

    let cleanSheets = 0;
    let goalsConceded = 0;

    if (player.position === 'GOALKEEPER') {
      const teamMatches = await prisma.match.findMany({
        where: {
          status: 'COMPLETED',
          OR: [{ teamAId: player.teamId }, { teamBId: player.teamId }],
        },
      });

      for (const m of teamMatches) {
        const conceded = m.teamAId === player.teamId ? m.teamBScore : m.teamAScore;
        goalsConceded += conceded;
        if (conceded === 0) cleanSheets += 1;
      }
    }

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        jerseyNumber: player.jerseyNumber,
        position: player.position,
        photo: player.photo,
        status: player.status,
        isCaptain: player.isCaptain,
        team: player.team,
        stats: {
          matches: teamMatchesCount,
          goals,
          yellowCards,
          redCards,
          goalsConceded: player.position === 'GOALKEEPER' ? goalsConceded : null,
          cleanSheets: player.position === 'GOALKEEPER' ? cleanSheets : null,
        },
        events: player.matchEvents,
      },
    });
  } catch (error: any) {
    console.error('Error fetching player profile:', error);
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}
