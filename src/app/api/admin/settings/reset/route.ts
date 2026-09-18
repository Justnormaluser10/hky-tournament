import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Run prisma db seed
    await execAsync('npx prisma db seed');

    await logActivity(
      auth.admin.email,
      'RESET_DATABASE',
      'Admin reset the tournament database to initial official seed state.'
    );

    return NextResponse.json({
      success: true,
      message: 'Database reset to default official tournament seed data successfully.',
    });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}
