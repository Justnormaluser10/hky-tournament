import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminGuard';

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ authenticated: false, admin: null });
  }

  return NextResponse.json({
    authenticated: true,
    admin,
  });
}
