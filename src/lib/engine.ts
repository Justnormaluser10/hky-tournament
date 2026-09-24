import { prisma } from './prisma';
import { getKnockoutOverrides } from './knockoutOverrides';

export interface StandingRow {
  position: number;
  teamId: string;
  name: string;
  shortName: string;
  logo: string | null;
  primaryColor: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
  isQualified: boolean;
  qualificationStatus?: string | null;
  isOverridden?: boolean;
  overrideNotes?: string | null;
}

export interface ScorerRow {
  rank: number;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  position: string;
  photo: string | null;
  isCaptain: boolean;
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamLogo: string | null;
  primaryColor: string;
  goals: number;
  matchesPlayed: number;
  isOverridden?: boolean;
}

export interface GoalkeeperRow {
  rank: number;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  photo: string | null;
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamLogo: string | null;
  primaryColor: string;
  matches: number;
  goalsConceded: number;
  cleanSheets: number;
  goalsPerMatch: number;
  isOverridden?: boolean;
}

export interface AwardWinnerRow {
  rank: number;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  position: string;
  photo: string | null;
  isCaptain: boolean;
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamLogo: string | null;
  primaryColor: string;
  awardsCount: number;
  matchesPlayed: number;
  isOverridden?: boolean;
}

export interface TeamStatsSummary {
  mostWins: { teamName: string; wins: number; logo: string | null } | null;
  mostGoals: { teamName: string; goals: number; logo: string | null } | null;
  bestGD: { teamName: string; gd: number; logo: string | null } | null;
  bestDefense: { teamName: string; goalsConceded: number; logo: string | null } | null;
  totalGoals: number;
  totalMatches: number;
  completedMatches: number;
}

export interface TeamCompletionStatus {
  teamId: string;
  name: string;
  shortName: string;
  logo: string | null;
  completedMatches: number;
  requiredMatches: number;
  isComplete: boolean;
}

export interface LeagueStageStatus {
  isComplete: boolean;
  teamsCount: number;
  expectedMatches: number;
  scheduledMatches: number;
  completedMatches: number;
  remainingMatches: number;
  percentComplete: number;
  expectedMatchesPerTeam: number;
  teamsStatus: TeamCompletionStatus[];
}

/**
 * Calculates deterministic league standings directly from match records and tournament configuration,
 * with support for official administrative StandingOverride corrections.
 */
export async function calculateStandings(tournamentId?: string): Promise<{
  standings: StandingRow[];
  tournament: any;
}> {
  const tournament = tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst();

  if (!tournament) {
    return { standings: [], tournament: null };
  }

  const teams = await prisma.team.findMany({
    where: { tournamentId: tournament.id },
  });

  const matches = await prisma.match.findMany({
    where: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      status: 'COMPLETED',
    },
    orderBy: { date: 'asc' },
  });

  const overrides = await prisma.standingOverride.findMany({
    where: { tournamentId: tournament.id },
  });
  const overrideMap = new Map(overrides.map((o) => [o.teamId, o]));

  const statsMap: Record<string, StandingRow> = {};
  for (const team of teams) {
    statsMap[team.id] = {
      position: 0,
      teamId: team.id,
      name: team.name,
      shortName: team.shortName,
      logo: team.logo,
      primaryColor: team.primaryColor,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
      isQualified: false,
      qualificationStatus: team.qualificationStatus || null,
      isOverridden: false,
      overrideNotes: null,
    };
  }

  for (const m of matches) {
    if (!m.teamAId || !m.teamBId) continue;
    const rowA = statsMap[m.teamAId];
    const rowB = statsMap[m.teamBId];

    if (!rowA || !rowB) continue;

    rowA.played += 1;
    rowB.played += 1;
    rowA.goalsFor += m.teamAScore;
    rowA.goalsAgainst += m.teamBScore;
    rowB.goalsFor += m.teamBScore;
    rowB.goalsAgainst += m.teamAScore;

    if (m.teamAScore > m.teamBScore) {
      rowA.won += 1;
      rowA.points += tournament.pointsForWin;
      rowA.form.push('W');

      rowB.lost += 1;
      rowB.points += tournament.pointsForLoss;
      rowB.form.push('L');
    } else if (m.teamAScore < m.teamBScore) {
      rowB.won += 1;
      rowB.points += tournament.pointsForWin;
      rowB.form.push('W');

      rowA.lost += 1;
      rowA.points += tournament.pointsForLoss;
      rowA.form.push('L');
    } else {
      rowA.drawn += 1;
      rowA.points += tournament.pointsForDraw;
      rowA.form.push('D');

      rowB.drawn += 1;
      rowB.points += tournament.pointsForDraw;
      rowB.form.push('D');
    }
  }

  let hasExplicitPositionOverride = false;

  const rows = Object.values(statsMap).map((row) => {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.form = row.form.slice(-5);

    const ov = overrideMap.get(row.teamId);
    if (ov) {
      row.isOverridden = true;
      row.overrideNotes = ov.notes;
      if (ov.played !== null && ov.played !== undefined) row.played = ov.played;
      if (ov.won !== null && ov.won !== undefined) row.won = ov.won;
      if (ov.drawn !== null && ov.drawn !== undefined) row.drawn = ov.drawn;
      if (ov.lost !== null && ov.lost !== undefined) row.lost = ov.lost;
      if (ov.goalsFor !== null && ov.goalsFor !== undefined) row.goalsFor = ov.goalsFor;
      if (ov.goalsAgainst !== null && ov.goalsAgainst !== undefined) row.goalsAgainst = ov.goalsAgainst;
      if (ov.goalDifference !== null && ov.goalDifference !== undefined) {
        row.goalDifference = ov.goalDifference;
      } else {
        row.goalDifference = row.goalsFor - row.goalsAgainst;
      }
      if (ov.points !== null && ov.points !== undefined) row.points = ov.points;
      if (ov.position !== null && ov.position !== undefined && ov.position > 0) {
        row.position = ov.position;
        hasExplicitPositionOverride = true;
      }
    }

    return row;
  });

  // Sort by Points DESC, GD DESC, GF DESC, Wins DESC, Name ASC
  // If an administrator set explicit positions, sort by those positions first
  if (hasExplicitPositionOverride) {
    rows.sort((a, b) => {
      const posA = a.position > 0 ? a.position : 9999;
      const posB = b.position > 0 ? b.position : 9999;
      if (posA !== posB) return posA - posB;
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (b.won !== a.won) return b.won - a.won;
      return a.name.localeCompare(b.name);
    });
  } else {
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (b.won !== a.won) return b.won - a.won;
      return a.name.localeCompare(b.name);
    });
  }

  const qualificationCount = tournament.qualificationCount || 4;
  rows.forEach((r, idx) => {
    if (!hasExplicitPositionOverride || r.position <= 0) {
      r.position = idx + 1;
    }
    r.isQualified = r.position <= qualificationCount;
  });

  return { standings: rows, tournament };
}


/**
 * Checks whether the round-robin league stage has 100% completed.
 * For N teams in single round-robin, expected matches = N * (N - 1) / 2, and
 * every team must have completed exactly (N - 1) matches (or all scheduled matches).
 */
export async function checkLeagueStageStatus(tournamentId?: string): Promise<LeagueStageStatus> {
  const tournament = tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst();

  if (!tournament) {
    return {
      isComplete: false,
      teamsCount: 0,
      expectedMatches: 0,
      scheduledMatches: 0,
      completedMatches: 0,
      remainingMatches: 0,
      percentComplete: 0,
      expectedMatchesPerTeam: 0,
      teamsStatus: [],
    };
  }

  const teams = await prisma.team.findMany({
    where: { tournamentId: tournament.id },
    select: { id: true, name: true, shortName: true, logo: true },
  });

  const teamsCount = teams.length;
  const expectedMatches = teamsCount >= 2 ? (teamsCount * (teamsCount - 1)) / 2 : 0;
  const expectedMatchesPerTeam = teamsCount >= 2 ? teamsCount - 1 : 0;

  const leagueMatches = await prisma.match.findMany({
    where: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
    },
    select: { id: true, status: true, teamAId: true, teamBId: true },
  });

  const scheduledMatches = leagueMatches.length;
  const completedLeagueMatches = leagueMatches.filter((m) => m.status === 'COMPLETED');
  const completedMatches = completedLeagueMatches.length;
  const remainingMatches = Math.max(0, scheduledMatches - completedMatches);

  const percentComplete =
    scheduledMatches > 0 ? Math.round((completedMatches / scheduledMatches) * 100) : 0;

  // Crucial Team Match Completion Check (Requirements 3 & 4):
  // Verify that every single participating team has completed all of its required league fixtures
  const teamsStatus: TeamCompletionStatus[] = teams.map((team) => {
    const scheduledForTeam = leagueMatches.filter(
      (m) => m.teamAId === team.id || m.teamBId === team.id
    ).length;
    const completedForTeam = completedLeagueMatches.filter(
      (m) => m.teamAId === team.id || m.teamBId === team.id
    ).length;

    // Required matches is based on round-robin formula (N - 1), or total scheduled if admin customized fixtures
    const requiredForTeam = Math.max(expectedMatchesPerTeam, scheduledForTeam);
    const isTeamComplete = requiredForTeam > 0 && completedForTeam >= requiredForTeam;

    return {
      teamId: team.id,
      name: team.name,
      shortName: team.shortName,
      logo: team.logo,
      completedMatches: completedForTeam,
      requiredMatches: requiredForTeam,
      isComplete: isTeamComplete,
    };
  });

  const allTeamsComplete =
    teamsStatus.length >= 2 && teamsStatus.every((t) => t.isComplete);

  // League is complete only if:
  // 1. At least 2 teams participate
  // 2. Scheduled matches match or exceed the mathematical expected matches (N * (N - 1) / 2)
  // 3. ALL scheduled league matches are marked COMPLETED
  // 4. EVERY team has completed all its required matches (e.g. 5/5 for all 6 teams)
  const isComplete =
    teamsCount >= 2 &&
    scheduledMatches >= expectedMatches &&
    scheduledMatches > 0 &&
    completedMatches === scheduledMatches &&
    allTeamsComplete;

  return {
    isComplete,
    teamsCount,
    expectedMatches,
    scheduledMatches,
    completedMatches,
    remainingMatches,
    percentComplete,
    expectedMatchesPerTeam,
    teamsStatus,
  };
}

/**
 * Generates knockout stage fixtures seeded from current league standings.
 * Dynamically supports Top 2, Top 4, Top 8 qualifiers.
 */
export async function generateKnockoutStages(tournamentId: string): Promise<{
  success: boolean;
  message: string;
  matchesCount: number;
}> {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error('Tournament not found');

  // Guard: League stage MUST be 100% complete before generating knockout stages (Requirements 1, 4, 20)
  const leagueStatus = await checkLeagueStageStatus(tournament.id);
  if (!leagueStatus.isComplete) {
    throw new Error(
      `Cannot activate knockout stage: League stage is not complete yet (${leagueStatus.completedMatches}/${leagueStatus.expectedMatches} matches completed). All teams must finish all required league fixtures.`
    );
  }

  const { standings } = await calculateStandings(tournament.id);
  const qualificationCount = tournament.qualificationCount || 4;

  if (standings.length < qualificationCount) {
    throw new Error(
      `Need at least ${qualificationCount} teams in standings to generate knockout stage.`
    );
  }

  // Delete existing knockout records and their matches without affecting league matches
  const existingKnockoutMatches = await prisma.knockoutMatch.findMany({
    where: { match: { tournamentId: tournament.id } },
    select: { id: true, matchId: true },
  });

  if (existingKnockoutMatches.length > 0) {
    const matchIds = existingKnockoutMatches.map((k) => k.matchId);
    await prisma.knockoutMatch.deleteMany({
      where: { id: { in: existingKnockoutMatches.map((k) => k.id) } },
    });
    await prisma.matchEvent.deleteMany({
      where: { matchId: { in: matchIds } },
    });
    await prisma.match.deleteMany({
      where: { id: { in: matchIds } },
    });
  }

  const lastMatch = await prisma.match.findFirst({
    where: { tournamentId: tournament.id },
    orderBy: { matchNumber: 'desc' },
  });
  let matchCounter = (lastMatch?.matchNumber || 0) + 1;

  let createdCount = 0;

  if (qualificationCount === 2) {
    // Top 2: Direct Final (1st vs 2nd)
    const finalMatch = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'FINAL',
        matchNumber: matchCounter++,
        teamAId: standings[0].teamId,
        teamBId: standings[1].teamId,
        venue: 'Pitch 1 - Grand Arena Amreli',
        time: '07:30 PM',
        status: 'UPCOMING',
        notes: `Grand Championship Final: ${standings[0].name} vs ${standings[1].name}`,
      },
    });

    await prisma.knockoutMatch.create({
      data: {
        stage: 'FINAL',
        matchId: finalMatch.id,
        bracketOrder: 1,
        seedLabelA: `1st: ${standings[0].name}`,
        seedLabelB: `2nd: ${standings[1].name}`,
      },
    });
    createdCount = 1;
  } else if (qualificationCount === 4) {
    // IPL-Style Format: Top 4
    // 1. QUALIFIER 1: League #1 vs League #2
    const q1Match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'QUALIFIER_1',
        matchNumber: matchCounter++,
        teamAId: standings[0].teamId,
        teamBId: standings[1].teamId,
        venue: 'Pitch 1 - Main Turf Arena',
        time: '05:00 PM',
        status: 'UPCOMING',
        notes: `Qualifier 1: 1st (${standings[0].name}) vs 2nd (${standings[1].name}) [Winner to Final, Loser to Qualifier 2]`,
      },
    });

    await prisma.knockoutMatch.create({
      data: {
        stage: 'QUALIFIER_1',
        matchId: q1Match.id,
        bracketOrder: 1,
        seedLabelA: `1st: ${standings[0].name}`,
        seedLabelB: `2nd: ${standings[1].name}`,
      },
    });

    // 2. ELIMINATOR: League #3 vs League #4
    const elimMatch = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'ELIMINATOR',
        matchNumber: matchCounter++,
        teamAId: standings[2].teamId,
        teamBId: standings[3].teamId,
        venue: 'Pitch 1 - Main Turf Arena',
        time: '07:00 PM',
        status: 'UPCOMING',
        notes: `Eliminator: 3rd (${standings[2].name}) vs 4th (${standings[3].name}) [Winner to Qualifier 2, Loser Eliminated]`,
      },
    });

    await prisma.knockoutMatch.create({
      data: {
        stage: 'ELIMINATOR',
        matchId: elimMatch.id,
        bracketOrder: 2,
        seedLabelA: `3rd: ${standings[2].name}`,
        seedLabelB: `4th: ${standings[3].name}`,
      },
    });

    // 3. QUALIFIER 2: Loser of Qualifier 1 vs Winner of Eliminator
    const q2Match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'QUALIFIER_2',
        matchNumber: matchCounter++,
        teamAId: null, // Placeholder: Loser of Qualifier 1
        teamBId: null, // Placeholder: Winner of Eliminator
        venue: 'Pitch 1 - Main Turf Arena',
        time: '06:00 PM',
        status: 'UPCOMING',
        notes: 'Qualifier 2: Loser Qualifier 1 vs Winner Eliminator [Winner to Final, Loser Eliminated]',
      },
    });

    await prisma.knockoutMatch.create({
      data: {
        stage: 'QUALIFIER_2',
        matchId: q2Match.id,
        bracketOrder: 3,
        seedLabelA: 'Loser Qualifier 1',
        seedLabelB: 'Winner Eliminator',
      },
    });

    // 4. FINAL: Winner of Qualifier 1 vs Winner of Qualifier 2
    const finalMatch = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'FINAL',
        matchNumber: matchCounter++,
        teamAId: null, // Placeholder: Winner of Qualifier 1
        teamBId: null, // Placeholder: Winner of Qualifier 2
        venue: 'Pitch 1 - Grand Arena Amreli',
        time: '08:00 PM',
        status: 'UPCOMING',
        notes: 'Grand Championship Final for the Amreli Silver Stick Trophy',
      },
    });

    await prisma.knockoutMatch.create({
      data: {
        stage: 'FINAL',
        matchId: finalMatch.id,
        bracketOrder: 4,
        seedLabelA: 'Winner Qualifier 1',
        seedLabelB: 'Winner Qualifier 2',
      },
    });

    createdCount = 4;
  } else if (qualificationCount === 8) {
    // Top 8: Quarter-Finals -> Semi-Finals -> Final
    const pairs = [
      { a: 0, b: 7, labelA: '1st', labelB: '8th', name: 'Quarter Final 1' },
      { a: 3, b: 4, labelA: '4th', labelB: '5th', name: 'Quarter Final 2' },
      { a: 1, b: 6, labelA: '2nd', labelB: '7th', name: 'Quarter Final 3' },
      { a: 2, b: 5, labelA: '3rd', labelB: '6th', name: 'Quarter Final 4' },
    ];

    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      const qf = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          round: 'QUARTER_FINAL',
          matchNumber: matchCounter++,
          teamAId: standings[p.a].teamId,
          teamBId: standings[p.b].teamId,
          venue: i < 2 ? 'Pitch 1' : 'Pitch 2',
          time: `0${3 + i}:00 PM`,
          status: 'UPCOMING',
          notes: `${p.name}: ${standings[p.a].name} vs ${standings[p.b].name}`,
        },
      });

      await prisma.knockoutMatch.create({
        data: {
          stage: 'QUARTER_FINALS',
          matchId: qf.id,
          bracketOrder: i + 1,
          seedLabelA: `${p.labelA}: ${standings[p.a].name}`,
          seedLabelB: `${p.labelB}: ${standings[p.b].name}`,
        },
      });
    }

    const sf1 = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'SEMI_FINAL',
        matchNumber: matchCounter++,
        teamAId: null,
        teamBId: null,
        venue: 'Pitch 1',
        time: '06:00 PM',
        status: 'UPCOMING',
        notes: 'Semi Final 1: Winner QF1 vs Winner QF2',
      },
    });
    await prisma.knockoutMatch.create({
      data: {
        stage: 'SEMI_FINALS',
        matchId: sf1.id,
        bracketOrder: 5,
        seedLabelA: 'Winner QF1',
        seedLabelB: 'Winner QF2',
      },
    });

    const sf2 = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'SEMI_FINAL',
        matchNumber: matchCounter++,
        teamAId: null,
        teamBId: null,
        venue: 'Pitch 1',
        time: '07:30 PM',
        status: 'UPCOMING',
        notes: 'Semi Final 2: Winner QF3 vs Winner QF4',
      },
    });
    await prisma.knockoutMatch.create({
      data: {
        stage: 'SEMI_FINALS',
        matchId: sf2.id,
        bracketOrder: 6,
        seedLabelA: 'Winner QF3',
        seedLabelB: 'Winner QF4',
      },
    });

    const finalM = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'FINAL',
        matchNumber: matchCounter++,
        teamAId: null,
        teamBId: null,
        venue: 'Pitch 1 - Grand Arena Amreli',
        time: '08:30 PM',
        status: 'UPCOMING',
        notes: 'Grand Championship Final',
      },
    });
    await prisma.knockoutMatch.create({
      data: {
        stage: 'FINAL',
        matchId: finalM.id,
        bracketOrder: 7,
        seedLabelA: 'Winner SF1',
        seedLabelB: 'Winner SF2',
      },
    });

    createdCount = 7;
  }

  // Update tournament state in DB
  const targetStage =
    qualificationCount === 2
      ? 'FINAL'
      : qualificationCount === 8
      ? 'QUARTER_FINALS'
      : 'KNOCKOUT';

  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { currentStage: targetStage },
  });

  return {
    success: true,
    message: `Generated ${createdCount} knockout matches for Top ${qualificationCount} teams.`,
    matchesCount: createdCount,
  };
}

/**
 * Automatically advances winners and losers according to the IPL knockout format
 * when a match score is updated, and handles retroactive corrections.
 */
export async function advanceKnockoutWinner(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      knockout: true,
      tournament: true,
    },
  });

  if (!match || !match.knockout) return;

  const kMatch = match.knockout;
  const stage = kMatch.stage;
  const tournamentId = match.tournamentId;

  // Determine current match winner and loser
  let winnerId: string | null = null;
  let loserId: string | null = null;

  if (match.status === 'COMPLETED') {
    if (match.teamAScore > match.teamBScore) {
      winnerId = match.teamAId;
      loserId = match.teamBId;
    } else if (match.teamBScore > match.teamAScore) {
      winnerId = match.teamBId;
      loserId = match.teamAId;
    } else {
      // Tied: use manually specified winner or team A
      winnerId = match.winnerId || match.teamAId;
      loserId = winnerId === match.teamAId ? match.teamBId : match.teamAId;
    }
  }

  // Update match winnerId if changed
  if (match.winnerId !== winnerId) {
    await prisma.match.update({
      where: { id: matchId },
      data: { winnerId },
    });
  }

  // Find all knockout matches for this tournament
  const allKnockouts = await prisma.knockoutMatch.findMany({
    where: { match: { tournamentId } },
    include: { match: true },
  });

  const q2Knockout = allKnockouts.find((k) => k.stage === 'QUALIFIER_2');
  const finalKnockout = allKnockouts.find((k) => k.stage === 'FINAL');

  // 1. QUALIFIER 1 Progression:
  // Winner -> directly qualifies for FINAL (teamA)
  // Loser -> goes to QUALIFIER 2 (teamA)
  if (stage === 'QUALIFIER_1') {
    if (finalKnockout) {
      const isManualFinalA = finalKnockout.match?.notes?.includes('MANUAL_SEED');
      if (!isManualFinalA) {
        await prisma.match.update({
          where: { id: finalKnockout.matchId },
          data: { teamAId: winnerId || null },
        });
        if (winnerId) {
          const winTeam = await prisma.team.findUnique({ where: { id: winnerId } });
          await prisma.knockoutMatch.update({
            where: { id: finalKnockout.id },
            data: { seedLabelA: winTeam ? `Winner Q1: ${winTeam.name}` : 'Winner Qualifier 1' },
          });
        } else {
          await prisma.knockoutMatch.update({
            where: { id: finalKnockout.id },
            data: { seedLabelA: 'Winner Qualifier 1' },
          });
        }
      }
    }

    if (q2Knockout) {
      const isManualQ2A = q2Knockout.match?.notes?.includes('MANUAL_SEED');
      if (!isManualQ2A) {
        await prisma.match.update({
          where: { id: q2Knockout.matchId },
          data: { teamAId: loserId || null },
        });
        if (loserId) {
          const loseTeam = await prisma.team.findUnique({ where: { id: loserId } });
          await prisma.knockoutMatch.update({
            where: { id: q2Knockout.id },
            data: { seedLabelA: loseTeam ? `Loser Q1: ${loseTeam.name}` : 'Loser Qualifier 1' },
          });
        } else {
          await prisma.knockoutMatch.update({
            where: { id: q2Knockout.id },
            data: { seedLabelA: 'Loser Qualifier 1' },
          });
        }
      }
    }
  }

  // 2. ELIMINATOR Progression:
  // Winner -> goes to QUALIFIER 2 (teamB)
  // Loser -> eliminated
  if (stage === 'ELIMINATOR') {
    if (q2Knockout) {
      const isManualQ2B = q2Knockout.match?.notes?.includes('MANUAL_SEED');
      if (!isManualQ2B) {
        await prisma.match.update({
          where: { id: q2Knockout.matchId },
          data: { teamBId: winnerId || null },
        });
        if (winnerId) {
          const winTeam = await prisma.team.findUnique({ where: { id: winnerId } });
          await prisma.knockoutMatch.update({
            where: { id: q2Knockout.id },
            data: { seedLabelB: winTeam ? `Winner Eliminator: ${winTeam.name}` : 'Winner Eliminator' },
          });
        } else {
          await prisma.knockoutMatch.update({
            where: { id: q2Knockout.id },
            data: { seedLabelB: 'Winner Eliminator' },
          });
        }
      }
    }
  }

  // 3. QUALIFIER 2 Progression:
  // Winner -> qualifies for FINAL (teamB)
  // Loser -> eliminated
  if (stage === 'QUALIFIER_2') {
    if (finalKnockout) {
      const isManualFinalB = finalKnockout.match?.notes?.includes('MANUAL_SEED');
      if (!isManualFinalB) {
        await prisma.match.update({
          where: { id: finalKnockout.matchId },
          data: { teamBId: winnerId || null },
        });
        if (winnerId) {
          const winTeam = await prisma.team.findUnique({ where: { id: winnerId } });
          await prisma.knockoutMatch.update({
            where: { id: finalKnockout.id },
            data: { seedLabelB: winTeam ? `Winner Q2: ${winTeam.name}` : 'Winner Qualifier 2' },
          });
        } else {
          await prisma.knockoutMatch.update({
            where: { id: finalKnockout.id },
            data: { seedLabelB: 'Winner Qualifier 2' },
          });
        }
      }
    }
  }

  // Legacy SEMI_FINALS support if needed
  if (stage === 'SEMI_FINALS' && finalKnockout) {
    if (kMatch.bracketOrder === 1) {
      await prisma.match.update({
        where: { id: finalKnockout.matchId },
        data: { teamAId: winnerId || null },
      });
    } else if (kMatch.bracketOrder === 2) {
      await prisma.match.update({
        where: { id: finalKnockout.matchId },
        data: { teamBId: winnerId || null },
      });
    }
  }

  // 4. FINAL Progression:
  // Winner -> Tournament Champion
  if (stage === 'FINAL') {
    if (match.status === 'COMPLETED' && winnerId) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          currentStage: 'COMPLETED',
          status: 'COMPLETED',
        },
      });
    } else if (match.status !== 'COMPLETED') {
      const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
      if (tournament && tournament.currentStage === 'COMPLETED') {
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: {
            currentStage: 'KNOCKOUT',
            status: 'LIVE',
          },
        });
      }
    }
  }
}

/**
 * Recalculate knockout seeds based on current standings if needed.
 * STRICT REQUIREMENT: Only runs if the tournament has actively transitioned into KNOCKOUT stage.
 */
export async function syncKnockoutSeeds(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return;

  const isKnockout = [
    'KNOCKOUT',
    'QUALIFIER_1',
    'ELIMINATOR',
    'QUALIFIER_2',
    'SEMI_FINALS',
    'FINAL',
  ].includes(tournament.currentStage);
  if (!isKnockout) return;

  const { standings } = await calculateStandings(tournamentId);
  if (standings.length < 4) return;

  const knockoutMatches = await prisma.knockoutMatch.findMany({
    where: { match: { tournamentId } },
    include: { match: true },
    orderBy: { bracketOrder: 'asc' },
  });

  const q1 = knockoutMatches.find((k) => k.stage === 'QUALIFIER_1');
  if (
    q1 &&
    q1.match.status === 'UPCOMING' &&
    standings[0] &&
    standings[1] &&
    !q1.match.notes?.includes('MANUAL_SEED')
  ) {
    await prisma.match.update({
      where: { id: q1.matchId },
      data: {
        teamAId: standings[0].teamId,
        teamBId: standings[1].teamId,
      },
    });
    await prisma.knockoutMatch.update({
      where: { id: q1.id },
      data: {
        seedLabelA: `1st: ${standings[0].name}`,
        seedLabelB: `2nd: ${standings[1].name}`,
      },
    });
  }

  const elim = knockoutMatches.find((k) => k.stage === 'ELIMINATOR');
  if (
    elim &&
    elim.match.status === 'UPCOMING' &&
    standings[2] &&
    standings[3] &&
    !elim.match.notes?.includes('MANUAL_SEED')
  ) {
    await prisma.match.update({
      where: { id: elim.matchId },
      data: {
        teamAId: standings[2].teamId,
        teamBId: standings[3].teamId,
      },
    });
    await prisma.knockoutMatch.update({
      where: { id: elim.id },
      data: {
        seedLabelA: `3rd: ${standings[2].name}`,
        seedLabelB: `4th: ${standings[3].name}`,
      },
    });
  }
}

/**
 * Returns knockout bracket data.
 * If league is complete and knockouts are generated: returns the real database matches.
 * If league is still running: dynamically projects the Top-4 IPL bracket from current standings.
 */
export async function getKnockoutData(tournamentId?: string) {
  const tournament = tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst();

  if (!tournament) {
    return {
      tournament: null,
      leagueStatus: null,
      isKnockoutActive: false,
      isPreview: false,
      knockoutMatches: [],
    };
  }

  const leagueStatus = await checkLeagueStageStatus(tournament.id);
  const knockoutCount = await prisma.knockoutMatch.count({
    where: { match: { tournamentId: tournament.id } },
  });

  const isKnockoutActive =
    leagueStatus.isComplete &&
    knockoutCount > 0 &&
    [
      'KNOCKOUT',
      'QUALIFIER_1',
      'ELIMINATOR',
      'QUALIFIER_2',
      'SEMI_FINALS',
      'FINAL',
      'COMPLETED',
    ].includes(tournament.currentStage);

  if (isKnockoutActive) {
    try {
      await syncKnockoutSeeds(tournament.id);
    } catch {}

    const knockoutMatches = await prisma.knockoutMatch.findMany({
      where: { match: { tournamentId: tournament.id } },
      include: {
        match: {
          include: {
            teamA: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
                primaryColor: true,
              },
            },
            teamB: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
                primaryColor: true,
              },
            },
            events: {
              where: { type: 'GOAL' },
              include: {
                player: { select: { id: true, name: true, jerseyNumber: true } },
                team: { select: { id: true, shortName: true } },
              },
              orderBy: { minute: 'asc' },
            },
          },
        },
      },
      orderBy: { bracketOrder: 'asc' },
    });

    return {
      tournament,
      leagueStatus,
      isKnockoutActive: true,
      isPreview: false,
      knockoutMatches,
    };
  }

  // Projected Preview Mode (during league)
  const { standings } = await calculateStandings(tournament.id);
  const overrides = getKnockoutOverrides();

  const allTeams = await prisma.team.findMany({
    where: { tournamentId: tournament.id },
    select: {
      id: true,
      name: true,
      shortName: true,
      logo: true,
      primaryColor: true,
    },
  });
  const teamsById = new Map(allTeams.map((t) => [t.id, t]));

  const team1 = standings[0] ? teamsById.get(standings[0].teamId) || null : null;
  const team2 = standings[1] ? teamsById.get(standings[1].teamId) || null : null;
  const team3 = standings[2] ? teamsById.get(standings[2].teamId) || null : null;
  const team4 = standings[3] ? teamsById.get(standings[3].teamId) || null : null;

  const lastLeagueMatch = await prisma.match.findFirst({
    where: { tournamentId: tournament.id, round: 'LEAGUE' },
    orderBy: { matchNumber: 'desc' },
  });
  const baseNum = (lastLeagueMatch?.matchNumber || 15) + 1;

  // 1. QUALIFIER 1
  const ovQ1 = overrides['QUALIFIER_1'] || {};
  let q1TeamA: any = null;
  let q1SeedA: string | null = null;
  if (ovQ1.teamAId === 'NO_TEAM') {
    q1TeamA = null;
    q1SeedA = 'NO TEAM';
  } else if (ovQ1.teamAId && teamsById.has(ovQ1.teamAId)) {
    q1TeamA = teamsById.get(ovQ1.teamAId);
    q1SeedA = ovQ1.seedLabelA || q1TeamA.name;
  } else {
    q1TeamA = team1;
    q1SeedA = team1 ? `1st: ${team1.name}` : 'League #1 (Rank 1)';
  }

  let q1TeamB: any = null;
  let q1SeedB: string | null = null;
  if (ovQ1.teamBId === 'NO_TEAM') {
    q1TeamB = null;
    q1SeedB = 'NO TEAM';
  } else if (ovQ1.teamBId && teamsById.has(ovQ1.teamBId)) {
    q1TeamB = teamsById.get(ovQ1.teamBId);
    q1SeedB = ovQ1.seedLabelB || q1TeamB.name;
  } else {
    q1TeamB = team2;
    q1SeedB = team2 ? `2nd: ${team2.name}` : 'League #2 (Rank 2)';
  }

  const q1ScoreA = ovQ1.teamAScore ?? 0;
  const q1ScoreB = ovQ1.teamBScore ?? 0;
  const q1Status = ovQ1.status || 'UPCOMING';
  let winnerQ1: any = null;
  let loserQ1: any = null;
  if (q1Status === 'COMPLETED') {
    if (q1ScoreA > q1ScoreB) {
      winnerQ1 = q1TeamA;
      loserQ1 = q1TeamB;
    } else if (q1ScoreB > q1ScoreA) {
      winnerQ1 = q1TeamB;
      loserQ1 = q1TeamA;
    } else {
      winnerQ1 = ovQ1.winnerId === q1TeamB?.id ? q1TeamB : q1TeamA;
      loserQ1 = winnerQ1 === q1TeamA ? q1TeamB : q1TeamA;
    }
  }

  // 2. ELIMINATOR
  const ovElim = overrides['ELIMINATOR'] || {};
  let elimTeamA: any = null;
  let elimSeedA: string | null = null;
  if (ovElim.teamAId === 'NO_TEAM') {
    elimTeamA = null;
    elimSeedA = 'NO TEAM';
  } else if (ovElim.teamAId && teamsById.has(ovElim.teamAId)) {
    elimTeamA = teamsById.get(ovElim.teamAId);
    elimSeedA = ovElim.seedLabelA || elimTeamA.name;
  } else {
    elimTeamA = team3;
    elimSeedA = team3 ? `3rd: ${team3.name}` : 'League #3 (Rank 3)';
  }

  let elimTeamB: any = null;
  let elimSeedB: string | null = null;
  if (ovElim.teamBId === 'NO_TEAM') {
    elimTeamB = null;
    elimSeedB = 'NO TEAM';
  } else if (ovElim.teamBId && teamsById.has(ovElim.teamBId)) {
    elimTeamB = teamsById.get(ovElim.teamBId);
    elimSeedB = ovElim.seedLabelB || elimTeamB.name;
  } else {
    elimTeamB = team4;
    elimSeedB = team4 ? `4th: ${team4.name}` : 'League #4 (Rank 4)';
  }

  const elimScoreA = ovElim.teamAScore ?? 0;
  const elimScoreB = ovElim.teamBScore ?? 0;
  const elimStatus = ovElim.status || 'UPCOMING';
  let winnerElim: any = null;
  let loserElim: any = null;
  if (elimStatus === 'COMPLETED') {
    if (elimScoreA > elimScoreB) {
      winnerElim = elimTeamA;
      loserElim = elimTeamB;
    } else if (elimScoreB > elimScoreA) {
      winnerElim = elimTeamB;
      loserElim = elimTeamA;
    } else {
      winnerElim = ovElim.winnerId === elimTeamB?.id ? elimTeamB : elimTeamA;
      loserElim = winnerElim === elimTeamA ? elimTeamB : elimTeamA;
    }
  }

  // 3. QUALIFIER 2 (Loser Q1 vs Winner Eliminator)
  const ovQ2 = overrides['QUALIFIER_2'] || {};
  let q2TeamA: any = null;
  let q2SeedA: string | null = null;
  if (ovQ2.teamAId === 'NO_TEAM') {
    q2TeamA = null;
    q2SeedA = 'NO TEAM';
  } else if (ovQ2.teamAId && teamsById.has(ovQ2.teamAId)) {
    q2TeamA = teamsById.get(ovQ2.teamAId);
    q2SeedA = ovQ2.seedLabelA || q2TeamA.name;
  } else if (loserQ1) {
    q2TeamA = loserQ1;
    q2SeedA = `Loser Q1: ${loserQ1.name}`;
  } else {
    q2TeamA = null;
    q2SeedA = 'Loser Qualifier 1';
  }

  let q2TeamB: any = null;
  let q2SeedB: string | null = null;
  if (ovQ2.teamBId === 'NO_TEAM') {
    q2TeamB = null;
    q2SeedB = 'NO TEAM';
  } else if (ovQ2.teamBId && teamsById.has(ovQ2.teamBId)) {
    q2TeamB = teamsById.get(ovQ2.teamBId);
    q2SeedB = ovQ2.seedLabelB || q2TeamB.name;
  } else if (winnerElim) {
    q2TeamB = winnerElim;
    q2SeedB = `Winner Eliminator: ${winnerElim.name}`;
  } else {
    q2TeamB = null;
    q2SeedB = 'Winner Eliminator';
  }

  const q2ScoreA = ovQ2.teamAScore ?? 0;
  const q2ScoreB = ovQ2.teamBScore ?? 0;
  const q2Status = ovQ2.status || 'UPCOMING';
  let winnerQ2: any = null;
  let loserQ2: any = null;
  if (q2Status === 'COMPLETED') {
    if (q2ScoreA > q2ScoreB) {
      winnerQ2 = q2TeamA;
      loserQ2 = q2TeamB;
    } else if (q2ScoreB > q2ScoreA) {
      winnerQ2 = q2TeamB;
      loserQ2 = q2TeamA;
    } else {
      winnerQ2 = ovQ2.winnerId === q2TeamB?.id ? q2TeamB : q2TeamA;
      loserQ2 = winnerQ2 === q2TeamA ? q2TeamB : q2TeamA;
    }
  }

  // 4. FINAL (Winner Q1 vs Winner Q2)
  const ovFinal = overrides['FINAL'] || {};
  let finalTeamA: any = null;
  let finalSeedA: string | null = null;
  if (ovFinal.teamAId === 'NO_TEAM') {
    finalTeamA = null;
    finalSeedA = 'NO TEAM';
  } else if (ovFinal.teamAId && teamsById.has(ovFinal.teamAId)) {
    finalTeamA = teamsById.get(ovFinal.teamAId);
    finalSeedA = ovFinal.seedLabelA || finalTeamA.name;
  } else if (winnerQ1) {
    finalTeamA = winnerQ1;
    finalSeedA = `Winner Q1: ${winnerQ1.name}`;
  } else {
    finalTeamA = null;
    finalSeedA = 'Winner Qualifier 1';
  }

  let finalTeamB: any = null;
  let finalSeedB: string | null = null;
  if (ovFinal.teamBId === 'NO_TEAM') {
    finalTeamB = null;
    finalSeedB = 'NO TEAM';
  } else if (ovFinal.teamBId && teamsById.has(ovFinal.teamBId)) {
    finalTeamB = teamsById.get(ovFinal.teamBId);
    finalSeedB = ovFinal.seedLabelB || finalTeamB.name;
  } else if (winnerQ2) {
    finalTeamB = winnerQ2;
    finalSeedB = `Winner Q2: ${winnerQ2.name}`;
  } else {
    finalTeamB = null;
    finalSeedB = 'Winner Qualifier 2';
  }

  const finalScoreA = ovFinal.teamAScore ?? 0;
  const finalScoreB = ovFinal.teamBScore ?? 0;
  const finalStatus = ovFinal.status || 'UPCOMING';
  let champion: any = null;
  if (finalStatus === 'COMPLETED') {
    if (finalScoreA > finalScoreB) {
      champion = finalTeamA;
    } else if (finalScoreB > finalScoreA) {
      champion = finalTeamB;
    } else {
      champion = ovFinal.winnerId === finalTeamB?.id ? finalTeamB : finalTeamA;
    }
  }

  const previewMatches = [
    {
      id: 'preview-q1',
      stage: 'QUALIFIER_1',
      bracketOrder: 1,
      seedLabelA: q1SeedA,
      seedLabelB: q1SeedB,
      match: {
        id: 'preview-q1-match',
        matchNumber: baseNum,
        teamAScore: q1ScoreA,
        teamBScore: q1ScoreB,
        time: '05:00 PM',
        venue: 'Pitch 1 - Main Turf Arena',
        status: q1Status,
        winnerId: winnerQ1?.id || null,
        teamA: q1TeamA,
        teamB: q1TeamB,
        events: [],
      },
    },
    {
      id: 'preview-elim',
      stage: 'ELIMINATOR',
      bracketOrder: 2,
      seedLabelA: elimSeedA,
      seedLabelB: elimSeedB,
      match: {
        id: 'preview-elim-match',
        matchNumber: baseNum + 1,
        teamAScore: elimScoreA,
        teamBScore: elimScoreB,
        time: '07:00 PM',
        venue: 'Pitch 1 - Main Turf Arena',
        status: elimStatus,
        winnerId: winnerElim?.id || null,
        teamA: elimTeamA,
        teamB: elimTeamB,
        events: [],
      },
    },
    {
      id: 'preview-q2',
      stage: 'QUALIFIER_2',
      bracketOrder: 3,
      seedLabelA: q2SeedA,
      seedLabelB: q2SeedB,
      match: {
        id: 'preview-q2-match',
        matchNumber: baseNum + 2,
        teamAScore: q2ScoreA,
        teamBScore: q2ScoreB,
        time: '06:00 PM',
        venue: 'Pitch 1 - Main Turf Arena',
        status: q2Status,
        winnerId: winnerQ2?.id || null,
        teamA: q2TeamA,
        teamB: q2TeamB,
        events: [],
      },
    },
    {
      id: 'preview-final',
      stage: 'FINAL',
      bracketOrder: 4,
      seedLabelA: finalSeedA,
      seedLabelB: finalSeedB,
      match: {
        id: 'preview-final-match',
        matchNumber: baseNum + 3,
        teamAScore: finalScoreA,
        teamBScore: finalScoreB,
        time: '08:00 PM',
        venue: 'Pitch 1 - Grand Arena Amreli',
        status: finalStatus,
        winnerId: champion?.id || null,
        teamA: finalTeamA,
        teamB: finalTeamB,
        events: [],
      },
    },
  ];

  return {
    tournament,
    leagueStatus,
    isKnockoutActive: false,
    isPreview: true,
    knockoutMatches: previewMatches,
  };
}

/**
 * Calculates top scorers ranked by total goals scored,
 * supporting official administrative corrections.
 */
export async function calculateTopScorers(tournamentId?: string): Promise<ScorerRow[]> {
  const tournament = tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst();

  if (!tournament) return [];

  const goalEvents = await prisma.matchEvent.findMany({
    where: {
      type: 'GOAL',
      match: {
        tournamentId: tournament.id,
        status: { in: ['COMPLETED', 'LIVE'] },
      },
    },
    include: {
      player: true,
      team: true,
    },
  });

  const playerGoalsMap: Record<
    string,
    {
      player: any;
      team: any;
      goals: number;
      isOverridden?: boolean;
    }
  > = {};

  for (const event of goalEvents) {
    if (!event.player) continue;
    const pid = event.player.id;
    if (!playerGoalsMap[pid]) {
      playerGoalsMap[pid] = {
        player: event.player,
        team: event.team,
        goals: 0,
        isOverridden: false,
      };
    }
    playerGoalsMap[pid].goals += 1;
  }

  // Check for administrative goal overrides
  const statOverrides = await prisma.playerStatOverride.findMany({
    where: { tournamentId: tournament.id },
  });

  for (const ov of statOverrides) {
    if (ov.goals !== null && ov.goals !== undefined) {
      if (playerGoalsMap[ov.playerId]) {
        playerGoalsMap[ov.playerId].goals = ov.goals;
        playerGoalsMap[ov.playerId].isOverridden = true;
      } else {
        // Player had 0 goal events registered, but admin credited goals
        const p = await prisma.player.findUnique({
          where: { id: ov.playerId },
          include: { team: true },
        });
        if (p) {
          playerGoalsMap[ov.playerId] = {
            player: p,
            team: p.team,
            goals: ov.goals,
            isOverridden: true,
          };
        }
      }
    }
  }

  const completedMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, status: 'COMPLETED' },
    select: { teamAId: true, teamBId: true },
  });

  const teamMatchCount: Record<string, number> = {};
  for (const m of completedMatches) {
    if (m.teamAId) teamMatchCount[m.teamAId] = (teamMatchCount[m.teamAId] || 0) + 1;
    if (m.teamBId) teamMatchCount[m.teamBId] = (teamMatchCount[m.teamBId] || 0) + 1;
  }

  const scorers: ScorerRow[] = Object.values(playerGoalsMap)
    .filter((entry) => entry.goals > 0)
    .map((entry) => ({
      rank: 0,
      playerId: entry.player.id,
      playerName: entry.player.name,
      jerseyNumber: entry.player.jerseyNumber,
      position: entry.player.position,
      photo: entry.player.photo,
      isCaptain: entry.player.isCaptain,
      teamId: entry.team.id,
      teamName: entry.team.name,
      teamShortName: entry.team.shortName,
      teamLogo: entry.team.logo,
      primaryColor: entry.team.primaryColor,
      goals: entry.goals,
      matchesPlayed: teamMatchCount[entry.team.id] || 0,
      isOverridden: entry.isOverridden,
    }));

  scorers.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.playerName.localeCompare(b.playerName);
  });

  scorers.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return scorers;
}

/**
 * Calculates top goalkeepers ranked primarily by FEWEST GOALS CONCEDED,
 * supporting official administrative corrections.
 */
export async function calculateTopGoalkeepers(tournamentId?: string): Promise<GoalkeeperRow[]> {
  const tournament = tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst();

  if (!tournament) return [];

  const goalkeepers = await prisma.player.findMany({
    where: {
      position: 'GOALKEEPER',
      team: { tournamentId: tournament.id },
    },
    include: {
      team: true,
    },
  });

  const completedMatches = await prisma.match.findMany({
    where: {
      tournamentId: tournament.id,
      status: 'COMPLETED',
    },
  });

  const statOverrides = await prisma.playerStatOverride.findMany({
    where: { tournamentId: tournament.id },
  });
  const overrideMap = new Map(statOverrides.map((o) => [o.playerId, o]));

  const rows: GoalkeeperRow[] = [];

  for (const gk of goalkeepers) {
    const teamMatches = completedMatches.filter(
      (m) => (m.teamAId && m.teamAId === gk.teamId) || (m.teamBId && m.teamBId === gk.teamId)
    );

    let matchesCount = teamMatches.length;

    let goalsConceded = 0;
    let cleanSheets = 0;

    for (const m of teamMatches) {
      const concededInMatch = m.teamAId === gk.teamId ? m.teamBScore : m.teamAScore;
      goalsConceded += concededInMatch;
      if (concededInMatch === 0) {
        cleanSheets += 1;
      }
    }

    const ov = overrideMap.get(gk.id);
    let isOverridden = false;
    if (ov) {
      if (ov.goalsConceded !== null && ov.goalsConceded !== undefined) {
        goalsConceded = ov.goalsConceded;
        isOverridden = true;
      }
      if (ov.cleanSheets !== null && ov.cleanSheets !== undefined) {
        cleanSheets = ov.cleanSheets;
        isOverridden = true;
      }
      if (ov.matchesPlayed !== null && ov.matchesPlayed !== undefined) {
        matchesCount = ov.matchesPlayed;
        isOverridden = true;
      }
    }

    if (matchesCount === 0 && !isOverridden) continue;

    const goalsPerMatch =
      matchesCount > 0 ? Number((goalsConceded / matchesCount).toFixed(2)) : 0;

    rows.push({
      rank: 0,
      playerId: gk.id,
      playerName: gk.name,
      jerseyNumber: gk.jerseyNumber,
      photo: gk.photo,
      teamId: gk.team.id,
      teamName: gk.team.name,
      teamShortName: gk.team.shortName,
      teamLogo: gk.team.logo,
      primaryColor: gk.team.primaryColor,
      matches: matchesCount,
      goalsConceded,
      cleanSheets,
      goalsPerMatch,
      isOverridden,
    });
  }

  rows.sort((a, b) => {
    if (a.goalsConceded !== b.goalsConceded) return a.goalsConceded - b.goalsConceded;
    if (b.cleanSheets !== a.cleanSheets) return b.cleanSheets - a.cleanSheets;
    return b.matches - a.matches;
  });

  rows.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return rows;
}

/**
 * Calculates Best Defender ranking based on match award selections (Match.bestDefenderId),
 * supporting administrative corrections. Idempotent: counts are derived directly from matches.
 */
export async function calculateBestDefenders(tournamentId?: string): Promise<AwardWinnerRow[]> {
  const tournament = tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst();

  if (!tournament) return [];

  // Completed or in-progress matches
  const matches = await prisma.match.findMany({
    where: {
      tournamentId: tournament.id,
      status: { in: ['COMPLETED', 'LIVE'] },
      bestDefenderId: { not: null },
    },
    select: { id: true, bestDefenderId: true },
  });

  // Calculate award counts per player
  const countMap: Record<string, number> = {};
  for (const m of matches) {
    if (m.bestDefenderId) {
      countMap[m.bestDefenderId] = (countMap[m.bestDefenderId] || 0) + 1;
    }
  }

  // Administrative overrides
  const statOverrides = await prisma.playerStatOverride.findMany({
    where: { tournamentId: tournament.id },
  });
  const overrideMap = new Map(statOverrides.map((o) => [o.playerId, o]));

  for (const ov of statOverrides) {
    if (ov.bestDefenderAwards !== null && ov.bestDefenderAwards !== undefined) {
      countMap[ov.playerId] = ov.bestDefenderAwards;
    }
  }

  const completedMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, status: 'COMPLETED' },
    select: { teamAId: true, teamBId: true },
  });
  const teamMatchCount: Record<string, number> = {};
  for (const m of completedMatches) {
    if (m.teamAId) teamMatchCount[m.teamAId] = (teamMatchCount[m.teamAId] || 0) + 1;
    if (m.teamBId) teamMatchCount[m.teamBId] = (teamMatchCount[m.teamBId] || 0) + 1;
  }

  // Fetch players with awards or overrides
  const playerIds = Object.keys(countMap).filter((id) => countMap[id] > 0);
  if (playerIds.length === 0) return [];

  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    include: { team: true },
  });

  const rows: AwardWinnerRow[] = players.map((p) => {
    const ov = overrideMap.get(p.id);
    const isOverridden = ov?.bestDefenderAwards !== null && ov?.bestDefenderAwards !== undefined;
    return {
      rank: 0,
      playerId: p.id,
      playerName: p.name,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      photo: p.photo,
      isCaptain: p.isCaptain,
      teamId: p.team.id,
      teamName: p.team.name,
      teamShortName: p.team.shortName,
      teamLogo: p.team.logo,
      primaryColor: p.team.primaryColor,
      awardsCount: countMap[p.id] || 0,
      matchesPlayed: teamMatchCount[p.team.id] || 0,
      isOverridden,
    };
  });

  rows.sort((a, b) => {
    if (b.awardsCount !== a.awardsCount) return b.awardsCount - a.awardsCount;
    return a.playerName.localeCompare(b.playerName);
  });

  rows.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return rows;
}

/**
 * Calculates Man of the Match (MOTM) ranking based on match award selections (Match.motmId),
 * supporting administrative corrections. Idempotent: counts are derived directly from matches.
 */
export async function calculateManOfTheMatches(tournamentId?: string): Promise<AwardWinnerRow[]> {
  const tournament = tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst();

  if (!tournament) return [];

  // Completed or in-progress matches
  const matches = await prisma.match.findMany({
    where: {
      tournamentId: tournament.id,
      status: { in: ['COMPLETED', 'LIVE'] },
      motmId: { not: null },
    },
    select: { id: true, motmId: true },
  });

  // Calculate award counts per player
  const countMap: Record<string, number> = {};
  for (const m of matches) {
    if (m.motmId) {
      countMap[m.motmId] = (countMap[m.motmId] || 0) + 1;
    }
  }

  // Administrative overrides
  const statOverrides = await prisma.playerStatOverride.findMany({
    where: { tournamentId: tournament.id },
  });
  const overrideMap = new Map(statOverrides.map((o) => [o.playerId, o]));

  for (const ov of statOverrides) {
    if (ov.motmAwards !== null && ov.motmAwards !== undefined) {
      countMap[ov.playerId] = ov.motmAwards;
    }
  }

  const completedMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, status: 'COMPLETED' },
    select: { teamAId: true, teamBId: true },
  });
  const teamMatchCount: Record<string, number> = {};
  for (const m of completedMatches) {
    if (m.teamAId) teamMatchCount[m.teamAId] = (teamMatchCount[m.teamAId] || 0) + 1;
    if (m.teamBId) teamMatchCount[m.teamBId] = (teamMatchCount[m.teamBId] || 0) + 1;
  }

  // Fetch players with awards or overrides
  const playerIds = Object.keys(countMap).filter((id) => countMap[id] > 0);
  if (playerIds.length === 0) return [];

  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    include: { team: true },
  });

  const rows: AwardWinnerRow[] = players.map((p) => {
    const ov = overrideMap.get(p.id);
    const isOverridden = ov?.motmAwards !== null && ov?.motmAwards !== undefined;
    return {
      rank: 0,
      playerId: p.id,
      playerName: p.name,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      photo: p.photo,
      isCaptain: p.isCaptain,
      teamId: p.team.id,
      teamName: p.team.name,
      teamShortName: p.team.shortName,
      teamLogo: p.team.logo,
      primaryColor: p.team.primaryColor,
      awardsCount: countMap[p.id] || 0,
      matchesPlayed: teamMatchCount[p.team.id] || 0,
      isOverridden,
    };
  });

  rows.sort((a, b) => {
    if (b.awardsCount !== a.awardsCount) return b.awardsCount - a.awardsCount;
    return a.playerName.localeCompare(b.playerName);
  });

  rows.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return rows;
}


/**
 * Calculates overarching team statistics (Most Wins, Most Goals, Best GD, Clean Sheets).
 */
export async function calculateTeamStats(tournamentId?: string): Promise<TeamStatsSummary> {
  const { standings } = await calculateStandings(tournamentId);

  const tournament = tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst();

  const allMatches = await prisma.match.findMany({
    where: { tournamentId: tournament?.id },
  });

  const completed = allMatches.filter((m) => m.status === 'COMPLETED');
  const totalGoals = completed.reduce((acc, m) => acc + m.teamAScore + m.teamBScore, 0);

  if (standings.length === 0) {
    return {
      mostWins: null,
      mostGoals: null,
      bestGD: null,
      bestDefense: null,
      totalGoals: 0,
      totalMatches: allMatches.length,
      completedMatches: completed.length,
    };
  }

  const byWins = [...standings].sort((a, b) => b.won - a.won);
  const mostWins = byWins[0]
    ? { teamName: byWins[0].name, wins: byWins[0].won, logo: byWins[0].logo }
    : null;

  const byGoals = [...standings].sort((a, b) => b.goalsFor - a.goalsFor);
  const mostGoals = byGoals[0]
    ? { teamName: byGoals[0].name, goals: byGoals[0].goalsFor, logo: byGoals[0].logo }
    : null;

  const byGD = [...standings].sort((a, b) => b.goalDifference - a.goalDifference);
  const bestGD = byGD[0]
    ? { teamName: byGD[0].name, gd: byGD[0].goalDifference, logo: byGD[0].logo }
    : null;

  const activeTeams = standings.filter((s) => s.played > 0);
  const byDefense = [...activeTeams].sort((a, b) => a.goalsAgainst - b.goalsAgainst);
  const bestDefense = byDefense[0]
    ? { teamName: byDefense[0].name, goalsConceded: byDefense[0].goalsAgainst, logo: byDefense[0].logo }
    : null;

  return {
    mostWins,
    mostGoals,
    bestGD,
    bestDefense,
    totalGoals,
    totalMatches: allMatches.length,
    completedMatches: completed.length,
  };
}
