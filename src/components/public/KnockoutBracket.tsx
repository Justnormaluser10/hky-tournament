'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, GitFork, Calendar, Flame, Shield, CheckCircle, ChevronRight, Award } from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';

export interface KnockoutMatchData {
  id: string;
  stage: string; // QUARTER_FINALS, SEMI_FINALS, FINAL
  bracketOrder: number;
  seedLabelA: string | null;
  seedLabelB: string | null;
  match: {
    id: string;
    matchNumber: number;
    teamAScore: number;
    teamBScore: number;
    time: string;
    venue: string;
    status: string; // UPCOMING, LIVE, COMPLETED
    winnerId: string | null;
    teamA?: {
      id: string;
      name: string;
      shortName: string;
      logo?: string | null;
      primaryColor: string;
    } | null;
    teamB?: {
      id: string;
      name: string;
      shortName: string;
      logo?: string | null;
      primaryColor: string;
    } | null;
    events?: Array<{
      id: string;
      minute: number;
      type: string;
      player?: { name: string; jerseyNumber: number } | null;
      team: { shortName: string };
    }>;
  };
}

interface KnockoutBracketProps {
  knockoutMatches: KnockoutMatchData[];
  currentStage?: string;
}

export function KnockoutBracket({ knockoutMatches, currentStage = 'KNOCKOUT' }: KnockoutBracketProps) {
  const quarterFinals = knockoutMatches.filter((k) => k.stage === 'QUARTER_FINALS');
  const semiFinals = knockoutMatches.filter((k) => k.stage === 'SEMI_FINALS');
  const finalMatch = knockoutMatches.find((k) => k.stage === 'FINAL');

  // Determine active tab for mobile view
  const availableRounds: string[] = [];
  if (quarterFinals.length > 0) availableRounds.push('QUARTER_FINALS');
  if (semiFinals.length > 0) availableRounds.push('SEMI_FINALS');
  if (finalMatch) availableRounds.push('FINAL');

  const defaultTab =
    currentStage === 'FINAL' || currentStage === 'COMPLETED'
      ? 'FINAL'
      : semiFinals.length > 0
      ? 'SEMI_FINALS'
      : availableRounds[0] || 'FINAL';

  const [activeMobileRound, setActiveMobileRound] = useState<string>(defaultTab);

  const getRoundLabel = (stage: string) => {
    switch (stage) {
      case 'QUARTER_FINALS':
        return 'Quarter Finals';
      case 'SEMI_FINALS':
        return 'Semi Finals';
      case 'FINAL':
        return 'Grand Championship Final';
      default:
        return stage;
    }
  };

  const isWinner = (match: KnockoutMatchData['match'], teamId?: string | null) => {
    if (!teamId || match.status !== 'COMPLETED') return false;
    return match.winnerId === teamId;
  };

  const renderMatchCard = (k: KnockoutMatchData, isFinal = false) => {
    const m = k.match;
    const teamAWon = isWinner(m, m.teamA?.id);
    const teamBWon = isWinner(m, m.teamB?.id);
    const isLive = m.status === 'LIVE';
    const isCompleted = m.status === 'COMPLETED';

    return (
      <div
        key={k.id}
        className={`glass-card rounded-2xl overflow-hidden border transition-all ${
          isFinal
            ? 'border-amber-500/50 shadow-xl shadow-amber-950/20 bg-gradient-to-b from-slate-900 via-[#0b1320] to-[#070b14]'
            : 'border-white/10 hover:border-emerald-500/40'
        }`}
      >
        {/* Match Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-white/5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-amber-400">
              Match #{m.matchNumber}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-semibold truncate max-w-[140px]">
              {isFinal ? '🏆 Championship Match' : getRoundLabel(k.stage)}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isLive
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                : isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {m.status}
          </span>
        </div>

        {/* Teams and Scores */}
        <div className="p-4 space-y-3">
          {/* Team A */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl transition ${
              teamAWon
                ? 'bg-emerald-950/40 border border-emerald-500/40'
                : 'bg-slate-950/40 border border-white/5'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {m.teamA ? (
                <TeamLogo
                  name={m.teamA.name}
                  shortName={m.teamA.shortName}
                  logo={m.teamA.logo}
                  primaryColor={m.teamA.primaryColor}
                  size="sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-dashed border-amber-500/40 flex items-center justify-center text-xs text-amber-400 font-mono shadow-inner shrink-0">
                  🏆
                </div>
              )}
              <div className="truncate">
                <span
                  className={`font-black text-xs sm:text-sm block truncate ${
                    m.teamA
                      ? teamAWon
                        ? 'text-emerald-300'
                        : 'text-white'
                      : 'text-slate-300 font-semibold'
                  }`}
                >
                  {m.teamA?.name || k.seedLabelA || 'TBD Qualifier'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {m.teamA ? k.seedLabelA || 'Qualifier' : 'Awaiting Match Result'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-3 shrink-0">
              {teamAWon && (
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  {isFinal ? 'CHAMPION' : 'ADVANCES'}
                </span>
              )}
              <span className="font-mono font-black text-2xl text-white">
                {isCompleted ? m.teamAScore : '—'}
              </span>
            </div>
          </div>

          {/* Team B */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl transition ${
              teamBWon
                ? 'bg-emerald-950/40 border border-emerald-500/40'
                : 'bg-slate-950/40 border border-white/5'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {m.teamB ? (
                <TeamLogo
                  name={m.teamB.name}
                  shortName={m.teamB.shortName}
                  logo={m.teamB.logo}
                  primaryColor={m.teamB.primaryColor}
                  size="sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-dashed border-amber-500/40 flex items-center justify-center text-xs text-amber-400 font-mono shadow-inner shrink-0">
                  🏆
                </div>
              )}
              <div className="truncate">
                <span
                  className={`font-black text-xs sm:text-sm block truncate ${
                    m.teamB
                      ? teamBWon
                        ? 'text-emerald-300'
                        : 'text-white'
                      : 'text-slate-300 font-semibold'
                  }`}
                >
                  {m.teamB?.name || k.seedLabelB || 'TBD Qualifier'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {m.teamB ? k.seedLabelB || 'Qualifier' : 'Awaiting Match Result'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-3 shrink-0">
              {teamBWon && (
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  {isFinal ? 'CHAMPION' : 'ADVANCES'}
                </span>
              )}
              <span className="font-mono font-black text-2xl text-white">
                {isCompleted ? m.teamBScore : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Venue & Time */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-400" />
            {m.time}
          </span>
          <span className="truncate max-w-[160px]">{m.venue}</span>
        </div>
      </div>
    );
  };

  if (knockoutMatches.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 text-2xl">
          🏑
        </div>
        <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">
          Playoffs Pending League Completion
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          The knockout tournament bracket will be seeded automatically once all single round-robin league matches are completed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Round Filter Switcher */}
      <div className="md:hidden flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-white/10">
        {availableRounds.map((round) => (
          <button
            key={round}
            onClick={() => setActiveMobileRound(round)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
              activeMobileRound === round
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {round === 'QUARTER_FINALS'
              ? 'Quarters'
              : round === 'SEMI_FINALS'
              ? 'Semis'
              : 'Final'}
          </button>
        ))}
      </div>

      {/* MOBILE VERTICAL STACK */}
      <div className="md:hidden space-y-4">
        {activeMobileRound === 'QUARTER_FINALS' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                Quarter-Final Matchups
              </h4>
            </div>
            {quarterFinals.map((k) => renderMatchCard(k))}
          </div>
        )}

        {activeMobileRound === 'SEMI_FINALS' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                Semi-Final Matchups
              </h4>
            </div>
            {semiFinals.map((k) => renderMatchCard(k))}
          </div>
        )}

        {activeMobileRound === 'FINAL' && finalMatch && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Grand Championship Final
              </h4>
            </div>
            {renderMatchCard(finalMatch, true)}
          </div>
        )}
      </div>

      {/* DESKTOP INTEGRATED BRACKET GRID */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center py-4">
        {/* Semi-Finals Column */}
        {semiFinals.length > 0 && (
          <div className="space-y-6">
            <div className="border-b border-emerald-500/30 pb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-amber-400" /> Semi-Finals
              </span>
              <span className="text-[10px] font-mono text-slate-500">Best of 4</span>
            </div>

            <div className="space-y-6">
              {semiFinals.map((k) => renderMatchCard(k))}
            </div>
          </div>
        )}

        {/* Connective Stage Arrow / Indicator */}
        <div className="space-y-6">
          <div className="border-b border-amber-500/30 pb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" /> Championship Decider
            </span>
            <span className="text-[10px] font-mono text-amber-400">Grand Final</span>
          </div>

          {finalMatch ? (
            renderMatchCard(finalMatch, true)
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500 border border-white/5">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <span className="text-xs font-bold block">Finalists Pending Semi-Finals</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
