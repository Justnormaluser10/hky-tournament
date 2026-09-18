import React from 'react';
import Link from 'next/link';
import { TableProperties, Trophy, ArrowRight, GitFork } from 'lucide-react';
import { calculateStandings } from '@/lib/engine';
import { TeamLogo } from '@/components/ui/TeamLogo';

export const revalidate = 0;

export default async function StandingsPage() {
  const { standings, tournament } = await calculateStandings();
  const qualificationCount = tournament?.qualificationCount || 4;
  const isKnockoutActive =
    tournament?.currentStage === 'KNOCKOUT' ||
    tournament?.currentStage === 'QUARTER_FINALS' ||
    tournament?.currentStage === 'SEMI_FINALS' ||
    tournament?.currentStage === 'FINAL' ||
    tournament?.currentStage === 'COMPLETED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <TableProperties className="w-3.5 h-3.5 text-amber-400" />
            Field Hockey League Standings
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            {isKnockoutActive || tournament?.currentStage === 'LEAGUE_COMPLETE'
              ? 'Final League Standings'
              : 'Official Table'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Points System: Win = {tournament?.pointsForWin ?? 3} pts • Draw = {tournament?.pointsForDraw ?? 1} pt • Loss = {tournament?.pointsForLoss ?? 0} pts
          </p>
        </div>

        {/* Right Header Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {isKnockoutActive && (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 border border-purple-500/40 text-xs font-black uppercase tracking-wider transition"
            >
              <GitFork className="w-3.5 h-3.5 text-purple-400" />
              <span>View Knockout Bracket</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">
              Top <strong className="text-emerald-300">{qualificationCount} Teams</strong> advance to Playoffs
            </span>
          </div>
        </div>
      </div>

      {/* Standings Table Card (Optimized for Mobile & Desktop) */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-200">
            <thead className="bg-slate-900 text-slate-400 font-black uppercase text-[10px] sm:text-xs tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">Pos</th>
                <th className="py-3.5 px-3 sticky left-0 bg-slate-900/95 z-10">Team</th>
                <th className="py-3.5 px-2.5 text-center" title="Matches Played">P</th>
                <th className="py-3.5 px-2.5 text-center text-emerald-400" title="Wins">W</th>
                <th className="py-3.5 px-2.5 text-center text-slate-400" title="Draws">D</th>
                <th className="py-3.5 px-2.5 text-center text-rose-400" title="Losses">L</th>
                <th className="py-3.5 px-2.5 text-center hidden sm:table-cell" title="Goals For">GF</th>
                <th className="py-3.5 px-2.5 text-center hidden sm:table-cell" title="Goals Against">GA</th>
                <th className="py-3.5 px-2.5 text-center font-bold" title="Goal Difference">GD</th>
                <th className="py-3.5 px-3 text-center font-black text-amber-400 text-sm sm:text-base" title="Total Points">Pts</th>
                <th className="py-3.5 px-3 text-center hidden md:table-cell" title="Recent Form">Form</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-medium">
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                    No teams or standings recorded yet.
                  </td>
                </tr>
              ) : (
                standings.map((row, index) => {
                  const isCutoff = row.position === qualificationCount;
                  const isQualified = row.position <= qualificationCount;

                  return (
                    <React.Fragment key={row.teamId}>
                      <tr
                        className={`hover:bg-white/5 transition duration-150 ${
                          isQualified ? 'bg-emerald-950/15' : ''
                        }`}
                      >
                        {/* Position */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-mono font-bold text-xs ${
                              row.position === 1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                : isQualified
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {row.position}
                          </span>
                        </td>

                        {/* Team Name and Logo (Sticky on mobile scroll) */}
                        <td className="py-3.5 px-3 sticky left-0 bg-slate-950/95 z-10">
                          <Link
                            href={`/teams/${row.teamId}`}
                            className="flex items-center gap-2.5 group hover:text-emerald-400 transition"
                          >
                            <TeamLogo
                              name={row.name}
                              shortName={row.shortName}
                              logo={row.logo}
                              primaryColor={row.primaryColor}
                              size="sm"
                            />
                            <div className="truncate max-w-[130px] sm:max-w-none">
                              <span className="font-bold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition block truncate">
                                {row.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono sm:hidden">
                                {row.shortName}
                              </span>
                            </div>
                            {isQualified && (
                              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                                QUALIFIED
                              </span>
                            )}
                          </Link>
                        </td>

                        {/* Stats */}
                        <td className="py-3.5 px-2.5 text-center font-mono">{row.played}</td>
                        <td className="py-3.5 px-2.5 text-center font-mono font-bold text-emerald-400">{row.won}</td>
                        <td className="py-3.5 px-2.5 text-center font-mono text-slate-400">{row.drawn}</td>
                        <td className="py-3.5 px-2.5 text-center font-mono text-rose-400">{row.lost}</td>
                        <td className="py-3.5 px-2.5 text-center font-mono hidden sm:table-cell">{row.goalsFor}</td>
                        <td className="py-3.5 px-2.5 text-center font-mono hidden sm:table-cell">{row.goalsAgainst}</td>
                        <td className="py-3.5 px-2.5 text-center font-mono font-bold">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-black text-amber-400 text-sm sm:text-base">
                          {row.points}
                        </td>

                        {/* Form pills */}
                        <td className="py-3.5 px-3 text-center hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {row.form.length === 0 ? (
                              <span className="text-xs text-slate-500 font-mono">—</span>
                            ) : (
                              row.form.map((res, i) => (
                                <span
                                  key={i}
                                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black font-mono uppercase ${
                                    res === 'W'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : res === 'D'
                                      ? 'bg-slate-700 text-slate-300'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  }`}
                                >
                                  {res}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* DYNAMIC QUALIFICATION CUTOFF LINE */}
                      {isCutoff && index < standings.length - 1 && (
                        <tr className="bg-emerald-950/80 border-y-2 border-emerald-500/80">
                          <td colSpan={11} className="py-2 px-4 text-center">
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-300">
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

      {/* Knockout Playoff Link if active */}
      {isKnockoutActive && (
        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm uppercase tracking-wider">
                Knockout Stage is Live!
              </h3>
              <p className="text-xs text-slate-400">
                The top qualifying teams are clashing in the Championship Playoffs.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition hover:from-emerald-500 hover:to-emerald-400 shrink-0"
          >
            <span>View Knockout Bracket</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
