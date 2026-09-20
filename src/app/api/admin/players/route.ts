import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import { invalidateTournamentCache } from '@/lib/tournamentCache';

import { getCachedPhotoPlayerIds } from '@/lib/tournamentCache';
import { invalidatePlayerPhotoBuffer } from '@/app/api/public/players/[id]/photo/route';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    const [players, photoSet] = await Promise.all([
      prisma.player.findMany({
        where: teamId ? { teamId } : undefined,
        select: {
          id: true,
          teamId: true,
          name: true,
          jerseyNumber: true,
          position: true,
          isCaptain: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              primaryColor: true,
            },
          },
        },
        orderBy: [{ teamId: 'asc' }, { jerseyNumber: 'asc' }],
      }),
      getCachedPhotoPlayerIds(),
    ]);

    const cleanedPlayers = players.map((p) => ({
      ...p,
      photo: photoSet.has(p.id) ? `/api/public/players/${p.id}/photo` : null,
    }));

    return NextResponse.json({ players: cleanedPlayers });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { teamId, name, jerseyNumber, position, photo, isCaptain, status } = body;

    if (!teamId || !name || jerseyNumber === undefined || !position) {
      return NextResponse.json(
        { error: 'Team, name, jersey number, and position are required.' },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // If marked as captain, unset any existing captain in this team
    if (isCaptain) {
      await prisma.player.updateMany({
        where: { teamId },
        data: { isCaptain: false },
      });
    }

    const player = await prisma.player.create({
      data: {
        teamId,
        name: name.trim(),
        jerseyNumber: Number(jerseyNumber),
        position: position.trim().toUpperCase(),
        photo: photo?.trim() || null,
        isCaptain: Boolean(isCaptain),
        status: status || 'ACTIVE',
      },
    });

    if (isCaptain) {
      await prisma.team.update({
        where: { id: teamId },
        data: { captainId: player.id },
      });
    }

    await logActivity(
      auth.admin.email,
      'ADD_PLAYER',
      `Added player ${player.name} (#${player.jerseyNumber}, ${player.position}) to ${team.name}`
    );

    invalidateTournamentCache('scorers');

    return NextResponse.json({ success: true, player });
  } catch (error: any) {
    console.error('Error creating player:', error);
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, teamId, name, jerseyNumber, position, photo, isCaptain, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Player ID is required.' }, { status: 400 });
    }

    const existing = await prisma.player.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const targetTeamId = teamId || existing.teamId;

    if (isCaptain) {
      await prisma.player.updateMany({
        where: { teamId: targetTeamId },
        data: { isCaptain: false },
      });
      await prisma.team.update({
        where: { id: targetTeamId },
        data: { captainId: id },
      });
    } else if (existing.isCaptain && isCaptain === false) {
      await prisma.team.update({
        where: { id: targetTeamId },
        data: { captainId: null },
      });
    }

    const isCleanPhotoUrl = typeof photo === 'string' && photo.startsWith('/api/public/players/');

    const updated = await prisma.player.update({
      where: { id },
      data: {
        teamId: targetTeamId,
        name: name !== undefined ? name.trim() : undefined,
        jerseyNumber: jerseyNumber !== undefined ? Number(jerseyNumber) : undefined,
        position: position !== undefined ? position.trim().toUpperCase() : undefined,
        photo: isCleanPhotoUrl ? undefined : (photo !== undefined ? (photo ? photo.trim() : null) : undefined),
        isCaptain: isCaptain !== undefined ? Boolean(isCaptain) : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    await logActivity(
      auth.admin.email,
      'EDIT_PLAYER',
      `Updated player ${updated.name} (#${updated.jerseyNumber})`
    );

    invalidatePlayerPhotoBuffer(id);
    invalidateTournamentCache('scorers');

    return NextResponse.json({ success: true, player: updated });
  } catch (error: any) {
    console.error('Error updating player:', error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Player ID is required.' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      return NextResponse.json({ error: 'Player not found.' }, { status: 404 });
    }

    // If captain, remove captainId from team
    if (player.isCaptain) {
      await prisma.team.update({
        where: { id: player.teamId },
        data: { captainId: null },
      });
    }

    await prisma.player.delete({ where: { id } });

    await logActivity(
      auth.admin.email,
      'DELETE_PLAYER',
      `Deleted player ${player.name} (#${player.jerseyNumber})`
    );

    invalidatePlayerPhotoBuffer(id);
    invalidateTournamentCache('scorers');

    return NextResponse.json({ success: true, message: 'Player deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting player:', error);
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
  }
}
