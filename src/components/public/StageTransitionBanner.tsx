'use client';

import React from 'react';
import { Trophy, GitFork, CheckCircle, Clock, Sparkles } from 'lucide-react';

interface StageTransitionBannerProps {
  currentStage: string; // LEAGUE, LEAGUE_COMPLETED, SEMI_FINALS, FINAL, COMPLETED
  qualificationCount?: number;
}

export function StageTransitionBanner({
  currentStage = 'LEAGUE',
  qualificationCount = 4,
}: StageTransitionBannerProps) {
  const stages = [
    {
      id: 'LEAGUE',
      label: 'League Stage',
      sub: 'Single Round-Robin',
      active:
        currentStage === 'LEAGUE' ||
        currentStage === 'LEAGUE_COMPLETE' ||
        currentStage === 'LEAGUE_COMPLETED' ||
        currentStage === 'UPCOMING',
      completed:
        currentStage === 'KNOCKOUT' ||
        currentStage === 'QUARTER_FINALS' ||
        currentStage === 'SEMI_FINALS' ||
        currentStage === 'FINAL' ||
        currentStage === 'COMPLETED',
    },
    {
      id: 'KNOCKOUT',
      label: 'Playoff Knockouts',
      sub: `Top ${qualificationCount} Teams`,
      active:
        currentStage === 'KNOCKOUT' ||
        currentStage === 'QUARTER_FINALS' ||
        currentStage === 'SEMI_FINALS' ||
        currentStage === 'FINAL',
      completed: currentStage === 'COMPLETED',
    },
    {
      id: 'COMPLETED',
      label: 'Championship Glory',
      sub: 'Silver Stick Trophy',
      active: currentStage === 'COMPLETED',
      completed: currentStage === 'COMPLETED',
    },
  ];

  const getStageTitle = () => {
    switch (currentStage) {
      case 'UPCOMING':
      case 'LEAGUE':
        return 'League Stage in Progress';
      case 'LEAGUE_COMPLETE':
      case 'LEAGUE_COMPLETED':
        return 'League Stage Complete — Awaiting Knockout Activation';
      case 'SEMI_FINALS':
      case 'QUARTER_FINALS':
      case 'KNOCKOUT':
        return 'Playoff Knockout Rounds Active';
      case 'FINAL':
        return 'Grand Championship Final';
      case 'COMPLETED':
        return 'Tournament Concluded — Champions Crowned!';
      default:
        return 'Tournament Live';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/20 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
            {getStageTitle()}
          </span>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          Stage: <strong className="text-white uppercase">{currentStage}</strong>
        </span>
      </div>

      {/* Stepper Progress */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {stages.map((st, i) => {
          const isCurrent =
            (st.id === 'LEAGUE' &&
              (currentStage === 'LEAGUE' ||
                currentStage === 'LEAGUE_COMPLETE' ||
                currentStage === 'LEAGUE_COMPLETED' ||
                currentStage === 'UPCOMING')) ||
            (st.id === 'KNOCKOUT' &&
              (currentStage === 'KNOCKOUT' ||
                currentStage === 'QUARTER_FINALS' ||
                currentStage === 'SEMI_FINALS' ||
                currentStage === 'FINAL')) ||
            (st.id === 'COMPLETED' && currentStage === 'COMPLETED');

          return (
            <div
              key={st.id}
              className={`p-2.5 rounded-xl border transition ${
                isCurrent
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                  : st.completed
                  ? 'bg-slate-900/40 border-emerald-500/20 text-slate-400'
                  : 'bg-slate-950/40 border-white/5 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {st.completed ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                      isCurrent
                        ? 'bg-emerald-500 text-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${
                    isCurrent ? 'text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  {st.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 hidden sm:block">
                {st.sub}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
