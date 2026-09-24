'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  GitFork,
  Calendar,
  Flame,
  Shield,
  CheckCircle,
  ChevronRight,
  Award,
  Lock,
  ArrowRight,
  Edit2,
  Users,
  Settings,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';

export interface KnockoutMatchData {
  id: string;
  stage: string; // QUALIFIER_1, ELIMINATOR, QUALIFIER_2, FINAL
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
  isPreview?: boolean;
  isAdmin?: boolean;
  onEditMatch?: (match: KnockoutMatchData) => void;
  onEditTeams?: (match: KnockoutMatchData, slot?: 'A' | 'B') => void;
  onEditScore?: (match: KnockoutMatchData) => void;
}

export function KnockoutBracket({
  knockoutMatches,
  currentStage = 'KNOCKOUT',
  isPreview = false,
  isAdmin = false,
  onEditMatch,
  onEditTeams,
  onEditScore,
}: KnockoutBracketProps) {
  const q1 = knockoutMatches.find((k) => k.stage === 'QUALIFIER_1');
  const elim = knockoutMatches.find((k) => k.stage === 'ELIMINATOR');
  const q2 = knockoutMatches.find((k) => k.stage === 'QUALIFIER_2');
  const finalMatch = knockoutMatches.find((k) => k.stage === 'FINAL');

  // Fallback for legacy data if present
  const semiFinals = knockoutMatches.filter((k) => k.stage === 'SEMI_FINALS');
  const quarterFinals = knockoutMatches.filter((k) => k.stage === 'QUARTER_FINALS');

  // Mobile navigation tabs
  const [activeMobileTab, setActiveMobileTab] = useState<string>('ALL');

  const isWinner = (match: KnockoutMatchData['match'], teamId?: string | null) => {
    if (!teamId || match.status !== 'COMPLETED') return false;
    return match.winnerId === teamId;
  };

  const getStageHeader = (stage: string) => {
    switch (stage) {
      case 'QUALIFIER_1':
        return {
          title: 'Qualifier 1',
          subtitle: 'League #1 vs League #2',
          badge: 'Winner ➔ Final • Loser ➔ Qualifier 2',
          glowClass: 'border-emerald-500/40 hover:border-emerald-400/70',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          numberClass: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40',
        };
      case 'ELIMINATOR':
        return {
          title: 'Eliminator',
          subtitle: 'League #3 vs League #4',
          badge: 'Winner ➔ Qualifier 2 • Loser ✖ Eliminated',
          glowClass: 'border-amber-500/40 hover:border-amber-400/70',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          numberClass: 'bg-amber-500/25 text-amber-300 border-amber-400/40',
        };
      case 'QUALIFIER_2':
        return {
          title: 'Qualifier 2',
          subtitle: 'Loser Q1 vs Winner Eliminator',
          badge: 'Winner ➔ Final • Loser ✖ Eliminated',
          glowClass: 'border-teal-500/40 hover:border-teal-400/70',
          badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          numberClass: 'bg-teal-500/25 text-teal-300 border-teal-400/40',
        };
      case 'FINAL':
        return {
          title: 'Grand Championship Final',
          subtitle: 'Winner Q1 vs Winner Q2',
          badge: '🏆 Championship Match • Silver Stick Trophy',
          glowClass: 'border-amber-400/60 hover:border-amber-300/80 shadow-amber-950/40',
          badgeClass: 'bg-amber-500/25 text-amber-200 border-amber-400/50',
          numberClass: 'bg-amber-500/30 text-amber-200 border-amber-400/50',
        };
      default:
        return {
          title: stage.replace('_', ' '),
          subtitle: 'Playoff Match',
          badge: 'Knockout Stage',
          glowClass: 'border-white/15 hover:border-white/30',
          badgeClass: 'bg-slate-800 text-slate-300 border-white/10',
          numberClass: 'bg-slate-800 text-slate-300 border-white/10',
        };
    }
  };

  const renderTeamSlot = (k: KnockoutMatchData, slot: 'A' | 'B', isFinal: boolean) => {
    const m = k.match;
    const team = slot === 'A' ? m.teamA : m.teamB;
    const seed = slot === 'A' ? k.seedLabelA : k.seedLabelB;
    const score = slot === 'A' ? m.teamAScore : m.teamBScore;
    const isWon = isWinner(m, team?.id);
    const isLive = m.status === 'LIVE';
    const isCompleted = m.status === 'COMPLETED';

    // Check if slot is explicitly designated as "NO TEAM"
    const isNoTeam =
      (!team && (seed === 'NO TEAM' || seed?.toUpperCase() === 'NO TEAM')) ||
      seed === 'NO TEAM';

    // CASE 1: NO TEAM (Clean black/empty slot, preserves bracket structure)
    if (isNoTeam) {
      return (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-dashed border-white/15 hover:border-white/30 transition group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-black/90 border border-dashed border-slate-700/60 flex items-center justify-center text-xs text-slate-500 font-mono shrink-0">
              —
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-400 text-xs sm:text-sm block tracking-wider uppercase">
                NO TEAM
              </span>
              <span className="text-[10px] text-slate-600 font-mono block">
                Unassigned Position
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-3 shrink-0">
            <span className="font-mono font-bold text-xl text-slate-600">—</span>
            {isAdmin && onEditTeams && (
              <button
                type="button"
                onClick={() => onEditTeams(k, slot)}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-white/15 text-[10px] font-black uppercase tracking-wider transition"
                title={`Assign team for Slot ${slot}`}
              >
                EDIT
              </button>
            )}
          </div>
        </div>
      );
    }

    // CASE 2: REAL TEAM ASSIGNED
    if (team) {
      return (
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl transition ${
            isWon
              ? 'bg-emerald-950/60 border border-emerald-500/60 shadow-md shadow-emerald-950/40'
              : 'bg-slate-950/60 border border-white/10 hover:border-white/25'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <TeamLogo
              name={team.name}
              shortName={team.shortName}
              logo={team.logo}
              primaryColor={team.primaryColor}
              size="sm"
            />
            <div className="truncate">
              <span
                className={`font-black text-xs sm:text-sm block truncate ${
                  isWon ? 'text-emerald-300' : 'text-white'
                }`}
              >
                {team.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {seed || (isPreview ? 'Projected Seed' : 'Qualified')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-3 shrink-0">
            {isWon && (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/25 px-2 py-0.5 rounded border border-emerald-500/40">
                {isFinal ? 'CHAMPION 🏆' : 'ADVANCES'}
              </span>
            )}
            <span className="font-mono font-black text-2xl text-white">
              {isCompleted || isLive ? score : '—'}
            </span>
            {isAdmin && onEditTeams && (
              <button
                type="button"
                onClick={() => onEditTeams(k, slot)}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-white/15 text-[10px] font-black uppercase tracking-wider transition"
                title={`Change Team ${slot}`}
              >
                EDIT
              </button>
            )}
          </div>
        </div>
      );
    }

    // CASE 3: TBD QUALIFIER (Awaiting prior match result or league rank)
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-dashed border-white/10 hover:border-white/25 transition">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-dashed border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono shrink-0">
            {isFinal ? '🏆' : '🏑'}
          </div>
          <div className="truncate">
            <span className="font-semibold text-slate-400 text-xs sm:text-sm block truncate italic">
              {seed || 'TBD Qualifier'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              {isPreview ? 'Pending League Rank' : 'Awaiting Prior Result'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-3 shrink-0">
          <span className="font-mono font-bold text-xl text-slate-600">—</span>
          {isAdmin && onEditTeams && (
            <button
              type="button"
              onClick={() => onEditTeams(k, slot)}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-white/15 text-[10px] font-black uppercase tracking-wider transition"
              title={`Assign Team for Slot ${slot}`}
            >
              EDIT
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderMatchCard = (k: KnockoutMatchData, isFinal = false) => {
    const m = k.match;
    const isLive = m.status === 'LIVE';
    const isCompleted = m.status === 'COMPLETED';
    const headerInfo = getStageHeader(k.stage);

    return (
      <div
        key={k.id}
        className={`glass-card rounded-2xl overflow-hidden border transition-all duration-200 shadow-xl ${
          isFinal
            ? 'border-amber-400/60 shadow-2xl shadow-amber-950/50 bg-gradient-to-b from-slate-900 via-[#0d1627] to-[#070c17]'
            : `${headerInfo.glowClass} bg-slate-900/90`
        }`}
      >
        {/* Match Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/95 border-b border-white/10 text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`font-mono font-black px-2 py-0.5 rounded border shrink-0 ${headerInfo.numberClass}`}
            >
              Match #{m.matchNumber}
            </span>
            <span className="font-bold text-white uppercase truncate">
              {headerInfo.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPreview ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                PROJECTED
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isLive
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 border border-white/10'
                }`}
              >
                {m.status}
              </span>
            )}
          </div>
        </div>

        {/* Stage Progression Guidance Pill */}
        <div className="px-4 py-1.5 bg-slate-950/40 border-b border-white/5 flex items-center justify-between text-[10px] text-slate-300">
          <span className="font-medium text-slate-400">{headerInfo.subtitle}</span>
          <span className="font-bold text-amber-300/90 truncate max-w-[200px]">
            {headerInfo.badge}
          </span>
        </div>

        {/* Teams and Scores */}
        <div className="p-3.5 sm:p-4 space-y-2.5">
          {renderTeamSlot(k, 'A', isFinal)}
          {renderTeamSlot(k, 'B', isFinal)}
        </div>

        {/* Footer: Venue, Time, and Admin Inline Edit Controls */}
        <div className="px-4 py-2.5 bg-slate-950/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Calendar className="w-3 h-3 text-emerald-400" />
            <span>{m.time}</span>
            <span>•</span>
            <span className="truncate max-w-[120px] sm:max-w-none">{m.venue}</span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1.5 ml-auto">
              {onEditTeams && (
                <button
                  type="button"
                  onClick={() => onEditTeams(k)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 hover:bg-slate-800 border border-white/15 text-[10px] font-black uppercase tracking-wider transition"
                  title="Edit Teams (including NO TEAM option)"
                >
                  <Users className="w-3 h-3" />
                  <span>EDIT TEAMS</span>
                </button>
              )}
              {onEditScore && (
                <button
                  type="button"
                  onClick={() => onEditScore(k)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider transition shadow-sm"
                  title="Directly edit score & recalculate progression"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>EDIT SCORE</span>
                </button>
              )}
              {onEditMatch && (
                <button
                  type="button"
                  onClick={() => onEditMatch(k)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider transition"
                  title="Full match settings"
                >
                  <Settings className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
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
      {/* 1. PREVIEW BANNER (Visible during league stage on public pages) */}
      {isPreview && !isAdmin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900/90 to-sky-950/70 border-2 border-sky-400/50 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-sky-300 font-black uppercase tracking-wider text-xs sm:text-sm">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>PLAYOFF BRACKET PREVIEW (PROJECTED FROM LIVE STANDINGS)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The top 4 teams below are dynamically projected from the current live league standings.
            The knockout stage officially locks and activates once all single round-robin fixtures are finished.
          </p>
        </div>
      )}

      {/* 2. IPL FORMAT EXPLAINER BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px] p-3 rounded-2xl bg-slate-950/80 border border-white/10">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
          <span className="font-black text-emerald-400 uppercase block text-[10px] tracking-wider">1. Qualifier 1</span>
          <span className="text-slate-300">#1 vs #2 • Winner directly to Final</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30">
          <span className="font-black text-amber-400 uppercase block text-[10px] tracking-wider">2. Eliminator</span>
          <span className="text-slate-300">#3 vs #4 • Winner to Q2, Loser out</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-teal-500/30">
          <span className="font-black text-teal-400 uppercase block text-[10px] tracking-wider">3. Qualifier 2</span>
          <span className="text-slate-300">Loser Q1 vs Winner Elim • Winner to Final</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-400/50">
          <span className="font-black text-amber-300 uppercase block text-[10px] tracking-wider">4. Grand Final</span>
          <span className="text-slate-300">Winner Q1 vs Winner Q2 🏆</span>
        </div>
      </div>

      {/* 3. MOBILE FILTER TABS */}
      <div className="md:hidden flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-black uppercase">
        <button
          onClick={() => setActiveMobileTab('ALL')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeMobileTab === 'ALL'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Stages
        </button>
        {q1 && (
          <button
            onClick={() => setActiveMobileTab('QUALIFIER_1')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeMobileTab === 'QUALIFIER_1'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Qualifier 1
          </button>
        )}
        {elim && (
          <button
            onClick={() => setActiveMobileTab('ELIMINATOR')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeMobileTab === 'ELIMINATOR'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Eliminator
          </button>
        )}
        {q2 && (
          <button
            onClick={() => setActiveMobileTab('QUALIFIER_2')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeMobileTab === 'QUALIFIER_2'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Qualifier 2
          </button>
        )}
        {finalMatch && (
          <button
            onClick={() => setActiveMobileTab('FINAL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeMobileTab === 'FINAL'
                ? 'bg-amber-500 text-black shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Final 🏆
          </button>
        )}
      </div>

      {/* 4. MOBILE VERTICAL STACK */}
      <div className="md:hidden space-y-4">
        {(activeMobileTab === 'ALL' || activeMobileTab === 'QUALIFIER_1') && q1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                Stage 1 — Qualifier 1
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Rank 1 vs Rank 2</span>
            </div>
            {renderMatchCard(q1)}
          </div>
        )}

        {(activeMobileTab === 'ALL' || activeMobileTab === 'ELIMINATOR') && elim && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Stage 2 — Eliminator
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Rank 3 vs Rank 4</span>
            </div>
            {renderMatchCard(elim)}
          </div>
        )}

        {(activeMobileTab === 'ALL' || activeMobileTab === 'QUALIFIER_2') && q2 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-teal-400 tracking-wider">
                Stage 3 — Qualifier 2
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Semifinal Playoff</span>
            </div>
            {renderMatchCard(q2)}
          </div>
        )}

        {(activeMobileTab === 'ALL' || activeMobileTab === 'FINAL') && finalMatch && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Grand Championship Final
              </span>
              <span className="text-[10px] text-amber-300 font-mono">Title Decider</span>
            </div>
            {renderMatchCard(finalMatch, true)}
          </div>
        )}

        {/* Fallback for quarter finals / semi finals if legacy tournament */}
        {quarterFinals.length > 0 && quarterFinals.map((k) => renderMatchCard(k))}
        {semiFinals.length > 0 && semiFinals.map((k) => renderMatchCard(k))}
      </div>

      {/* 5. DESKTOP IPL BRACKET ARCHITECTURE */}
      <div className="hidden md:grid grid-cols-3 gap-6 lg:gap-8 items-center py-4">
        {/* Column 1: Initial Playoff Round (Qualifier 1 & Eliminator) */}
        <div className="space-y-6">
          {/* Qualifier 1 */}
          <div className="space-y-2">
            <div className="border-b border-emerald-500/30 pb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-emerald-400" /> Qualifier 1
              </span>
              <span className="text-[10px] font-mono text-emerald-300">#1 vs #2</span>
            </div>
            {q1 ? renderMatchCard(q1) : <div className="p-6 rounded-2xl bg-slate-900/60 text-center text-xs text-slate-500">TBD</div>}
          </div>

          {/* Eliminator */}
          <div className="space-y-2">
            <div className="border-b border-amber-500/30 pb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> Eliminator
              </span>
              <span className="text-[10px] font-mono text-amber-300">#3 vs #4</span>
            </div>
            {elim ? renderMatchCard(elim) : <div className="p-6 rounded-2xl bg-slate-900/60 text-center text-xs text-slate-500">TBD</div>}
          </div>
        </div>

        {/* Column 2: Qualifier 2 (Second Chance Decider) */}
        <div className="space-y-4">
          <div className="border-b border-teal-500/30 pb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-teal-400" /> Qualifier 2
            </span>
            <span className="text-[10px] font-mono text-teal-300">Semifinal Decider</span>
          </div>

          <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/20 text-[11px] text-teal-200/90 text-center">
            Loser Q1 vs Winner Eliminator ➔ Winner to Final
          </div>

          {q2 ? renderMatchCard(q2) : (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500 border border-white/5">
              <Shield className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <span className="text-xs font-bold block">Awaiting Q1 & Eliminator</span>
            </div>
          )}
        </div>

        {/* Column 3: Grand Championship Final */}
        <div className="space-y-4">
          <div className="border-b border-amber-500/40 pb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" /> Grand Final
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">Championship</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200 text-center font-bold">
            Winner Q1 vs Winner Q2 ➔ Champion 🏆
          </div>

          {finalMatch ? (
            renderMatchCard(finalMatch, true)
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500 border border-white/5">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <span className="text-xs font-bold block">Finalists Pending Playoff Rounds</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
