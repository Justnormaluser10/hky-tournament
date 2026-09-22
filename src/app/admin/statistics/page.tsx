'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Shield,
  Flame,
  Award,
  Edit2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Sparkles,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { SportsAvatar } from '@/components/ui/SportsAvatar';

interface ScorerRow {
  rank: number;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  position: string;
  photo: string | null;
  isCaptain: boolean;
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamLogo: string | null;
  primaryColor: string;
  goals: number;
  matchesPlayed: number;
  isOverridden?: boolean;
}

interface GoalkeeperRow {
  rank: number;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  photo: string | null;
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamLogo: string | null;
  primaryColor: string;
  matches: number;
  goalsConceded: number;
  cleanSheets: number;
  goalsPerMatch: number;
  isOverridden?: boolean;
}

interface AwardWinnerRow {
  rank: number;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  position: string;
  photo: string | null;
  isCaptain: boolean;
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamLogo: string | null;
  primaryColor: string;
  awardsCount: number;
  matchesPlayed: number;
  isOverridden?: boolean;
}

interface PlayerOption {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  team: {
    id: string;
    name: string;
    shortName: string;
  };
}

export default function AdminStatisticsPage() {
  const [activeTab, setActiveTab] = useState<'SCORER' | 'GOALKEEPER' | 'DEFENDER' | 'MOTM'>('SCORER');
  const [topScorers, setTopScorers] = useState<ScorerRow[]>([]);
  const [topGoalkeepers, setTopGoalkeepers] = useState<GoalkeeperRow[]>([]);
  const [bestDefenders, setBestDefenders] = useState<AwardWinnerRow[]>([]);
  const [manOfTheMatches, setManOfTheMatches] = useState<AwardWinnerRow[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [modalStatType, setModalStatType] = useState<'SCORER' | 'GOALKEEPER' | 'DEFENDER' | 'MOTM'>('SCORER');
  const [goalsInput, setGoalsInput] = useState<number>(0);
  const [concededInput, setConcededInput] = useState<number>(0);
  const [cleanSheetsInput, setCleanSheetsInput] = useState<number>(0);
  const [matchesInput, setMatchesInput] = useState<number>(0);
  const [defenderAwardsInput, setDefenderAwardsInput] = useState<number>(0);
  const [motmAwardsInput, setMotmAwardsInput] = useState<number>(0);
  const [notesInput, setNotesInput] = useState<string>('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/statistics');
      if (res.ok) {
        const data = await res.json();
        setTopScorers(data.topScorers || []);
        setTopGoalkeepers(data.topGoalkeepers || []);
        setBestDefenders(data.bestDefenders || []);
        setManOfTheMatches(data.manOfTheMatches || []);
        setAllPlayers(data.players || []);
      }
    } catch (e) {
      console.error(e);
      setActionError('Failed to load tournament statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const openScorerEdit = (s?: ScorerRow) => {
    setModalStatType('SCORER');
    if (s) {
      setSelectedPlayerId(s.playerId);
      setGoalsInput(s.goals);
    } else {
      setSelectedPlayerId(allPlayers.length > 0 ? allPlayers[0].id : '');
      setGoalsInput(1);
    }
    setNotesInput('');
    setEditModalOpen(true);
  };

  const openGoalkeeperEdit = (gk?: GoalkeeperRow) => {
    setModalStatType('GOALKEEPER');
    if (gk) {
      setSelectedPlayerId(gk.playerId);
      setConcededInput(gk.goalsConceded);
      setCleanSheetsInput(gk.cleanSheets);
      setMatchesInput(gk.matches);
    } else {
      const firstGk = allPlayers.find((p) => p.position === 'GOALKEEPER') || allPlayers[0];
      setSelectedPlayerId(firstGk ? firstGk.id : '');
      setConcededInput(0);
      setCleanSheetsInput(0);
      setMatchesInput(1);
    }
    setNotesInput('');
    setEditModalOpen(true);
  };

  const openDefenderEdit = (d?: AwardWinnerRow) => {
    setModalStatType('DEFENDER');
    if (d) {
      setSelectedPlayerId(d.playerId);
      setDefenderAwardsInput(d.awardsCount);
    } else {
      const firstDef = allPlayers.find((p) => p.position === 'DEFENDER') || allPlayers[0];
      setSelectedPlayerId(firstDef ? firstDef.id : '');
      setDefenderAwardsInput(1);
    }
    setNotesInput('');
    setEditModalOpen(true);
  };

  const openMotmEdit = (m?: AwardWinnerRow) => {
    setModalStatType('MOTM');
    if (m) {
      setSelectedPlayerId(m.playerId);
      setMotmAwardsInput(m.awardsCount);
    } else {
      setSelectedPlayerId(allPlayers.length > 0 ? allPlayers[0].id : '');
      setMotmAwardsInput(1);
    }
    setNotesInput('');
    setEditModalOpen(true);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return;
    setSubmitting(true);
    setActionError(null);

    const payload: any = { playerId: selectedPlayerId, notes: notesInput };

    if (modalStatType === 'SCORER') {
      payload.goals = Number(goalsInput);
    } else if (modalStatType === 'GOALKEEPER') {
      payload.goalsConceded = Number(concededInput);
      payload.cleanSheets = Number(cleanSheetsInput);
      payload.matchesPlayed = Number(matchesInput);
    } else if (modalStatType === 'DEFENDER') {
      payload.bestDefenderAwards = Number(defenderAwardsInput);
    } else if (modalStatType === 'MOTM') {
      payload.motmAwards = Number(motmAwardsInput);
    }

    try {
      const res = await fetch('/api/admin/statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to save correction.');
      } else {
        const playerObj = allPlayers.find((p) => p.id === selectedPlayerId);
        setActionSuccess(
          `Official statistics correction applied for #${playerObj?.jerseyNumber || ''} ${playerObj?.name || 'player'}. Reflects immediately across public site.`
        );
        setEditModalOpen(false);
        if (data.topScorers) setTopScorers(data.topScorers);
        if (data.topGoalkeepers) setTopGoalkeepers(data.topGoalkeepers);
        if (data.bestDefenders) setBestDefenders(data.bestDefenders);
        if (data.manOfTheMatches) setManOfTheMatches(data.manOfTheMatches);
      }
    } catch (err) {
      setActionError('An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPlayerStat = async (playerId: string, fieldType: string, playerName: string) => {
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/statistics?playerId=${playerId}&field=${fieldType}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to reset stat.');
      } else {
        setActionSuccess(
          `Statistic for ${playerName} successfully reset to automatic match calculation.`
        );
        setEditModalOpen(false);
        if (data.topScorers) setTopScorers(data.topScorers);
        if (data.topGoalkeepers) setTopGoalkeepers(data.topGoalkeepers);
        if (data.bestDefenders) setBestDefenders(data.bestDefenders);
        if (data.manOfTheMatches) setManOfTheMatches(data.manOfTheMatches);
      }
    } catch (err) {
      setActionError('An error occurred while resetting.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlayer = allPlayers.find((p) => p.id === selectedPlayerId);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/40">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Tournament Honours & Statistics Command Center
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            Honours & Awards Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
            Authoritative interface to review and correct Top Scorers, Top Goalkeepers, Best Defenders, and MOTM awards
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/matches"
            className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 hover:text-white border border-emerald-400/50 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Match Fixtures & Awards</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-400/50 text-xs font-bold text-emerald-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-400/50 text-xs font-bold text-rose-200 flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab('SCORER')}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center gap-3 ${
            activeTab === 'SCORER'
              ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
              : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
          }`}
        >
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">Top Scorer</span>
            <span className="text-[10px] text-slate-400 font-mono">Golden Stick</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('GOALKEEPER')}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center gap-3 ${
            activeTab === 'GOALKEEPER'
              ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg'
              : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
          }`}
        >
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">Top Goalkeeper</span>
            <span className="text-[10px] text-slate-400 font-mono">Fewest Conceded</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('DEFENDER')}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center gap-3 ${
            activeTab === 'DEFENDER'
              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg'
              : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
          }`}
        >
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">Best Defender</span>
            <span className="text-[10px] text-slate-400 font-mono">Defensive Wall</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('MOTM')}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center gap-3 ${
            activeTab === 'MOTM'
              ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg'
              : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
          }`}
        >
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">Man of Match</span>
            <span className="text-[10px] text-slate-400 font-mono">Match MVPs</span>
          </div>
        </button>
      </div>

      {/* 1. TOP SCORERS SECTION */}
      {activeTab === 'SCORER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Golden Stick Leaderboard</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by goals scored • Derived automatically from match goal events with administrative correction support
              </p>
            </div>

            <button
              onClick={() => openScorerEdit()}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-extrabold uppercase tracking-wider transition hover:bg-amber-500/30 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Credit Goals / Add Scorer</span>
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900/85 backdrop-blur-md border border-white/20">
            {topScorers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No goal scorers recorded yet. Add goals through match events or click &ldquo;Credit Goals / Add Scorer&rdquo;.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {topScorers.map((scorer) => (
                  <div
                    key={scorer.playerId}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-mono font-black text-sm ${
                          scorer.rank === 1
                            ? 'text-amber-400'
                            : scorer.rank === 2
                            ? 'text-slate-300'
                            : scorer.rank === 3
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        #{scorer.rank}
                      </span>

                      <SportsAvatar
                        photo={scorer.photo}
                        name={scorer.playerName}
                        jerseyNumber={scorer.jerseyNumber}
                        size="md"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{scorer.playerName}</span>
                          {scorer.isOverridden && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase">
                              Admin Corrected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{scorer.teamName}</span>
                          <span>•</span>
                          <span className="font-mono">#{scorer.jerseyNumber}</span>
                          <span>•</span>
                          <span className="text-[11px] text-slate-500">
                            {scorer.matchesPlayed} {scorer.matchesPlayed === 1 ? 'match' : 'matches'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-amber-400">
                          {scorer.goals}
                        </span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Goals
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openScorerEdit(scorer)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-amber-400" />
                          <span>Correct</span>
                        </button>
                        {scorer.isOverridden && (
                          <button
                            onClick={() =>
                              handleResetPlayerStat(scorer.playerId, 'goals', scorer.playerName)
                            }
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 border border-white/10"
                            title="Reset to Match Events"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TOP GOALKEEPERS SECTION */}
      {activeTab === 'GOALKEEPER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                <span>Top Goalkeepers (Fewest Conceded)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by fewest goals conceded and clean sheets • Supports official admin corrections
              </p>
            </div>

            <button
              onClick={() => openGoalkeeperEdit()}
              className="px-3.5 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-extrabold uppercase tracking-wider transition hover:bg-teal-500/30 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Correct Goalkeeper Stats</span>
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900/85 backdrop-blur-md border border-white/20">
            {topGoalkeepers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No goalkeeper records available yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {topGoalkeepers.map((gk) => (
                  <div
                    key={gk.playerId}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-mono font-black text-sm ${
                          gk.rank === 1
                            ? 'text-teal-400'
                            : gk.rank === 2
                            ? 'text-slate-300'
                            : gk.rank === 3
                            ? 'text-amber-500'
                            : 'text-slate-500'
                        }`}
                      >
                        #{gk.rank}
                      </span>

                      <SportsAvatar
                        photo={gk.photo}
                        name={gk.playerName}
                        jerseyNumber={gk.jerseyNumber}
                        size="md"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{gk.playerName}</span>
                          {gk.isOverridden && (
                            <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-black uppercase">
                              Admin Corrected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{gk.teamName}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">
                            {gk.cleanSheets} Clean {gk.cleanSheets === 1 ? 'Sheet' : 'Sheets'}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">{gk.matches} matches</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          {gk.goalsConceded}
                        </span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Conceded ({gk.goalsPerMatch}/m)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openGoalkeeperEdit(gk)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-teal-400" />
                          <span>Correct</span>
                        </button>
                        {gk.isOverridden && (
                          <button
                            onClick={() =>
                              handleResetPlayerStat(gk.playerId, 'goalkeeper', gk.playerName)
                            }
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 border border-white/10"
                            title="Reset to Match Scores"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. BEST DEFENDERS SECTION */}
      {activeTab === 'DEFENDER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Best Defender Ranking</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by Best Defender match awards • Selected in match management; idempotent without runaway counters
              </p>
            </div>

            <button
              onClick={() => openDefenderEdit()}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold uppercase tracking-wider transition hover:bg-emerald-500/30 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Correct Award Count</span>
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900/85 backdrop-blur-md border border-white/20">
            {bestDefenders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No Best Defender awards assigned yet. Assign awards when editing matches or adjust directly here.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {bestDefenders.map((def) => (
                  <div
                    key={def.playerId}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-mono font-black text-sm ${
                          def.rank === 1
                            ? 'text-emerald-400'
                            : def.rank === 2
                            ? 'text-slate-300'
                            : def.rank === 3
                            ? 'text-amber-500'
                            : 'text-slate-500'
                        }`}
                      >
                        #{def.rank}
                      </span>

                      <SportsAvatar
                        photo={def.photo}
                        name={def.playerName}
                        jerseyNumber={def.jerseyNumber}
                        size="md"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{def.playerName}</span>
                          {def.isOverridden && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase">
                              Admin Corrected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{def.teamName}</span>
                          <span>•</span>
                          <span className="font-mono">#{def.jerseyNumber}</span>
                          <span>•</span>
                          <span className="text-[11px] text-slate-500">
                            {def.matchesPlayed} matches
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          {def.awardsCount}
                        </span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {def.awardsCount === 1 ? 'Award' : 'Awards'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openDefenderEdit(def)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-emerald-400" />
                          <span>Correct</span>
                        </button>
                        {def.isOverridden && (
                          <button
                            onClick={() =>
                              handleResetPlayerStat(def.playerId, 'bestDefender', def.playerName)
                            }
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 border border-white/10"
                            title="Reset to Match Awards"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MAN OF THE MATCH SECTION */}
      {activeTab === 'MOTM' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span>Man of the Match (MOTM) Ranking</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by match MVP awards • Selected per match; reassigning replaces prior award without double counting
              </p>
            </div>

            <button
              onClick={() => openMotmEdit()}
              className="px-3.5 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-extrabold uppercase tracking-wider transition hover:bg-purple-500/30 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Correct Award Count</span>
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900/85 backdrop-blur-md border border-white/20">
            {manOfTheMatches.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No Man of the Match awards assigned yet. Assign awards when editing matches or adjust directly here.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {manOfTheMatches.map((motm) => (
                  <div
                    key={motm.playerId}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-mono font-black text-sm ${
                          motm.rank === 1
                            ? 'text-purple-400'
                            : motm.rank === 2
                            ? 'text-slate-300'
                            : motm.rank === 3
                            ? 'text-amber-500'
                            : 'text-slate-500'
                        }`}
                      >
                        #{motm.rank}
                      </span>

                      <SportsAvatar
                        photo={motm.photo}
                        name={motm.playerName}
                        jerseyNumber={motm.jerseyNumber}
                        size="md"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{motm.playerName}</span>
                          {motm.isOverridden && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-black uppercase">
                              Admin Corrected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{motm.teamName}</span>
                          <span>•</span>
                          <span className="font-mono">#{motm.jerseyNumber}</span>
                          <span>•</span>
                          <span className="text-[11px] text-slate-500">
                            {motm.matchesPlayed} matches
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-purple-400">
                          {motm.awardsCount}
                        </span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {motm.awardsCount === 1 ? 'MOTM' : 'MOTMs'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openMotmEdit(motm)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-purple-400" />
                          <span>Correct</span>
                        </button>
                        {motm.isOverridden && (
                          <button
                            onClick={() =>
                              handleResetPlayerStat(motm.playerId, 'motm', motm.playerName)
                            }
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 border border-white/10"
                            title="Reset to Match Awards"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT STAT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black uppercase text-white tracking-wider">
                {modalStatType === 'SCORER' && 'Correct Top Scorer Goals'}
                {modalStatType === 'GOALKEEPER' && 'Correct Goalkeeper Statistic'}
                {modalStatType === 'DEFENDER' && 'Correct Best Defender Awards'}
                {modalStatType === 'MOTM' && 'Correct Man of the Match Awards'}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4">
              {/* Select Player */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Select Player <span className="text-emerald-400">*</span>
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  {allPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.team.shortName}] #{p.jerseyNumber} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
                {selectedPlayer && (
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Team: {selectedPlayer.team.name}
                  </span>
                )}
              </div>

              {/* Dynamic Form fields by category */}
              {modalStatType === 'SCORER' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-amber-400 mb-1">
                    Total Goals Credited
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={goalsInput}
                    onChange={(e) => setGoalsInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-400 text-2xl font-black font-mono text-center focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Example: If a player had 5 goals and 1 was incorrectly credited, set to 4. Public leaderboard updates immediately.
                  </p>
                </div>
              )}

              {modalStatType === 'GOALKEEPER' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                        Conceded
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={concededInput}
                        onChange={(e) => setConcededInput(Number(e.target.value))}
                        className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs text-center font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-teal-400 mb-1">
                        Clean Sheets
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={cleanSheetsInput}
                        onChange={(e) => setCleanSheetsInput(Number(e.target.value))}
                        className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-teal-500/30 text-teal-300 text-xs text-center font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                        Matches
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={matchesInput}
                        onChange={(e) => setMatchesInput(Number(e.target.value))}
                        className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Goals per match will recalculate automatically from Conceded / Matches.
                  </p>
                </div>
              )}

              {modalStatType === 'DEFENDER' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-400 mb-1">
                    Total Best Defender Match Awards
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={defenderAwardsInput}
                    onChange={(e) => setDefenderAwardsInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-400 text-2xl font-black font-mono text-center focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Note: Best Defender is normally derived from matches. Adjusting this value sets an official administrative count.
                  </p>
                </div>
              )}

              {modalStatType === 'MOTM' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-purple-400 mb-1">
                    Total Man of the Match (MOTM) Awards
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={motmAwardsInput}
                    onChange={(e) => setMotmAwardsInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-purple-500/40 text-purple-400 text-2xl font-black font-mono text-center focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Note: MOTM is normally derived from matches. Adjusting this value sets an official administrative count.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Reason / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Official committee decision or tournament correction..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40"
                >
                  {submitting ? 'Saving...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
