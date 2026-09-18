'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GitFork,
  RotateCcw,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Edit2,
  X,
  Flame,
  ArrowRight,
  Users,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface AvailableTeam {
  id: string;
  name: string;
  shortName: string;
  logo: string | null;
  primaryColor: string;
}

interface KnockoutMatch {
  id: string;
  stage: string;
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
    status: string;
    winnerId: string | null;
    teamA?: {
      id: string;
      name: string;
      shortName: string;
      logo: string | null;
      primaryColor: string;
    } | null;
    teamB?: {
      id: string;
      name: string;
      shortName: string;
      logo: string | null;
      primaryColor: string;
    } | null;
  };
}

export default function AdminKnockoutPage() {
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);
  const [availableTeams, setAvailableTeams] = useState<AvailableTeam[]>([]);
  const [tournamentStage, setTournamentStage] = useState('LEAGUE');
  const [leagueStatus, setLeagueStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Quick Score Modal
  const [editingKnockout, setEditingKnockout] = useState<KnockoutMatch | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [matchStatus, setMatchStatus] = useState('COMPLETED');
  const [savingScore, setSavingScore] = useState(false);

  // Edit Teams Modal
  const [editingTeamsKnockout, setEditingTeamsKnockout] = useState<KnockoutMatch | null>(null);
  const [selectedTeamAId, setSelectedTeamAId] = useState('');
  const [selectedTeamBId, setSelectedTeamBId] = useState('');
  const [savingTeams, setSavingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const fetchKnockout = async () => {
    try {
      const res = await fetch('/api/admin/knockout');
      if (res.ok) {
        const data = await res.json();
        setKnockoutMatches(data.knockoutMatches || []);
        if (data.tournament) setTournamentStage(data.tournament.currentStage);
        if (data.leagueStatus) setLeagueStatus(data.leagueStatus);
        if (data.teams && data.teams.length > 0) {
          setAvailableTeams(data.teams);
        } else {
          // Fallback fetch teams
          const teamsRes = await fetch('/api/admin/teams');
          if (teamsRes.ok) {
            const teamsData = await teamsRes.json();
            setAvailableTeams(teamsData.teams || []);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEditTeamsModal = (k: KnockoutMatch) => {
    setEditingTeamsKnockout(k);
    setSelectedTeamAId(k.match.teamA?.id || '');
    setSelectedTeamBId(k.match.teamB?.id || '');
    setTeamsError(null);
  };

  const handleSaveTeams = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeamsKnockout) return;

    if (!selectedTeamAId || !selectedTeamBId) {
      setTeamsError('Please select both Team A and Team B.');
      return;
    }

    if (selectedTeamAId === selectedTeamBId) {
      setTeamsError('A team cannot play against itself. Please select two distinct teams.');
      return;
    }

    setSavingTeams(true);
    setTeamsError(null);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/knockout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knockoutMatchId: editingTeamsKnockout.id,
          teamAId: selectedTeamAId,
          teamBId: selectedTeamBId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTeamsError(data.error || 'Failed to update teams.');
      } else {
        const teamAName = availableTeams.find((t) => t.id === selectedTeamAId)?.name || 'Team A';
        const teamBName = availableTeams.find((t) => t.id === selectedTeamBId)?.name || 'Team B';
        setActionSuccess(
          `Match #${editingTeamsKnockout.match.matchNumber} teams updated: ${teamAName} vs ${teamBName}!`
        );
        setEditingTeamsKnockout(null);
        fetchKnockout();
      }
    } catch (err) {
      setTeamsError('An error occurred while saving teams.');
    } finally {
      setSavingTeams(false);
    }
  };

  useEffect(() => {
    fetchKnockout();
  }, []);

  const handleGenerateBracket = async () => {
    setGenerating(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/knockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to generate bracket.');
      } else {
        setActionSuccess('Knockout stages generated successfully from current league standings.');
        fetchKnockout();
      }
    } catch (e) {
      setActionError('An error occurred.');
    } finally {
      setGenerating(false);
    }
  };

  const openScoreModal = (k: KnockoutMatch) => {
    setEditingKnockout(k);
    setScoreA(k.match.teamAScore);
    setScoreB(k.match.teamBScore);
    setMatchStatus(k.match.status);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKnockout) return;

    setSavingScore(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingKnockout.match.id,
          teamAScore: Number(scoreA),
          teamBScore: Number(scoreB),
          status: matchStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to update score.');
      } else {
        setActionSuccess(
          `Match #${editingKnockout.match.matchNumber} score recorded! Bracket automatically advanced.`
        );
        setEditingKnockout(null);
        fetchKnockout();
      }
    } catch (err) {
      setActionError('Failed to save match score.');
    } finally {
      setSavingScore(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <GitFork className="w-3.5 h-3.5 text-amber-400" />
            Playoff Bracket Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Knockout Stages Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Current Stage: <strong className="text-emerald-400 uppercase">{tournamentStage}</strong>
            {leagueStatus && ` • League Completion: ${leagueStatus.completedMatches} / ${leagueStatus.scheduledMatches} (${leagueStatus.percentComplete}%)`}
          </p>
        </div>

        <button
          onClick={handleGenerateBracket}
          disabled={generating || (leagueStatus && !leagueStatus.isComplete)}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition ${
            leagueStatus && !leagueStatus.isComplete
              ? 'bg-slate-800 text-slate-400 border border-white/10 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-900/30'
          }`}
          title={
            leagueStatus && !leagueStatus.isComplete
              ? 'All league matches must be completed first'
              : 'Generate or update knockout fixtures'
          }
        >
          {leagueStatus && !leagueStatus.isComplete ? (
            <span>🔒 Knockout Locked (League Incomplete)</span>
          ) : (
            <>
              <RotateCcw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Seeding Bracket...' : '🏆 Seed / Re-seed Knockouts'}</span>
            </>
          )}
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Knockout Match Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : knockoutMatches.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 max-w-xl mx-auto space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white uppercase">Knockout Brackets Not Generated</h3>
          <p className="text-xs text-slate-400">
            Click &ldquo;Seed / Re-seed Knockouts&rdquo; to automatically populate fixtures from current league standings, or advance via the Dashboard once the league stage is complete.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {knockoutMatches.map((k) => {
            const m = k.match;
            const isCompleted = m.status === 'COMPLETED';

            return (
              <div
                key={k.id}
                className="glass-card rounded-2xl p-5 border border-white/10 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                    <span className="font-mono font-bold text-amber-400">
                      {k.stage.replace('_', ' ')} • Match #{m.matchNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : m.status === 'LIVE'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="space-y-3 my-3">
                    {/* Team A */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40">
                      <div className="flex items-center gap-2.5">
                        {m.teamA ? (
                          <TeamLogo
                            name={m.teamA.name}
                            shortName={m.teamA.shortName}
                            logo={m.teamA.logo}
                            primaryColor={m.teamA.primaryColor}
                            size="sm"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                            ?
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-white text-xs block">
                            {m.teamA?.name || k.seedLabelA || 'TBD'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {k.seedLabelA || 'Qualifier'}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-xl text-white">
                        {isCompleted ? m.teamAScore : '—'}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40">
                      <div className="flex items-center gap-2.5">
                        {m.teamB ? (
                          <TeamLogo
                            name={m.teamB.name}
                            shortName={m.teamB.shortName}
                            logo={m.teamB.logo}
                            primaryColor={m.teamB.primaryColor}
                            size="sm"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                            ?
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-white text-xs block">
                            {m.teamB?.name || k.seedLabelB || 'TBD'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {k.seedLabelB || 'Qualifier'}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-xl text-white">
                        {isCompleted ? m.teamBScore : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">{m.time}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditTeamsModal(k)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-wider transition"
                      title="Edit teams for this match"
                    >
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Teams</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openScoreModal(k)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Enter Score</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK SCORE MODAL */}
      {editingKnockout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-black text-white uppercase text-base">
                  Record Score — Match #{editingKnockout.match.matchNumber}
                </h3>
                <span className="text-xs text-emerald-400 font-mono">
                  {editingKnockout.stage.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setEditingKnockout(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/5 space-y-2">
                  <label className="block text-xs font-bold uppercase text-slate-300 truncate">
                    {editingKnockout.match.teamA?.name || 'Team A'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono font-black text-2xl text-center focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/5 space-y-2">
                  <label className="block text-xs font-bold uppercase text-slate-300 truncate">
                    {editingKnockout.match.teamB?.name || 'Team B'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono font-black text-2xl text-center focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Match Status
                </label>
                <select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="COMPLETED">COMPLETED (Advances Winner)</option>
                  <option value="LIVE">LIVE</option>
                  <option value="UPCOMING">UPCOMING</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300">
                Saving score marks the winner and automatically updates the next bracket round (e.g. Semi-Finals → Grand Final).
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingKnockout(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScore}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs uppercase tracking-wider hover:from-emerald-500 hover:to-emerald-400 transition shadow-lg shadow-emerald-900/40"
                >
                  {savingScore ? 'Saving...' : 'Save & Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAMS MODAL */}
      {editingTeamsKnockout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-950 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-black text-white uppercase text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Edit Teams — Match #{editingTeamsKnockout.match.matchNumber}</span>
                </h3>
                <span className="text-xs text-emerald-400 font-mono">
                  {editingTeamsKnockout.stage.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeamsKnockout(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {teamsError && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{teamsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeams} className="space-y-4">
              <div className="space-y-3">
                {/* Team A Selection */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/5 space-y-2">
                  <label className="block text-xs font-black uppercase text-amber-400 tracking-wider">
                    Team A (First Team)
                  </label>
                  <select
                    value={selectedTeamAId}
                    onChange={(e) => setSelectedTeamAId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-semibold focus:border-emerald-500 focus:outline-none transition"
                  >
                    <option value="" disabled>
                      -- Select Team A --
                    </option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team B Selection */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/5 space-y-2">
                  <label className="block text-xs font-black uppercase text-teal-400 tracking-wider">
                    Team B (Second Team)
                  </label>
                  <select
                    value={selectedTeamBId}
                    onChange={(e) => setSelectedTeamBId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-semibold focus:border-emerald-500 focus:outline-none transition"
                  >
                    <option value="" disabled>
                      -- Select Team B --
                    </option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.shortName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTeamAId && selectedTeamBId && selectedTeamAId === selectedTeamBId && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300">
                  ⚠️ A team cannot play against itself. Please select two different teams.
                </div>
              )}

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300">
                💡 Changing either team will immediately update the fixture lineup in both the admin management panel and the public tournament knockout bracket.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeamsKnockout(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTeams || !selectedTeamAId || !selectedTeamBId || selectedTeamAId === selectedTeamBId}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTeams ? 'Saving Teams...' : 'Save Teams'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
