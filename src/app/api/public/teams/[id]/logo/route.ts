import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// High-speed in-memory buffer cache so images are decoded once and served in <1ms
const logoBufferCache = new Map<string, { buffer: Buffer; mime: string }>();

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return new NextResponse('Team ID required', { status: 400 });
    }

    if (logoBufferCache.has(id)) {
      const cached = logoBufferCache.get(id)!;
      return new NextResponse(cached.buffer, {
        headers: {
          'Content-Type': cached.mime,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    const team = await prisma.team.findUnique({
      where: { id },
      select: { logo: true },
    });

    if (!team || !team.logo) {
      return new NextResponse('Logo not found', { status: 404 });
    }

    const trimmed = team.logo.trim();

    if (trimmed.startsWith('data:')) {
      const match = trimmed.match(/^data:([^;]+);base64,(.*)$/);
      if (!match) {
        return new NextResponse('Invalid logo format', { status: 500 });
      }
      const mime = match[1] || 'image/png';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      logoBufferCache.set(id, { buffer, mime });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // If it's a file path like /uploads/... or http URL, redirect to it
    return NextResponse.redirect(new URL(trimmed, req.url));
  } catch (error) {
    console.error('Error serving team logo:', error);
    return new NextResponse('Failed to load logo', { status: 500 });
  }
}

/**
 * Invalidate memory buffer for a team if an admin updates their logo
 */
export function invalidateTeamLogoBuffer(teamId?: string) {
  if (teamId) {
    logoBufferCache.delete(teamId);
  } else {
    logoBufferCache.clear();
  }
}
