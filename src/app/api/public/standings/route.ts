import { NextResponse } from 'next/server';
import { calculateStandings } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { standings, tournament } = await calculateStandings();
    return NextResponse.json(
      { standings, tournament },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('Error calculating standings:', error);
    return NextResponse.json({ error: 'Failed to calculate standings' }, { status: 500 });
  }
}
