import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import { invalidateTournamentCache } from '@/lib/tournamentCache';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const tournament = await prisma.tournament.findFirst();
    return NextResponse.json({ tournament });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load tournament' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const tournament = await prisma.tournament.findFirst();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const updated = await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        name: body.name ?? tournament.name,
        sport: body.sport ?? tournament.sport,
        location: body.location ?? tournament.location,
        venue: body.venue ?? tournament.venue,
        description: body.description ?? tournament.description,
        status: body.status ?? tournament.status,
        format: body.format ?? tournament.format,
        currentStage: body.currentStage ?? tournament.currentStage,
        qualificationCount: body.qualificationCount ? Number(body.qualificationCount) : tournament.qualificationCount,
        pointsForWin: body.pointsForWin !== undefined ? Number(body.pointsForWin) : tournament.pointsForWin,
        pointsForDraw: body.pointsForDraw !== undefined ? Number(body.pointsForDraw) : tournament.pointsForDraw,
        pointsForLoss: body.pointsForLoss !== undefined ? Number(body.pointsForLoss) : tournament.pointsForLoss,
        tieBreakerRules: body.tieBreakerRules ?? tournament.tieBreakerRules,
        startDate: body.startDate ? new Date(body.startDate) : tournament.startDate,
        endDate: body.endDate ? new Date(body.endDate) : tournament.endDate,
        logo: body.logo ?? tournament.logo,
        banner: body.banner ?? tournament.banner,
      },
    });

    await logActivity(
      auth.admin.email,
      'UPDATE_TOURNAMENT',
      `Updated tournament settings (Stage: ${updated.currentStage}, Status: ${updated.status})`
    );

    invalidateTournamentCache('tournament');

    return NextResponse.json({ success: true, tournament: updated });
  } catch (error: any) {
    console.error('Error updating tournament:', error);
    return NextResponse.json({ error: 'Failed to update tournament configuration' }, { status: 500 });
  }
}
