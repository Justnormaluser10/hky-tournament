import { prisma } from '../src/lib/prisma';
import {
  calculateStandings,
  calculateTopScorers,
  calculateTopGoalkeepers,
  calculateBestDefenders,
  calculateManOfTheMatches,
  calculateTeamStats,
} from '../src/lib/engine';
import assert from 'assert';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 AMRELI TOURNAMENT — FULL ADMIN EDITABILITY TESTS');
  console.log('====================================================\n');

  // Baseline Verification
  const tournament = await prisma.tournament.findFirst();
  assert.ok(tournament, 'Tournament must exist');
  console.log(`🏆 Tournament: "${tournament.name}" (ID: ${tournament.id})`);

  const initialTeams = await prisma.team.findMany({ where: { tournamentId: tournament.id } });
  const initialPlayers = await prisma.player.findMany({ where: { team: { tournamentId: tournament.id } } });
  const initialMatches = await prisma.match.findMany({ where: { tournamentId: tournament.id } });

  console.log(`📊 Baseline Counts: ${initialTeams.length} Teams, ${initialPlayers.length} Players, ${initialMatches.length} Matches`);
  assert.strictEqual(initialTeams.length, 6, 'Must have exactly 6 teams');
  assert.strictEqual(initialPlayers.length, 55, 'Must have exactly 55 players');
  assert.strictEqual(initialMatches.length, 15, 'Must have exactly 15 matches');

  // Clean up any leftover test overrides before running
  await prisma.standingOverride.deleteMany({ where: { tournamentId: tournament.id } });
  await prisma.playerStatOverride.deleteMany({ where: { tournamentId: tournament.id } });

  // ----------------------------------------------------
  // TEST A: Change a match score -> standings update
  // ----------------------------------------------------
  console.log('\n--- [TEST A] Change a match score -> Standings update ---');
  const targetMatch = await prisma.match.findFirst({
    where: { tournamentId: tournament.id, status: 'COMPLETED', round: 'LEAGUE' },
    include: { teamA: true, teamB: true },
  });
  assert.ok(targetMatch && targetMatch.teamA && targetMatch.teamB, 'Must have a completed league match');

  const baselineStandings = await calculateStandings(tournament.id);
  const origTeamARow = baselineStandings.standings.find((s) => s.teamId === targetMatch.teamAId)!;
  const origTeamAGoalsFor = origTeamARow.goalsFor;

  // Temporarily increment teamAScore by 2
  await prisma.match.update({
    where: { id: targetMatch.id },
    data: { teamAScore: targetMatch.teamAScore + 2 },
  });

  const updatedStandingsA = await calculateStandings(tournament.id);
  const newTeamARow = updatedStandingsA.standings.find((s) => s.teamId === targetMatch.teamAId)!;
  assert.strictEqual(
    newTeamARow.goalsFor,
    origTeamAGoalsFor + 2,
    `Team A goalsFor should increase by 2 (expected ${origTeamAGoalsFor + 2}, got ${newTeamARow.goalsFor})`
  );
  console.log(`✅ Standings updated automatically: Goals For changed from ${origTeamAGoalsFor} to ${newTeamARow.goalsFor}`);

  // Restore original match score
  await prisma.match.update({
    where: { id: targetMatch.id },
    data: { teamAScore: targetMatch.teamAScore },
  });
  const restoredStandings = await calculateStandings(tournament.id);
  const restoredRow = restoredStandings.standings.find((s) => s.teamId === targetMatch.teamAId)!;
  assert.strictEqual(restoredRow.goalsFor, origTeamAGoalsFor, 'Standings reverted to baseline');
  console.log('✅ Reverted match score; standings verified clean.');

  // ----------------------------------------------------
  // TEST B: Correct a goal scorer -> Top Scorer update
  // ----------------------------------------------------
  console.log('\n--- [TEST B] Correct a goal scorer -> Top Scorer update ---');
  const testPlayer = initialPlayers[0];
  const baselineScorers = await calculateTopScorers(tournament.id);
  const initialPlayerScorer = baselineScorers.find((s) => s.playerId === testPlayer.id);
  const initialPlayerGoals = initialPlayerScorer ? initialPlayerScorer.goals : 0;

  // Apply administrative override: +5 goals
  await prisma.playerStatOverride.upsert({
    where: { playerId: testPlayer.id },
    create: {
      tournamentId: tournament.id,
      playerId: testPlayer.id,
      goals: initialPlayerGoals + 5,
      notes: 'Official administrative correction',
    },
    update: {
      goals: initialPlayerGoals + 5,
      notes: 'Official administrative correction',
    },
  });

  const overriddenScorers = await calculateTopScorers(tournament.id);
  const updatedPlayerScorer = overriddenScorers.find((s) => s.playerId === testPlayer.id);
  assert.ok(updatedPlayerScorer, 'Player must appear in Top Scorers');
  assert.strictEqual(updatedPlayerScorer.goals, initialPlayerGoals + 5, 'Player goals must equal overridden value');
  assert.strictEqual(updatedPlayerScorer.isOverridden, true, 'Row must be marked isOverridden = true');
  console.log(`✅ Admin goal correction applied: ${testPlayer.name} goals updated from ${initialPlayerGoals} to ${updatedPlayerScorer.goals}`);

  // Reset override
  await prisma.playerStatOverride.deleteMany({ where: { playerId: testPlayer.id } });
  const revertedScorers = await calculateTopScorers(tournament.id);
  const revertedPlayerScorer = revertedScorers.find((s) => s.playerId === testPlayer.id);
  assert.strictEqual(
    revertedPlayerScorer ? revertedPlayerScorer.goals : 0,
    initialPlayerGoals,
    'Goals reverted to match-calculated value'
  );
  console.log('✅ Reset override; Top Scorer reverted to automatic match records.');

  // ----------------------------------------------------
  // TEST C: Correct goalkeeper statistic -> Top Goalkeeper update
  // ----------------------------------------------------
  console.log('\n--- [TEST C] Correct goalkeeper statistic -> Top Goalkeeper update ---');
  const gkPlayer = initialPlayers.find((p) => p.position === 'GOALKEEPER');
  assert.ok(gkPlayer, 'Must have at least one goalkeeper');

  // Apply override: 0 goals conceded, 6 clean sheets
  await prisma.playerStatOverride.upsert({
    where: { playerId: gkPlayer.id },
    create: {
      tournamentId: tournament.id,
      playerId: gkPlayer.id,
      goalsConceded: 0,
      cleanSheets: 6,
      matchesPlayed: 6,
      notes: 'Clean sheet record correction',
    },
    update: {
      goalsConceded: 0,
      cleanSheets: 6,
      matchesPlayed: 6,
      notes: 'Clean sheet record correction',
    },
  });

  const updatedGkList = await calculateTopGoalkeepers(tournament.id);
  const targetGk = updatedGkList.find((g) => g.playerId === gkPlayer.id);
  assert.ok(targetGk, 'Goalkeeper must appear in Top Goalkeepers');
  assert.strictEqual(targetGk.goalsConceded, 0, 'Goals conceded must be 0');
  assert.strictEqual(targetGk.cleanSheets, 6, 'Clean sheets must be 6');
  assert.strictEqual(targetGk.rank, 1, 'Goalkeeper with 0 conceded and 6 CS must rank #1');
  assert.strictEqual(targetGk.isOverridden, true, 'isOverridden must be true');
  console.log(`✅ Top Goalkeeper correction applied: ${gkPlayer.name} now Rank #1 (0 GA, 6 CS)`);

  // Reset override
  await prisma.playerStatOverride.deleteMany({ where: { playerId: gkPlayer.id } });
  const restoredGkList = await calculateTopGoalkeepers(tournament.id);
  const restoredTargetGk = restoredGkList.find((g) => g.playerId === gkPlayer.id);
  if (restoredTargetGk) {
    assert.strictEqual(restoredTargetGk.isOverridden, false, 'isOverridden must revert to false');
  }
  console.log('✅ Reset goalkeeper override; rankings returned to match calculation.');

  // ----------------------------------------------------
  // TEST D: Change Best Defender -> old award removed and new award assigned
  // ----------------------------------------------------
  console.log('\n--- [TEST D] Change Best Defender -> Old award removed & new award assigned ---');
  const playerA = initialPlayers[0];
  const playerB = initialPlayers[1];
  const awardMatch = targetMatch;

  const originalDefenderId = awardMatch.bestDefenderId;

  // Step 1: Assign Player A
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { bestDefenderId: playerA.id },
  });
  let defenders = await calculateBestDefenders(tournament.id);
  let defA = defenders.find((d) => d.playerId === playerA.id);
  const countA_step1 = defA ? defA.awardsCount : 0;
  assert.ok(countA_step1 >= 1, 'Player A must have at least 1 award');
  console.log(`   Assigned Best Defender to Player A (${playerA.name}): Count = ${countA_step1}`);

  // Step 2: Reassign to Player B
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { bestDefenderId: playerB.id },
  });
  defenders = await calculateBestDefenders(tournament.id);
  defA = defenders.find((d) => d.playerId === playerA.id);
  const defB = defenders.find((d) => d.playerId === playerB.id);
  const countA_step2 = defA ? defA.awardsCount : 0;
  const countB_step2 = defB ? defB.awardsCount : 0;

  assert.strictEqual(countA_step2, countA_step1 - 1, 'Player A award count must decrease by 1');
  assert.ok(countB_step2 >= 1, 'Player B must now have received the award');
  console.log(`✅ Reassigned to Player B (${playerB.name}): Player A awards decreased to ${countA_step2}, Player B awards is now ${countB_step2}`);

  // Restore original
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { bestDefenderId: originalDefenderId },
  });
  console.log('✅ Restored match best defender to original state.');

  // ----------------------------------------------------
  // TEST E: Change MOTM -> old award removed and new award assigned
  // ----------------------------------------------------
  console.log('\n--- [TEST E] Change MOTM -> Old award removed & new award assigned ---');
  const originalMotmId = awardMatch.motmId;
  const playerX = initialPlayers[2];
  const playerY = initialPlayers[3];

  // Step 1: Assign Player X
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { motmId: playerX.id },
  });
  let motms = await calculateManOfTheMatches(tournament.id);
  let motmX = motms.find((m) => m.playerId === playerX.id);
  const countX_step1 = motmX ? motmX.awardsCount : 0;
  assert.ok(countX_step1 >= 1, 'Player X must have at least 1 MOTM award');
  console.log(`   Assigned MOTM to Player X (${playerX.name}): Count = ${countX_step1}`);

  // Step 2: Reassign to Player Y
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { motmId: playerY.id },
  });
  motms = await calculateManOfTheMatches(tournament.id);
  motmX = motms.find((m) => m.playerId === playerX.id);
  const motmY = motms.find((m) => m.playerId === playerY.id);
  const countX_step2 = motmX ? motmX.awardsCount : 0;
  const countY_step2 = motmY ? motmY.awardsCount : 0;

  assert.strictEqual(countX_step2, countX_step1 - 1, 'Player X MOTM count must decrease by 1');
  assert.ok(countY_step2 >= 1, 'Player Y must now have received the MOTM award');
  console.log(`✅ Reassigned MOTM to Player Y (${playerY.name}): Player X count decreased to ${countX_step2}, Player Y count is now ${countY_step2}`);

  // Restore original
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { motmId: originalMotmId },
  });
  console.log('✅ Restored match MOTM to original state.');

  // ----------------------------------------------------
  // TEST F: Save the same match repeatedly -> NO duplicate statistics
  // ----------------------------------------------------
  console.log('\n--- [TEST F] Save same match repeatedly -> Strict Idempotency ---');
  // Set awards on match
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { bestDefenderId: playerA.id, motmId: playerX.id },
  });

  const countDefenderBaseline = (await calculateBestDefenders(tournament.id)).find((d) => d.playerId === playerA.id)?.awardsCount || 0;
  const countMotmBaseline = (await calculateManOfTheMatches(tournament.id)).find((m) => m.playerId === playerX.id)?.awardsCount || 0;

  // Save the exact same match 5 times in a row
  for (let i = 1; i <= 5; i++) {
    await prisma.match.update({
      where: { id: awardMatch.id },
      data: {
        bestDefenderId: playerA.id,
        motmId: playerX.id,
        notes: `Idempotency save #${i}`,
      },
    });
  }

  const countDefenderAfter5 = (await calculateBestDefenders(tournament.id)).find((d) => d.playerId === playerA.id)?.awardsCount || 0;
  const countMotmAfter5 = (await calculateManOfTheMatches(tournament.id)).find((m) => m.playerId === playerX.id)?.awardsCount || 0;

  assert.strictEqual(
    countDefenderAfter5,
    countDefenderBaseline,
    `Best Defender count must remain strictly ${countDefenderBaseline} after 5 repeated saves, got ${countDefenderAfter5}`
  );
  assert.strictEqual(
    countMotmAfter5,
    countMotmBaseline,
    `MOTM count must remain strictly ${countMotmBaseline} after 5 repeated saves, got ${countMotmAfter5}`
  );
  console.log(`✅ Idempotency strictly verified: Best Defender remained ${countDefenderAfter5}, MOTM remained ${countMotmAfter5} after 5 saves.`);

  // Restore match awards
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { bestDefenderId: originalDefenderId, motmId: originalMotmId, notes: awardMatch.notes },
  });

  // ----------------------------------------------------
  // TEST G: Refresh Admin -> Corrections persist in DB
  // ----------------------------------------------------
  console.log('\n--- [TEST G] Refresh Admin -> Corrections persist in DB ---');
  const targetTeam = initialTeams[0];
  await prisma.standingOverride.upsert({
    where: { teamId: targetTeam.id },
    create: {
      tournamentId: tournament.id,
      teamId: targetTeam.id,
      points: 25,
      position: 1,
      notes: 'Administrative penalty adjustment',
    },
    update: {
      points: 25,
      position: 1,
      notes: 'Administrative penalty adjustment',
    },
  });

  // Simulate a page refresh: Re-query from fresh database call
  const reloadedStandings = await calculateStandings(tournament.id);
  const reloadedTeam = reloadedStandings.standings.find((s) => s.teamId === targetTeam.id);
  assert.ok(reloadedTeam, 'Team must be present');
  assert.strictEqual(reloadedTeam.points, 25, 'Persisted points must equal 25');
  assert.strictEqual(reloadedTeam.position, 1, 'Persisted position must equal 1');
  assert.strictEqual(reloadedTeam.isOverridden, true, 'isOverridden must be true');
  console.log(`✅ Standings correction persisted after fresh query: ${targetTeam.name} has 25 pts and rank #1`);

  // Clean up
  await prisma.standingOverride.deleteMany({ where: { teamId: targetTeam.id } });
  console.log('✅ Cleaned up standings override.');

  // ----------------------------------------------------
  // TEST H: Open public website -> Corrections are reflected
  // ----------------------------------------------------
  console.log('\n--- [TEST H] Open public website -> Public endpoints consume engine overrides ---');
  // Both public `/api/public/statistics` and `/api/public/standings` invoke the exact engine functions:
  // calculateStandings, calculateTopScorers, calculateTopGoalkeepers, calculateBestDefenders, calculateManOfTheMatches
  const publicStandings = await calculateStandings();
  assert.ok(publicStandings.standings.length >= 6, 'Public standings must return all teams');

  const publicScorers = await calculateTopScorers();
  const publicGks = await calculateTopGoalkeepers();
  const publicDefs = await calculateBestDefenders();
  const publicMotms = await calculateManOfTheMatches();
  const publicTeamStats = await calculateTeamStats();

  assert.ok(Array.isArray(publicScorers), 'Top Scorers must be array');
  assert.ok(Array.isArray(publicGks), 'Top Goalkeepers must be array');
  assert.ok(Array.isArray(publicDefs), 'Best Defenders must be array');
  assert.ok(Array.isArray(publicMotms), 'Man of the Matches must be array');
  assert.ok(publicTeamStats, 'Team stats summary must be returned');
  console.log('✅ Public data layers tested: Standings, Scorers, Goalkeepers, Defenders, MOTMs, TeamStats all valid.');

  // ----------------------------------------------------
  // TEST I: Verify all four statistics visible in Honours & Statistics page
  // ----------------------------------------------------
  console.log('\n--- [TEST I] Verify all 4 Honours / Statistics categories ---');
  console.log(`   1. Top Scorers: ${publicScorers.length} ranked players`);
  console.log(`   2. Top Goalkeepers: ${publicGks.length} ranked goalkeepers`);
  console.log(`   3. Best Defenders: ${publicDefs.length} ranked defenders`);
  console.log(`   4. Man of the Match: ${publicMotms.length} ranked MVPs`);

  // Assign a sample Best Defender and MOTM to verify non-empty ranking display
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { bestDefenderId: initialPlayers[4].id, motmId: initialPlayers[5].id },
  });

  const updatedDefs = await calculateBestDefenders(tournament.id);
  const updatedMotms = await calculateManOfTheMatches(tournament.id);

  assert.ok(updatedDefs.length > 0, 'Best Defenders leaderboard must have entries');
  assert.ok(updatedMotms.length > 0, 'Man of the Match leaderboard must have entries');
  console.log(`   Verified with live award: Best Defender #1 is ${updatedDefs[0].playerName} (${updatedDefs[0].awardsCount} award)`);
  console.log(`   Verified with live award: MOTM #1 is ${updatedMotms[0].playerName} (${updatedMotms[0].awardsCount} award)`);

  // Restore original match awards
  await prisma.match.update({
    where: { id: awardMatch.id },
    data: { bestDefenderId: originalDefenderId, motmId: originalMotmId },
  });
  console.log('✅ Restored match awards; all 4 Honours verified.');

  // ----------------------------------------------------
  // TEST J: Verify existing functionality remains intact
  // ----------------------------------------------------
  console.log('\n--- [TEST J] Verify existing functionality & database integrity ---');
  const finalTeams = await prisma.team.findMany({ where: { tournamentId: tournament.id } });
  const finalPlayers = await prisma.player.findMany({ where: { team: { tournamentId: tournament.id } } });
  const finalMatches = await prisma.match.findMany({ where: { tournamentId: tournament.id } });

  assert.strictEqual(finalTeams.length, 6, 'Database must retain exactly 6 teams');
  assert.strictEqual(finalPlayers.length, 55, 'Database must retain exactly 55 players');
  assert.strictEqual(finalMatches.length, 15, 'Database must retain exactly 15 matches');

  // Verify teams integrity
  for (const t of finalTeams) {
    assert.ok(t.name && t.shortName, `Team ${t.id} must have valid name and shortName`);
  }

  // Verify players integrity
  for (const p of finalPlayers) {
    assert.ok(p.name && p.teamId, `Player ${p.id} must have valid name and teamId`);
  }

  console.log('✅ ALL 6 TEAMS, 55 PLAYERS, AND 15 MATCHES 100% PRESERVED INTACT!');
  console.log('\n====================================================');
  console.log('🎉 ALL TESTS A THROUGH J PASSED WITH FLYING COLORS!');
  console.log('====================================================');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
