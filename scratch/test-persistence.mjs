import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function testPersistence() {
  console.log('🔄 === VERIFYING PERSISTENCE AFTER SERVER RESTART === 🔄\n');

  // 1. Verify Team persists
  console.log('1. Checking created team "Rajkot Dynamos" persists...');
  const teamsRes = await fetch(`${BASE_URL}/api/public/teams`);
  const teamsData = await teamsRes.json();
  const rajkot = teamsData.teams.find((t) => t.shortName === 'RDY');
  assert.ok(rajkot, 'Team "Rajkot Dynamos" must persist in database after server reboot');
  console.log(`✅ Persisted team found: ${rajkot.name} with ${rajkot.players.length} rostered players.`);

  // 2. Verify Captain persists
  console.log('2. Checking switched Captain persists...');
  const teamDetailRes = await fetch(`${BASE_URL}/api/public/teams/${rajkot.id}`);
  const teamDetailData = await teamDetailRes.json();
  assert.strictEqual(
    teamDetailData.team.captain?.name,
    'Deepak Chahar',
    'Captain Deepak Chahar must persist'
  );
  console.log(`✅ Persisted captain found: ${teamDetailData.team.captain.name} ⭐`);

  // 3. Verify Match Score correction persists
  console.log('3. Checking corrected score (5–1) and standings persist...');
  const matchesRes = await fetch(`${BASE_URL}/api/public/matches`);
  const matchesData = await matchesRes.json();
  const testMatch = matchesData.matches
    .slice()
    .reverse()
    .find((m) => m.teamA.shortName === 'AHC' && m.teamB.shortName === 'RDY');
  assert.ok(testMatch, 'Match between AHC and RDY must persist');
  assert.strictEqual(testMatch.teamAScore, 5, 'Score must remain 5');
  assert.strictEqual(testMatch.teamBScore, 1, 'Score must remain 1');
  console.log(`✅ Corrected match score persisted: ${testMatch.teamAScore}–${testMatch.teamBScore}`);

  // 4. Verify Standings Table reflects persisted score
  const standingsRes = await fetch(`${BASE_URL}/api/public/standings`);
  const standingsData = await standingsRes.json();
  const ahcStanding = standingsData.standings.find((s) => s.shortName === 'AHC');
  assert.strictEqual(ahcStanding.won, 4, 'AHC 4 wins must persist');
  assert.strictEqual(ahcStanding.goalsFor, 14, 'AHC 14 GF must persist');
  console.log(`✅ Standings persisted: AHC Points = ${ahcStanding.points}, GF = ${ahcStanding.goalsFor}, GD = ${ahcStanding.goalDifference}`);

  // 5. Verify Announcement persists
  console.log('5. Checking announcement persists...');
  const annRes = await fetch(`${BASE_URL}/api/public/announcements`);
  const annData = await annRes.json();
  const testAnn = annData.announcements.find((a) =>
    a.title.includes('Rajkot Dynamos Test Notice')
  );
  assert.ok(testAnn, 'Announcement must persist');
  console.log(`✅ Persisted announcement found: "${testAnn.title}"`);

  // 6. Verify Review persists
  console.log('6. Checking approved fan review persists...');
  const revRes = await fetch(`${BASE_URL}/api/public/reviews`);
  const revData = await revRes.json();
  const testRev = revData.reviews.find((r) => r.name === 'Chirag Dave');
  assert.ok(testRev, 'Approved fan review must persist');
  console.log(`✅ Persisted approved review found: "${testRev.message}" by ${testRev.name}`);

  console.log('\n🏆 100% PERSISTENCE ACROSS REBOOT VERIFIED! THE DATABASE IS THE TRUE SINGLE SOURCE OF TRUTH! 🏆\n');
}

testPersistence().catch((err) => {
  console.error('❌ Persistence test failed:', err);
  process.exit(1);
});
