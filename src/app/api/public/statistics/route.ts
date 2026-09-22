import { NextResponse } from 'next/server';
import {
  calculateTopScorers,
  calculateTopGoalkeepers,
  calculateBestDefenders,
  calculateManOfTheMatches,
  calculateTeamStats,
} from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [topScorers, topGoalkeepers, bestDefenders, manOfTheMatches, teamStats] =
      await Promise.all([
        calculateTopScorers(),
        calculateTopGoalkeepers(),
        calculateBestDefenders(),
        calculateManOfTheMatches(),
        calculateTeamStats(),
      ]);

    return NextResponse.json({
      topScorers,
      topGoalkeepers,
      bestDefenders,
      manOfTheMatches,
      teamStats,
    });
  } catch (error: any) {
    console.error('Error calculating statistics:', error);
    return NextResponse.json({ error: 'Failed to calculate statistics' }, { status: 500 });
  }
}
