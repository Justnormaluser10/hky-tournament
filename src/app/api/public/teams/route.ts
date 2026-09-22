import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStandings } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        players: {
          select: {
            id: true,
            name: true,
            jerseyNumber: true,
            position: true,
            isCaptain: true,
          },
          orderBy: { jerseyNumber: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get standings to enrich team cards with W/D/L/Pts
    const { standings } = await calculateStandings();
    const standingsMap = new Map(standings.map((s) => [s.teamId, s]));

    const enrichedTeams = teams.map((team) => {
      const standing = standingsMap.get(team.id);
      const stats = standing
        ? {
            position: standing.position,
            played: standing.played,
            won: standing.won,
            drawn: standing.drawn,
            lost: standing.lost,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            goalDifference: standing.goalDifference,
            points: standing.points,
          }
        : {
            position: 0,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          };

      const captain = team.players.find((p) => p.isCaptain) || null;

      return {
        ...team,
        logo: null,
        captain,
        playerCount: team.players.length,
        stats,
      };
    });

    return NextResponse.json({ teams: enrichedTeams });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}
