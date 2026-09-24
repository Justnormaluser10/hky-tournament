import { NextResponse } from 'next/server';
import { getKnockoutData } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getKnockoutData();
    if (!data.tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json({
      tournament: data.tournament,
      tournamentStage: data.tournament.currentStage,
      format: data.tournament.format,
      qualificationCount: data.tournament.qualificationCount,
      leagueStatus: data.leagueStatus,
      knockoutMatches: data.knockoutMatches,
      isKnockoutActive: data.isKnockoutActive,
      isPreview: data.isPreview,
      message: data.isPreview
        ? 'Projected Playoff Bracket — Based on current league standings.'
        : 'Official Playoff Knockout Matches.',
    });
  } catch (error: any) {
    console.error('Error fetching knockout bracket:', error);
    return NextResponse.json({ error: 'Failed to fetch knockout stage' }, { status: 500 });
  }
}
