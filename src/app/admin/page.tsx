import React from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Trophy,
  Shield,
  Activity,
  Sparkles,
  Flame,
  GitFork,
  ArrowRight,
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
import { TournamentProgressionCard } from '@/components/admin/TournamentProgressionCard';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const tournament = await prisma.tournament.findFirst();
  const { standings } = await calculateStandings(tournament?.id);
  const leagueStatus = await checkLeagueStageStatus(tournament?.id);
  const topScorers = await calculateTopScorers(tournament?.id);
  const topGoalkeepers = await calculateTopGoalkeepers(tournament?.id);

  const totalTeams = await prisma.team.count();
  const totalPlayers = await prisma.player.count();
  const totalMatches = await prisma.match.count();
  const completedMatches = await prisma.match.count({ where: { status: 'COMPLETED' } });
  const upcomingMatches = await prisma.match.count({ where: { status: 'UPCOMING' } });

  const recentActivities = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const leader = standings.length > 0 ? standings[0] : null;
  const bestScorer = topScorers.length > 0 ? topScorers[0] : null;
  const bestGk = topGoalkeepers.length > 0 ? topGoalkeepers[0] : null;

  const qualifiedTeams = standings.slice(0, tournament?.qualificationCount || 4);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Tournament Director Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Tournament Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of {tournament?.name} • Stage:{' '}
            <strong className="text-emerald-400 uppercase">{tournament?.currentStage}</strong>
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/matches"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" /> Enter Scores
          </Link>
          <Link
            href="/admin/teams"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/10 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Manage Teams
          </Link>
          <Link
            href="/admin/knockout"
            className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
          >
            <GitFork className="w-3.5 h-3.5" /> Knockouts
          </Link>
        </div>
      </div>

      {/* 1. TOURNAMENT PROGRESSION CONTROL CARD (Crucial Requirement) */}
      {tournament && (
        <TournamentProgressionCard
          tournament={{
            id: tournament.id,
            name: tournament.name,
            currentStage: tournament.currentStage,
            qualificationCount: tournament.qualificationCount || 4,
            status: tournament.status,
          }}
          leagueStatus={leagueStatus}
          qualifiedTeams={qualifiedTeams}
        />
      )}

      {/* 2. METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="glass-card rounded-2xl p-4 sm:p-5 border-emerald-500/20">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
            Total Teams
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-4xl font-black font-mono text-white">
              {totalTeams}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Active
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border-emerald-500/20">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
            Rostered Players
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-400">
              {totalPlayers}
            </span>
            <span className="text-[10px] font-mono text-slate-500">Registered</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border-amber-500/20">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
            Matches Completed
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-4xl font-black font-mono text-amber-400">
              {completedMatches}
            </span>
            <span className="text-[10px] font-mono text-slate-400">of {totalMatches}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border-teal-500/20">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
            Upcoming Fixtures
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-4xl font-black font-mono text-teal-300">
              {upcomingMatches}
            </span>
            <span className="text-[10px] font-mono text-teal-400">Scheduled</span>
          </div>
        </div>
      </div>

      {/* 3. LEADERS SPOTLIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Table Leader */}
        <div className="glass-card rounded-2xl p-5 border-amber-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-black tracking-wider text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Current Table Leader
              </span>
              <Link href="/admin/matches" className="text-[11px] text-slate-400 hover:text-white">
                View →
              </Link>
            </div>

            {leader ? (
              <div className="flex items-center gap-3 mt-2">
                <TeamLogo
                  name={leader.name}
                  shortName={leader.shortName}
                  logo={leader.logo}
                  primaryColor={leader.primaryColor}
                  size="md"
                />
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base leading-tight">
                    {leader.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Points: <strong className="text-amber-400 font-mono">{leader.points}</strong> • GD:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {leader.goalDifference > 0 ? `+${leader.goalDifference}` : leader.goalDifference}
                    </strong>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">No standings recorded yet.</p>
            )}
          </div>
        </div>

        {/* Top Scorer */}
        <div className="glass-card rounded-2xl p-5 border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> Top Scorer
              </span>
              <Link href="/admin/players" className="text-[11px] text-slate-400 hover:text-white">
                Players →
              </Link>
            </div>

            {bestScorer ? (
              <div className="flex items-center gap-3 mt-2">
                <SportsAvatar
                  photo={bestScorer.photo}
                  name={bestScorer.playerName}
                  jerseyNumber={bestScorer.jerseyNumber}
                  size="md"
                />
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base leading-tight">
                    {bestScorer.playerName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {bestScorer.teamName} • Goals:{' '}
                    <strong className="text-amber-400 font-mono text-sm">{bestScorer.goals}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">No goals logged yet.</p>
            )}
          </div>
        </div>

        {/* Best Goalkeeper */}
        <div className="glass-card rounded-2xl p-5 border-teal-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-black tracking-wider text-teal-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Top Goalkeeper
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Fewest Conceded</span>
            </div>

            {bestGk ? (
              <div className="flex items-center gap-3 mt-2">
                <SportsAvatar
                  photo={bestGk.photo}
                  name={bestGk.playerName}
                  jerseyNumber={bestGk.jerseyNumber}
                  size="md"
                />
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base leading-tight">
                    {bestGk.playerName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {bestGk.teamName} • Conceded:{' '}
                    <strong className="text-emerald-400 font-mono">{bestGk.goalsConceded}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">No goalkeeper stats yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. RECENT ACTIVITY AUDIT TRAIL */}
      <div className="glass-card rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
              Recent Administrative Actions
            </h2>
          </div>

          <Link
            href="/admin/activity"
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No recent actions logged.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono font-bold text-emerald-400 text-[10px] uppercase mr-2 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {act.action}
                  </span>
                  <span className="text-slate-300">{act.description}</span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
