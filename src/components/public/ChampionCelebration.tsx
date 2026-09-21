'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Award, Flame, Shield, Sparkles, ChevronRight } from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { SportsAvatar } from '@/components/ui/SportsAvatar';

interface ChampionCelebrationProps {
  championTeam: {
    id: string;
    name: string;
    shortName: string;
    logo?: string | null;
    primaryColor: string;
    coach?: string | null;
  };
  runnerUpTeam?: {
    id: string;
    name: string;
    shortName: string;
    logo?: string | null;
    primaryColor: string;
  } | null;
  finalScore?: {
    teamAScore: number;
    teamBScore: number;
  } | null;
  topScorer?: any;
  topGoalkeeper?: any;
}

export function ChampionCelebration({
  championTeam,
  runnerUpTeam,
  finalScore,
  topScorer,
  topGoalkeeper,
}: ChampionCelebrationProps) {
  useEffect(() => {
    // Fire celebratory confetti cascade safely in browser
    let isMounted = true;
    try {
      if (typeof window === 'undefined') return;
      import('canvas-confetti')
        .then((module) => {
          if (!isMounted) return;
          const confetti = module.default || module;
          if (typeof confetti !== 'function') return;

          const duration = 3.5 * 1000;
          const end = Date.now() + duration;

          const frame = () => {
            if (!isMounted) return;
            confetti({
              particleCount: 4,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#059669', '#10b981', '#f59e0b', '#fbbf24'],
            });
            confetti({
              particleCount: 4,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#059669', '#10b981', '#f59e0b', '#fbbf24'],
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          };
          frame();
        })
        .catch((err) => {
          console.warn('Could not load confetti:', err);
        });
    } catch (e) {
      console.warn(e);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/40 via-slate-950 to-[#070b14] p-6 sm:p-10 shadow-2xl shadow-amber-950/40 text-center">
      {/* Background Stadium Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-widest border border-amber-500/40 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>TOURNAMENT CHAMPIONS 2026</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>

        {/* Champion Logo & Name */}
        <div className="space-y-4 pt-2">
          <div className="mx-auto w-fit transform hover:scale-105 transition-transform">
            <TeamLogo
              name={championTeam.name}
              shortName={championTeam.shortName}
              logo={championTeam.logo}
              primaryColor={championTeam.primaryColor}
              size="2xl"
              className="ring-4 ring-amber-500/40 shadow-2xl shadow-amber-900/50"
            />
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 block mb-1">
              🏆 Inagural Amreli Silver Stick Trophy Winner
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none drop-shadow-md">
              {championTeam.name}
            </h2>
            {championTeam.coach && (
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Head Coach: <strong className="text-slate-200">{championTeam.coach}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Final Match Scoreline if available */}
        {finalScore && runnerUpTeam && (
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 max-w-md mx-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Championship Decider Result
            </span>
            <div className="flex items-center justify-center gap-4 text-sm font-bold">
              <span className="text-emerald-400 font-extrabold">{championTeam.shortName}</span>
              <span className="font-mono font-black text-xl text-white px-2.5 py-0.5 rounded bg-slate-950 border border-white/10">
                {finalScore.teamAScore} — {finalScore.teamBScore}
              </span>
              <span className="text-slate-400">{runnerUpTeam.shortName} (Runner-Up)</span>
            </div>
          </div>
        )}

        {/* Individual Honors Spotlight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
          {topScorer?.playerName && (
            <div className="glass-card rounded-2xl p-4 border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SportsAvatar
                  photo={topScorer.photo}
                  name={topScorer.playerName}
                  jerseyNumber={topScorer.jerseyNumber}
                  size="md"
                />
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 block flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Golden Stick Winner
                  </span>
                  <h4 className="font-extrabold text-white text-sm">{topScorer.playerName}</h4>
                  <span className="text-xs text-slate-400 font-mono">{topScorer.teamName}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-xl text-amber-400">{topScorer.goals}</span>
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Goals</span>
              </div>
            </div>
          )}

          {topGoalkeeper?.playerName && (
            <div className="glass-card rounded-2xl p-4 border-teal-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SportsAvatar
                  photo={topGoalkeeper.photo}
                  name={topGoalkeeper.playerName}
                  jerseyNumber={topGoalkeeper.jerseyNumber}
                  size="md"
                />
                <div>
                  <span className="text-[10px] font-black uppercase text-teal-400 block flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Best Goalkeeper
                  </span>
                  <h4 className="font-extrabold text-white text-sm">{topGoalkeeper.playerName}</h4>
                  <span className="text-xs text-slate-400 font-mono">{topGoalkeeper.teamName}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-xl text-emerald-400">{topGoalkeeper.goalsConceded}</span>
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Conceded</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
