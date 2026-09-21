import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Trophy,
  Shield,
  Flame,
  Award,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  calculateTopScorers,
  calculateTopGoalkeepers,
  calculateTeamStats,
} from '@/lib/engine';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { SportsAvatar } from '@/components/ui/SportsAvatar';

export const revalidate = 30;

export default async function StatisticsPage() {
  const [topScorers, topGoalkeepers, teamStats] = await Promise.all([
    calculateTopScorers(),
    calculateTopGoalkeepers(),
    calculateTeamStats(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          Tournament Analytics & Leaderboards
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          Player & Team Statistics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time individual performance rankings and collective team milestones
        </p>
      </div>

      {/* 1. OVERARCHING TEAM STATS TILES */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Team Performance Leaders
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Most Wins */}
          <div className="glass-card rounded-2xl p-5 border-emerald-500/20 flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Most Wins
            </span>
            <div className="my-3">
              <h3 className="text-xl font-black text-white truncate">
                {teamStats.mostWins ? teamStats.mostWins.teamName : '—'}
              </h3>
              <span className="text-3xl font-black font-mono text-emerald-400 mt-1 block">
                {teamStats.mostWins ? `${teamStats.mostWins.wins} Wins` : '0'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Match Victory Leader
            </div>
          </div>

          {/* Most Goals Scored */}
          <div className="glass-card rounded-2xl p-5 border-amber-500/20 flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Most Goals Scored
            </span>
            <div className="my-3">
              <h3 className="text-xl font-black text-white truncate">
                {teamStats.mostGoals ? teamStats.mostGoals.teamName : '—'}
              </h3>
              <span className="text-3xl font-black font-mono text-amber-400 mt-1 block">
                {teamStats.mostGoals ? `${teamStats.mostGoals.goals} Goals` : '0'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Best Offense
            </div>
          </div>

          {/* Best Goal Difference */}
          <div className="glass-card rounded-2xl p-5 border-teal-500/20 flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Best Goal Difference
            </span>
            <div className="my-3">
              <h3 className="text-xl font-black text-white truncate">
                {teamStats.bestGD ? teamStats.bestGD.teamName : '—'}
              </h3>
              <span className="text-3xl font-black font-mono text-teal-300 mt-1 block">
                {teamStats.bestGD
                  ? teamStats.bestGD.gd > 0
                    ? `+${teamStats.bestGD.gd}`
                    : teamStats.bestGD.gd
                  : '0'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Goal Margin Superiority
            </div>
          </div>

          {/* Best Defense */}
          <div className="glass-card rounded-2xl p-5 border-purple-500/20 flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Fewest Goals Conceded
            </span>
            <div className="my-3">
              <h3 className="text-xl font-black text-white truncate">
                {teamStats.bestDefense ? teamStats.bestDefense.teamName : '—'}
              </h3>
              <span className="text-3xl font-black font-mono text-purple-400 mt-1 block">
                {teamStats.bestDefense ? `${teamStats.bestDefense.goalsConceded} GA` : '0'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Strongest Defensive Unit
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP SCORERS & TOP GOALKEEPERS LEADERBOARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP SCORERS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase text-white tracking-wide">
                  Top Scorers
                </h2>
                <p className="text-xs text-slate-400">Golden Stick Award Ranking</p>
              </div>
            </div>

            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              By Goals
            </span>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden shadow-xl border-white/10">
            {topScorers.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">No goal records registered yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {topScorers.map((scorer) => (
                  <div
                    key={scorer.playerId}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-mono font-black text-sm ${
                          scorer.rank === 1
                            ? 'text-amber-400'
                            : scorer.rank === 2
                            ? 'text-slate-300'
                            : scorer.rank === 3
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        #{scorer.rank}
                      </span>

                      <SportsAvatar
                        photo={scorer.photo}
                        name={scorer.playerName}
                        jerseyNumber={scorer.jerseyNumber}
                        size="md"
                      />

                      <div>
                        <Link
                          href={`/players/${scorer.playerId}`}
                          className="font-black text-white text-sm hover:text-emerald-400 transition flex items-center gap-1.5"
                        >
                          <span>{scorer.playerName}</span>
                          {scorer.isCaptain && (
                            <span className="text-amber-400 text-xs" title="Captain">⭐</span>
                          )}
                        </Link>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{scorer.teamName}</span>
                          <span>•</span>
                          <span className="font-mono">#{scorer.jerseyNumber}</span>
                          <span>•</span>
                          <span className="text-[11px] text-slate-500">
                            {scorer.matchesPlayed} {scorer.matchesPlayed === 1 ? 'match' : 'matches'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-amber-400">
                        {scorer.goals}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Goals
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TOP GOALKEEPERS (FEWEST GOALS CONCEDED) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase text-white tracking-wide">
                  Top Goalkeepers
                </h2>
                <p className="text-xs text-emerald-400 font-semibold">
                  Ranked by Fewest Goals Conceded
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Fewest Conceded
            </span>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden shadow-xl border-white/10">
            {topGoalkeepers.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">No goalkeeping records available.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {topGoalkeepers.map((gk) => (
                  <div
                    key={gk.playerId}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-mono font-black text-sm ${
                          gk.rank === 1
                            ? 'text-emerald-400'
                            : gk.rank === 2
                            ? 'text-slate-300'
                            : gk.rank === 3
                            ? 'text-amber-500'
                            : 'text-slate-500'
                        }`}
                      >
                        #{gk.rank}
                      </span>

                      <SportsAvatar
                        photo={gk.photo}
                        name={gk.playerName}
                        jerseyNumber={gk.jerseyNumber}
                        size="md"
                      />

                      <div>
                        <Link
                          href={`/players/${gk.playerId}`}
                          className="font-black text-white text-sm hover:text-emerald-400 transition"
                        >
                          {gk.playerName}
                        </Link>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{gk.teamName}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">
                            {gk.cleanSheets} Clean {gk.cleanSheets === 1 ? 'Sheet' : 'Sheets'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-emerald-400">
                        {gk.goalsConceded}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Conceded ({gk.matches} {gk.matches === 1 ? 'm' : 'm'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
