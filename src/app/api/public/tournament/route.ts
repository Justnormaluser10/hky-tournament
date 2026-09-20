import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tournament = await prisma.tournament.findFirst({
      include: {
        _count: {
          select: {
            teams: true,
            matches: true,
            announcements: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const completedMatchesCount = await prisma.match.count({
      where: { tournamentId: tournament.id, status: 'COMPLETED' },
    });

    const totalPlayersCount = await prisma.player.count({
      where: { team: { tournamentId: tournament.id } },
    });

    return NextResponse.json({
      tournament,
      stats: {
        totalTeams: tournament._count.teams,
        totalPlayers: totalPlayersCount,
        totalMatches: tournament._count.matches,
        completedMatches: completedMatchesCount,
        announcementsCount: tournament._count.announcements,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
