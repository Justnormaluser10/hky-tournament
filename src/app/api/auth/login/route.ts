import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signAdminToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || body.email || '').trim();
    const password = body.password || '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Verify authorized credentials
    const isAuthorized =
      username.toLowerCase() === 'hockeyamreli' && password === 'hkyamreli14';

    let admin = null;

    if (isAuthorized) {
      // Find the active admin to preserve full admin operational capabilities and relations
      admin = await prisma.admin.findFirst();
      if (!admin) {
        admin = {
          id: 'admin_master',
          email: 'HockeyAmreli',
          name: 'HockeyAmreli',
          role: 'SUPERADMIN',
        } as any;
      }
    } else {
      // Check database credentials fallback
      const dbAdmin = await prisma.admin.findUnique({
        where: { email: username.toLowerCase() },
      });
      if (dbAdmin && (await comparePassword(password, dbAdmin.passwordHash))) {
        admin = dbAdmin;
      }
    }

    if (!admin) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = signAdminToken({
      adminId: admin.id,
      email: admin.email || 'HockeyAmreli',
      name: 'HockeyAmreli',
      role: admin.role || 'SUPERADMIN',
    });

    try {
      await logActivity('HockeyAmreli', 'ADMIN_LOGIN', 'Admin authenticated successfully.');
    } catch {}

    const res = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: 'HockeyAmreli',
        role: admin.role,
      },
    });

    // Session-only cookie (no maxAge -> browser discards on session end)
    res.cookies.set('amreli_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
