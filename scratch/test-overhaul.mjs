import { PrismaClient } from '@prisma/client';
import assert from 'assert';
import {
  calculateStandings,
  checkLeagueStageStatus,
  generateKnockoutStages,
  advanceKnockoutWinner,
  calculateTopScorers,
  calculateTopGoalkeepers,
} from '../src/lib/engine.ts';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE OVERHAUL VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Verify Tournament Exists & Base Configuration
  console.log('Test 1: Verifying Tournament Configuration & State...');
  const tournament = await prisma.tournament.findFirst();
  assert.ok(tournament, 'Tournament must exist');
  console.log(`✅ Tournament: "${tournament.name}" (Stage: ${tournament.currentStage}, Status: ${tournament.status})`);

  // 2. Verify Teams & Round-Robin Math
  console.log('\nTest 2: Verifying Teams & Single Round-Robin Expected Matches...');
  const teams = await prisma.team.findMany({ where: { tournamentId: tournament.id } });
  const N = teams.length;
  console.log(`Found ${N} competing teams.`);
  const expectedMatches = (N * (N - 1)) / 2;
  console.log(`Expected single round-robin matches for ${N} teams: ${expectedMatches} matches.`);

  // 3. Verify League Stage Completion Detection
  console.log('\nTest 3: Testing Automatic League Completion Detection...');
  const initialLeagueStatus = await checkLeagueStageStatus(tournament.id);
  console.log(`Current league fixtures scheduled: ${initialLeagueStatus.scheduledMatches}`);
  console.log(`Current league fixtures completed: ${initialLeagueStatus.completedMatches} / ${initialLeagueStatus.expectedMatches}`);
  console.log(`isComplete detected: ${initialLeagueStatus.isComplete}`);

  // Let's ensure all 15 matches exist in the database for a full round-robin
  // If fewer than 15 matches exist, let's create the remaining pairings so we can test the 15/15 condition
  const existingLeagueMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, round: 'LEAGUE' },
  });

  const scheduledPairings = new Set(
    existingLeagueMatches.map((m) => [m.teamAId, m.teamBId].sort().join('-'))
  );

  let nextMatchNumber =
    (await prisma.match.findFirst({
      where: { tournamentId: tournament.id },
      orderBy: { matchNumber: 'desc' },
    }))?.matchNumber || 10;

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const pairKey = [teams[i].id, teams[j].id].sort().join('-');
      if (!scheduledPairings.has(pairKey)) {
        nextMatchNumber++;
        await prisma.match.create({
          data: {
            tournamentId: tournament.id,
            round: 'LEAGUE',
            matchNumber: nextMatchNumber,
            teamAId: teams[i].id,
            teamBId: teams[j].id,
            teamAScore: 0,
            teamBScore: 0,
            status: 'UPCOMING',
            venue: 'Pitch 1 - Main Turf',
            time: '04:00 PM',
          },
        });
        scheduledPairings.add(pairKey);
      }
    }
  }

  // Verify completion status before all are marked completed
  const midStatus = await checkLeagueStageStatus(tournament.id);
  assert.strictEqual(midStatus.scheduledMatches, 15, 'Must have 15 scheduled league matches for 6 teams');
  console.log(`✅ 15 round-robin league matches confirmed. Completed: ${midStatus.completedMatches}/15.`);

  // Mark all 15 matches completed with realistic scores if not already completed
  const allLeagueMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, round: 'LEAGUE' },
  });

  for (let idx = 0; idx < allLeagueMatches.length; idx++) {
    const m = allLeagueMatches[idx];
    if (m.status !== 'COMPLETED') {
      const scoreA = ((idx * 2 + 1) % 4) + 1;
      const scoreB = ((idx * 3) % 3);
      await prisma.match.update({
        where: { id: m.id },
        data: {
          teamAScore: scoreA,
          teamBScore: scoreB,
          status: 'COMPLETED',
          winnerId: scoreA > scoreB ? m.teamAId : scoreB > scoreA ? m.teamBId : null,
        },
      });
    }
  }

  const completedStatus = await checkLeagueStageStatus(tournament.id);
  assert.strictEqual(completedStatus.isComplete, true, 'checkLeagueStageStatus MUST detect complete when 15/15 are finished');
  console.log(`✅ Automatic league stage completion detected: ${completedStatus.completedMatches}/${completedStatus.expectedMatches} completed (100%).`);

  // 4. Verify Standings Calculation & Dynamic Qualification Line
  console.log('\nTest 4: Standings Calculation & Dynamic Qualification Line...');
  const { standings } = await calculateStandings(tournament.id);
  assert.strictEqual(standings.length, 6, 'Must calculate standings for all 6 teams');
  for (let i = 0; i < 4; i++) {
    assert.strictEqual(standings[i].isQualified, true, `Rank ${i + 1} must be qualified for Top 4`);
  }
  for (let i = 4; i < 6; i++) {
    assert.strictEqual(standings[i].isQualified, false, `Rank ${i + 1} must NOT be qualified for Top 4`);
  }
  console.log(`✅ Standings verified. Top 4 qualified: ${standings.slice(0, 4).map((s) => s.name).join(', ')}`);

  // 5. Admin Action: MOVE TO KNOCKOUT STAGE
  console.log('\nTest 5: Admin Action — "MOVE TO KNOCKOUT STAGE"...');
  const genResult = await generateKnockoutStages(tournament.id);
  console.log(`✅ ${genResult.message}`);

  const updatedTournament = await prisma.tournament.findUnique({ where: { id: tournament.id } });
  assert.strictEqual(updatedTournament.currentStage, 'SEMI_FINALS', 'Current stage should be SEMI_FINALS');

  // Verify Knockout Match records
  const kMatches = await prisma.knockoutMatch.findMany({
    where: { match: { tournamentId: tournament.id } },
    include: { match: { include: { teamA: true, teamB: true } } },
    orderBy: { bracketOrder: 'asc' },
  });
  assert.strictEqual(kMatches.length, 3, 'Top 4 qualification must generate 3 matches (2 Semis + 1 Final)');

  const sf1 = kMatches[0];
  const sf2 = kMatches[1];
  const finalM = kMatches[2];

  // SF1: 1st vs 4th
  assert.strictEqual(sf1.match.teamAId, standings[0].teamId, 'SF1 Team A must be Rank 1');
  assert.strictEqual(sf1.match.teamBId, standings[3].teamId, 'SF1 Team B must be Rank 4');
  console.log(`✅ SF1 correctly seeded: ${sf1.match.teamA.name} (1st) vs ${sf1.match.teamB.name} (4th)`);

  // SF2: 2nd vs 3rd
  assert.strictEqual(sf2.match.teamAId, standings[1].teamId, 'SF2 Team A must be Rank 2');
  assert.strictEqual(sf2.match.teamBId, standings[2].teamId, 'SF2 Team B must be Rank 3');
  console.log(`✅ SF2 correctly seeded: ${sf2.match.teamA.name} (2nd) vs ${sf2.match.teamB.name} (3rd)`);

  // 6. Test Automatic Advancement to Grand Final
  console.log('\nTest 6: Scoring Semi-Finals & Automatic Progression to Final...');
  // SF1: Team A wins 3–1
  await prisma.match.update({
    where: { id: sf1.matchId },
    data: { teamAScore: 3, teamBScore: 1, status: 'COMPLETED' },
  });
  await advanceKnockoutWinner(sf1.matchId);

  // SF2: Team A wins 2–0
  await prisma.match.update({
    where: { id: sf2.matchId },
    data: { teamAScore: 2, teamBScore: 0, status: 'COMPLETED' },
  });
  await advanceKnockoutWinner(sf2.matchId);

  const updatedFinal = await prisma.match.findUnique({
    where: { id: finalM.matchId },
    include: { teamA: true, teamB: true },
  });

  assert.strictEqual(updatedFinal.teamAId, standings[0].teamId, 'Final Team A must be Winner SF1 (Rank 1)');
  assert.strictEqual(updatedFinal.teamBId, standings[1].teamId, 'Final Team B must be Winner SF2 (Rank 2)');
  console.log(`✅ Final automatically populated with winners: ${updatedFinal.teamA.name} vs ${updatedFinal.teamB.name}`);

  // 7. Test Score Correction Recalculation
  console.log('\nTest 7: Score Correction Recalculation...');
  // Suppose admin corrects SF1: Team B (Rank 4) actually won 2–1!
  await prisma.match.update({
    where: { id: sf1.matchId },
    data: { teamAScore: 1, teamBScore: 2, status: 'COMPLETED' },
  });
  await advanceKnockoutWinner(sf1.matchId);

  const correctedFinal = await prisma.match.findUnique({
    where: { id: finalM.matchId },
    include: { teamA: true, teamB: true },
  });
  assert.strictEqual(correctedFinal.teamAId, standings[3].teamId, 'Corrected Final Team A must now be Rank 4');
  console.log(`✅ Downstream bracket automatically updated to corrected winner: ${correctedFinal.teamA.name} vs ${correctedFinal.teamB.name}`);

  // Revert back to Rank 1 winning for final championship test
  await prisma.match.update({
    where: { id: sf1.matchId },
    data: { teamAScore: 3, teamBScore: 1, status: 'COMPLETED' },
  });
  await advanceKnockoutWinner(sf1.matchId);

  // 8. Test Grand Final Scoring & Championship Crown
  console.log('\nTest 8: Grand Final Scoring & Championship Glory...');
  await prisma.match.update({
    where: { id: finalM.matchId },
    data: { teamAScore: 4, teamBScore: 2, status: 'COMPLETED' },
  });
  await advanceKnockoutWinner(finalM.matchId);

  const champTournament = await prisma.tournament.findUnique({ where: { id: tournament.id } });
  assert.strictEqual(champTournament.currentStage, 'COMPLETED', 'Tournament stage must become COMPLETED after Final');
  assert.strictEqual(champTournament.status, 'COMPLETED', 'Tournament status must become COMPLETED');
  console.log(`✅ Champion crowned! Tournament stage is now: ${champTournament.currentStage}`);

  // 9. Verify League Data Integrity (Data Loss Prevention)
  console.log('\nTest 9: Verifying League Data Integrity...');
  const finalStandingsCheck = await calculateStandings(tournament.id);
  assert.strictEqual(finalStandingsCheck.standings.length, 6, 'All 6 league standings rows must remain intact');
  const totalMatchesCheck = await prisma.match.count({ where: { tournamentId: tournament.id } });
  assert.ok(totalMatchesCheck >= 18, 'All league matches (15) and knockout matches (3) must persist');
  console.log(`✅ League data 100% preserved with ${totalMatchesCheck} persistent matches.`);

  console.log('\n====================================================');
  console.log('🎉 ALL TESTS PASSED! FULL OVERHAUL VERIFIED.');
  console.log('====================================================\n');
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
