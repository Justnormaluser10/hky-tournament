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
  ArrowDown,
  Edit2,
  Users,
  Settings,
  Medal,
  Sparkles,
  Clock,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { formatMatchDate, formatMatchTime } from '@/lib/dateUtils';

export interface KnockoutMatchData {
  id: string;
  stage: string; // QUALIFIER_1, ELIMINATOR, QUALIFIER_2, HARDLINE, FINAL
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
    date?: string | Date;
    scheduledAt?: string | Date | null;
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
  onEditDate?: (match: KnockoutMatchData) => void;
}

export function KnockoutBracket({
  knockoutMatches,
  currentStage = 'KNOCKOUT',
  isPreview = false,
  isAdmin = false,
  onEditMatch,
  onEditTeams,
  onEditScore,
  onEditDate,
}: KnockoutBracketProps) {
  const q1 = knockoutMatches.find((k) => k.stage === 'QUALIFIER_1');
  const elim = knockoutMatches.find((k) => k.stage === 'ELIMINATOR');
  const q2 = knockoutMatches.find((k) => k.stage === 'QUALIFIER_2');
  const hardline = knockoutMatches.find((k) => k.stage === 'HARDLINE');
  const finalMatch = knockoutMatches.find((k) => k.stage === 'FINAL');

  // Fallback for legacy tournament data if present
  const semiFinals = knockoutMatches.filter((k) => k.stage === 'SEMI_FINALS');
  const quarterFinals = knockoutMatches.filter((k) => k.stage === 'QUARTER_FINALS');

  // Mobile navigation tab filter
  const [activeMobileTab, setActiveMobileTab] = useState<string>('ALL');

  const isWinner = (match: KnockoutMatchData['match'], teamId?: string | null) => {
    if (!teamId || match.status !== 'COMPLETED') return false;
    return match.winnerId === teamId;
  };

  const isLoser = (match: KnockoutMatchData['match'], teamId?: string | null) => {
    if (!teamId || match.status !== 'COMPLETED') return false;
    return match.winnerId !== null && match.winnerId !== teamId;
  };

  const getStageHeader = (stage: string) => {
    switch (stage) {
      case 'QUALIFIER_1':
        return {
          title: 'Qualifier 1',
          shortTitle: 'Q1',
          subtitle: 'League #1 vs League #2',
          badge: 'Winner ➔ Final • Loser ➔ Q2',
          glowClass: 'border-emerald-500/40 hover:border-emerald-400/60 shadow-emerald-950/20',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          numberClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
          accentColor: '#10b981',
          icon: <GitFork className="w-4 h-4 text-emerald-400" />,
        };
      case 'ELIMINATOR':
        return {
          title: 'Eliminator',
          shortTitle: 'Elim',
          subtitle: 'League #3 vs League #4',
          badge: 'Winner ➔ Q2 • Loser ➔ Hardline',
          glowClass: 'border-sky-500/40 hover:border-sky-400/60 shadow-sky-950/20',
          badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          numberClass: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
          accentColor: '#0ea5e9',
          icon: <Flame className="w-4 h-4 text-sky-400" />,
        };
      case 'QUALIFIER_2':
        return {
          title: 'Qualifier 2',
          shortTitle: 'Q2',
          subtitle: 'Loser Q1 vs Winner Eliminator',
          badge: 'Winner ➔ Final • Loser ➔ Hardline',
          glowClass: 'border-teal-500/40 hover:border-teal-400/60 shadow-teal-950/20',
          badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          numberClass: 'bg-teal-500/20 text-teal-300 border-teal-400/30',
          accentColor: '#14b8a6',
          icon: <GitFork className="w-4 h-4 text-teal-400" />,
        };
      case 'HARDLINE':
        return {
          title: 'Hardline (3rd Place Match)',
          shortTitle: '3rd Place',
          subtitle: 'Loser Eliminator vs Loser Qualifier 2',
          badge: '🥉 Winner ➔ 3rd Place • Loser ➔ 4th Place',
          glowClass: 'border-amber-600/50 hover:border-amber-500/70 shadow-amber-950/30',
          badgeClass: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
          numberClass: 'bg-amber-600/25 text-amber-300 border-amber-500/40',
          accentColor: '#d97706',
          icon: <Medal className="w-4 h-4 text-amber-400" />,
        };
      case 'FINAL':
        return {
          title: 'Grand Championship Final',
          shortTitle: 'Final',
          subtitle: 'Winner Qualifier 1 vs Winner Qualifier 2',
          badge: '🏆 Championship Match • Silver Stick Trophy',
          glowClass: 'border-amber-400/70 hover:border-amber-300/90 shadow-amber-950/60 ring-1 ring-amber-400/30',
          badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
          numberClass: 'bg-amber-500/30 text-amber-200 border-amber-400/50',
          accentColor: '#f59e0b',
          icon: <Trophy className="w-4 h-4 text-amber-400" />,
        };
      default:
        return {
          title: stage.replace('_', ' '),
          shortTitle: stage,
          subtitle: 'Playoff Match',
          badge: 'Knockout Stage',
          glowClass: 'border-white/15 hover:border-white/30',
          badgeClass: 'bg-slate-800 text-slate-300 border-white/10',
          numberClass: 'bg-slate-800 text-slate-300 border-white/10',
          accentColor: '#64748b',
          icon: <Shield className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const getAdvancementTag = (k: KnockoutMatchData, slot: 'A' | 'B', teamId?: string | null) => {
    if (!teamId || k.match.status !== 'COMPLETED') return null;
    const isWon = isWinner(k.match, teamId);
    const isLost = isLoser(k.match, teamId);

    if (k.stage === 'FINAL') {
      if (isWon) {
        return (
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/25 px-2 py-0.5 rounded border border-amber-400/50 shrink-0">
            CHAMPION 🏆
          </span>
        );
      }
      if (isLost) {
        return (
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
            RUNNER-UP 🥈
          </span>
        );
      }
    }

    if (k.stage === 'HARDLINE') {
      if (isWon) {
        return (
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-600/30 px-2 py-0.5 rounded border border-amber-500/50 shrink-0">
            3RD PLACE 🥉
          </span>
        );
      }
      if (isLost) {
        return (
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
            4TH PLACE
          </span>
        );
      }
    }

    if (k.stage === 'QUALIFIER_1') {
      if (isWon) {
        return (
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/25 px-2 py-0.5 rounded border border-emerald-500/40 shrink-0">
            TO FINAL ➔
          </span>
        );
      }
      if (isLost) {
        return (
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded border border-teal-500/30 shrink-0">
            TO Q2 ➔
          </span>
        );
      }
    }

    if (k.stage === 'ELIMINATOR') {
      if (isWon) {
        return (
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-teal-300 bg-teal-500/25 px-2 py-0.5 rounded border border-teal-500/40 shrink-0">
            TO Q2 ➔
          </span>
        );
      }
      if (isLost) {
        return (
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-600/20 px-1.5 py-0.5 rounded border border-amber-600/30 shrink-0">
            TO HARDLINE ➔
          </span>
        );
      }
    }

    if (k.stage === 'QUALIFIER_2') {
      if (isWon) {
        return (
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/25 px-2 py-0.5 rounded border border-amber-400/40 shrink-0">
            TO FINAL ➔
          </span>
        );
      }
      if (isLost) {
        return (
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-600/20 px-1.5 py-0.5 rounded border border-amber-600/30 shrink-0">
            TO HARDLINE ➔
          </span>
        );
      }
    }

    return null;
  };

  const renderTeamSlot = (
    k: KnockoutMatchData,
    slot: 'A' | 'B',
    isFinal: boolean,
    isHardline: boolean
  ) => {
    const m = k.match;
    const team = slot === 'A' ? m.teamA : m.teamB;
    const seed = slot === 'A' ? k.seedLabelA : k.seedLabelB;
    const score = slot === 'A' ? m.teamAScore : m.teamBScore;
    const isWon = isWinner(m, team?.id);
    const isLost = isLoser(m, team?.id);
    const isLive = m.status === 'LIVE';
    const isCompleted = m.status === 'COMPLETED';

    // Check if slot is explicitly designated as "NO TEAM"
    const isNoTeam =
      (!team && (seed === 'NO TEAM' || seed?.toUpperCase() === 'NO TEAM')) ||
      seed === 'NO TEAM';

    // CASE 1: NO TEAM (Clean black placeholder slot, preserves structure)
    if (isNoTeam) {
      return (
        <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-black/60 border border-dashed border-white/15 hover:border-white/30 transition group min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/90 border border-dashed border-slate-700/60 flex items-center justify-center text-xs text-slate-500 font-mono shrink-0">
              —
            </div>
            <div className="truncate min-w-0 flex-1">
              <span className="font-bold text-slate-400 text-xs sm:text-sm block tracking-wider uppercase truncate">
                NO TEAM
              </span>
              <span className="text-[10px] text-slate-600 font-mono block truncate">
                Unassigned Position
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-2 shrink-0">
            <span className="font-mono font-bold text-lg sm:text-xl text-slate-600">—</span>
            {isAdmin && onEditTeams && (
              <button
                type="button"
                onClick={() => onEditTeams(k, slot)}
                className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 border border-white/15 text-[10px] font-black uppercase tracking-wider transition"
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
      const advancementTag = getAdvancementTag(k, slot, team.id);

      return (
        <div
          className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl transition min-w-0 ${
            isWon
              ? isFinal
                ? 'bg-gradient-to-r from-amber-950/70 to-slate-900/90 border border-amber-400/60 shadow-md shadow-amber-950/40'
                : isHardline
                ? 'bg-gradient-to-r from-amber-950/60 to-slate-900/90 border border-amber-600/50 shadow-md shadow-amber-950/30'
                : 'bg-emerald-950/60 border border-emerald-500/50 shadow-md shadow-emerald-950/40'
              : isLost
              ? 'bg-slate-950/50 border border-white/5 opacity-75'
              : 'bg-slate-950/70 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="shrink-0">
              <TeamLogo
                name={team.name}
                shortName={team.shortName}
                logo={team.logo}
                primaryColor={team.primaryColor}
                size="sm"
              />
            </div>
            <div className="truncate min-w-0 flex-1">
              <span
                className={`font-black text-xs sm:text-sm block truncate ${
                  isWon
                    ? isFinal
                      ? 'text-amber-200'
                      : isHardline
                      ? 'text-amber-300'
                      : 'text-emerald-300'
                    : isLost
                    ? 'text-slate-400'
                    : 'text-white'
                }`}
              >
                {team.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {seed || (isPreview ? 'Projected Seed' : 'Qualified')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 pl-2 shrink-0">
            {advancementTag}
            <span
              className={`font-mono font-black text-xl sm:text-2xl min-w-[24px] text-right ${
                isWon ? 'text-white drop-shadow-sm' : isLost ? 'text-slate-500' : 'text-slate-200'
              }`}
            >
              {isCompleted || isLive ? score : '—'}
            </span>
            {isAdmin && onEditTeams && (
              <button
                type="button"
                onClick={() => onEditTeams(k, slot)}
                className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 border border-white/15 text-[10px] font-black uppercase tracking-wider transition"
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
      <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-950/40 border border-dashed border-white/10 hover:border-white/20 transition min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-mono shrink-0 border border-dashed ${
              isFinal
                ? 'bg-amber-950/40 text-amber-400 border-amber-500/40'
                : isHardline
                ? 'bg-amber-950/30 text-amber-500 border-amber-600/30'
                : 'bg-slate-900 text-slate-400 border-slate-700/60'
            }`}
          >
            {isFinal ? '🏆' : isHardline ? '🥉' : '🏑'}
          </div>
          <div className="truncate min-w-0 flex-1">
            <span className="font-semibold text-slate-400 text-xs sm:text-sm block truncate italic">
              {seed || 'TBD Qualifier'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block truncate">
              {isPreview ? 'Pending League Rank' : 'Awaiting Prior Result'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-2 shrink-0">
          <span className="font-mono font-bold text-lg sm:text-xl text-slate-600">—</span>
          {isAdmin && onEditTeams && (
            <button
              type="button"
              onClick={() => onEditTeams(k, slot)}
              className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 border border-white/15 text-[10px] font-black uppercase tracking-wider transition"
              title={`Assign Team for Slot ${slot}`}
            >
              EDIT
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderMatchCard = (k: KnockoutMatchData, isFinal = false, isHardline = false) => {
    const m = k.match;
    const isLive = m.status === 'LIVE';
    const isCompleted = m.status === 'COMPLETED';
    const headerInfo = getStageHeader(k.stage);

    const hasScheduledDate = Boolean(m.scheduledAt);
    const formattedDate = hasScheduledDate ? formatMatchDate(m.scheduledAt) : null;
    const formattedTime = hasScheduledDate && m.time ? formatMatchTime(m.time) : (m.time ? formatMatchTime(m.time) : null);

    return (
      <div
        key={k.id}
        className={`glass-card rounded-2xl overflow-hidden border transition-all duration-300 shadow-xl ${
          isFinal
            ? 'border-amber-400/70 shadow-2xl shadow-amber-950/50 bg-gradient-to-b from-[#181308]/95 via-[#0e1526]/95 to-[#070b14]/98 ring-1 ring-amber-400/25'
            : isHardline
            ? 'border-amber-600/50 shadow-xl shadow-amber-950/40 bg-gradient-to-b from-[#1c1208]/95 via-[#0e1422]/95 to-[#070b14]/98 ring-1 ring-amber-600/20'
            : `${headerInfo.glowClass} bg-gradient-to-b from-slate-900/95 via-[#0b1220]/95 to-[#060a12]/98`
        }`}
      >
        {/* Match Header Bar */}
        <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 bg-slate-950/95 border-b border-white/10 text-[11px] gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`font-mono font-black px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] border shrink-0 ${headerInfo.numberClass}`}
            >
              #{m.matchNumber}
            </span>
            <div className="flex items-center gap-1.5 truncate">
              {headerInfo.icon}
              <span className="font-black text-white uppercase truncate text-xs">
                {headerInfo.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPreview ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                PROJECTED
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                  isLive
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
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

        {/* Stage Progression Guidance Banner */}
        <div className="px-3.5 sm:px-4 py-1.5 bg-slate-950/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-1 text-[10px]">
          <span className="font-medium text-slate-400 truncate">{headerInfo.subtitle}</span>
          <span
            className={`font-bold truncate ${
              isFinal ? 'text-amber-300' : isHardline ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {headerInfo.badge}
          </span>
        </div>

        {/* Scheduled Date & Time Schedule Banner */}
        <div className="px-3.5 sm:px-4 py-2 bg-slate-950/80 border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              {hasScheduledDate ? (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-black text-xs sm:text-sm text-white uppercase tracking-wider font-mono">
                    {formattedDate}
                  </span>
                  {formattedTime && (
                    <span className="text-[11px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 inline shrink-0" />
                      {formattedTime}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic">
                  <span>{isAdmin ? 'Scheduled date: Not set' : 'Date TBA'}</span>
                </div>
              )}
            </div>
          </div>

          {isAdmin && onEditDate && (
            <button
              type="button"
              onClick={() => onEditDate(k)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 border shadow-sm ${
                hasScheduledDate
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30 hover:border-amber-400/60'
                  : 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/40 animate-pulse'
              }`}
              title={hasScheduledDate ? 'Change scheduled date and time' : 'Set match date and time'}
            >
              <Calendar className="w-3 h-3" />
              <span>{hasScheduledDate ? 'EDIT DATE' : 'SET DATE'}</span>
            </button>
          )}
        </div>

        {/* Teams and Scores Body */}
        <div className="p-3 sm:p-3.5 space-y-2">
          {renderTeamSlot(k, 'A', isFinal, isHardline)}
          <div className="relative flex items-center justify-center my-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <span className="relative px-2 bg-slate-950/80 text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono rounded">
              VS
            </span>
          </div>
          {renderTeamSlot(k, 'B', isFinal, isHardline)}
        </div>

        {/* Footer: Venue, Time, and Admin Inline Edit Controls */}
        <div className="px-3.5 sm:px-4 py-2 bg-slate-950/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] min-w-0">
            <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="shrink-0">{hasScheduledDate && formattedTime ? formattedTime : m.time}</span>
            <span>•</span>
            <span className="truncate max-w-[120px] sm:max-w-[200px]">{m.venue}</span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              {onEditDate && (
                <button
                  type="button"
                  onClick={() => onEditDate(k)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 text-sky-300 hover:bg-slate-800 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider transition"
                  title="Edit Date & Time"
                >
                  <Calendar className="w-3 h-3" />
                  <span>{hasScheduledDate ? 'DATE' : 'SET DATE'}</span>
                </button>
              )}
              {onEditTeams && (
                <button
                  type="button"
                  onClick={() => onEditTeams(k)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 text-amber-300 hover:bg-slate-800 border border-white/15 text-[10px] font-black uppercase tracking-wider transition"
                  title="Edit Teams (including NO TEAM option)"
                >
                  <Users className="w-3 h-3" />
                  <span>TEAMS</span>
                </button>
              )}
              {onEditScore && (
                <button
                  type="button"
                  onClick={() => onEditScore(k)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider transition shadow-sm"
                  title="Directly edit score & recalculate progression"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>SCORE</span>
                </button>
              )}
              {onEditMatch && (
                <button
                  type="button"
                  onClick={() => onEditMatch(k)}
                  className="p-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/10 transition"
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
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900/90 to-sky-950/70 border-2 border-sky-400/50 shadow-xl space-y-1.5">
          <div className="flex items-center gap-2 text-sky-300 font-black uppercase tracking-wider text-xs sm:text-sm">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>PLAYOFF BRACKET PREVIEW (PROJECTED FROM LIVE STANDINGS)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The top 4 teams below are dynamically projected from current live league standings.
            The knockout stage officially locks and activates once all single round-robin fixtures are finished.
          </p>
        </div>
      )}

      {/* 2. IPL + HARDLINE FORMAT EXPLAINER BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] p-2.5 sm:p-3 rounded-2xl bg-slate-950/80 border border-white/10">
        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
          <span className="font-black text-emerald-400 uppercase block text-[10px] tracking-wider">
            1. Qualifier 1
          </span>
          <span className="text-slate-300 block text-[10px] leading-tight">
            #1 vs #2 • Winner to Final, Loser to Q2
          </span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-sky-500/30">
          <span className="font-black text-sky-400 uppercase block text-[10px] tracking-wider">
            2. Eliminator
          </span>
          <span className="text-slate-300 block text-[10px] leading-tight">
            #3 vs #4 • Winner to Q2, Loser to Hardline
          </span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-teal-500/30">
          <span className="font-black text-teal-400 uppercase block text-[10px] tracking-wider">
            3. Qualifier 2
          </span>
          <span className="text-slate-300 block text-[10px] leading-tight">
            Loser Q1 vs Win Elim • Winner to Final, Loser to Hardline
          </span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-amber-600/40">
          <span className="font-black text-amber-400 uppercase block text-[10px] tracking-wider">
            4. Hardline 🥉
          </span>
          <span className="text-slate-300 block text-[10px] leading-tight">
            Loser Elim vs Loser Q2 • 3rd/4th Decider
          </span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-amber-400/50 col-span-2 md:col-span-1">
          <span className="font-black text-amber-300 uppercase block text-[10px] tracking-wider">
            5. Grand Final 🏆
          </span>
          <span className="text-slate-300 block text-[10px] leading-tight">
            Winner Q1 vs Winner Q2 • Champion
          </span>
        </div>
      </div>

      {/* 3. MOBILE-FIRST NAVIGATION TABS (Visible on screens < 768px) */}
      <div className="md:hidden flex flex-wrap items-center justify-center gap-1 p-1 rounded-xl bg-slate-950 border border-white/10 text-xs font-black uppercase">
        <button
          onClick={() => setActiveMobileTab('ALL')}
          className={`px-2.5 py-1.5 rounded-lg transition text-[11px] ${
            activeMobileTab === 'ALL'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        {q1 && (
          <button
            onClick={() => setActiveMobileTab('QUALIFIER_1')}
            className={`px-2.5 py-1.5 rounded-lg transition text-[11px] ${
              activeMobileTab === 'QUALIFIER_1'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Q1
          </button>
        )}
        {elim && (
          <button
            onClick={() => setActiveMobileTab('ELIMINATOR')}
            className={`px-2.5 py-1.5 rounded-lg transition text-[11px] ${
              activeMobileTab === 'ELIMINATOR'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Elim
          </button>
        )}
        {q2 && (
          <button
            onClick={() => setActiveMobileTab('QUALIFIER_2')}
            className={`px-2.5 py-1.5 rounded-lg transition text-[11px] ${
              activeMobileTab === 'QUALIFIER_2'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Q2
          </button>
        )}
        {hardline && (
          <button
            onClick={() => setActiveMobileTab('HARDLINE')}
            className={`px-2.5 py-1.5 rounded-lg transition text-[11px] ${
              activeMobileTab === 'HARDLINE'
                ? 'bg-amber-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hardline 🥉
          </button>
        )}
        {finalMatch && (
          <button
            onClick={() => setActiveMobileTab('FINAL')}
            className={`px-2.5 py-1.5 rounded-lg transition text-[11px] ${
              activeMobileTab === 'FINAL'
                ? 'bg-amber-500 text-black shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Final 🏆
          </button>
        )}
      </div>

      {/* 4. MOBILE-FIRST VERTICAL KNOCKOUT FLOW (Screens < 768px) */}
      <div className="md:hidden space-y-4">
        {/* Match 1: Qualifier 1 */}
        {(activeMobileTab === 'ALL' || activeMobileTab === 'QUALIFIER_1') && q1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5" /> Stage 1 — Qualifier 1
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Rank 1 vs Rank 2</span>
            </div>
            {renderMatchCard(q1)}
          </div>
        )}

        {/* Visual Connector: Q1 to Next Rounds */}
        {activeMobileTab === 'ALL' && q1 && (
          <div className="flex flex-col items-center justify-center py-0.5 text-[10px] text-slate-400">
            <div className="w-px h-3 bg-gradient-to-b from-emerald-500 to-transparent" />
            <div className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-[9px] font-mono text-slate-400 my-0.5">
              Winner ➔ Final • Loser ➔ Q2
            </div>
            <div className="w-px h-3 bg-gradient-to-b from-transparent to-sky-500" />
          </div>
        )}

        {/* Match 2: Eliminator */}
        {(activeMobileTab === 'ALL' || activeMobileTab === 'ELIMINATOR') && elim && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Stage 2 — Eliminator
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Rank 3 vs Rank 4</span>
            </div>
            {renderMatchCard(elim)}
          </div>
        )}

        {/* Visual Connector: Eliminator to Q2 & Hardline */}
        {activeMobileTab === 'ALL' && elim && (
          <div className="flex flex-col items-center justify-center py-0.5 text-[10px] text-slate-400">
            <div className="w-px h-3 bg-gradient-to-b from-sky-500 to-transparent" />
            <div className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-[9px] font-mono text-slate-400 my-0.5">
              Winner ➔ Q2 • Loser ➔ Hardline
            </div>
            <div className="w-px h-3 bg-gradient-to-b from-transparent to-teal-500" />
          </div>
        )}

        {/* Match 3: Qualifier 2 */}
        {(activeMobileTab === 'ALL' || activeMobileTab === 'QUALIFIER_2') && q2 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5" /> Stage 3 — Qualifier 2
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Semifinal Decider</span>
            </div>
            {renderMatchCard(q2)}
          </div>
        )}

        {/* Visual Connector: Q2 into Hardline & Final */}
        {activeMobileTab === 'ALL' && q2 && (
          <div className="flex flex-col items-center justify-center py-0.5 text-[10px] text-slate-400">
            <div className="w-px h-3 bg-gradient-to-b from-teal-500 to-transparent" />
            <div className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-[9px] font-mono text-slate-400 my-0.5">
              Winner ➔ Final • Loser ➔ Hardline
            </div>
            <div className="w-px h-3 bg-gradient-to-b from-transparent to-amber-600" />
          </div>
        )}

        {/* Match 4: Hardline — 3rd Place Match */}
        {(activeMobileTab === 'ALL' || activeMobileTab === 'HARDLINE') && hardline && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5 text-amber-400" /> Stage 4 — Hardline (3rd Place Match)
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono font-bold">
                Bronze Decider
              </span>
            </div>
            {renderMatchCard(hardline, false, true)}
          </div>
        )}

        {/* Visual Connector: Hardline to Final */}
        {activeMobileTab === 'ALL' && hardline && (
          <div className="flex flex-col items-center justify-center py-0.5 text-[10px] text-slate-400">
            <div className="w-px h-3 bg-gradient-to-b from-amber-600 to-transparent" />
            <div className="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-400/30 text-[9px] font-mono text-amber-300 font-bold my-0.5">
              Next: Grand Championship Final 🏆
            </div>
            <div className="w-px h-3 bg-gradient-to-b from-transparent to-amber-400" />
          </div>
        )}

        {/* Match 5: Grand Championship Final */}
        {(activeMobileTab === 'ALL' || activeMobileTab === 'FINAL') && finalMatch && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> Stage 5 — Grand Championship Final
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-bold">
                Title Championship
              </span>
            </div>
            {renderMatchCard(finalMatch, true, false)}
          </div>
        )}

        {/* Fallback for quarter finals / semi finals if legacy tournament */}
        {quarterFinals.length > 0 && quarterFinals.map((k) => renderMatchCard(k))}
        {semiFinals.length > 0 && semiFinals.map((k) => renderMatchCard(k))}
      </div>

      {/* 5. DESKTOP & TABLET DUAL-BRANCH BRACKET ARCHITECTURE (Screens >= 768px) */}
      <div className="hidden md:grid grid-cols-3 gap-6 lg:gap-8 items-start py-2">
        {/* ============================================================
            COLUMN 1: ROUND 1 (Qualifier 1 [Top] & Eliminator [Bottom])
           ============================================================ */}
        <div className="space-y-8">
          {/* Qualifier 1 */}
          <div className="space-y-2">
            <div className="border-b border-emerald-500/30 pb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-emerald-400" /> Qualifier 1
              </span>
              <span className="text-[10px] font-mono text-emerald-300">#1 vs #2</span>
            </div>
            {q1 ? (
              renderMatchCard(q1)
            ) : (
              <div className="glass-card rounded-2xl p-6 text-center text-xs text-slate-500 border border-white/5">
                TBD Qualifier 1
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
              <span className="text-emerald-400 font-bold">Winner ➔ Final</span>
              <span className="text-teal-400">Loser ➔ Q2</span>
            </div>
          </div>

          {/* Eliminator */}
          <div className="space-y-2">
            <div className="border-b border-sky-500/30 pb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-sky-400" /> Eliminator
              </span>
              <span className="text-[10px] font-mono text-sky-300">#3 vs #4</span>
            </div>
            {elim ? (
              renderMatchCard(elim)
            ) : (
              <div className="glass-card rounded-2xl p-6 text-center text-xs text-slate-500 border border-white/5">
                TBD Eliminator
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
              <span className="text-teal-400 font-bold">Winner ➔ Q2</span>
              <span className="text-amber-400">Loser ➔ Hardline</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            COLUMN 2: QUALIFIER 2 (Semifinal Decider in Middle)
           ============================================================ */}
        <div className="space-y-4 my-auto pt-6">
          <div className="border-b border-teal-500/30 pb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-teal-400" /> Qualifier 2
            </span>
            <span className="text-[10px] font-mono text-teal-300">Semifinal Decider</span>
          </div>

          <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/20 text-[10px] text-teal-200/90 text-center font-mono">
            Loser Q1 vs Winner Eliminator
          </div>

          {q2 ? (
            renderMatchCard(q2)
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500 border border-white/5">
              <Shield className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <span className="text-xs font-bold block">Awaiting Q1 & Eliminator</span>
            </div>
          )}

          {/* Dual Direction Exit Indicator */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5 text-[10px] font-mono">
            <div className="flex items-center justify-between text-amber-300">
              <span>Winner advances:</span>
              <span className="font-bold flex items-center gap-1">
                Grand Final 🏆 <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="flex items-center justify-between text-amber-400">
              <span>Loser advances:</span>
              <span className="font-bold flex items-center gap-1">
                Hardline 🥉 <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================
            COLUMN 3: THE FINALS (Grand Final [Top] & Hardline [Bottom])
           ============================================================ */}
        <div className="space-y-8">
          {/* Top: Grand Championship Final */}
          <div className="space-y-2">
            <div className="border-b border-amber-400/50 pb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> Grand Final
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-bold">1st / 2nd Place</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[10px] text-amber-200 text-center font-bold font-mono">
              Winner Q1 vs Winner Q2 ➔ Champion 🏆
            </div>

            {finalMatch ? (
              renderMatchCard(finalMatch, true, false)
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center text-slate-500 border border-white/5">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <span className="text-xs font-bold block">Finalists Pending Playoff Rounds</span>
              </div>
            )}
          </div>

          {/* Bottom: Hardline — 3rd Place Match */}
          <div className="space-y-2">
            <div className="border-b border-amber-600/40 pb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-amber-400" /> Hardline Match
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">3rd / 4th Place</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-950/25 border border-amber-600/30 text-[10px] text-amber-300 text-center font-bold font-mono">
              Loser Eliminator vs Loser Q2 ➔ 3rd Place 🥉
            </div>

            {hardline ? (
              renderMatchCard(hardline, false, true)
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center text-slate-500 border border-white/5">
                <Medal className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <span className="text-xs font-bold block">Teams Pending Earlier Rounds</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
