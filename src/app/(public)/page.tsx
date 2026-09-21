import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  MapPin,
  Calendar,
  ChevronRight,
  Clock,
  Sparkles,
  Flame,
  Shield,
  ArrowRight,
  Megaphone,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import {
  calculateStandings,
  calculateTopScorers,
  calculateTopGoalkeepers,
  checkLeagueStageStatus,
} from '@/lib/engine';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { SportsAvatar } from '@/components/ui/SportsAvatar';
import { KnockoutBracket } from '@/components/public/KnockoutBracket';
import { ChampionCelebration } from '@/components/public/ChampionCelebration';
import { StageTransitionBanner } from '@/components/public/StageTransitionBanner';

export const revalidate = 30; // Conservative 30s ISR for live tournament freshness while protecting Netlify quotas

export default async function HomePage() {
  const tournament = await prisma.tournament.findFirst();
  let currentStage = tournament?.currentStage || 'LEAGUE';
  const qualificationCount = tournament?.qualificationCount || 4;

  const leagueStatus = await checkLeagueStageStatus(tournament?.id);
  const { standings } = await calculateStandings(tournament?.id);
  const topScorers = await calculateTopScorers(tournament?.id);
  const topGoalkeepers = await calculateTopGoalkeepers(tournament?.id);

  // Self-heal: If league is not complete, stage must remain LEAGUE
  if (!leagueStatus.isComplete && currentStage !== 'LEAGUE' && tournament?.id) {
    currentStage = 'LEAGUE';
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { currentStage: 'LEAGUE' },
    });
  }

  // Next Upcoming Match
  const upcomingMatch = await prisma.match.findFirst({
    where: {
      tournamentId: tournament?.id,
      status: 'UPCOMING',
    },
    include: {
      teamA: true,
      teamB: true,
    },
    orderBy: [{ date: 'asc' }, { matchNumber: 'asc' }],
  });

  // Latest Completed Match
  const latestCompletedMatch = await prisma.match.findFirst({
    where: {
      tournamentId: tournament?.id,
      status: 'COMPLETED',
    },
    include: {
      teamA: true,
      teamB: true,
      events: {
        where: { type: 'GOAL' },
        include: { player: true, team: true },
        orderBy: { minute: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Knockout stage can ONLY be active if:
  // 1. League stage is 100% complete
  // 2. Knockout fixtures have been generated and exist
  // 3. Current stage is set to a playoff/final/completed stage
  const knockoutMatchesRaw =
    leagueStatus.isComplete &&
    [
      'KNOCKOUT',
      'QUARTER_FINALS',
      'SEMI_FINALS',
      'FINAL',
      'COMPLETED',
    ].includes(currentStage)
      ? await prisma.knockoutMatch.findMany({
          where: { match: { tournamentId: tournament?.id } },
          include: {
            match: {
              include: {
                teamA: true,
                teamB: true,
                events: {
                  include: { player: true, team: true },
                  orderBy: { minute: 'asc' },
                },
              },
            },
          },
          orderBy: [{ stage: 'desc' }, { bracketOrder: 'asc' }],
        })
      : [];

  const hasKnockoutStarted =
    leagueStatus.isComplete &&
    knockoutMatchesRaw.length > 0 &&
    [
      'KNOCKOUT',
      'QUARTER_FINALS',
      'SEMI_FINALS',
      'FINAL',
      'COMPLETED',
    ].includes(currentStage);

  const isKnockoutActive =
    hasKnockoutStarted &&
    (currentStage === 'KNOCKOUT' ||
      currentStage === 'QUARTER_FINALS' ||
      currentStage === 'SEMI_FINALS' ||
      currentStage === 'FINAL');

  const isCompleted = hasKnockoutStarted && currentStage === 'COMPLETED';
  const isLeagueComplete = leagueStatus.isComplete && !hasKnockoutStarted;

  // Format knockout matches
  const knockoutMatches = knockoutMatchesRaw.map((k) => ({
    id: k.id,
    stage: k.stage,
    bracketOrder: k.bracketOrder,
    seedLabelA: k.seedLabelA,
    seedLabelB: k.seedLabelB,
    match: {
      id: k.match.id,
      matchNumber: k.match.matchNumber,
      teamAScore: k.match.teamAScore,
      teamBScore: k.match.teamBScore,
      time: k.match.time,
      venue: k.match.venue,
      status: k.match.status,
      winnerId: k.match.winnerId,
      teamA: k.match.teamA,
      teamB: k.match.teamB,
      events: k.match.events,
    },
  }));

  // Identify Champion if tournament is completed
  let championTeam = null;
  let runnerUpTeam = null;
  let finalScore = null;

  const finalKnockout = knockoutMatches.find((k) => k.stage === 'FINAL');
  if (finalKnockout && finalKnockout.match.status === 'COMPLETED' && finalKnockout.match.winnerId) {
    const winnerId = finalKnockout.match.winnerId;
    if (finalKnockout.match.teamA?.id === winnerId) {
      championTeam = finalKnockout.match.teamA;
      runnerUpTeam = finalKnockout.match.teamB;
    } else if (finalKnockout.match.teamB?.id === winnerId) {
      championTeam = finalKnockout.match.teamB;
      runnerUpTeam = finalKnockout.match.teamA;
    }
    finalScore = {
      teamAScore: finalKnockout.match.teamAScore,
      teamBScore: finalKnockout.match.teamBScore,
    };
  }

  // Active Teams for team showcase
  const teams = await prisma.team.findMany({
    where: { tournamentId: tournament?.id },
    take: 6,
  });

  // Recent Announcements
  const announcements = await prisma.announcement.findMany({
    where: { tournamentId: tournament?.id },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 2,
  });

  const getStageDisplay = () => {
    if (isCompleted) return 'CHAMPIONSHIP COMPLETE';
    if (isKnockoutActive) return 'PLAYOFF KNOCKOUTS';
    if (isLeagueComplete) return 'LEAGUE COMPLETE';
    return 'LEAGUE STAGE';
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* 1. HERO SECTION (MOBILE-FIRST SPORTS BROADCAST FEEL) */}
      <section className="relative pt-6 sm:pt-10 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Field Hockey Stadium Photo with Dynamic Floodlight Illumination */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-45 scale-105"
          style={{ backgroundImage: "url('/images/hockey-stadium-blue.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06142e]/60 via-[#040e24]/75 to-[#040e24] pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[650px] h-[300px] bg-sky-500/25 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-4">
          {/* Live Stage Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-black tracking-wider uppercase shadow-lg shadow-emerald-950/60">
            <span
              className={`w-2 h-2 rounded-full ${
                isCompleted
                  ? 'bg-amber-400'
                  : isLeagueComplete
                  ? 'bg-emerald-400'
                  : 'bg-emerald-400 animate-ping'
              }`}
            />
            <span>STAGE: {getStageDisplay()}</span>
          </div>

          {/* Tournament Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-tight">
            LATE KISHAN BARAIYA(PAJI){' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              HOCKEY
            </span>
            <span className="block text-2xl sm:text-4xl text-slate-200 mt-1">
              CHAMPIONSHIP
            </span>
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-slate-300 pt-1">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-white/10">
              <span className="text-base">🏑</span> Field Hockey — 7s
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Amreli, Gujarat
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-white/10">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Amreli Silver Stick
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* 2. STAGE PROGRESSION STEPPER BANNER */}
        <StageTransitionBanner
          currentStage={currentStage}
          qualificationCount={qualificationCount}
        />

        {/* 3. CHAMPION CELEBRATION (Displayed prominently when stage is COMPLETED) */}
        {isCompleted && championTeam && (
          <ChampionCelebration
            championTeam={championTeam}
            runnerUpTeam={runnerUpTeam}
            finalScore={finalScore}
            topScorer={topScorers[0]}
            topGoalkeeper={topGoalkeepers[0]}
          />
        )}

        {/* 4. MOBILE-FIRST MATCH HIGHLIGHT CARDS (Next Match & Latest Result) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* NEXT MATCH CARD */}
          <div className="glass-card glass-card-hover rounded-2xl p-5 border border-white/10 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs uppercase font-black tracking-wider text-amber-400">
                  Next Match #{upcomingMatch?.matchNumber || '—'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                {upcomingMatch?.round || 'LEAGUE'}
              </span>
            </div>

            {upcomingMatch && upcomingMatch.teamA && upcomingMatch.teamB ? (
              <div className="my-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TeamLogo
                      name={upcomingMatch.teamA.name}
                      shortName={upcomingMatch.teamA.shortName}
                      logo={upcomingMatch.teamA.logo}
                      primaryColor={upcomingMatch.teamA.primaryColor}
                      size="md"
                    />
                    <span className="font-extrabold text-white text-sm sm:text-base">
                      {upcomingMatch.teamA.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                    VS
                  </span>
                  <div className="flex items-center gap-3 flex-row-reverse text-right">
                    <TeamLogo
                      name={upcomingMatch.teamB.name}
                      shortName={upcomingMatch.teamB.shortName}
                      logo={upcomingMatch.teamB.logo}
                      primaryColor={upcomingMatch.teamB.primaryColor}
                      size="md"
                    />
                    <span className="font-extrabold text-white text-sm sm:text-base">
                      {upcomingMatch.teamB.name}
                    </span>
                  </div>
                </div>

                <div className="py-2 px-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-mono font-bold text-emerald-400">
                    {upcomingMatch.time}
                  </span>
                  <span className="truncate max-w-[180px] text-slate-400">
                    {upcomingMatch.venue}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No upcoming matches scheduled.
              </div>
            )}

            <div className="pt-2 border-t border-white/5">
              <Link
                href="/matches"
                className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition py-1"
              >
                <span>View All Fixtures</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* LATEST RESULT CARD */}
          <div className="glass-card glass-card-hover rounded-2xl p-5 border border-white/10 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs uppercase font-black tracking-wider text-emerald-400">
                  Latest Result #{latestCompletedMatch?.matchNumber || '—'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">
                Full Time
              </span>
            </div>

            {latestCompletedMatch && latestCompletedMatch.teamA && latestCompletedMatch.teamB ? (
              <div className="my-3 space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <TeamLogo
                      name={latestCompletedMatch.teamA.name}
                      shortName={latestCompletedMatch.teamA.shortName}
                      logo={latestCompletedMatch.teamA.logo}
                      primaryColor={latestCompletedMatch.teamA.primaryColor}
                      size="sm"
                    />
                    <span className="font-bold text-sm text-white">
                      {latestCompletedMatch.teamA.name}
                    </span>
                  </div>
                  <span className="text-2xl font-black font-mono text-emerald-400 scoreboard-number">
                    {latestCompletedMatch.teamAScore}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <TeamLogo
                      name={latestCompletedMatch.teamB.name}
                      shortName={latestCompletedMatch.teamB.shortName}
                      logo={latestCompletedMatch.teamB.logo}
                      primaryColor={latestCompletedMatch.teamB.primaryColor}
                      size="sm"
                    />
                    <span className="font-bold text-sm text-white">
                      {latestCompletedMatch.teamB.name}
                    </span>
                  </div>
                  <span className="text-2xl font-black font-mono text-slate-300 scoreboard-number">
                    {latestCompletedMatch.teamBScore}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No match results recorded yet.
              </div>
            )}

            <div className="pt-2 border-t border-white/5">
              <Link
                href="/matches?status=COMPLETED"
                className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition py-1"
              >
                <span>Full Results Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 5. DYNAMIC PRIMARY SECTION: LEAGUE TABLE vs KNOCKOUT BRACKET */}
        {isKnockoutActive ? (
          /* KNOCKOUT IS ACTIVE: RENDER PROMINENT KNOCKOUT BRACKET */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Playoff Knockout Bracket</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Single-elimination championship bracket for the Amreli Silver Stick Trophy
                </p>
              </div>

              <Link
                href="/standings"
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1"
              >
                <span>League Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <KnockoutBracket
              knockoutMatches={knockoutMatches}
              currentStage={currentStage}
            />
          </section>
        ) : (
          /* LEAGUE IS ACTIVE: RENDER LEAGUE TABLE PREVIEW WITH DYNAMIC QUALIFICATION CUTOFF */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <span>{isLeagueComplete ? 'Final League Standings' : 'League Standings'}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isLeagueComplete
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isLeagueComplete ? 'LEAGUE COMPLETE' : 'LIVE'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Top <strong className="text-emerald-400">{qualificationCount} teams</strong> advance to the Knockout Stage
                </p>
              </div>

              <Link
                href="/standings"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>Full Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile-Usable League Table */}
            <div className="glass-card rounded-2xl overflow-hidden border border-emerald-500/20 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap sm:whitespace-normal">
                  <thead className="bg-slate-900 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-3 text-center w-10">Pos</th>
                      <th className="py-3 px-3">Team</th>
                      <th className="py-3 px-2 text-center" title="Played">P</th>
                      <th className="py-3 px-2 text-center text-emerald-400" title="Won">W</th>
                      <th className="py-3 px-2 text-center text-slate-400" title="Drawn">D</th>
                      <th className="py-3 px-2 text-center text-rose-400" title="Lost">L</th>
                      <th className="py-3 px-2 text-center font-bold" title="Goal Diff">GD</th>
                      <th className="py-3 px-3 text-center font-bold text-amber-400 text-sm" title="Points">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {standings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                          No standings data recorded yet.
                        </td>
                      </tr>
                    ) : (
                      standings.map((team) => {
                        const isCutoff = team.position === qualificationCount;
                        const isQualified = team.position <= qualificationCount;

                        return (
                          <React.Fragment key={team.teamId}>
                            <tr
                              className={`hover:bg-white/5 transition ${
                                isQualified ? 'bg-emerald-950/15' : ''
                              }`}
                            >
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-mono font-bold ${
                                    isQualified
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {team.position}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <Link
                                  href={`/teams/${team.teamId}`}
                                  className="flex items-center gap-2 hover:text-emerald-400 transition"
                                >
                                  <TeamLogo
                                    name={team.name}
                                    shortName={team.shortName}
                                    logo={team.logo}
                                    primaryColor={team.primaryColor}
                                    size="sm"
                                  />
                                  <span className="font-bold text-white text-xs truncate max-w-[140px] sm:max-w-none">
                                    {team.name}
                                  </span>
                                </Link>
                              </td>
                              <td className="py-3 px-2 text-center font-mono">{team.played}</td>
                              <td className="py-3 px-2 text-center font-mono text-emerald-400">{team.won}</td>
                              <td className="py-3 px-2 text-center font-mono text-slate-400">{team.drawn}</td>
                              <td className="py-3 px-2 text-center font-mono text-rose-400">{team.lost}</td>
                              <td className="py-3 px-2 text-center font-mono font-bold">
                                {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-black text-amber-400 text-sm">
                                {team.points}
                              </td>
                            </tr>

                            {/* Dynamic Qualification Cutoff Line */}
                            {isCutoff && team.position < standings.length && (
                              <tr className="bg-emerald-950/60 border-y-2 border-emerald-500/60">
                                <td colSpan={8} className="py-1 px-4 text-center">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                                    ──────── Top {qualificationCount} Advance to Knockouts ────────
                                  </span>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* 6. TOURNAMENT STATS SPOTLIGHT (Golden Stick & Top Goalkeeper) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Tournament Honors</span>
            </h3>
            <Link
              href="/statistics"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>All Leaders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top Scorer */}
            <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 flex items-center justify-between">
              {topScorers.length > 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <SportsAvatar
                      photo={topScorers[0].photo}
                      name={topScorers[0].playerName}
                      jerseyNumber={topScorers[0].jerseyNumber}
                      size="md"
                    />
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-400 block">
                        Golden Stick Leader
                      </span>
                      <h4 className="font-extrabold text-white text-sm">{topScorers[0].playerName}</h4>
                      <p className="text-xs text-slate-400">{topScorers[0].teamName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-2xl text-amber-400">
                      {topScorers[0].goals}
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Goals</span>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-4 text-xs text-slate-500">
                  No goal records logged yet.
                </div>
              )}
            </div>

            {/* Top Goalkeeper */}
            <div className="glass-card rounded-2xl p-4 border border-teal-500/20 flex items-center justify-between">
              {topGoalkeepers.length > 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <SportsAvatar
                      photo={topGoalkeepers[0].photo}
                      name={topGoalkeepers[0].playerName}
                      jerseyNumber={topGoalkeepers[0].jerseyNumber}
                      size="md"
                    />
                    <div>
                      <span className="text-[10px] font-black uppercase text-teal-400 block">
                        Top Goalkeeper (Fewest Conceded)
                      </span>
                      <h4 className="font-extrabold text-white text-sm">{topGoalkeepers[0].playerName}</h4>
                      <p className="text-xs text-slate-400">
                        {topGoalkeepers[0].teamName} • {topGoalkeepers[0].cleanSheets} Clean Sheets
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-2xl text-emerald-400">
                      {topGoalkeepers[0].goalsConceded}
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Conceded</span>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-4 text-xs text-slate-500">
                  No goalkeeping stats logged yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 7. PARTICIPATING TEAMS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase text-white tracking-wider">
              Participating Teams ({teams.length})
            </h3>
            <Link
              href="/teams"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>All Squads</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/teams/${t.id}`}
                className="glass-card glass-card-hover rounded-2xl p-3.5 text-center flex flex-col items-center justify-between border border-white/5 space-y-2"
              >
                <TeamLogo
                  name={t.name}
                  shortName={t.shortName}
                  logo={t.logo}
                  primaryColor={t.primaryColor}
                  size="md"
                />
                <div>
                  <h4 className="font-bold text-xs text-white truncate max-w-[120px]">{t.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{t.shortName}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 8. LATEST OFFICIAL ANNOUNCEMENTS */}
        {announcements.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Tournament Notices</span>
              </h3>
              <Link href="/announcements" className="text-xs text-slate-400 hover:text-white">
                View All →
              </Link>
            </div>

            <div className="space-y-2">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3 text-xs"
                >
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono uppercase shrink-0 mt-0.5">
                    {a.type}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-white">{a.title}</h4>
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
