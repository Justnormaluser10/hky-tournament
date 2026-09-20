import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Trophy,
  Shield,
  Star,
  Activity,
  Calendar,
  Award,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { toCleanLogoUrl, toCleanPhotoUrl } from '@/lib/logoUrl';
import { SportsAvatar } from '@/components/ui/SportsAvatar';
import { TeamLogo } from '@/components/ui/TeamLogo';

export const revalidate = 0;

export default async function PlayerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const rawPlayer = await prisma.player.findUnique({
    where: { id },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          primaryColor: true,
        },
      },
      matchEvents: {
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!rawPlayer) {
    notFound();
  }

  const player = {
    ...rawPlayer,
    photo: toCleanPhotoUrl(rawPlayer.id, rawPlayer.photo),
    team: {
      ...rawPlayer.team,
      logo: toCleanLogoUrl(rawPlayer.team.id, rawPlayer.team.logo),
    },
    matchEvents: rawPlayer.matchEvents.map((ev) => ({
      ...ev,
      match: {
        ...ev.match,
        teamA: ev.match.teamA
          ? { ...ev.match.teamA, logo: toCleanLogoUrl(ev.match.teamA.id, ev.match.teamA.logo) }
          : null,
        teamB: ev.match.teamB
          ? { ...ev.match.teamB, logo: toCleanLogoUrl(ev.match.teamB.id, ev.match.teamB.logo) }
          : null,
      },
    })),
  };

  // Calculate stats
  const teamMatches = await prisma.match.findMany({
    where: {
      status: 'COMPLETED',
      OR: [{ teamAId: player.teamId }, { teamBId: player.teamId }],
    },
  });

  const matchesPlayed = teamMatches.length;
  const goals = player.matchEvents.filter((e) => e.type === 'GOAL').length;
  const yellowCards = player.matchEvents.filter((e) => e.type === 'YELLOW_CARD').length;
  const redCards = player.matchEvents.filter((e) => e.type === 'RED_CARD').length;

  let cleanSheets = 0;
  let goalsConceded = 0;

  if (player.position === 'GOALKEEPER') {
    for (const m of teamMatches) {
      const conceded = m.teamAId === player.teamId ? m.teamBScore : m.teamAScore;
      goalsConceded += conceded;
      if (conceded === 0) cleanSheets += 1;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back to team */}
      <Link
        href={`/teams/${player.teamId}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {player.team.name}
      </Link>

      {/* Main Profile Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 relative overflow-hidden border-emerald-500/30">
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: player.team.primaryColor }}
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <SportsAvatar
            photo={player.photo}
            name={player.name}
            jerseyNumber={player.jerseyNumber}
            size="xl"
            className="border-4"
          />

          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-black">
                #{player.jerseyNumber}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs uppercase font-bold tracking-wider text-slate-300">
                {player.position}
              </span>
              {player.isCaptain && (
                <span className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1">
                  ⭐ Official Team Captain
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              {player.name}
            </h1>

            {/* Team Association */}
            <Link
              href={`/teams/${player.team.id}`}
              className="inline-flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-white/10 hover:border-emerald-500/40 transition group"
            >
              <TeamLogo
                name={player.team.name}
                shortName={player.team.shortName}
                logo={player.team.logo}
                primaryColor={player.team.primaryColor}
                size="sm"
              />
              <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition">
                {player.team.name}
              </span>
            </Link>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10 text-center">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Matches</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {matchesPlayed}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Goals Scored</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
              {goals}
            </span>
          </div>

          {player.position === 'GOALKEEPER' ? (
            <>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Clean Sheets</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  {cleanSheets}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Goals Conceded</span>
                <span className="text-2xl font-black text-teal-300 font-mono mt-1 block">
                  {goalsConceded}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Yellow Cards</span>
                <span className="text-2xl font-black text-yellow-400 font-mono mt-1 block">
                  {yellowCards}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Status</span>
                <span className="text-sm font-black text-emerald-400 uppercase mt-2 block">
                  {player.status}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Career Events Timeline */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Tournament Event Log
        </h3>

        {player.matchEvents.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 bg-slate-950/40 rounded-xl">
            No match events recorded for this player yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {player.matchEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {evt.type === 'GOAL' ? '⚽' : evt.type === 'YELLOW_CARD' ? '🟨' : '🟥'}
                  </span>
                  <div>
                    <span className="font-bold text-white block">
                      {evt.type.replace('_', ' ')} at {evt.minute}&apos;
                    </span>
                    <span className="text-[11px] text-slate-400">
                      vs {evt.match.teamAId === player.teamId ? (evt.match.teamB?.name || 'Opponent') : (evt.match.teamA?.name || 'Opponent')}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  Match #{evt.match.matchNumber}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
