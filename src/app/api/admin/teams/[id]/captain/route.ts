import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: teamId } = params;
    const body = await req.json();
    const { playerId } = body;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { players: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const previousCaptain = team.players.find((p) => p.isCaptain);

    if (playerId) {
      const newCaptain = team.players.find((p) => p.id === playerId);
      if (!newCaptain) {
        return NextResponse.json({ error: 'Player does not belong to this team' }, { status: 400 });
      }

      // Step 1: Remove captain status from all other players in this team
      await prisma.player.updateMany({
        where: { teamId },
        data: { isCaptain: false },
      });

      // Step 2: Assign captain status to the selected player
      await prisma.player.update({
        where: { id: playerId },
        data: { isCaptain: true },
      });

      // Step 3: Update team's captainId
      await prisma.team.update({
        where: { id: teamId },
        data: { captainId: playerId },
      });

      await logActivity(
        auth.admin.email,
        'CHANGE_CAPTAIN',
        `Changed captain for "${team.name}" from ${
          previousCaptain ? previousCaptain.name : 'None'
        } to ${newCaptain.name}`
      );

      return NextResponse.json({
        success: true,
        message: `Captain updated to ${newCaptain.name}`,
        captain: newCaptain,
      });
    } else {
      // Remove captain
      await prisma.player.updateMany({
        where: { teamId },
        data: { isCaptain: false },
      });

      await prisma.team.update({
        where: { id: teamId },
        data: { captainId: null },
      });

      await logActivity(
        auth.admin.email,
        'REMOVE_CAPTAIN',
        `Removed captain designation from "${team.name}"`
      );

      return NextResponse.json({
        success: true,
        message: 'Captain removed.',
        captain: null,
      });
    }
  } catch (error: any) {
    console.error('Error assigning captain:', error);
    return NextResponse.json({ error: 'Failed to update captain' }, { status: 500 });
  }
}
