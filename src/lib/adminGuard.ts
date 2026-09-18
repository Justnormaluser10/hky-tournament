import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, AdminPayload } from './auth';

export function getAdminFromRequest(req: NextRequest): AdminPayload | null {
  const cookieToken = req.cookies.get('amreli_admin_token')?.value;
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function requireAdmin(req: NextRequest): { admin: AdminPayload } | NextResponse {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }
  return { admin };
}
