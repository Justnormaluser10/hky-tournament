'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  MapPin,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface MatchEvent {
  id: string;
  type: string;
  minute: number;
  notes?: string | null;
  playerId?: string | null;
  player?: {
    id: string;
    name: string;
    jerseyNumber: number;
  } | null;
  team: {
    id: string;
    shortName: string;
  };
}

interface Match {
  id: string;
  matchNumber: number;
  round: string;
  date: string;
  time: string;
  venue: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';
  teamAScore: number;
  teamBScore: number;
  teamAId?: string | null;
  teamBId?: string | null;
  notes?: string | null;
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
  knockout?: {
    seedLabelA?: string | null;
    seedLabelB?: string | null;
    stage?: string | null;
  } | null;
  events: MatchEvent[];
}

interface TeamOption {
  id: string;
  name: string;
  shortName: string;
}

interface TeamPlayer {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [scoreEditMatch, setScoreEditMatch] = useState<Match | null>(null);
  const [deleteMatch, setDeleteMatch] = useState<Match | null>(null);
  const [generating, setGenerating] = useState(false);

  // Score & Match Edit Form
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [matchStatus, setMatchStatus] = useState<string>('UPCOMING');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('17:30');
  const [matchVenue, setMatchVenue] = useState('Pitch 1 - Main Turf');
  const [matchNotes, setMatchNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Match Event Form in Score Modal
  const [eventTeamId, setEventTeamId] = useState('');
  const [eventPlayerId, setEventPlayerId] = useState('');
  const [eventType, setEventType] = useState('GOAL');
  const [eventMinute, setEventMinute] = useState(10);
  const [availablePlayers, setAvailablePlayers] = useState<TeamPlayer[]>([]);

  // Create Form
  const [newTeamAId, setNewTeamAId] = useState('');
  const [newTeamBId, setNewTeamBId] = useState('');
  const [newRound, setNewRound] = useState('LEAGUE');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('17:30');
  const [newVenue, setNewVenue] = useState('Pitch 1 - Main Turf');

  const fetchMatchesAndTeams = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        fetch('/api/admin/matches'),
        fetch('/api/admin/teams'),
      ]);
      if (mRes.ok && tRes.ok) {
        const mData = await mRes.json();
        const tData = await tRes.json();
        setMatches(mData.matches || []);
        setTeams(tData.teams || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesAndTeams();
  }, []);

  const openScoreModal = (m: Match) => {
    setScoreEditMatch(m);
    setScoreA(m.teamAScore);
    setScoreB(m.teamBScore);
    setMatchStatus(m.status);
    setMatchDate(m.date ? new Date(m.date).toISOString().split('T')[0] : '');
    setMatchTime(m.time);
    setMatchVenue(m.venue);
    setMatchNotes(m.notes || '');
    setEventTeamId(m.teamAId || '');
    if (m.teamAId) {
      loadPlayersForTeam(m.teamAId);
    } else {
      setAvailablePlayers([]);
      setEventPlayerId('');
    }
  };

  const loadPlayersForTeam = async (tId: string) => {
    try {
      const res = await fetch(`/api/admin/players?teamId=${tId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailablePlayers(data.players || []);
        if (data.players?.length > 0) {
          setEventPlayerId(data.players[0].id);
        } else {
          setEventPlayerId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreEditMatch) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scoreEditMatch.id,
          teamAScore: Number(scoreA),
          teamBScore: Number(scoreB),
          status: matchStatus,
          date: matchDate ? new Date(matchDate).toISOString() : undefined,
          time: matchTime,
          venue: matchVenue,
          notes: matchNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to update match score.');
      } else {
        setActionSuccess(
          `Match #${scoreEditMatch.matchNumber} score updated to ${scoreA}–${scoreB}. Standings and stats recalculated automatically.`
        );
        setScoreEditMatch(null);
        fetchMatchesAndTeams();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEvent = async () => {
    if (!scoreEditMatch || !eventTeamId) return;

    try {
      const res = await fetch(`/api/admin/matches/${scoreEditMatch.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: eventTeamId,
          playerId: eventPlayerId || null,
          type: eventType,
          minute: Number(eventMinute),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess('Match event added.');
        // Refresh match in modal
        const refreshedRes = await fetch('/api/admin/matches');
        const refreshedData = await refreshedRes.json();
        const updated = refreshedData.matches.find((m: Match) => m.id === scoreEditMatch.id);
        if (updated) {
          setScoreEditMatch(updated);
          setScoreA(updated.teamAScore);
          setScoreB(updated.teamBScore);
        }
        setMatches(refreshedData.matches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!scoreEditMatch) return;

    try {
      const res = await fetch(`/api/admin/matches/${scoreEditMatch.id}/events?eventId=${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setActionSuccess('Match event removed.');
        const refreshedRes = await fetch('/api/admin/matches');
        const refreshedData = await refreshedRes.json();
        const updated = refreshedData.matches.find((m: Match) => m.id === scoreEditMatch.id);
        if (updated) {
          setScoreEditMatch(updated);
          setScoreA(updated.teamAScore);
          setScoreB(updated.teamBScore);
        }
        setMatches(refreshedData.matches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamAId: newTeamAId,
          teamBId: newTeamBId,
          round: newRound,
          time: newTime,
          venue: newVenue,
          date: newDate ? new Date(newDate).toISOString() : new Date().toISOString(),
          status: 'UPCOMING',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to schedule match.');
      } else {
        setActionSuccess(`Match #${data.match.matchNumber} scheduled successfully.`);
        setIsCreateOpen(false);
        fetchMatchesAndTeams();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateFixtures = async () => {
    setGenerating(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/matches/generate', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to generate fixtures.');
      } else {
        setActionSuccess(data.message || 'Fixtures generated successfully.');
        fetchMatchesAndTeams();
      }
    } catch (err) {
      setActionError('An error occurred while generating fixtures.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!deleteMatch) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/matches?id=${deleteMatch.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setActionError('Failed to delete match.');
      } else {
        setActionSuccess(`Match #${deleteMatch.matchNumber} deleted.`);
        setDeleteMatch(null);
        fetchMatchesAndTeams();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Match Operations & Score Recalculation
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Match Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Schedule fixtures, edit scores, record goal events, and automatically update league standings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateFixtures}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {generating ? 'Generating...' : 'Auto-Generate Fixtures'}
          </button>

          <button
            onClick={() => {
              if (teams.length >= 2) {
                setNewTeamAId(teams[0].id);
                setNewTeamBId(teams[1].id);
              }
              setIsCreateOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Schedule Match
          </button>
        </div>
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

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white uppercase">No matches scheduled</h3>
          <p className="text-xs text-slate-400 mt-1">
            Click &ldquo;Auto-Generate Fixtures&rdquo; to create a round-robin schedule or &ldquo;Schedule Match&rdquo; manually.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((m) => {
            const isCompleted = m.status === 'COMPLETED';
            return (
              <div
                key={m.id}
                className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Match #{m.matchNumber}
                    </span>
                    <span className="font-bold text-slate-400 uppercase">{m.round}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : m.status === 'LIVE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>

                    <button
                      onClick={() => setDeleteMatch(m)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400"
                      title="Delete Match"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Scoreboard display */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
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
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-amber-400 font-mono shrink-0">
                          🏆
                        </div>
                      )}
                      <span className="font-bold text-white text-sm truncate">
                        {m.teamA?.name || m.knockout?.seedLabelA || 'TBD Qualifier'}
                      </span>
                    </div>
                    <span className="text-2xl font-black font-mono text-white">
                      {isCompleted || m.status === 'LIVE' ? m.teamAScore : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
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
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-amber-400 font-mono shrink-0">
                          🏆
                        </div>
                      )}
                      <span className="font-bold text-white text-sm truncate">
                        {m.teamB?.name || m.knockout?.seedLabelB || 'TBD Qualifier'}
                      </span>
                    </div>
                    <span className="text-2xl font-black font-mono text-white">
                      {isCompleted || m.status === 'LIVE' ? m.teamBScore : '—'}
                    </span>
                  </div>
                </div>

                {/* Footer and Edit Score CTA */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400 truncate max-w-[60%]">
                    {m.time} • {m.venue}
                  </div>

                  <button
                    onClick={() => openScoreModal(m)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40 font-bold uppercase tracking-wider text-[11px] transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Score & Events</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCORE & EVENTS EDIT MODAL (Single Source of Truth Recalculation) */}
      {scoreEditMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-white tracking-wider">
                  Edit Match #{scoreEditMatch.matchNumber} Score
                </h3>
                <span className="text-xs text-slate-400">
                  {scoreEditMatch.teamA?.name || scoreEditMatch.knockout?.seedLabelA || 'TBD'} vs{' '}
                  {scoreEditMatch.teamB?.name || scoreEditMatch.knockout?.seedLabelB || 'TBD'}
                </span>
              </div>
              <button
                onClick={() => setScoreEditMatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScoreSave} className="space-y-4">
              {/* Score Input Controls */}
              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3">
                <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider block">
                  Official Match Scoreline
                </span>

                <div className="grid grid-cols-2 gap-4 items-center text-center">
                  <div>
                    <span className="text-xs font-bold text-white block mb-1 truncate">
                      {scoreEditMatch.teamA?.shortName || scoreEditMatch.teamA?.name || scoreEditMatch.knockout?.seedLabelA || 'Team A'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={scoreA}
                      onChange={(e) => setScoreA(Number(e.target.value))}
                      className="w-24 mx-auto text-center text-3xl font-black font-mono py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-xs font-bold text-white block mb-1 truncate">
                      {scoreEditMatch.teamB?.shortName || scoreEditMatch.teamB?.name || scoreEditMatch.knockout?.seedLabelB || 'Team B'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={scoreB}
                      onChange={(e) => setScoreB(Number(e.target.value))}
                      className="w-24 mx-auto text-center text-3xl font-black font-mono py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Match Date, Time & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Match Date
                  </label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Kickoff Time
                  </label>
                  <input
                    type="text"
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Match Status
                  </label>
                  <select
                    value={matchStatus}
                    onChange={(e) => setMatchStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED (Recalculate Standings)</option>
                    <option value="POSTPONED">POSTPONED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Venue / Pitch
                </label>
                <input
                  type="text"
                  value={matchVenue}
                  onChange={(e) => setMatchVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Save Match Score & Recalculate */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition disabled:opacity-50"
              >
                {submitting ? 'Recalculating...' : 'Save Score & Recalculate Standings'}
              </button>
            </form>

            {/* RECORD MATCH EVENTS (GOALS / CARDS) */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Match Goal & Card Events
              </h4>

              {/* Add event row */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Select Team */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Team</label>
                    <select
                      value={eventTeamId}
                      onChange={(e) => {
                        setEventTeamId(e.target.value);
                        loadPlayersForTeam(e.target.value);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                    >
                      {scoreEditMatch.teamA && (
                        <option value={scoreEditMatch.teamAId || ''}>{scoreEditMatch.teamA.shortName}</option>
                      )}
                      {scoreEditMatch.teamB && (
                        <option value={scoreEditMatch.teamBId || ''}>{scoreEditMatch.teamB.shortName}</option>
                      )}
                    </select>
                  </div>

                  {/* Select Type */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                    >
                      <option value="GOAL">⚽ Goal</option>
                      <option value="YELLOW_CARD">🟨 Yellow Card</option>
                      <option value="RED_CARD">🟥 Red Card</option>
                      <option value="GREEN_CARD">🟩 Green Card</option>
                    </select>
                  </div>

                  {/* Select Player */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Scorer / Player</label>
                    <select
                      value={eventPlayerId}
                      onChange={(e) => setEventPlayerId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs truncate"
                    >
                      <option value="">-- Optional Player --</option>
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.jerseyNumber} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Minute */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Minute (&apos;)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={eventMinute}
                      onChange={(e) => setEventMinute(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="w-full py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-bold uppercase transition"
                >
                  + Add Event to Match
                </button>
              </div>

              {/* Events List */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {scoreEditMatch.events.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">No events recorded.</p>
                ) : (
                  scoreEditMatch.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">{evt.minute}&apos;</span>
                        <span>{evt.type === 'GOAL' ? '⚽' : '🟨'}</span>
                        <span className="font-bold text-white">
                          {evt.player ? evt.player.name : evt.team.shortName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({evt.team.shortName})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Remove Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MATCH MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black uppercase text-white tracking-wider">
                Schedule Match
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Team A <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    required
                    value={newTeamAId}
                    onChange={(e) => setNewTeamAId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Team B <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    required
                    value={newTeamBId}
                    onChange={(e) => setNewTeamBId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Match Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Match Date <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Kickoff Time
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="17:30"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Round / Stage
                  </label>
                  <select
                    value={newRound}
                    onChange={(e) => setNewRound(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  >
                    <option value="LEAGUE">LEAGUE</option>
                    <option value="QUARTER_FINAL">QUARTER_FINAL</option>
                    <option value="SEMI_FINAL">SEMI_FINAL</option>
                    <option value="FINAL">FINAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Scheduling...' : 'Save Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black uppercase text-white tracking-wider">
              Delete Match #{deleteMatch.matchNumber}?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this fixture between{' '}
              <strong className="text-white">{deleteMatch.teamA?.name || deleteMatch.knockout?.seedLabelA || 'TBD'}</strong> and{' '}
              <strong className="text-white">{deleteMatch.teamB?.name || deleteMatch.knockout?.seedLabelB || 'TBD'}</strong>?
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteMatch(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMatch}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
