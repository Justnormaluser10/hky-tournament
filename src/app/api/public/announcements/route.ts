import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

let cachedAnnouncements: any = null;
let lastAnnouncementsFetchTime = 0;
const ANNOUNCEMENTS_TTL = 20_000; // 20 seconds

export function invalidateAnnouncementsCache() {
  cachedAnnouncements = null;
  lastAnnouncementsFetchTime = 0;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedAnnouncements && now - lastAnnouncementsFetchTime < ANNOUNCEMENTS_TTL) {
      return NextResponse.json(cachedAnnouncements, {
        headers: {
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
        },
      });
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const latestAnnouncement = announcements.length > 0 ? announcements[0] : null;

    cachedAnnouncements = {
      announcements,
      latestAnnouncement,
    };
    lastAnnouncementsFetchTime = now;

    return NextResponse.json(cachedAnnouncements, {
      headers: {
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
