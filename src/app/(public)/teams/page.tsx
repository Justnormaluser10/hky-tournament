import React from 'react';
import Link from 'next/link';
import { Users, Trophy, ChevronRight, Shield } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { calculateStandings } from '@/lib/engine';
import { toCleanLogoUrl } from '@/lib/logoUrl';
import { TeamLogo } from '@/components/ui/TeamLogo';

export const revalidate = 0;

export default async function TeamsPage() {
  const [rawTeams, { standings }] = await Promise.all([
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
        coach: true,
        primaryColor: true,
        players: {
          select: {
            id: true,
            name: true,
            isCaptain: true,
            position: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    calculateStandings(),
  ]);

  const teams = rawTeams.map((team) => ({
    ...team,
    logo: `/api/public/teams/${team.id}/logo`,
  }));

  const standingsMap = new Map(standings.map((s) => [s.teamId, s]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Users className="w-3.5 h-3.5 text-amber-400" />
          Clubs & Academies
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          Participating Teams
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Official club profiles, squad rosters, and designated team captains
        </p>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const stats = standingsMap.get(team.id) || {
            position: 0,
            played: 0,
            won: 0,
            points: 0,
            goalDifference: 0,
          };

          const captain = team.players.find((p) => p.isCaptain);

          return (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Header with Logo and Position Badge */}
                <div className="flex items-start justify-between gap-4">
                  <TeamLogo
                    name={team.name}
                    shortName={team.shortName}
                    logo={team.logo}
                    primaryColor={team.primaryColor}
                    size="lg"
                  />

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs font-black font-mono text-amber-400">
                      Rank #{stats.position || '—'}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-mono mt-1">
                      {team.players.length} Players
                    </span>
                  </div>
                </div>

                {/* Team Name & Coach */}
                <div className="mt-4">
                  <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition">
                    {team.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Coach: <strong className="text-slate-200">{team.coach || 'Head Coach'}</strong>
                  </p>
                </div>

                {/* Captain Highlight */}
                {captain && (
                  <div className="mt-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs">
                    <span className="text-amber-400 font-bold">⭐ Captain:</span>
                    <span className="font-extrabold text-white">{captain.name}</span>
                  </div>
                )}
              </div>

              {/* Quick Standings Stats Strip */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Played</span>
                    <span className="font-bold text-white">{stats.played}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Won</span>
                    <span className="font-bold text-emerald-400">{stats.won}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Points</span>
                    <span className="font-black text-amber-400">{stats.points}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition">
                  <span>View Full Squad & Bio</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
