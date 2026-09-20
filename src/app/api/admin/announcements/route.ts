import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ announcements });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { title, message, type, priority, isPinned } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
    }

    const tournament = await prisma.tournament.findFirst();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const announcement = await prisma.announcement.create({
      data: {
        tournamentId: tournament.id,
        title: title.trim(),
        message: message.trim(),
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        isPinned: Boolean(isPinned),
      },
    });

    await logActivity(
      auth.admin.email,
      'CREATE_ANNOUNCEMENT',
      `Published announcement: "${announcement.title}" (${announcement.type})`
    );

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, title, message, type, priority, isPinned } = body;

    if (!id) return NextResponse.json({ error: 'Announcement ID is required.' }, { status: 400 });

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        message: message !== undefined ? message.trim() : undefined,
        type: type !== undefined ? type : undefined,
        priority: priority !== undefined ? priority : undefined,
        isPinned: isPinned !== undefined ? Boolean(isPinned) : undefined,
      },
    });

    await logActivity(auth.admin.email, 'EDIT_ANNOUNCEMENT', `Updated announcement: "${updated.title}"`);

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Announcement ID is required.' }, { status: 400 });

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) return NextResponse.json({ error: 'Announcement not found.' }, { status: 404 });

    await prisma.announcement.delete({ where: { id } });

    await logActivity(
      auth.admin.email,
      'DELETE_ANNOUNCEMENT',
      `Deleted announcement: "${announcement.title}"`
    );

    return NextResponse.json({ success: true, message: 'Announcement deleted.' });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
