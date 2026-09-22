import { NextResponse } from 'next/server';
import { calculateStandings } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { standings, tournament } = await calculateStandings();
    const sanitizedStandings = standings.map((row) => ({
      ...row,
      logo: null,
    }));
    return NextResponse.json({ standings: sanitizedStandings, tournament });
  } catch (error: any) {
    console.error('Error calculating standings:', error);
    return NextResponse.json({ error: 'Failed to calculate standings' }, { status: 500 });
  }
}
