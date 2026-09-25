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
  Settings,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { KnockoutBracket, KnockoutMatchData } from '@/components/public/KnockoutBracket';
import {
  formatMatchDate,
  formatMatchTime,
  toHtmlDateValue,
  toHtmlTimeValue,
} from '@/lib/dateUtils';

interface AvailableTeam {
  id: string;
  name: string;
  shortName: string;
  logo: string | null;
  primaryColor: string;
}

export default function AdminKnockoutPage() {
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatchData[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<AvailableTeam[]>([]);
  const [tournamentStage, setTournamentStage] = useState('LEAGUE');
  const [leagueStatus, setLeagueStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Edit Date Modal
  const [editingDateMatch, setEditingDateMatch] = useState<KnockoutMatchData | null>(null);
  const [inputMatchDate, setInputMatchDate] = useState<string>('');
  const [inputMatchTime, setInputMatchTime] = useState<string>('');
  const [savingDate, setSavingDate] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Edit Teams Modal
  const [editingTeamsMatch, setEditingTeamsMatch] = useState<KnockoutMatchData | null>(null);
  const [selectedTeamAId, setSelectedTeamAId] = useState<string>('');
  const [selectedTeamBId, setSelectedTeamBId] = useState<string>('');
  const [savingTeams, setSavingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  // Quick Score Modal
  const [editingScoreMatch, setEditingScoreMatch] = useState<KnockoutMatchData | null>(null);
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [matchStatus, setMatchStatus] = useState<string>('COMPLETED');
  const [savingScore, setSavingScore] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // Match Details / Settings Modal
  const [editingDetailsMatch, setEditingDetailsMatch] = useState<KnockoutMatchData | null>(null);
  const [detailsTime, setDetailsTime] = useState<string>('');
  const [detailsVenue, setDetailsVenue] = useState<string>('');
  const [detailsStatus, setDetailsStatus] = useState<string>('');
  const [savingDetails, setSavingDetails] = useState(false);

  const fetchKnockout = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/knockout');
      if (res.ok) {
        const data = await res.json();
        const matches = (data.knockoutMatches && data.knockoutMatches.length > 0)
          ? data.knockoutMatches
          : (data.previewMatches || []);

        setKnockoutMatches(matches);
        setIsPreview(Boolean(data.isPreview));
        if (data.tournament) setTournamentStage(data.tournament.currentStage);
        if (data.leagueStatus) setLeagueStatus(data.leagueStatus);

        if (data.teams && data.teams.length > 0) {
          setAvailableTeams(data.teams);
        } else {
          const teamsRes = await fetch('/api/admin/teams');
          if (teamsRes.ok) {
            const teamsData = await teamsRes.json();
            setAvailableTeams(teamsData.teams || []);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching knockout:', e);
      setActionError('Failed to load knockout bracket data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnockout();
  }, []);

  // Open Edit Date Editor
  const handleOpenEditDate = (k: KnockoutMatchData) => {
    setEditingDateMatch(k);
    const m = k.match;
    setInputMatchDate(toHtmlDateValue(m.scheduledAt || m.date || ''));
    setInputMatchTime(toHtmlTimeValue(m.time || '18:00'));
    setDateError(null);
  };

  // Save Scheduled Date & Time
  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDateMatch) return;

    if (!inputMatchDate) {
      setDateError('Please select a match date.');
      return;
    }

    setSavingDate(true);
    setDateError(null);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/knockout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knockoutMatchId: editingDateMatch.id,
          date: inputMatchDate,
          time: inputMatchTime || '18:00',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDateError(data.error || 'Failed to update match schedule.');
      } else {
        const formattedDate = formatMatchDate(inputMatchDate);
        const formattedTime = formatMatchTime(inputMatchTime || '18:00');
        setActionSuccess(
          `Schedule updated for Match #${editingDateMatch.match.matchNumber} (${editingDateMatch.stage.replace('_', ' ')}): ${formattedDate} at ${formattedTime}!`
        );
        setEditingDateMatch(null);
        await fetchKnockout();
      }
    } catch (err) {
      setDateError('An error occurred while saving the schedule.');
    } finally {
      setSavingDate(false);
    }
  };

  // Clear / Remove Scheduled Date
  const handleClearDate = async () => {
    if (!editingDateMatch) return;

    setSavingDate(true);
    setDateError(null);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/knockout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knockoutMatchId: editingDateMatch.id,
          date: null,
          time: inputMatchTime || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDateError(data.error || 'Failed to clear match schedule.');
      } else {
        setActionSuccess(
          `Schedule cleared for Match #${editingDateMatch.match.matchNumber} (${editingDateMatch.stage.replace('_', ' ')}).`
        );
        setEditingDateMatch(null);
        await fetchKnockout();
      }
    } catch (err) {
      setDateError('An error occurred while clearing the schedule.');
    } finally {
      setSavingDate(false);
    }
  };

  // Open Direct Teams Editor
  const handleOpenEditTeams = (k: KnockoutMatchData, slot?: 'A' | 'B') => {
    setEditingTeamsMatch(k);
    const m = k.match;

    // Team A determination:
    if (k.seedLabelA === 'NO TEAM') {
      setSelectedTeamAId('NO_TEAM');
    } else {
      setSelectedTeamAId(m.teamA?.id || '');
    }

    // Team B determination:
    if (k.seedLabelB === 'NO TEAM') {
      setSelectedTeamBId('NO_TEAM');
    } else {
      setSelectedTeamBId(m.teamB?.id || '');
    }

    setTeamsError(null);
  };

  // Save Direct Teams
  const handleSaveTeams = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeamsMatch) return;

    // Validation: if both are set to the same real team
    if (
      selectedTeamAId &&
      selectedTeamBId &&
      selectedTeamAId !== 'NO_TEAM' &&
      selectedTeamBId !== 'NO_TEAM' &&
      selectedTeamAId === selectedTeamBId
    ) {
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
          knockoutMatchId: editingTeamsMatch.id,
          teamAId: selectedTeamAId || null,
          teamBId: selectedTeamBId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTeamsError(data.error || 'Failed to update teams.');
      } else {
        const teamAName =
          selectedTeamAId === 'NO_TEAM'
            ? 'NO TEAM'
            : availableTeams.find((t) => t.id === selectedTeamAId)?.name || 'Team A';
        const teamBName =
          selectedTeamBId === 'NO_TEAM'
            ? 'NO TEAM'
            : availableTeams.find((t) => t.id === selectedTeamBId)?.name || 'Team B';

        setActionSuccess(
          `Match #${editingTeamsMatch.match.matchNumber} (${editingTeamsMatch.stage.replace('_', ' ')}) updated: ${teamAName} vs ${teamBName}! Bracket recalculated.`
        );
        setEditingTeamsMatch(null);
        await fetchKnockout();
      }
    } catch (err) {
      setTeamsError('An error occurred while saving teams.');
    } finally {
      setSavingTeams(false);
    }
  };

  // Open Direct Score Editor
  const handleOpenEditScore = (k: KnockoutMatchData) => {
    setEditingScoreMatch(k);
    setScoreA(k.match.teamAScore ?? 0);
    setScoreB(k.match.teamBScore ?? 0);
    setMatchStatus(k.match.status || 'COMPLETED');
    setScoreError(null);
  };

  // Save Direct Score
  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScoreMatch) return;

    setSavingScore(true);
    setScoreError(null);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/knockout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knockoutMatchId: editingScoreMatch.id,
          teamAScore: Number(scoreA),
          teamBScore: Number(scoreB),
          status: matchStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScoreError(data.error || 'Failed to record score.');
      } else {
        setActionSuccess(
          `Match #${editingScoreMatch.match.matchNumber} score saved (${scoreA} - ${scoreB})! Downstream progression recalculated.`
        );
        setEditingScoreMatch(null);
        await fetchKnockout();
      }
    } catch (err) {
      setScoreError('An error occurred while recording score.');
    } finally {
      setSavingScore(false);
    }
  };

  // Open Match Settings
  const handleOpenEditMatch = (k: KnockoutMatchData) => {
    setEditingDetailsMatch(k);
    setDetailsTime(k.match.time || '18:00');
    setDetailsVenue(k.match.venue || 'Pitch 1 - Main Turf Arena');
    setDetailsStatus(k.match.status || 'UPCOMING');
  };

  // Save Match Settings
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDetailsMatch) return;

    setSavingDetails(true);
    try {
      // If it's a real DB match, update via /api/admin/matches
      if (!editingDetailsMatch.id.startsWith('preview-')) {
        await fetch('/api/admin/matches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingDetailsMatch.match.id,
            time: detailsTime,
            venue: detailsVenue,
            status: detailsStatus,
          }),
        });
      } else {
        await fetch('/api/admin/knockout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            knockoutMatchId: editingDetailsMatch.id,
            status: detailsStatus,
          }),
        });
      }
      setActionSuccess(`Match #${editingDetailsMatch.match.matchNumber} details updated!`);
      setEditingDetailsMatch(null);
      await fetchKnockout();
    } catch (err) {
      setActionError('Failed to update match details.');
    } finally {
      setSavingDetails(false);
    }
  };

  // Trigger Seeding (When league is complete)
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
        setActionSuccess('Knockout bracket successfully seeded from official league standings!');
        await fetchKnockout();
      }
    } catch (e) {
      setActionError('An error occurred during bracket seeding.');
    } finally {
      setGenerating(false);
    }
  };

  const isLeagueIncomplete = leagueStatus && !leagueStatus.isComplete;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. CONTROL CENTER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
            <GitFork className="w-3.5 h-3.5 text-amber-400" />
            KNOCKOUT CONTROL CENTER
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Playoff Bracket Architecture
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            Tournament Status:{' '}
            <strong className="text-emerald-300 font-bold uppercase">{tournamentStage}</strong>
            {leagueStatus && (
              <span>
                {' '}
                • League Progress:{' '}
                <strong className="text-amber-300 font-mono">
                  {leagueStatus.completedMatches} / {leagueStatus.expectedMatches || 15} Matches ({leagueStatus.percentComplete}%)
                </strong>
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchKnockout}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
            title="Refresh bracket data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleGenerateBracket}
            disabled={generating || isLeagueIncomplete}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition ${
              isLeagueIncomplete
                ? 'bg-slate-800/80 text-slate-400 border border-white/10 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:via-teal-300 text-white shadow-emerald-500/40 border border-emerald-300/80'
            }`}
            title={
              isLeagueIncomplete
                ? 'Knockout automatically unlocks after all league matches are completed'
                : 'Generate official knockout fixtures'
            }
          >
            {isLeagueIncomplete ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Knockout Locked (League Incomplete)</span>
              </>
            ) : (
              <>
                <RotateCcw className={`w-4 h-4 text-white ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'Seeding Bracket...' : '🏆 Seed Official Knockouts'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. ALERTS */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-semibold">{actionError}</span>
        </div>
      )}

      {/* 3. KNOCKOUT LOCK STATE BANNER (CLEAR, INFORMATIVE, BRIGHT - NOT DARK/OBSCURED) */}
      {isLeagueIncomplete ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-amber-300 uppercase tracking-wide text-xs sm:text-sm">
                PROJECTED PLAYOFF BRACKET (KNOCKOUT CURRENTLY LOCKED)
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                Knockout officially unlocks after all league matches are completed ({leagueStatus?.completedMatches || 0}/{leagueStatus?.expectedMatches || 15} finished).
                The bracket below shows projected positions from current standings. You can directly edit teams (including &ldquo;NO TEAM&rdquo;), scores, dates, and match settings.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 font-mono font-bold text-amber-400 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30">
            <span>🔒 Locked: {leagueStatus?.completedMatches || 0}/{leagueStatus?.expectedMatches || 15} Played</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-500/40 shadow-lg flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Unlock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black uppercase tracking-wide text-xs sm:text-sm">
                OFFICIAL KNOCKOUT BRACKET UNLOCKED
              </span>
              <p className="text-slate-300 text-[11px] mt-0.5">
                All league fixtures are completed. Changes to teams, scores, dates, and progression update live across all public tournament pages.
              </p>
            </div>
          </div>
          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            🟢 League Complete
          </span>
        </div>
      )}

      {/* 4. THE BRACKET (BRIGHT, FULLY INTERACTIVE, MAIN INTERFACE) */}
      <div className="bg-slate-950/60 p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Championship Playoff Structure (Qualifier 1 ➔ Eliminator ➔ Qualifier 2 ➔ Final)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Direct Edit Controls Active
          </span>
        </div>

        <KnockoutBracket
          knockoutMatches={knockoutMatches}
          currentStage={tournamentStage}
          isPreview={isPreview}
          isAdmin={true}
          onEditTeams={handleOpenEditTeams}
          onEditScore={handleOpenEditScore}
          onEditMatch={handleOpenEditMatch}
          onEditDate={handleOpenEditDate}
        />
      </div>

      {/* 5. DIRECT TEAM EDITING MODAL (Supports ALL teams + "NO TEAM") */}
      {editingTeamsMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-black text-white uppercase text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Edit Teams — Match #{editingTeamsMatch.match.matchNumber}</span>
                </h3>
                <span className="text-xs text-emerald-400 font-mono">
                  {editingTeamsMatch.stage.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeamsMatch(null)}
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
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                  <label className="block text-xs font-black uppercase text-amber-400 tracking-wider">
                    Team A Slot
                  </label>
                  <select
                    value={selectedTeamAId}
                    onChange={(e) => setSelectedTeamAId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-semibold focus:border-emerald-500 focus:outline-none transition"
                  >
                    <option value="" disabled>
                      -- Select Team A --
                    </option>
                    <option value="NO_TEAM" className="text-amber-400 font-bold">
                      🚫 NO TEAM (Black / Empty Placeholder Slot)
                    </option>
                    <optgroup label="Tournament Teams">
                      {availableTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.shortName})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Team B Selection */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                  <label className="block text-xs font-black uppercase text-teal-400 tracking-wider">
                    Team B Slot
                  </label>
                  <select
                    value={selectedTeamBId}
                    onChange={(e) => setSelectedTeamBId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-semibold focus:border-emerald-500 focus:outline-none transition"
                  >
                    <option value="" disabled>
                      -- Select Team B --
                    </option>
                    <option value="NO_TEAM" className="text-amber-400 font-bold">
                      🚫 NO TEAM (Black / Empty Placeholder Slot)
                    </option>
                    <optgroup label="Tournament Teams">
                      {availableTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.shortName})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 leading-relaxed">
                💡 <strong>Manual Seed Protection:</strong> Editing teams directly tags the match with manual assignment protection so automatic seed recalculations will not overwrite your chosen teams.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeamsMatch(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTeams}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                >
                  {savingTeams ? 'Saving Teams...' : 'Save Teams'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DIRECT SCORE EDITING MODAL */}
      {editingScoreMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-black text-white uppercase text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  <span>Record Score — Match #{editingScoreMatch.match.matchNumber}</span>
                </h3>
                <span className="text-xs text-emerald-400 font-mono">
                  {editingScoreMatch.stage.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingScoreMatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scoreError && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{scoreError}</span>
              </div>
            )}

            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                  <label className="block text-xs font-bold uppercase text-slate-300 truncate">
                    {editingScoreMatch.match.teamA?.name || editingScoreMatch.seedLabelA || 'Team A'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono font-black text-2xl text-center focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                  <label className="block text-xs font-bold uppercase text-slate-300 truncate">
                    {editingScoreMatch.match.teamB?.name || editingScoreMatch.seedLabelB || 'Team B'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white font-mono font-black text-2xl text-center focus:border-emerald-500 focus:outline-none"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="COMPLETED">COMPLETED (Advances Winner/Loser Downstream)</option>
                  <option value="LIVE">LIVE</option>
                  <option value="UPCOMING">UPCOMING</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 leading-relaxed">
                Saving score marks the match result and immediately calculates the winner/loser progression to the next knockout round.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingScoreMatch(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScore}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-900/40"
                >
                  {savingScore ? 'Saving Score...' : 'Save & Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. FULL MATCH DETAILS MODAL */}
      {editingDetailsMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-black text-white uppercase text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>Match #{editingDetailsMatch.match.matchNumber} Details</span>
                </h3>
                <span className="text-xs text-emerald-400 font-mono">
                  {editingDetailsMatch.stage.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingDetailsMatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="text"
                  value={detailsTime}
                  onChange={(e) => setDetailsTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. 06:00 PM"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Venue / Pitch
                </label>
                <input
                  type="text"
                  value={detailsVenue}
                  onChange={(e) => setDetailsVenue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Pitch 1 - Main Turf Arena"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={detailsStatus}
                  onChange={(e) => setDetailsStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="LIVE">LIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDetailsMatch(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-900/40"
                >
                  {savingDetails ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. EDIT DATE & TIME MODAL */}
      {editingDateMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm sm:max-w-md bg-slate-950 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-black text-white uppercase text-sm sm:text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>
                    {editingDateMatch.match.scheduledAt ? 'Edit Match Date' : 'Set Match Date'}
                  </span>
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    Match #{editingDateMatch.match.matchNumber}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    • {editingDateMatch.stage.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDateMatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Teams Subheading */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between text-xs">
              <span className="font-black text-white truncate max-w-[120px] sm:max-w-[150px]">
                {editingDateMatch.match.teamA?.name || editingDateMatch.seedLabelA || 'TBD Qualifier'}
              </span>
              <span className="font-mono font-black text-amber-400 text-[10px] px-1.5 py-0.5 rounded bg-black/50">
                VS
              </span>
              <span className="font-black text-white truncate max-w-[120px] sm:max-w-[150px] text-right">
                {editingDateMatch.match.teamB?.name || editingDateMatch.seedLabelB || 'TBD Qualifier'}
              </span>
            </div>

            {/* Current Schedule Status */}
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="text-slate-500">Current:</span>
              {editingDateMatch.match.scheduledAt ? (
                <span className="text-emerald-300 font-bold">
                  {formatMatchDate(editingDateMatch.match.scheduledAt)} at{' '}
                  {formatMatchTime(editingDateMatch.match.time) || editingDateMatch.match.time}
                </span>
              ) : (
                <span className="text-amber-400/90 italic">Scheduled date: Not set</span>
              )}
            </div>

            {dateError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{dateError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDate} className="space-y-4">
              {/* Native Date Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200">
                  Match Date <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={inputMatchDate}
                    onChange={(e) => setInputMatchDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs sm:text-sm font-mono focus:border-emerald-500 focus:outline-none transition [color-scheme:dark]"
                  />
                </div>
                {inputMatchDate && (
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    ➔ Preview: {formatMatchDate(inputMatchDate)}
                  </span>
                )}
              </div>

              {/* Native Time Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-200">
                  Match Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={inputMatchTime}
                    onChange={(e) => setInputMatchTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs sm:text-sm font-mono focus:border-emerald-500 focus:outline-none transition [color-scheme:dark]"
                  />
                </div>
                {inputMatchTime && (
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    ➔ Preview: {formatMatchTime(inputMatchTime)} (IST)
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingDateMatch(null)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDate}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                  >
                    {savingDate ? 'Saving...' : 'Save Date'}
                  </button>
                </div>

                {/* Option to clear/remove scheduled date if one is currently set */}
                {editingDateMatch.match.scheduledAt && (
                  <button
                    type="button"
                    onClick={handleClearDate}
                    disabled={savingDate}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 font-semibold text-[11px] uppercase tracking-wider transition border border-white/5 hover:border-rose-500/30 text-center"
                  >
                    Remove / Clear Scheduled Date
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
