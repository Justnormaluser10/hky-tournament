import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStandings } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            matchEvents: true,
          },
          orderBy: [
            { isCaptain: 'desc' },
            { jerseyNumber: 'asc' },
          ],
        },
        homeMatches: {
          include: {
            teamB: { select: { id: true, name: true, shortName: true } },
          },
          orderBy: { date: 'asc' },
        },
        awayMatches: {
          include: {
            teamA: { select: { id: true, name: true, shortName: true } },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const { standings } = await calculateStandings();
    const teamStandings = standings.find((s) => s.teamId === team.id) || null;
    const sanitizedStandings = teamStandings
      ? { ...teamStandings, logo: null }
      : null;

    // Process players to calculate goals and cards
    const enrichedPlayers = team.players.map((p) => {
      const goals = p.matchEvents.filter((e) => e.type === 'GOAL').length;
      const yellowCards = p.matchEvents.filter((e) => e.type === 'YELLOW_CARD').length;
      const redCards = p.matchEvents.filter((e) => e.type === 'RED_CARD').length;

      return {
        id: p.id,
        name: p.name,
        jerseyNumber: p.jerseyNumber,
        position: p.position,
        photo: p.photo,
        isCaptain: p.isCaptain,
        status: p.status,
        goals,
        yellowCards,
        redCards,
      };
    });

    const captain = enrichedPlayers.find((p) => p.isCaptain) || null;

    // Combine matches
    const allMatches = [
      ...team.homeMatches.map((m) => ({
        ...m,
        opponent: m.teamB,
        isHome: true,
      })),
      ...team.awayMatches.map((m) => ({
        ...m,
        opponent: m.teamA,
        isHome: false,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        primaryColor: team.primaryColor,
        coach: team.coach,
        description: team.description,
        captain,
        standings: sanitizedStandings,
        players: enrichedPlayers,
        matches: allMatches,
      },
    });
  } catch (error: any) {
    console.error('Error fetching team profile:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}
