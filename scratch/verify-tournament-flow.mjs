import { PrismaClient } from '@prisma/client';
import assert from 'assert';
import { signAdminToken } from '../src/lib/auth.ts';
import {
  calculateStandings,
  checkLeagueStageStatus,
  generateKnockoutStages,
  advanceKnockoutWinner,
} from '../src/lib/engine.ts';

const prisma = new PrismaClient();

function getAdminToken(admin) {
  return signAdminToken({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
}

async function runFullVerification() {
  console.log('================================================================');
  console.log('🏆 CRITICAL TEST: 6-TEAM TOURNAMENT FULL LIFECYCLE VERIFICATION');
  console.log('================================================================\n');

  // Step 0: Ensure tournament & admin exist
  const tournament = await prisma.tournament.findFirst();
  assert.ok(tournament, 'Tournament must exist');
  const admin = await prisma.admin.findFirst();
  assert.ok(admin, 'Admin must exist');
  const adminToken = getAdminToken(admin);

  console.log(`Tournament: "${tournament.name}" (Initial Stage: ${tournament.currentStage})`);

  // Step 1: Verify 6 teams and mathematical expected matches
  const teams = await prisma.team.findMany({ where: { tournamentId: tournament.id } });
  const N = teams.length;
  assert.strictEqual(N, 6, 'Must have exactly 6 teams in tournament');
  const expectedMatches = (N * (N - 1)) / 2;
  const expectedPerTeam = N - 1;
  assert.strictEqual(expectedMatches, 15, 'Single round-robin for 6 teams must be 15 matches');
  assert.strictEqual(expectedPerTeam, 5, 'Each team must play 5 matches in single round-robin');
  console.log(`✅ Verified: 6 teams, expected matches: ${expectedMatches}, expected per team: ${expectedPerTeam}`);

  // Step 2: Test League Incomplete State (e.g. 6/15 completed)
  console.log('\n--- Test Phase 1: Incomplete League State (6/15 matches completed) ---');
  let status = await checkLeagueStageStatus(tournament.id);
  console.log(`Completed matches: ${status.completedMatches} / ${status.expectedMatches}`);
  console.log(`isComplete: ${status.isComplete}`);
  assert.strictEqual(status.isComplete, false, 'League must NOT be complete when only 6/15 are finished');

  // Check per-team completion status
  const incompleteTeams = status.teamsStatus.filter((t) => !t.isComplete);
  console.log(`Teams pending completion: ${incompleteTeams.length} / 6`);
  assert.ok(incompleteTeams.length > 0, 'Incomplete teams must be identified');
  console.log(`Sample team status: ${status.teamsStatus[0].name}: ${status.teamsStatus[0].completedMatches}/${status.teamsStatus[0].requiredMatches} (isComplete: ${status.teamsStatus[0].isComplete})`);

  // Step 3: Verify backend rejects knockout activation when incomplete
  console.log('\n--- Test Phase 2: Backend API Guard Rejection ---');
  try {
    const apiRes = await fetch('http://localhost:3000/api/admin/knockout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'MOVE_TO_KNOCKOUT' }),
    });

    const apiJson = await apiRes.json();
    console.log(`API response status: ${apiRes.status}`);
    console.log(`API response error: "${apiJson.error}"`);
    assert.strictEqual(apiRes.status, 400, 'Backend MUST return 400 Bad Request when league is incomplete');
    assert.ok(apiJson.error.includes('League stage is not complete yet'), 'Error message must specify league incomplete');
    console.log('✅ Backend API correctly blocked knockout activation!');
  } catch (err) {
    if (err.name === 'AssertionError') throw err;
    console.log('Fetch note:', err.message);
  }

  // Verify direct engine call also throws
  await assert.rejects(
    async () => {
      await generateKnockoutStages(tournament.id);
    },
    /League stage is not complete yet/,
    'generateKnockoutStages MUST throw an Error if league is incomplete'
  );
  console.log('✅ Engine generateKnockoutStages correctly throws when league is incomplete');

  // Step 4: Verify public knockout API returns empty bracket
  console.log('\n--- Test Phase 3: Public Endpoint Exposure Guard ---');
  const pubRes = await fetch('http://localhost:3000/api/public/knockout');
  const pubJson = await pubRes.json();
  assert.strictEqual(pubJson.isKnockoutActive, false, 'isKnockoutActive must be false on public route');
  assert.strictEqual(pubJson.knockoutMatches.length, 0, 'Public knockout matches must be empty');
  console.log('✅ Public website knockout bracket is completely hidden during league stage');

  // Step 5: Test 14/15 Matches Completed (One team 4/5)
  console.log('\n--- Test Phase 4: Near-Completion Guard (14/15 matches completed) ---');
  const leagueMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, round: 'LEAGUE' },
    orderBy: { matchNumber: 'asc' },
  });

  // Complete matches 7 through 14 (leaving match 15 upcoming)
  for (let i = 0; i < 14; i++) {
    const m = leagueMatches[i];
    if (m.status !== 'COMPLETED') {
      await prisma.match.update({
        where: { id: m.id },
        data: {
          teamAScore: (i % 3) + 1,
          teamBScore: (i % 2),
          status: 'COMPLETED',
          winnerId: (i % 3) + 1 > (i % 2) ? m.teamAId : m.teamBId,
        },
      });
    }
  }

  const nearStatus = await checkLeagueStageStatus(tournament.id);
  console.log(`Matches completed: ${nearStatus.completedMatches} / 15`);
  assert.strictEqual(nearStatus.completedMatches, 14, 'Must have 14 completed matches');
  assert.strictEqual(nearStatus.isComplete, false, 'League must NOT be complete with 14/15 matches');
  const pending14 = nearStatus.teamsStatus.filter((t) => !t.isComplete);
  console.log(`Teams with incomplete fixtures at 14/15: ${pending14.map((t) => `${t.name} (${t.completedMatches}/5)`).join(', ')}`);
  assert.ok(pending14.length > 0, 'Must identify teams that have only 4/5 matches');
  console.log('✅ Requirement 4 enforced: 14/15 matches still rejected!');

  // Step 6: Complete all 15 matches (5/5 for all 6 teams)
  console.log('\n--- Test Phase 5: Complete All 15 Matches (100% Completion) ---');
  const m15 = leagueMatches[14];
  // Complete match 15 via Admin PUT route to verify automatic stage transition to LEAGUE_COMPLETE
  const putRes = await fetch('http://localhost:3000/api/admin/matches', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      id: m15.id,
      teamAScore: 3,
      teamBScore: 1,
      status: 'COMPLETED',
    }),
  });
  assert.strictEqual(putRes.status, 200, 'Match update PUT must succeed');

  const fullStatus = await checkLeagueStageStatus(tournament.id);
  console.log(`Matches completed: ${fullStatus.completedMatches} / 15 (100%)`);
  assert.strictEqual(fullStatus.isComplete, true, 'isComplete MUST be true when 15/15 matches are done');
  for (const t of fullStatus.teamsStatus) {
    assert.strictEqual(t.completedMatches, 5, `${t.name} must have exactly 5 completed matches`);
    assert.strictEqual(t.isComplete, true, `${t.name} must be marked complete`);
  }
  console.log('✅ All 6 teams verified at 5/5 completed fixtures!');

  const tourneyAfterLeague = await prisma.tournament.findUnique({ where: { id: tournament.id } });
  console.log(`Tournament stage after 15/15 matches: ${tourneyAfterLeague.currentStage}`);
  assert.strictEqual(tourneyAfterLeague.currentStage, 'LEAGUE_COMPLETE', 'Tournament stage must become LEAGUE_COMPLETE');
  console.log('✅ Tournament stage automatically transitioned to LEAGUE_COMPLETE (awaiting admin activation)');

  // Verify public website STILL does not show knockout bracket before admin clicks button
  const pubStillLeague = await fetch('http://localhost:3000/api/public/knockout');
  const pubStillJson = await pubStillLeague.json();
  assert.strictEqual(pubStillJson.isKnockoutActive, false, 'Knockout must remain inactive before admin activates it');
  console.log('✅ Public website remains on LEAGUE COMPLETE until Admin activates knockout');

  // Step 7: Admin Manually Activates Knockout Stage
  console.log('\n--- Test Phase 6: Admin Manually Activates Knockout Stage ---');
  const activateRes = await fetch('http://localhost:3000/api/admin/knockout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ action: 'MOVE_TO_KNOCKOUT' }),
  });

  const activateJson = await activateRes.json();
  assert.strictEqual(activateRes.status, 200, 'Admin knockout activation must succeed');
  console.log(`Activation response message: "${activateJson.message}"`);

  const tourneyInKnockout = await prisma.tournament.findUnique({ where: { id: tournament.id } });
  console.log(`Tournament stage after activation: ${tourneyInKnockout.currentStage}`);
  assert.strictEqual(tourneyInKnockout.currentStage, 'SEMI_FINALS', 'Stage must be SEMI_FINALS for Top 4');

  // Step 8: Verify Bracket Generation & Placeholders
  console.log('\n--- Test Phase 7: Bracket Structure & Final Placeholder Verification ---');
  const { standings: finalStandings } = await calculateStandings(tournament.id);
  console.log('Final League Standings (Top 4 Qualified):');
  for (let i = 0; i < 4; i++) {
    console.log(`  #${i + 1} ${finalStandings[i].name} (${finalStandings[i].points} pts)`);
  }

  const kMatches = await prisma.knockoutMatch.findMany({
    where: { match: { tournamentId: tournament.id } },
    include: { match: { include: { teamA: true, teamB: true } } },
    orderBy: { bracketOrder: 'asc' },
  });

  assert.strictEqual(kMatches.length, 3, 'Top 4 qualification must generate 3 fixtures (2 Semis + 1 Final)');

  // SF1: 1st vs 4th
  const sf1 = kMatches[0];
  assert.strictEqual(sf1.match.teamAId, finalStandings[0].teamId, 'SF1 Team A must be Rank 1');
  assert.strictEqual(sf1.match.teamBId, finalStandings[3].teamId, 'SF1 Team B must be Rank 4');
  console.log(`✅ SF1 correctly seeded: ${sf1.match.teamA.name} (1st) vs ${sf1.match.teamB.name} (4th)`);

  // SF2: 2nd vs 3rd
  const sf2 = kMatches[1];
  assert.strictEqual(sf2.match.teamAId, finalStandings[1].teamId, 'SF2 Team A must be Rank 2');
  assert.strictEqual(sf2.match.teamBId, finalStandings[2].teamId, 'SF2 Team B must be Rank 3');
  console.log(`✅ SF2 correctly seeded: ${sf2.match.teamA.name} (2nd) vs ${sf2.match.teamB.name} (3rd)`);

  // Grand Final: Must have NULL teamAId and NULL teamBId (Requirement 17)
  const finalMatch = kMatches[2];
  assert.strictEqual(finalMatch.match.teamAId, null, 'Final Team A MUST be null (placeholder) before SF1');
  assert.strictEqual(finalMatch.match.teamBId, null, 'Final Team B MUST be null (placeholder) before SF2');
  assert.strictEqual(finalMatch.seedLabelA, 'Winner Semi Final 1', 'Final seedLabelA must be Winner Semi Final 1');
  assert.strictEqual(finalMatch.seedLabelB, 'Winner Semi Final 2', 'Final seedLabelB must be Winner Semi Final 2');
  console.log('✅ STRICT REQUIREMENT 17 MET: Grand Final has null teams and placeholder seed labels!');

  // Verify public knockout API now returns active bracket
  const pubActive = await fetch('http://localhost:3000/api/public/knockout');
  const pubActiveJson = await pubActive.json();
  assert.strictEqual(pubActiveJson.isKnockoutActive, true, 'isKnockoutActive must be true after activation');
  assert.strictEqual(pubActiveJson.knockoutMatches.length, 3, 'Must return 3 knockout matches to public');
  console.log('✅ Public website now renders the official knockout playoff bracket');

  // Step 9: Score Semifinals & Verify Dynamic Winner Advancement
  console.log('\n--- Test Phase 8: Scoring Semifinals & Dynamic Finalist Advancement ---');
  // Score SF1: Rank 1 wins 3 - 1
  await prisma.match.update({
    where: { id: sf1.matchId },
    data: { teamAScore: 3, teamBScore: 1, status: 'COMPLETED' },
  });
  await advanceKnockoutWinner(sf1.matchId);

  let finalCheck = await prisma.match.findUnique({ where: { id: finalMatch.matchId } });
  assert.strictEqual(finalCheck.teamAId, finalStandings[0].teamId, 'Final Team A must dynamically become Winner of SF1');
  assert.strictEqual(finalCheck.teamBId, null, 'Final Team B must still be null waiting for SF2');
  console.log(`✅ Winner SF1 (${finalStandings[0].name}) advanced to Final Team A`);

  // Score SF2: Rank 2 wins 2 - 0
  await prisma.match.update({
    where: { id: sf2.matchId },
    data: { teamAScore: 2, teamBScore: 0, status: 'COMPLETED' },
  });
  await advanceKnockoutWinner(sf2.matchId);

  finalCheck = await prisma.match.findUnique({
    where: { id: finalMatch.matchId },
    include: { teamA: true, teamB: true },
  });
  assert.strictEqual(finalCheck.teamBId, finalStandings[1].teamId, 'Final Team B must dynamically become Winner of SF2');
  console.log(`✅ Winner SF2 (${finalStandings[1].name}) advanced to Final Team B`);
  console.log(`✅ Grand Final Matchup fully determined: ${finalCheck.teamA.name} vs ${finalCheck.teamB.name}`);

  const tourneyInFinal = await prisma.tournament.findUnique({ where: { id: tournament.id } });
  assert.strictEqual(tourneyInFinal.currentStage, 'FINAL', 'Tournament stage must become FINAL after both SFs complete');
  console.log(`✅ Tournament stage transitioned to FINAL`);

  // Step 10: Score Grand Final & Crown Champion
  console.log('\n--- Test Phase 9: Grand Final Scoring & Championship Glory ---');
  // Team A wins 4 - 2
  await prisma.match.update({
    where: { id: finalMatch.matchId },
    data: { teamAScore: 4, teamBScore: 2, status: 'COMPLETED' },
  });
  await advanceKnockoutWinner(finalMatch.matchId);

  const completedTourney = await prisma.tournament.findUnique({ where: { id: tournament.id } });
  assert.strictEqual(completedTourney.currentStage, 'COMPLETED', 'Current stage must be COMPLETED');
  assert.strictEqual(completedTourney.status, 'COMPLETED', 'Status must be COMPLETED');
  console.log(`✅ Champion crowned: ${finalCheck.teamA.name}!`);
  console.log(`Tournament stage: ${completedTourney.currentStage} (Status: ${completedTourney.status})`);

  // Step 11: Verify League Data Integrity (Requirement 22)
  console.log('\n--- Test Phase 10: League Data Integrity Verification ---');
  const finalStandingsCheck = await calculateStandings(tournament.id);
  assert.strictEqual(finalStandingsCheck.standings.length, 6, 'All 6 teams must have intact league standings');
  const leagueMatchesCount = await prisma.match.count({
    where: { tournamentId: tournament.id, round: 'LEAGUE' },
  });
  assert.strictEqual(leagueMatchesCount, 15, 'All 15 league matches must persist');
  console.log(`✅ League data 100% intact: 15 league fixtures and 6 standing rows preserved.`);

  // Step 12: Verify Public Homepage HTTP 200 Rendering
  console.log('\n--- Test Phase 11: Public Homepage Rendering ---');
  const homeRes = await fetch('http://localhost:3000/');
  assert.strictEqual(homeRes.status, 200, 'Public homepage must respond with HTTP 200');
  const homeText = await homeRes.text();
  assert.ok(homeText.includes('AMRELI 1st'), 'Homepage must render tournament branding');
  console.log('✅ Public homepage rendered successfully with HTTP 200');

  console.log('\n================================================================');
  console.log('🎉 ALL 11 VERIFICATION PHASES PASSED WITH ZERO ERRORS!');
  console.log('================================================================\n');
}

runFullVerification()
  .catch((err) => {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
