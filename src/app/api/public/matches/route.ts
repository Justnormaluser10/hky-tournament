import { NextRequest, NextResponse } from 'next/server';
import { getCachedMatches } from '@/lib/tournamentCache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const round = searchParams.get('round');

    const allMatches = await getCachedMatches();

    const matches = allMatches.filter((m) => {
      if (status && status !== 'ALL' && m.status !== status) return false;
      if (round && round !== 'ALL' && m.round !== round) return false;
      return true;
    });

    return NextResponse.json(
      { matches },
      {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
