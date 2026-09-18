// Comprehensive verification script for Amreli 1st Hockey 7-Side Tournament Platform
import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🧪 === STARTING AMRELI HOCKEY PLATFORM VERIFICATION === 🧪\n');

  // 1. Public Tournament Info
  console.log('Test 1: Fetching Public Tournament Configuration...');
  const tRes = await fetch(`${BASE_URL}/api/public/tournament`);
  assert.strictEqual(tRes.status, 200, 'Tournament endpoint must return 200');
  const tData = await tRes.json();
  assert.ok(tData.tournament, 'Tournament object must exist');
  assert.strictEqual(tData.tournament.name, 'AMRELI 1st HOCKEY 7-SIDE TOURNAMENT');
  assert.strictEqual(tData.tournament.sport, 'Field Hockey — 7-Side');
  console.log(`✅ Tournament verified: "${tData.tournament.name}" (${tData.stats.totalTeams} teams, ${tData.stats.totalPlayers} players)\n`);

  // 2. Public Standings Table Calculation
  console.log('Test 2: Verifying Dynamic Standings Table...');
  const sRes = await fetch(`${BASE_URL}/api/public/standings`);
  assert.strictEqual(sRes.status, 200);
  const sData = await sRes.json();
  assert.ok(Array.isArray(sData.standings), 'Standings must be an array');
  assert.ok(sData.standings.length >= 6, 'Should have at least 6 teams');
  const leader = sData.standings[0];
  console.log(`✅ Standings calculated: 1st Place is "${leader.name}" with ${leader.points} pts (${leader.won}W ${leader.drawn}D ${leader.lost}L, GD: ${leader.goalDifference})\n`);

  // 3. Public Statistics (Top Scorers & Top Goalkeepers by Fewest Goals Conceded)
  console.log('Test 3: Verifying Statistics (Top Scorers & Goalkeeping Leaders)...');
  const statsRes = await fetch(`${BASE_URL}/api/public/statistics`);
  assert.strictEqual(statsRes.status, 200);
  const statsData = await statsRes.json();
  assert.ok(statsData.topScorers.length > 0, 'Must have top scorers');
  assert.ok(statsData.topGoalkeepers.length > 0, 'Must have top goalkeepers');

  const topScorer = statsData.topScorers[0];
  console.log(`✅ Top Scorer: ${topScorer.playerName} (${topScorer.teamName}) with ${topScorer.goals} goals`);

  const topGk = statsData.topGoalkeepers[0];
  console.log(`✅ Top Goalkeeper (Fewest Goals Conceded): ${topGk.playerName} (${topGk.teamName}) with ${topGk.goalsConceded} goals conceded in ${topGk.matches} matches (Clean sheets: ${topGk.cleanSheets})`);
  assert.ok(topGk.matches > 0, 'Goalkeeper must have played at least 1 match');
  console.log('✅ Statistics leaderboards verified.\n');

  // 4. Admin Authentication
  console.log('Test 4: Admin Login & Protected Route Security...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@amrelihockey.com',
      password: 'AmreliHockey@2026',
    }),
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login must succeed');
  const rawCookie = loginRes.headers.get('set-cookie');
  assert.ok(rawCookie, 'Must receive auth cookie');
  const cookie = rawCookie.split(';')[0];

  // Test unauthenticated access to admin endpoint
  const unauthRes = await fetch(`${BASE_URL}/api/admin/teams`);
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request to admin endpoint must return 401 Unauthorized');
  console.log('✅ Security guard verified: Unauthorized request rejected with 401.');

  // Test authenticated access
  const authRes = await fetch(`${BASE_URL}/api/admin/teams`, {
    headers: { Cookie: cookie },
  });
  assert.strictEqual(authRes.status, 200, 'Authenticated request to admin endpoint must return 200');
  console.log('✅ Admin session verified with valid JWT cookie.\n');

  // 5. Team CRUD, Unlimited Players & Captain Reassignment
  console.log('Test 5: Team Management & Captain Switch...');
  const createTeamRes = await fetch(`${BASE_URL}/api/admin/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      name: 'Rajkot Dynamos',
      shortName: 'RDY',
      coach: 'Suresh Raina',
      description: 'Invited guest academy featuring rising talents.',
      primaryColor: '#e11d48',
    }),
  });
  assert.strictEqual(createTeamRes.status, 200);
  const createdTeamData = await createTeamRes.json();
  const testTeamId = createdTeamData.team.id;
  console.log(`✅ Created Team: "${createdTeamData.team.name}" (ID: ${testTeamId})`);

  // Add 2 players to team
  const p1Res = await fetch(`${BASE_URL}/api/admin/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      teamId: testTeamId,
      name: 'Krunal Pandya',
      jerseyNumber: 12,
      position: 'MIDFIELDER',
      isCaptain: false,
    }),
  });
  const p1Data = await p1Res.json();

  const p2Res = await fetch(`${BASE_URL}/api/admin/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      teamId: testTeamId,
      name: 'Deepak Chahar',
      jerseyNumber: 9,
      position: 'FORWARD',
      isCaptain: false,
    }),
  });
  const p2Data = await p2Res.json();
  console.log(`✅ Added players to roster: ${p1Data.player.name} and ${p2Data.player.name}`);

  // Assign Captain 1 (Krunal)
  await fetch(`${BASE_URL}/api/admin/teams/${testTeamId}/captain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ playerId: p1Data.player.id }),
  });

  // Verify on public team endpoint
  let publicTeamRes = await fetch(`${BASE_URL}/api/public/teams/${testTeamId}`);
  let publicTeamData = await publicTeamRes.json();
  assert.strictEqual(publicTeamData.team.captain?.name, 'Krunal Pandya', 'Krunal must be captain');
  console.log('✅ Captain assigned: Krunal Pandya ⭐ verified on public team page.');

  // Switch Captain to Deepak Chahar
  await fetch(`${BASE_URL}/api/admin/teams/${testTeamId}/captain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ playerId: p2Data.player.id }),
  });

  publicTeamRes = await fetch(`${BASE_URL}/api/public/teams/${testTeamId}`);
  publicTeamData = await publicTeamRes.json();
  assert.strictEqual(publicTeamData.team.captain?.name, 'Deepak Chahar', 'Deepak must now be captain');
  assert.strictEqual(publicTeamData.team.players.find(p => p.name === 'Krunal Pandya').isCaptain, false, 'Krunal is no longer captain');
  console.log('✅ Captain successfully switched to: Deepak Chahar ⭐ (exclusivity verified on public page).\n');

  // 6. Score Correction & Automatic Recalculation Engine
  console.log('Test 6: Score Correction & Automatic Standings Recalculation...');
  // Find Amreli Hockey Club
  const ahcTeam = sData.standings.find(s => s.shortName === 'AHC');
  const initialAhcGF = ahcTeam.goalsFor;
  const initialAhcGD = ahcTeam.goalDifference;

  // Create match between AHC and Rajkot Dynamos
  const createMatchRes = await fetch(`${BASE_URL}/api/admin/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      round: 'LEAGUE',
      teamAId: ahcTeam.teamId,
      teamBId: testTeamId,
      venue: 'Pitch 1 - Test Arena',
      time: '04:00 PM',
    }),
  });
  const matchData = await createMatchRes.json();
  const matchId = matchData.match.id;

  // Enter initial score: 2–1
  await fetch(`${BASE_URL}/api/admin/matches`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      id: matchId,
      teamAScore: 2,
      teamBScore: 1,
      status: 'COMPLETED',
    }),
  });

  let checkStandings = await (await fetch(`${BASE_URL}/api/public/standings`)).json();
  let updatedAhc = checkStandings.standings.find(s => s.teamId === ahcTeam.teamId);
  assert.strictEqual(updatedAhc.goalsFor, initialAhcGF + 2, 'Goals For must increase by 2');
  assert.strictEqual(updatedAhc.goalDifference, initialAhcGD + 1, 'Goal Difference must increase by +1');
  console.log(`✅ Initial match entered (2–1): AHC GF = ${updatedAhc.goalsFor}, GD = ${updatedAhc.goalDifference}`);

  // CRITICAL REQUIREMENT #15: Score Correction from 2-1 to 5-1!
  console.log('⚡ Executing Score Correction: Changing score from 2–1 to 5–1...');
  await fetch(`${BASE_URL}/api/admin/matches`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      id: matchId,
      teamAScore: 5,
      teamBScore: 1,
      status: 'COMPLETED',
    }),
  });

  checkStandings = await (await fetch(`${BASE_URL}/api/public/standings`)).json();
  updatedAhc = checkStandings.standings.find(s => s.teamId === ahcTeam.teamId);
  assert.strictEqual(updatedAhc.goalsFor, initialAhcGF + 5, 'Goals For must automatically recalculate to initial + 5');
  assert.strictEqual(updatedAhc.goalDifference, initialAhcGD + 4, 'Goal Difference must automatically recalculate to initial + 4');
  console.log(`✅ Score correction verified! AHC GF updated to ${updatedAhc.goalsFor}, GD updated to ${updatedAhc.goalDifference} with zero manual intervention!\n`);

  // 7. Announcements & Reviews
  console.log('Test 7: Announcements & Review Moderation...');
  const annRes = await fetch(`${BASE_URL}/api/admin/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      title: '⚡ LIVE BREAKING: Rajkot Dynamos Test Notice',
      message: 'Persistent storage verification announcement for Amreli tournament.',
      type: 'GENERAL',
      priority: 'URGENT',
      isPinned: true,
    }),
  });
  const annData = await annRes.json();
  const testAnnId = annData.announcement.id;

  // Check public announcements
  const pubAnnRes = await (await fetch(`${BASE_URL}/api/public/announcements`)).json();
  assert.strictEqual(pubAnnRes.latestAnnouncement.id, testAnnId, 'Latest announcement must be our newly created urgent notice');
  console.log('✅ Urgent announcement published and surfaced as latest announcement.');

  // Submit public fan review
  const revSubmitRes = await fetch(`${BASE_URL}/api/public/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Chirag Dave',
      rating: 5,
      message: 'Outstanding 7-side hockey action in Amreli! Unbelievable facilities and energy.',
    }),
  });
  const revSubmitData = await revSubmitRes.json();
  const testRevId = revSubmitData.review.id;
  assert.strictEqual(revSubmitData.review.status, 'PENDING', 'New review must start in PENDING state');

  // Verify review is NOT in public gallery yet
  let pubRevs = await (await fetch(`${BASE_URL}/api/public/reviews`)).json();
  assert.ok(!pubRevs.reviews.some(r => r.id === testRevId), 'Pending review must not appear in public reviews');
  console.log('✅ Review security verified: Pending review is hidden from public view.');

  // Admin approves review
  await fetch(`${BASE_URL}/api/admin/reviews`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ id: testRevId, status: 'APPROVED', isFeatured: true }),
  });

  // Verify review now appears publicly
  pubRevs = await (await fetch(`${BASE_URL}/api/public/reviews`)).json();
  const approvedReview = pubRevs.reviews.find(r => r.id === testRevId);
  assert.ok(approvedReview, 'Approved review must appear in public reviews');
  assert.strictEqual(approvedReview.isFeatured, true, 'Review marked as featured');
  console.log('✅ Review moderation verified: Approved & Featured review displays in public gallery.\n');

  console.log('🎉 ALL FUNCTIONAL AND CALCULATION TESTS PASSED! 🎉\n');
}

runTests().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
