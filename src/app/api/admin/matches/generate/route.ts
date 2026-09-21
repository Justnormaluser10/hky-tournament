import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminGuard';
import { logActivity } from '@/lib/activity';
import { revalidateTournamentData } from '@/lib/revalidate';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const tournament = await prisma.tournament.findFirst({
      include: { teams: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const teams = tournament.teams;
    if (teams.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams are required to generate fixtures.' },
        { status: 400 }
      );
    }

    // Single round-robin generation
    const teamList = [...teams];
    if (teamList.length % 2 !== 0) {
      // Odd number of teams: add a dummy bye
      teamList.push({ id: '__BYE__', name: 'BYE' } as any);
    }

    const numTeams = teamList.length;
    const numRounds = numTeams - 1;
    const half = numTeams / 2;

    const generatedFixtures: Array<{
      teamAId: string;
      teamBId: string;
      round: string;
      matchNumber: number;
      date: Date;
      time: string;
      venue: string;
    }> = [];

    // Find the highest existing matchNumber
    const lastMatch = await prisma.match.findFirst({
      where: { tournamentId: tournament.id },
      orderBy: { matchNumber: 'desc' },
    });
    let matchCounter = (lastMatch?.matchNumber || 0) + 1;

    let currentDate = new Date(tournament.startDate);
    const times = ['09:00 AM', '11:00 AM', '03:30 PM', '05:30 PM', '07:30 PM'];
    const pitches = ['Pitch 1 - Main Turf', 'Pitch 2 - North Arena'];

    const rotatingTeams = [...teamList];

    for (let r = 0; r < numRounds; r++) {
      for (let i = 0; i < half; i++) {
        const teamA = rotatingTeams[i];
        const teamB = rotatingTeams[numTeams - 1 - i];

        if (teamA.id !== '__BYE__' && teamB.id !== '__BYE__') {
          const timeSlot = times[generatedFixtures.length % times.length];
          const pitch = pitches[generatedFixtures.length % pitches.length];

          generatedFixtures.push({
            teamAId: teamA.id,
            teamBId: teamB.id,
            round: 'LEAGUE',
            matchNumber: matchCounter++,
            date: new Date(currentDate),
            time: timeSlot,
            venue: pitch,
          });
        }
      }

      // Rotate teams except first
      const first = rotatingTeams[0];
      const rest = rotatingTeams.slice(1);
      const last = rest.pop()!;
      rotatingTeams.splice(0, rotatingTeams.length, first, last, ...rest);

      // Increment date for next round
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Insert new fixtures
    let insertedCount = 0;
    for (const fix of generatedFixtures) {
      // Check if match between these two already exists in league round
      const existing = await prisma.match.findFirst({
        where: {
          tournamentId: tournament.id,
          round: 'LEAGUE',
          OR: [
            { teamAId: fix.teamAId, teamBId: fix.teamBId },
            { teamAId: fix.teamBId, teamBId: fix.teamAId },
          ],
        },
      });

      if (!existing) {
        await prisma.match.create({
          data: {
            tournamentId: tournament.id,
            matchNumber: fix.matchNumber,
            round: fix.round,
            teamAId: fix.teamAId,
            teamBId: fix.teamBId,
            date: fix.date,
            time: fix.time,
            venue: fix.venue,
            status: 'UPCOMING',
          },
        });
        insertedCount++;
      }
    }

    await logActivity(
      auth.admin.email,
      'GENERATE_FIXTURES',
      `Auto-generated ${insertedCount} round-robin league fixtures for ${teams.length} teams.`
    );

    revalidateTournamentData();

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${insertedCount} league fixtures.`,
      count: insertedCount,
    });
  } catch (error: any) {
    console.error('Error generating fixtures:', error);
    return NextResponse.json({ error: 'Failed to generate fixtures' }, { status: 500 });
  }
}
