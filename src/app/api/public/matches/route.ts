import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const round = searchParams.get('round');

    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (round && round !== 'ALL') {
      whereClause.round = round;
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
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
          include: {
            player: {
              select: {
                id: true,
                name: true,
                jerseyNumber: true,
              },
            },
            team: {
              select: {
                id: true,
                shortName: true,
              },
            },
          },
          orderBy: { minute: 'asc' },
        },
        knockout: true,
      },
      orderBy: [{ date: 'asc' }, { matchNumber: 'asc' }],
    });

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
