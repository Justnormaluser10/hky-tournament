import { NextResponse } from 'next/server';
import {
  calculateTopScorers,
  calculateTopGoalkeepers,
  calculateTeamStats,
} from '@/lib/engine';

export const dynamic = 'force-dynamic';

let cachedStats: any = null;
let lastStatsFetch = 0;
const STATS_TTL = 30_000;

export function invalidatePublicStatisticsCache() {
  cachedStats = null;
  lastStatsFetch = 0;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedStats && now - lastStatsFetch < STATS_TTL) {
      return NextResponse.json(cachedStats, {
        headers: {
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
        },
      });
    }

    const [topScorers, topGoalkeepers, teamStats] = await Promise.all([
      calculateTopScorers(),
      calculateTopGoalkeepers(),
      calculateTeamStats(),
    ]);

    const result = {
      topScorers,
      topGoalkeepers,
      teamStats,
    };

    cachedStats = result;
    lastStatsFetch = now;

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error('Error calculating statistics:', error);
    return NextResponse.json({ error: 'Failed to calculate statistics' }, { status: 500 });
  }
}
