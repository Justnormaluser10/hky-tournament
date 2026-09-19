import React from 'react';
import Link from 'next/link';
import { TableProperties, ArrowUpRight, Calendar, Sparkles } from 'lucide-react';
import { calculateStandings } from '@/lib/engine';
import { TeamLogo } from '@/components/ui/TeamLogo';

export const revalidate = 0;

export default async function AdminStandingsPage() {
  const { standings, tournament } = await calculateStandings();
  const qualificationCount = tournament?.qualificationCount || 4;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/40">
            <TableProperties className="w-3.5 h-3.5 text-amber-400" />
            Live Calculation Engine
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            League Standings Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
            Standings computed automatically from completed match scores • Win = {tournament?.pointsForWin ?? 3}, Draw = {tournament?.pointsForDraw ?? 1}
          </p>
        </div>

        <Link
          href="/admin/matches"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:via-teal-300 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 border-2 border-emerald-300/80 hover:border-emerald-200 flex items-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Calendar className="w-4 h-4 text-white stroke-[2.5]" />
          <span>Edit Match Scores</span>
        </Link>
      </div>

      {/* Standings Table Card */}
      <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900/85 backdrop-blur-md border border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/90 text-slate-200 font-black uppercase text-xs tracking-wider border-b border-white/15">
              <tr>
                <th className="py-4 px-4 text-center w-16">Pos</th>
                <th className="py-4 px-4">Club / Team</th>
                <th className="py-4 px-3 text-center">P</th>
                <th className="py-4 px-3 text-center text-emerald-400">W</th>
                <th className="py-4 px-3 text-center text-slate-400">D</th>
                <th className="py-4 px-3 text-center text-rose-400">L</th>
                <th className="py-4 px-3 text-center">GF</th>
                <th className="py-4 px-3 text-center">GA</th>
                <th className="py-4 px-3 text-center font-bold">GD</th>
                <th className="py-4 px-4 text-center font-black text-amber-400 text-base">Pts</th>
                <th className="py-4 px-4 text-center">Qualification</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-medium">
              {standings.map((row) => {
                const isQualified = row.position <= qualificationCount;

                return (
                  <tr
                    key={row.teamId}
                    className={`hover:bg-white/5 transition duration-150 ${
                      isQualified ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono font-bold text-xs ${
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

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <TeamLogo
                          name={row.name}
                          shortName={row.shortName}
                          logo={row.logo}
                          primaryColor={row.primaryColor}
                          size="sm"
                        />
                        <div>
                          <span className="font-bold text-white text-sm">{row.name}</span>
                          <span className="block text-[11px] text-slate-400 font-mono">
                            {row.shortName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center font-mono">{row.played}</td>
                    <td className="py-4 px-3 text-center font-mono font-bold text-emerald-400">{row.won}</td>
                    <td className="py-4 px-3 text-center font-mono text-slate-400">{row.drawn}</td>
                    <td className="py-4 px-3 text-center font-mono text-rose-400">{row.lost}</td>
                    <td className="py-4 px-3 text-center font-mono">{row.goalsFor}</td>
                    <td className="py-4 px-3 text-center font-mono">{row.goalsAgainst}</td>
                    <td className="py-4 px-3 text-center font-mono font-bold">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-black text-amber-400 text-base">
                      {row.points}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {isQualified ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                          Qualified (Top {qualificationCount})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          League Phase
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
