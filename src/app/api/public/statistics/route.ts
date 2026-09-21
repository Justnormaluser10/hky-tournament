import { NextResponse } from 'next/server';
import {
  calculateTopScorers,
  calculateTopGoalkeepers,
  calculateTeamStats,
} from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [topScorers, topGoalkeepers, teamStats] = await Promise.all([
      calculateTopScorers(),
      calculateTopGoalkeepers(),
      calculateTeamStats(),
    ]);

    return NextResponse.json(
      {
        topScorers,
        topGoalkeepers,
        teamStats,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('Error calculating statistics:', error);
    return NextResponse.json({ error: 'Failed to calculate statistics' }, { status: 500 });
  }
}
