import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Users,
  Trophy,
  ArrowLeft,
  Calendar,
  Shield,
  Star,
  Award,
  ChevronRight,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { calculateStandings } from '@/lib/engine';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { SportsAvatar } from '@/components/ui/SportsAvatar';

export const revalidate = 0;

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: {
        include: {
          matchEvents: {
            where: { type: 'GOAL' },
          },
        },
        orderBy: [{ isCaptain: 'desc' }, { jerseyNumber: 'asc' }],
      },
      homeMatches: {
        include: {
          teamB: { select: { id: true, name: true, shortName: true, logo: true, primaryColor: true } },
        },
        orderBy: { date: 'asc' },
      },
      awayMatches: {
        include: {
          teamA: { select: { id: true, name: true, shortName: true, logo: true, primaryColor: true } },
        },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const { standings } = await calculateStandings();
  const teamStandings = standings.find((s) => s.teamId === team.id);
  const captain = team.players.find((p) => p.isCaptain);

  // Combine and sort team matches
  const matches = [
    ...team.homeMatches.map((m) => ({
      id: m.id,
      matchNumber: m.matchNumber,
      round: m.round,
      status: m.status,
      date: m.date,
      time: m.time,
      venue: m.venue,
      teamScore: m.teamAScore,
      opponentScore: m.teamBScore,
      opponent: m.teamB,
      isHome: true,
      result:
        m.status === 'COMPLETED'
          ? m.teamAScore > m.teamBScore
            ? 'WIN'
            : m.teamAScore < m.teamBScore
            ? 'LOSS'
            : 'DRAW'
          : null,
    })),
    ...team.awayMatches.map((m) => ({
      id: m.id,
      matchNumber: m.matchNumber,
      round: m.round,
      status: m.status,
      date: m.date,
      time: m.time,
      venue: m.venue,
      teamScore: m.teamBScore,
      opponentScore: m.teamAScore,
      opponent: m.teamA,
      isHome: false,
      result:
        m.status === 'COMPLETED'
          ? m.teamBScore > m.teamAScore
            ? 'WIN'
            : m.teamBScore < m.teamAScore
            ? 'LOSS'
            : 'DRAW'
          : null,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Teams
      </Link>

      {/* Team Hero Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 relative overflow-hidden border-emerald-500/30">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: team.primaryColor }}
        />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <TeamLogo
            name={team.name}
            shortName={team.shortName}
            logo={team.logo}
            primaryColor={team.primaryColor}
            size="2xl"
          />

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-mono font-bold text-amber-400 mb-2">
                <span>{team.shortName}</span>
                <span>•</span>
                <span>Rank #{teamStandings?.position || '—'}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
                {team.name}
              </h1>
            </div>

            {team.description && (
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                {team.description}
              </p>
            )}

            {/* Leadership Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              {captain && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>
                    Team Captain: <strong className="text-white">{captain.name}</strong> (#{captain.jerseyNumber})
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>
                  Head Coach: <strong className="text-white">{team.coach || 'Head Coach'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Standings Strip */}
        {teamStandings && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-8 pt-8 border-t border-white/10 text-center">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Played</span>
              <span className="text-xl font-black text-white">{teamStandings.played}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Won</span>
              <span className="text-xl font-black text-emerald-400">{teamStandings.won}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Drawn</span>
              <span className="text-xl font-black text-slate-400">{teamStandings.drawn}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lost</span>
              <span className="text-xl font-black text-rose-400">{teamStandings.lost}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Goal Diff</span>
              <span className="text-xl font-black text-teal-300">
                {teamStandings.goalDifference > 0 ? `+${teamStandings.goalDifference}` : teamStandings.goalDifference}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Points</span>
              <span className="text-xl font-black text-amber-400">{teamStandings.points}</span>
            </div>
          </div>
        )}
      </div>

      {/* TEAM SQUAD ROSTER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>Official Squad Roster</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                {team.players.length} Players
              </span>
            </h2>
            <p className="text-xs text-slate-400">Click any player to view career tournament statistics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.players.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="glass-card glass-card-hover rounded-2xl p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <SportsAvatar
                  photo={player.photo}
                  name={player.name}
                  jerseyNumber={player.jerseyNumber}
                  size="md"
                />

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-sm group-hover:text-emerald-400 transition">
                      {player.name}
                    </span>
                    {player.isCaptain && (
                      <span className="text-amber-400 text-xs" title="Official Team Captain">⭐</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-emerald-400 font-bold">#{player.jerseyNumber}</span>
                    <span>•</span>
                    <span className="uppercase text-[10px] font-bold tracking-wider">{player.position}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                {player.matchEvents.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold font-mono">
                    ⚽ {player.matchEvents.length}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition ml-auto mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* TEAM MATCHES HISTORY & FIXTURES */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">
          Match Fixtures & Results
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((m) => (
            <div
              key={m.id}
              className="glass-card rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <TeamLogo
                  name={m.opponent?.name || 'TBD'}
                  shortName={m.opponent?.shortName || 'TBD'}
                  logo={m.opponent?.logo}
                  primaryColor={m.opponent?.primaryColor || '#64748b'}
                  size="sm"
                />
                <div>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    Match #{m.matchNumber} • {m.isHome ? 'Home' : 'Away'}
                  </span>
                  <span className="font-bold text-white text-sm">
                    vs {m.opponent?.name || 'To Be Announced'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                {m.status === 'COMPLETED' ? (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                        m.result === 'WIN'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : m.result === 'LOSS'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {m.result} {m.teamScore}–{m.opponentScore}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-amber-400">
                    {m.time}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 block mt-0.5">{m.venue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
