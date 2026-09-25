'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TableProperties,
  Calendar,
  Edit2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface StandingRow {
  position: number;
  teamId: string;
  name: string;
  shortName: string;
  logo: string | null;
  primaryColor: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
  isQualified: boolean;
  qualificationStatus?: string | null;
  isOverridden?: boolean;
  overrideNotes?: string | null;
}

export default function AdminStandingsPage() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatusTeamId, setUpdatingStatusTeamId] = useState<string | null>(null);

  // Edit Modal State
  const [editRow, setEditRow] = useState<StandingRow | null>(null);
  const [posInput, setPosInput] = useState<string>('');
  const [pInput, setPInput] = useState<number>(0);
  const [wInput, setWInput] = useState<number>(0);
  const [dInput, setDInput] = useState<number>(0);
  const [lInput, setLInput] = useState<number>(0);
  const [gfInput, setGfInput] = useState<number>(0);
  const [gaInput, setGaInput] = useState<number>(0);
  const [ptsInput, setPtsInput] = useState<number>(0);
  const [qStatusInput, setQStatusInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  const fetchStandings = async () => {
    try {
      const res = await fetch('/api/admin/standings');
      if (res.ok) {
        const data = await res.json();
        setStandings(data.standings || []);
        setTournament(data.tournament || null);
      }
    } catch (e) {
      console.error(e);
      setActionError('Failed to load standings data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  const handleSetQualificationStatus = async (teamId: string, status: string | null) => {
    setUpdatingStatusTeamId(teamId);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/standings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, qualificationStatus: status }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.standings) {
          setStandings(data.standings);
        } else {
          fetchStandings();
        }
        setActionSuccess(`Updated qualification status to ${status || 'NONE'}`);
      } else {
        setActionError(data.error || 'Failed to update qualification status');
      }
    } catch (e) {
      setActionError('Error updating qualification status');
    } finally {
      setUpdatingStatusTeamId(null);
    }
  };

  const openEditModal = (row: StandingRow) => {
    setEditRow(row);
    setPosInput('');
    setPInput(row.played);
    setWInput(row.won);
    setDInput(row.drawn);
    setLInput(row.lost);
    setGfInput(row.goalsFor);
    setGaInput(row.goalsAgainst);
    setPtsInput(row.points);
    setQStatusInput(row.qualificationStatus || '');
    setNotesInput(row.overrideNotes || '');
    setActionError(null);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setSubmitting(true);
    setActionError(null);

    const calcGD = Number(gfInput) - Number(gaInput);

    try {
      const res = await fetch('/api/admin/standings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: editRow.teamId,
          position: posInput ? Number(posInput) : null,
          played: Number(pInput),
          won: Number(wInput),
          drawn: Number(dInput),
          lost: Number(lInput),
          goalsFor: Number(gfInput),
          goalsAgainst: Number(gaInput),
          goalDifference: calcGD,
          points: Number(ptsInput),
          qualificationStatus: qStatusInput || null,
          notes: notesInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to save correction.');
      } else {
        setActionSuccess(
          `Standings successfully corrected for ${editRow.name}. Public standings and honours updated immediately.`
        );
        setEditRow(null);
        if (data.standings) {
          setStandings(data.standings);
        } else {
          fetchStandings();
        }
      }
    } catch (err) {
      setActionError('An error occurred while saving correction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetTeam = async (teamId: string, teamName: string) => {
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/standings?teamId=${teamId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to reset standings.');
      } else {
        setActionSuccess(
          `Standings for ${teamName} reset back to automatic calculation from completed match results.`
        );
        setEditRow(null);
        if (data.standings) {
          setStandings(data.standings);
        } else {
          fetchStandings();
        }
      }
    } catch (err) {
      setActionError('An error occurred while resetting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAll = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset ALL manual standings corrections? The table will recalculate strictly from match results.'
      )
    ) {
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/standings?resetAll=true', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to reset all standings.');
      } else {
        setActionSuccess('All standings reset to automatic calculation from match results.');
        if (data.standings) {
          setStandings(data.standings);
        } else {
          fetchStandings();
        }
      }
    } catch (err) {
      setActionError('An error occurred resetting all.');
    } finally {
      setSubmitting(false);
    }
  };

  const qualificationCount = tournament?.qualificationCount || 4;
  const hasAnyOverrides = standings.some((s) => s.isOverridden);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/40">
            <TableProperties className="w-3.5 h-3.5 text-amber-400" />
            League Standings Management & Audit
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            Standings Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
            Review automatic calculations and apply official corrections to Points, GD, Goals, or Positions when required
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {hasAnyOverrides && (
            <button
              onClick={handleResetAll}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-extrabold uppercase tracking-wider transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All to Auto</span>
            </button>
          )}

          <Link
            href="/admin/matches"
            className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 hover:text-white border border-emerald-400/50 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Match Scores</span>
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

      {/* Standings Table Card */}
      <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900/85 backdrop-blur-md border border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-200 whitespace-nowrap sm:whitespace-normal">
            <thead className="bg-slate-950/90 text-slate-200 font-black uppercase text-xs tracking-wider border-b border-white/15">
              <tr>
                <th className="py-4 px-3 text-center w-14">Pos</th>
                <th className="py-4 px-4">Club / Team</th>
                <th className="py-4 px-2.5 text-center" title="Played">P</th>
                <th className="py-4 px-2.5 text-center text-emerald-400" title="Won">W</th>
                <th className="py-4 px-2.5 text-center text-slate-400" title="Drawn">D</th>
                <th className="py-4 px-2.5 text-center text-rose-400" title="Lost">L</th>
                <th className="py-4 px-2.5 text-center" title="Goals For">GF</th>
                <th className="py-4 px-2.5 text-center" title="Goals Against">GA</th>
                <th className="py-4 px-2.5 text-center font-bold" title="Goal Difference">GD</th>
                <th className="py-4 px-3 text-center font-black text-amber-400 text-base" title="Points">Pts</th>
                <th className="py-4 px-3 text-center">Status (Q/E)</th>
                <th className="py-4 px-3 text-center">Overrides</th>
                <th className="py-4 px-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    Loading standings data...
                  </td>
                </tr>
              ) : standings.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    No teams or standings records available.
                  </td>
                </tr>
              ) : (
                standings.map((row) => {
                  const isQualified = row.position <= qualificationCount;

                  return (
                    <tr
                      key={row.teamId}
                      className={`hover:bg-white/5 transition duration-150 ${
                        isQualified ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono font-bold text-xs ${
                            row.position === 1
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                              : isQualified
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {row.position}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <TeamLogo
                            name={row.name}
                            shortName={row.shortName}
                            logo={row.logo}
                            primaryColor={row.primaryColor}
                            size="sm"
                          />
                          <div>
                            <span className="font-bold text-white text-sm block">{row.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {row.shortName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-2.5 text-center font-mono">{row.played}</td>
                      <td className="py-3.5 px-2.5 text-center font-mono font-bold text-emerald-400">{row.won}</td>
                      <td className="py-3.5 px-2.5 text-center font-mono text-slate-400">{row.drawn}</td>
                      <td className="py-3.5 px-2.5 text-center font-mono text-rose-400">{row.lost}</td>
                      <td className="py-3.5 px-2.5 text-center font-mono">{row.goalsFor}</td>
                      <td className="py-3.5 px-2.5 text-center font-mono">{row.goalsAgainst}</td>
                      <td className="py-3.5 px-2.5 text-center font-mono font-bold">
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-black text-amber-400 text-base">
                        {row.points}
                      </td>

                      {/* Qualification Status (Q / E / Clear) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center rounded-lg bg-slate-950 p-1 border border-white/10 gap-1 shadow-inner">
                          <button
                            type="button"
                            onClick={() => handleSetQualificationStatus(row.teamId, null)}
                            disabled={updatingStatusTeamId === row.teamId}
                            title="Clear qualification status"
                            className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition ${
                              !row.qualificationStatus
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            —
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetQualificationStatus(row.teamId, 'Q')}
                            disabled={updatingStatusTeamId === row.teamId}
                            title="Mark as Qualified (Q)"
                            className={`px-2 py-0.5 rounded text-[11px] font-black transition ${
                              row.qualificationStatus === 'Q'
                                ? 'bg-emerald-500 text-white shadow-md ring-1 ring-emerald-300'
                                : 'text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            Q
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetQualificationStatus(row.teamId, 'E')}
                            disabled={updatingStatusTeamId === row.teamId}
                            title="Mark as Eliminated (E)"
                            className={`px-2 py-0.5 rounded text-[11px] font-black transition ${
                              row.qualificationStatus === 'E'
                                ? 'bg-rose-500 text-white shadow-md ring-1 ring-rose-300'
                                : 'text-rose-400 hover:bg-rose-500/20'
                            }`}
                          >
                            E
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {row.isOverridden ? (
                          <span
                            className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1"
                            title={row.overrideNotes || 'Administrative correction active'}
                          >
                            <Sparkles className="w-3 h-3" /> Corrected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">
                            Auto
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => openEditModal(row)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white border border-emerald-400/40 text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 mx-auto"
                        >
                          <Edit2 className="w-3 h-3 text-emerald-400" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT STANDING CORRECTION MODAL */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <TeamLogo
                  name={editRow.name}
                  shortName={editRow.shortName}
                  logo={editRow.logo}
                  primaryColor={editRow.primaryColor}
                  size="md"
                />
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">
                    Correct Standings: {editRow.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Official tournament administrator adjustment
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditRow(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Adjusting these values applies an authoritative administrative override that persists and displays on the public website. You can revert back to match-calculated values at any time.
                </span>
              </div>

              {/* Position and Points */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Position (Rank)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={posInput}
                    onChange={(e) => setPosInput(e.target.value)}
                    placeholder="Leave blank for auto"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Current: #{editRow.position}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Points (Pts) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={ptsInput}
                    onChange={(e) => setPtsInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-400 text-sm font-mono font-black focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Win={tournament?.pointsForWin ?? 3} / Draw={tournament?.pointsForDraw ?? 1}</span>
                </div>
              </div>

              {/* Match records: Played, Won, Drawn, Lost */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                    Played
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pInput}
                    onChange={(e) => setPInput(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Won
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={wInput}
                    onChange={(e) => setWInput(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-400 text-xs text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Drawn
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={dInput}
                    onChange={(e) => setDInput(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-white/10 text-slate-300 text-xs text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-rose-400 mb-1">
                    Lost
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={lInput}
                    onChange={(e) => setLInput(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-rose-500/30 text-rose-400 text-xs text-center font-mono font-bold"
                  />
                </div>
              </div>

              {/* Goals For, Goals Against, Calculated GD */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                    Goals For (GF)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={gfInput}
                    onChange={(e) => setGfInput(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                    Goals Against (GA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={gaInput}
                    onChange={(e) => setGaInput(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-teal-400 mb-1">
                    Goal Diff (GD)
                  </label>
                  <div className="py-2 px-2 rounded-xl bg-slate-950 border border-white/10 text-teal-300 text-xs text-center font-mono font-black">
                    {Number(gfInput) - Number(gaInput) > 0
                      ? `+${Number(gfInput) - Number(gaInput)}`
                      : Number(gfInput) - Number(gaInput)}
                  </div>
                </div>
              </div>

              {/* Qualification Status (Q / E) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Qualification Status (Q / E)
                </label>
                <select
                  value={qStatusInput}
                  onChange={(e) => setQStatusInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">None (Regular League Team)</option>
                  <option value="Q">Q — Qualified for Knockouts</option>
                  <option value="E">E — Eliminated from Tournament</option>
                </select>
              </div>

              {/* Correction Notes / Reason */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Reason / Notes for Official Correction
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Official league committee correction after review"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                {editRow.isOverridden ? (
                  <button
                    type="button"
                    onClick={() => handleResetTeam(editRow.teamId, editRow.name)}
                    disabled={submitting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Match Auto</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRow(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40"
                  >
                    {submitting ? 'Saving...' : 'Apply Correction'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
