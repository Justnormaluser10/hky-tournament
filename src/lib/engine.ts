import { cache } from 'react';
import { prisma } from './prisma';

export const getCachedTournament = cache(async (tournamentId?: string) => {
  return tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst();
});

export const getCachedTeams = cache(async (tournamentId: string) => {
  return await prisma.team.findMany({
    where: { tournamentId },
  });
});

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
 * Calculates deterministic league standings directly from match records and tournament configuration.
 */
export async function calculateStandings(tournamentId?: string): Promise<{
  standings: StandingRow[];
  tournament: any;
}> {
  const tournament = await getCachedTournament(tournamentId);

  if (!tournament) {
    return { standings: [], tournament: null };
  }

  const teams = await getCachedTeams(tournament.id);

  const matches = await prisma.match.findMany({
    where: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      status: 'COMPLETED',
    },
    orderBy: { date: 'asc' },
  });

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

  const rows = Object.values(statsMap).map((row) => {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.form = row.form.slice(-5);
    return row;
  });

  // Sort by Points DESC, GD DESC, GF DESC, Wins DESC, Name ASC
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return a.name.localeCompare(b.name);
  });

  const qualificationCount = tournament.qualificationCount || 4;
  rows.forEach((r, idx) => {
    r.position = idx + 1;
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
  const tournament = await getCachedTournament(tournamentId);

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

  const teams = await getCachedTeams(tournament.id);

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
    // Top 4: Semi-Finals -> Final
    // SF1: 1st vs 4th
    const sf1 = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'SEMI_FINAL',
        matchNumber: matchCounter++,
        teamAId: standings[0].teamId,
        teamBId: standings[3].teamId,
        venue: 'Pitch 1 - Main Turf Arena',
        time: '05:00 PM',
        status: 'UPCOMING',
        notes: `Semi Final 1: 1st (${standings[0].name}) vs 4th (${standings[3].name})`,
      },
    });

    await prisma.knockoutMatch.create({
      data: {
        stage: 'SEMI_FINALS',
        matchId: sf1.id,
        bracketOrder: 1,
        seedLabelA: `1st: ${standings[0].name}`,
        seedLabelB: `4th: ${standings[3].name}`,
      },
    });

    // SF2: 2nd vs 3rd
    const sf2 = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'SEMI_FINAL',
        matchNumber: matchCounter++,
        teamAId: standings[1].teamId,
        teamBId: standings[2].teamId,
        venue: 'Pitch 1 - Main Turf Arena',
        time: '07:00 PM',
        status: 'UPCOMING',
        notes: `Semi Final 2: 2nd (${standings[1].name}) vs 3rd (${standings[2].name})`,
      },
    });

    await prisma.knockoutMatch.create({
      data: {
        stage: 'SEMI_FINALS',
        matchId: sf2.id,
        bracketOrder: 2,
        seedLabelA: `2nd: ${standings[1].name}`,
        seedLabelB: `3rd: ${standings[2].name}`,
      },
    });

    // Grand Final: STRICT REQUIREMENT 17 - DO NOT pre-assign teams. Placeholders until SFs finish!
    const finalM = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 'FINAL',
        matchNumber: matchCounter++,
        teamAId: null, // Placeholder until SF1 finishes
        teamBId: null, // Placeholder until SF2 finishes
        venue: 'Pitch 1 - Grand Arena Amreli',
        time: '08:00 PM',
        status: 'UPCOMING',
        notes: 'Grand Championship Final for the Amreli Silver Stick Trophy',
      },
    });

    await prisma.knockoutMatch.create({
      data: {
        stage: 'FINAL',
        matchId: finalM.id,
        bracketOrder: 3,
        seedLabelA: 'Winner Semi Final 1',
        seedLabelB: 'Winner Semi Final 2',
      },
    });
    createdCount = 3;
  } else if (qualificationCount === 8) {
    // Top 8: Quarter-Finals -> Semi-Finals -> Final
    // QF1: 1 vs 8, QF2: 4 vs 5, QF3: 2 vs 7, QF4: 3 vs 6
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

    // SF1 & SF2: Placeholders until QFs finish
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

    // Final: Placeholders until SFs finish
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

  // Update tournament state in DB to KNOCKOUT / SEMI_FINALS / QUARTER_FINALS / FINAL
  const targetStage =
    qualificationCount === 2
      ? 'FINAL'
      : qualificationCount === 8
      ? 'QUARTER_FINALS'
      : 'SEMI_FINALS';

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
 * Automatically advances winners to the next knockout round when a match score is updated,
 * and handles retroactive score changes.
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

  // Determine current match winner
  let winnerId: string | null = null;
  if (match.status === 'COMPLETED') {
    if (match.teamAScore > match.teamBScore) {
      winnerId = match.teamAId;
    } else if (match.teamBScore > match.teamAScore) {
      winnerId = match.teamBId;
    } else {
      // Tied at full time: use manually specified winner or team A
      winnerId = match.winnerId || match.teamAId;
    }
  }

  // Update match winnerId
  if (match.winnerId !== winnerId) {
    await prisma.match.update({
      where: { id: matchId },
      data: { winnerId },
    });
  }

  // 1. Semi-Finals -> Grand Final Advancement
  if (stage === 'SEMI_FINALS') {
    const finalKnockout = await prisma.knockoutMatch.findFirst({
      where: {
        match: { tournamentId },
        stage: 'FINAL',
      },
      include: { match: true },
    });

    if (finalKnockout) {
      const isSF1 = kMatch.bracketOrder === 1;
      const isSF2 = kMatch.bracketOrder === 2;

      if (isSF1) {
        await prisma.match.update({
          where: { id: finalKnockout.matchId },
          data: { teamAId: winnerId || null },
        });
      } else if (isSF2) {
        await prisma.match.update({
          where: { id: finalKnockout.matchId },
          data: { teamBId: winnerId || null },
        });
      }

      // Check if both SFs are completed -> move stage to FINAL
      const allSFs = await prisma.knockoutMatch.findMany({
        where: { match: { tournamentId }, stage: 'SEMI_FINALS' },
        include: { match: true },
      });
      const allCompleted = allSFs.every((sf) => sf.match.status === 'COMPLETED');
      if (allCompleted) {
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { currentStage: 'FINAL' },
        });
      }
    }
  }

  // 2. Quarter-Finals -> Semi-Finals Advancement
  if (stage === 'QUARTER_FINALS') {
    const sfMatches = await prisma.knockoutMatch.findMany({
      where: { match: { tournamentId }, stage: 'SEMI_FINALS' },
      include: { match: true },
      orderBy: { bracketOrder: 'asc' },
    });

    if (sfMatches.length >= 2) {
      // QF1 (1) -> SF1 teamA, QF2 (2) -> SF1 teamB
      // QF3 (3) -> SF2 teamA, QF4 (4) -> SF2 teamB
      if (kMatch.bracketOrder === 1) {
        await prisma.match.update({
          where: { id: sfMatches[0].matchId },
          data: { teamAId: winnerId || null },
        });
      } else if (kMatch.bracketOrder === 2) {
        await prisma.match.update({
          where: { id: sfMatches[0].matchId },
          data: { teamBId: winnerId || null },
        });
      } else if (kMatch.bracketOrder === 3) {
        await prisma.match.update({
          where: { id: sfMatches[1].matchId },
          data: { teamAId: winnerId || null },
        });
      } else if (kMatch.bracketOrder === 4) {
        await prisma.match.update({
          where: { id: sfMatches[1].matchId },
          data: { teamBId: winnerId || null },
        });
      }
    }
  }

  // 3. Final -> Champions
  if (stage === 'FINAL') {
    if (match.status === 'COMPLETED' && winnerId) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          currentStage: 'COMPLETED',
          status: 'COMPLETED',
        },
      });
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

  const isKnockout = ['KNOCKOUT', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'].includes(
    tournament.currentStage
  );
  if (!isKnockout) return; // Do not touch seeds unless active in knockout stage

  const { standings } = await calculateStandings(tournamentId);
  if (standings.length < 4) return;

  const knockoutMatches = await prisma.knockoutMatch.findMany({
    where: { match: { tournamentId } },
    include: { match: true },
    orderBy: { bracketOrder: 'asc' },
  });

  const sfMatches = knockoutMatches.filter((k) => k.stage === 'SEMI_FINALS');
  if (sfMatches.length >= 2) {
    const sf1 = sfMatches[0];
    if (
      sf1.match.status === 'UPCOMING' &&
      standings[0] &&
      standings[3] &&
      !sf1.match.notes?.includes('MANUAL_SEED')
    ) {
      await prisma.match.update({
        where: { id: sf1.matchId },
        data: {
          teamAId: standings[0].teamId,
          teamBId: standings[3].teamId,
        },
      });
    }

    const sf2 = sfMatches[1];
    if (
      sf2.match.status === 'UPCOMING' &&
      standings[1] &&
      standings[2] &&
      !sf2.match.notes?.includes('MANUAL_SEED')
    ) {
      await prisma.match.update({
        where: { id: sf2.matchId },
        data: {
          teamAId: standings[1].teamId,
          teamBId: standings[2].teamId,
        },
      });
    }
  }
}

/**
 * Calculates top scorers ranked by total goals scored.
 */
export async function calculateTopScorers(tournamentId?: string): Promise<ScorerRow[]> {
  const tournament = await getCachedTournament(tournamentId);

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
      };
    }
    playerGoalsMap[pid].goals += 1;
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

  const scorers: ScorerRow[] = Object.values(playerGoalsMap).map((entry) => ({
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
 * Calculates top goalkeepers ranked primarily by FEWEST GOALS CONCEDED.
 */
export async function calculateTopGoalkeepers(tournamentId?: string): Promise<GoalkeeperRow[]> {
  const tournament = await getCachedTournament(tournamentId);

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

  const rows: GoalkeeperRow[] = [];

  for (const gk of goalkeepers) {
    const teamMatches = completedMatches.filter(
      (m) => (m.teamAId && m.teamAId === gk.teamId) || (m.teamBId && m.teamBId === gk.teamId)
    );

    const matchesCount = teamMatches.length;
    if (matchesCount === 0) continue;

    let goalsConceded = 0;
    let cleanSheets = 0;

    for (const m of teamMatches) {
      const concededInMatch = m.teamAId === gk.teamId ? m.teamBScore : m.teamAScore;
      goalsConceded += concededInMatch;
      if (concededInMatch === 0) {
        cleanSheets += 1;
      }
    }

    const goalsPerMatch = Number((goalsConceded / matchesCount).toFixed(2));

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
 * Calculates overarching team statistics (Most Wins, Most Goals, Best GD, Clean Sheets).
 */
export async function calculateTeamStats(tournamentId?: string): Promise<TeamStatsSummary> {
  const { standings } = await calculateStandings(tournamentId);

  const tournament = await getCachedTournament(tournamentId);

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
