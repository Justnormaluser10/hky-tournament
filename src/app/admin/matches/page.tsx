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
  Check,
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
  const [editTeamAId, setEditTeamAId] = useState('');
  const [editTeamBId, setEditTeamBId] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState<TeamPlayer[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<TeamPlayer[]>([]);
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

  // Inline Match Event Editing State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEvTeamId, setEditEvTeamId] = useState('');
  const [editEvPlayerId, setEditEvPlayerId] = useState('');
  const [editEvType, setEditEvType] = useState('GOAL');
  const [editEvMinute, setEditEvMinute] = useState(10);
  const [editEvNotes, setEditEvNotes] = useState('');

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

  const loadPlayersForTeamA = async (tId: string) => {
    if (!tId) {
      setTeamAPlayers([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/players?teamId=${tId}`);
      if (res.ok) {
        const data = await res.json();
        setTeamAPlayers(data.players || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPlayersForTeamB = async (tId: string) => {
    if (!tId) {
      setTeamBPlayers([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/players?teamId=${tId}`);
      if (res.ok) {
        const data = await res.json();
        setTeamBPlayers(data.players || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openScoreModal = (m: Match) => {
    setScoreEditMatch(m);
    const initialTeamA = m.teamAId || (teams.length >= 1 ? teams[0].id : '');
    const initialTeamB = m.teamBId || (teams.length >= 2 ? teams[1].id : '');
    setEditTeamAId(initialTeamA);
    setEditTeamBId(initialTeamB);
    setScoreA(m.teamAScore);
    setScoreB(m.teamBScore);
    setMatchStatus(m.status);
    setMatchDate(m.date ? new Date(m.date).toISOString().split('T')[0] : '');
    setMatchTime(m.time);
    setMatchVenue(m.venue);
    setMatchNotes(m.notes || '');
    setEventTeamId(initialTeamA);
    setEventPlayerId('');
    setEditingEventId(null);
    setActionError(null);

    loadPlayersForTeamA(initialTeamA);
    loadPlayersForTeamB(initialTeamB);
  };

  const handleTeamAChange = (newTId: string) => {
    setEditTeamAId(newTId);
    loadPlayersForTeamA(newTId);
    if (eventTeamId === editTeamAId) {
      setEventTeamId(newTId);
      setEventPlayerId('');
    }
    if (editEvTeamId === editTeamAId) {
      setEditEvTeamId(newTId);
      setEditEvPlayerId('');
    }
  };

  const handleTeamBChange = (newTId: string) => {
    setEditTeamBId(newTId);
    loadPlayersForTeamB(newTId);
    if (eventTeamId === editTeamBId) {
      setEventTeamId(newTId);
      setEventPlayerId('');
    }
    if (editEvTeamId === editTeamBId) {
      setEditEvTeamId(newTId);
      setEditEvPlayerId('');
    }
  };

  const handleScoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreEditMatch) return;
    if (editTeamAId && editTeamBId && editTeamAId === editTeamBId) {
      setActionError('Home Team and Away Team cannot be the same team.');
      return;
    }
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scoreEditMatch.id,
          teamAId: editTeamAId,
          teamBId: editTeamBId,
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
        setActionError(data.error || 'Failed to update match.');
      } else {
        setActionSuccess(
          `Match #${scoreEditMatch.matchNumber} details and score updated successfully. Standings and stats recalculated.`
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
    if (editTeamAId && editTeamBId && editTeamAId === editTeamBId) {
      setActionError('Home Team and Away Team cannot be the same team.');
      return;
    }
    setSubmitting(true);
    setActionError(null);

    try {
      // If teams were modified in the header, persist match updates first so backend validates against new teams
      if (editTeamAId !== scoreEditMatch.teamAId || editTeamBId !== scoreEditMatch.teamBId) {
        const teamSaveRes = await fetch('/api/admin/matches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: scoreEditMatch.id,
            teamAId: editTeamAId,
            teamBId: editTeamBId,
            status: matchStatus,
            date: matchDate ? new Date(matchDate).toISOString() : undefined,
            time: matchTime,
            venue: matchVenue,
            notes: matchNotes,
          }),
        });
        if (!teamSaveRes.ok) {
          const teamErr = await teamSaveRes.json();
          setActionError(teamErr.error || 'Failed to update match teams before adding event.');
          setSubmitting(false);
          return;
        }
      }

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
      if (!res.ok) {
        setActionError(data.error || 'Failed to add event.');
      } else {
        setActionSuccess('Match event added.');
        setEventPlayerId('');
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
      setActionError('An error occurred adding event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEvent = async (eventId: string) => {
    if (!scoreEditMatch) return;
    setSubmitting(true);
    setActionError(null);

    try {
      // If teams were modified in the header, persist match updates first
      if (editTeamAId !== scoreEditMatch.teamAId || editTeamBId !== scoreEditMatch.teamBId) {
        await fetch('/api/admin/matches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: scoreEditMatch.id,
            teamAId: editTeamAId,
            teamBId: editTeamBId,
            status: matchStatus,
            date: matchDate ? new Date(matchDate).toISOString() : undefined,
            time: matchTime,
            venue: matchVenue,
            notes: matchNotes,
          }),
        });
      }

      const res = await fetch(`/api/admin/matches/${scoreEditMatch.id}/events`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          teamId: editEvTeamId,
          playerId: editEvPlayerId || null,
          type: editEvType,
          minute: Number(editEvMinute),
          notes: editEvNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to update event.');
      } else {
        setActionSuccess('Match event updated successfully.');
        setEditingEventId(null);
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
      setActionError('An error occurred updating event.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingEvent = (evt: MatchEvent) => {
    setEditingEventId(evt.id);
    setEditEvTeamId(evt.team.id);
    setEditEvPlayerId(evt.playerId || '');
    setEditEvType(evt.type);
    setEditEvMinute(evt.minute);
    setEditEvNotes(evt.notes || '');
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!scoreEditMatch) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/matches/${scoreEditMatch.id}/events?eventId=${eventId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to delete event.');
      } else {
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
      setActionError('An error occurred deleting event.');
    } finally {
      setSubmitting(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/40">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Match Operations & Score Recalculation
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            Match Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
            Schedule fixtures, edit scores, record goal events, and automatically update league standings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGenerateFixtures}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-slate-800/95 hover:bg-slate-700/95 border-2 border-emerald-400/70 text-emerald-200 hover:text-white font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-md shadow-slate-950/60 hover:border-emerald-300 hover:shadow-emerald-900/40 active:scale-95 disabled:opacity-50"
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
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:via-teal-300 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 border-2 border-emerald-300/80 hover:border-emerald-200 flex items-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4 text-white stroke-[3] drop-shadow-sm" />
            <span className="drop-shadow-sm">Schedule Match</span>
          </button>
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

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/60 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-300">
          <Calendar className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-black text-white uppercase">No matches scheduled</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
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
                className="rounded-2xl p-5 bg-slate-900/85 backdrop-blur-md border border-white/20 flex flex-col justify-between space-y-4 hover:border-emerald-400/60 transition-all duration-200 shadow-xl shadow-slate-950/50"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded border border-amber-400/40">
                      Match #{m.matchNumber}
                    </span>
                    <span className="font-black text-slate-200 uppercase">{m.round}</span>
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
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="text-xs text-slate-200 font-semibold truncate max-w-[60%]">
                    {m.time} • {m.venue}
                  </div>

                  <button
                    onClick={() => openScoreModal(m)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white border border-emerald-400/50 hover:border-emerald-300 font-extrabold uppercase tracking-wider text-[11px] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit2 className="w-3 h-3 text-emerald-400" />
                    <span>Edit Match & Events</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL MATCH & EVENTS EDIT MODAL */}
      {scoreEditMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  Edit Match #{scoreEditMatch.matchNumber}
                </h3>
                <span className="text-xs text-slate-400">
                  Update teams, schedule, venue, scores, and goal scorers
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
              {/* TEAMS SELECTION */}
              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider block">
                    Participating Teams
                  </span>
                  {editTeamAId && editTeamBId && editTeamAId === editTeamBId && (
                    <span className="text-[11px] font-bold text-rose-400 animate-pulse">
                      ⚠️ Teams must be different
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                      Home Team (Team A) <span className="text-emerald-400">*</span>
                    </label>
                    <select
                      value={editTeamAId}
                      onChange={(e) => handleTeamAChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                      Away Team (Team B) <span className="text-emerald-400">*</span>
                    </label>
                    <select
                      value={editTeamBId}
                      onChange={(e) => handleTeamBChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {editTeamAId && editTeamBId && editTeamAId === editTeamBId && (
                  <p className="text-xs text-rose-400 font-medium">
                    A team cannot play against itself. Please select two different teams.
                  </p>
                )}
              </div>

              {/* SCORE INPUT CONTROLS */}
              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider block">
                    Official Match Scoreline
                  </span>
                  {scoreEditMatch.events.filter((e) => e.type === 'GOAL').length > 0 && (
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Synced with {scoreEditMatch.events.filter((e) => e.type === 'GOAL').length} goal event(s)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 items-center text-center">
                  <div>
                    <span className="text-xs font-bold text-white block mb-1 truncate">
                      {teams.find((t) => t.id === editTeamAId)?.shortName || 'Home Team'}
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
                      {teams.find((t) => t.id === editTeamBId)?.shortName || 'Away Team'}
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

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  placeholder="Fixture notes or details..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Save Match Score & Recalculate */}
              <button
                type="submit"
                disabled={submitting || (editTeamAId === editTeamBId)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition disabled:opacity-50"
              >
                {submitting ? 'Saving Match...' : 'Save Match Details & Recalculate'}
              </button>
            </form>

            {/* RECORD MATCH EVENTS (GOALS / CARDS) */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Match Goal & Card Events
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Add, edit, or remove goals. Scores and statistics update automatically.
                  </p>
                </div>
              </div>

              {/* Add event row */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider block">
                  + Record New Event
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Select Team */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Team</label>
                    <select
                      value={eventTeamId}
                      onChange={(e) => {
                        setEventTeamId(e.target.value);
                        setEventPlayerId('');
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                    >
                      <option value={editTeamAId}>
                        {teams.find((t) => t.id === editTeamAId)?.shortName || 'Home Team'}
                      </option>
                      <option value={editTeamBId}>
                        {teams.find((t) => t.id === editTeamBId)?.shortName || 'Away Team'}
                      </option>
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
                      <option value="">-- Optional / Team Goal --</option>
                      {(eventTeamId === editTeamBId ? teamBPlayers : teamAPlayers).map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.jerseyNumber} {p.name} ({p.position})
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
                      max={100}
                      value={eventMinute}
                      onChange={(e) => setEventMinute(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddEvent}
                  disabled={submitting || (editTeamAId === editTeamBId)}
                  className="w-full py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-bold uppercase transition disabled:opacity-50"
                >
                  + Add Event to Match
                </button>
              </div>

              {/* Events List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {scoreEditMatch.events.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3 bg-slate-950/40 rounded-xl border border-white/5">
                    No events recorded for this match yet.
                  </p>
                ) : (
                  scoreEditMatch.events.map((evt) => {
                    const isEditing = editingEventId === evt.id;

                    if (isEditing) {
                      return (
                        <div
                          key={evt.id}
                          className="p-3 rounded-xl bg-slate-950 border border-emerald-500/60 space-y-2.5 shadow-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-emerald-400">
                              Edit Event
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingEventId(null)}
                              className="text-slate-400 hover:text-white text-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                Team
                              </label>
                              <select
                                value={editEvTeamId}
                                onChange={(e) => {
                                  setEditEvTeamId(e.target.value);
                                  setEditEvPlayerId('');
                                }}
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                              >
                                <option value={editTeamAId}>
                                  {teams.find((t) => t.id === editTeamAId)?.shortName || 'Home Team'}
                                </option>
                                <option value={editTeamBId}>
                                  {teams.find((t) => t.id === editTeamBId)?.shortName || 'Away Team'}
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                Type
                              </label>
                              <select
                                value={editEvType}
                                onChange={(e) => setEditEvType(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                              >
                                <option value="GOAL">⚽ Goal</option>
                                <option value="YELLOW_CARD">🟨 Yellow Card</option>
                                <option value="RED_CARD">🟥 Red Card</option>
                                <option value="GREEN_CARD">🟩 Green Card</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                Scorer / Player
                              </label>
                              <select
                                value={editEvPlayerId}
                                onChange={(e) => setEditEvPlayerId(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs truncate"
                              >
                                <option value="">-- Optional / Team Goal --</option>
                                {(editEvTeamId === editTeamBId ? teamBPlayers : teamAPlayers).map((p) => (
                                  <option key={p.id} value={p.id}>
                                    #{p.jerseyNumber} {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                Minute (&apos;)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={editEvMinute}
                                onChange={(e) => setEditEvMinute(Number(e.target.value))}
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingEventId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateEvent(evt.id)}
                              disabled={submitting}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={evt.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-white/5 hover:border-white/15 text-xs transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                            {evt.minute}&apos;
                          </span>
                          <span className="text-sm">
                            {evt.type === 'GOAL'
                              ? '⚽'
                              : evt.type === 'YELLOW_CARD'
                              ? '🟨'
                              : evt.type === 'RED_CARD'
                              ? '🟥'
                              : '🟩'}
                          </span>
                          <span className="font-bold text-white">
                            {evt.player ? `#${evt.player.jerseyNumber} ${evt.player.name}` : evt.team.shortName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                            {evt.team.shortName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingEvent(evt)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-400 transition"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                            title="Remove Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
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
