import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const photoBufferCache = new Map<string, { buffer: Buffer; mime: string }>();

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return new NextResponse('Player ID required', { status: 400 });
    }

    if (photoBufferCache.has(id)) {
      const cached = photoBufferCache.get(id)!;
      return new NextResponse(cached.buffer, {
        headers: {
          'Content-Type': cached.mime,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    const player = await prisma.player.findUnique({
      where: { id },
      select: { photo: true },
    });

    if (!player || !player.photo) {
      return new NextResponse('Photo not found', { status: 404 });
    }

    const trimmed = player.photo.trim();

    if (trimmed.startsWith('data:')) {
      const match = trimmed.match(/^data:([^;]+);base64,(.*)$/);
      if (!match) {
        return new NextResponse('Invalid photo format', { status: 500 });
      }
      const mime = match[1] || 'image/jpeg';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      photoBufferCache.set(id, { buffer, mime });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    return NextResponse.redirect(new URL(trimmed, req.url));
  } catch (error) {
    console.error('Error serving player photo:', error);
    return new NextResponse('Failed to load photo', { status: 500 });
  }
}

export function invalidatePlayerPhotoBuffer(playerId?: string) {
  if (playerId) {
    photoBufferCache.delete(playerId);
  } else {
    photoBufferCache.clear();
  }
}
