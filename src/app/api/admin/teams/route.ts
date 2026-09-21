import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const teams = await prisma.team.findMany({
      include: {
        players: {
          orderBy: [{ isCaptain: 'desc' }, { jerseyNumber: 'asc' }],
        },
        _count: {
          select: {
            players: true,
            homeMatches: true,
            awayMatches: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ teams });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { name, shortName, coach, description, primaryColor, logo } = body;

    if (!name || !shortName) {
      return NextResponse.json({ error: 'Team name and short name are required.' }, { status: 400 });
    }

    const tournament = await prisma.tournament.findFirst();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const team = await prisma.team.create({
      data: {
        tournamentId: tournament.id,
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
        coach: coach?.trim() || null,
        description: description?.trim() || null,
        primaryColor: primaryColor || '#059669',
        logo: logo || null,
      },
    });

    await logActivity(auth.admin.email, 'ADD_TEAM', `Added new team: "${team.name}" (${team.shortName})`);

    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, name, shortName, coach, description, primaryColor, logo } = body;

    if (!id) {
      return NextResponse.json({ error: 'Team ID is required.' }, { status: 400 });
    }

    const updated = await prisma.team.update({
      where: { id },
      data: {
        name: name?.trim(),
        shortName: shortName?.trim().toUpperCase(),
        coach: coach !== undefined ? coach?.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        primaryColor: primaryColor || undefined,
        logo: logo !== undefined ? (logo && logo.trim() ? logo.trim() : null) : undefined,
      },
    });

    await logActivity(auth.admin.email, 'EDIT_TEAM', `Updated details for team "${updated.name}"`);

    return NextResponse.json({ success: true, team: updated });
  } catch (error: any) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Team ID is required.' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    await prisma.team.delete({ where: { id } });

    await logActivity(auth.admin.email, 'DELETE_TEAM', `Deleted team "${team.name}"`);

    return NextResponse.json({ success: true, message: 'Team deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
