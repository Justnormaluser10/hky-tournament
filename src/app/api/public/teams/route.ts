import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStandings } from '@/lib/engine';
import { getCachedPhotoPlayerIds } from '@/lib/tournamentCache';

export const dynamic = 'force-dynamic';

let cachedEnrichedTeams: any = null;
let lastTeamsFetch = 0;
const TEAMS_TTL = 30_000;

export function invalidatePublicTeamsCache() {
  cachedEnrichedTeams = null;
  lastTeamsFetch = 0;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedEnrichedTeams && now - lastTeamsFetch < TEAMS_TTL) {
      return NextResponse.json({ teams: cachedEnrichedTeams }, {
        headers: {
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
        },
      });
    }

    const [teams, { standings }, photoSet] = await Promise.all([
      prisma.team.findMany({
        select: {
          id: true,
          tournamentId: true,
          name: true,
          shortName: true,
          coach: true,
          description: true,
          primaryColor: true,
          captainId: true,
          createdAt: true,
          updatedAt: true,
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
      }),
      calculateStandings(),
      getCachedPhotoPlayerIds(),
    ]);
    const standingsMap = new Map(standings.map((s) => [s.teamId, s]));

    const enrichedTeams = teams.map((team) => {
      const stats = standingsMap.get(team.id) || {
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

      const cleanedPlayers = team.players.map((p) => ({
        ...p,
        photo: photoSet.has(p.id) ? `/api/public/players/${p.id}/photo` : null,
      }));

      const captain = cleanedPlayers.find((p) => p.isCaptain) || null;

      return {
        ...team,
        logo: `/api/public/teams/${team.id}/logo`,
        players: cleanedPlayers,
        captain,
        playerCount: team.players.length,
        stats,
      };
    });

    cachedEnrichedTeams = enrichedTeams;
    lastTeamsFetch = now;

    return NextResponse.json(
      { teams: enrichedTeams },
      {
        headers: {
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}
