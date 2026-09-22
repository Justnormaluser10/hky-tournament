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

    const sanitizeRow = (row: any) => ({
      ...row,
      photo: null,
      teamLogo: null,
    });

    const sanitizeTeamStat = (stat: any) =>
      stat ? { ...stat, logo: null } : null;

    const sanitizedTeamStats = {
      ...teamStats,
      mostWins: sanitizeTeamStat(teamStats.mostWins),
      mostGoals: sanitizeTeamStat(teamStats.mostGoals),
      bestGD: sanitizeTeamStat(teamStats.bestGD),
      bestDefense: sanitizeTeamStat(teamStats.bestDefense),
    };

    return NextResponse.json({
      topScorers: topScorers.map(sanitizeRow),
      topGoalkeepers: topGoalkeepers.map(sanitizeRow),
      bestDefenders: bestDefenders.map(sanitizeRow),
      manOfTheMatches: manOfTheMatches.map(sanitizeRow),
      teamStats: sanitizedTeamStats,
    });
  } catch (error: any) {
    console.error('Error calculating statistics:', error);
    return NextResponse.json({ error: 'Failed to calculate statistics' }, { status: 500 });
  }
}
