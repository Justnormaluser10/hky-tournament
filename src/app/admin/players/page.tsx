'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  UploadCloud,
} from 'lucide-react';
import { SportsAvatar } from '@/components/ui/SportsAvatar';

interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  photo: string | null;
  status: string;
  isCaptain: boolean;
  teamId: string;
  team: {
    id: string;
    name: string;
    shortName: string;
    primaryColor: string;
  };
}

interface TeamOption {
  id: string;
  name: string;
  shortName: string;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('');
  const [selectedPositionFilter, setSelectedPositionFilter] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);

  const [teamId, setTeamId] = useState('');
  const [name, setName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('');
  const [position, setPosition] = useState('FORWARD');
  const [photo, setPhoto] = useState('');
  const [isCaptain, setIsCaptain] = useState(false);
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch('/api/admin/players'),
        fetch('/api/admin/teams'),
      ]);
      if (pRes.ok && tRes.ok) {
        const pData = await pRes.json();
        const tData = await tRes.json();
        setPlayers(pData.players || []);
        setTeams(tData.teams || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setTeamId(teams[0]?.id || '');
    setName('');
    setJerseyNumber('');
    setPosition('FORWARD');
    setPhoto('');
    setIsCaptain(false);
    setStatus('ACTIVE');
    setIsAddOpen(true);
  };

  const openEditModal = (p: Player) => {
    setEditPlayer(p);
    setTeamId(p.teamId);
    setName(p.name);
    setJerseyNumber(p.jerseyNumber);
    setPosition(p.position);
    setPhoto(p.photo || '');
    setIsCaptain(p.isCaptain);
    setStatus(p.status);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPhoto(data.url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    const isEdit = Boolean(editPlayer);
    const url = '/api/admin/players';
    const method = isEdit ? 'PUT' : 'POST';
    const body = {
      id: editPlayer?.id,
      teamId,
      name,
      jerseyNumber: Number(jerseyNumber),
      position,
      photo: photo || null,
      isCaptain,
      status,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to save player.');
      } else {
        setActionSuccess(
          isEdit ? `Player ${data.player.name} updated.` : `Player ${data.player.name} registered.`
        );
        setIsAddOpen(false);
        setEditPlayer(null);
        fetchData();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePlayer) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/players?id=${deletePlayer.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setActionError('Failed to delete player.');
      } else {
        setActionSuccess(`Player ${deletePlayer.name} deleted.`);
        setDeletePlayer(null);
        fetchData();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlayers = players.filter((p) => {
    if (selectedTeamFilter && p.teamId !== selectedTeamFilter) return false;
    if (selectedPositionFilter && p.position !== selectedPositionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/40">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            Central Player Registry
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            Player Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
            Maintain registered field hockey athletes, jersey allocations, and positions
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:via-teal-300 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 border-2 border-emerald-300/80 hover:border-emerald-200 flex items-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 text-white stroke-[3] drop-shadow-sm" />
          <span className="drop-shadow-sm">Add Player</span>
        </button>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/20 text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200 uppercase">Filter:</span>
        </div>

        <select
          value={selectedTeamFilter}
          onChange={(e) => setSelectedTeamFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/20 text-white text-xs focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Teams ({teams.length})</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.shortName})
            </option>
          ))}
        </select>

        <select
          value={selectedPositionFilter}
          onChange={(e) => setSelectedPositionFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/20 text-white text-xs focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Positions</option>
          <option value="GOALKEEPER">Goalkeeper</option>
          <option value="DEFENDER">Defender</option>
          <option value="MIDFIELDER">Midfielder</option>
          <option value="FORWARD">Forward</option>
          <option value="UTILITY">Utility</option>
        </select>

        <span className="ml-auto text-slate-300 font-mono font-semibold">
          Showing {filteredPlayers.length} of {players.length} Players
        </span>
      </div>

      {/* Players Table */}
      <div className="rounded-2xl overflow-hidden bg-slate-900/85 backdrop-blur-md border border-white/20 shadow-xl shadow-slate-950/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950/90 text-slate-200 font-black uppercase text-[11px] tracking-wider border-b border-white/15">
              <tr>
                <th className="py-3.5 px-4 text-center">#</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Team</th>
                <th className="py-3.5 px-4">Position</th>
                <th className="py-3.5 px-4 text-center">Captain</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-medium">
              {filteredPlayers.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition">
                  <td className="py-3.5 px-4 text-center font-mono font-black text-amber-400">
                    #{p.jerseyNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <SportsAvatar
                        photo={p.photo}
                        name={p.name}
                        jerseyNumber={p.jerseyNumber}
                        size="sm"
                      />
                      <span className="font-bold text-white text-xs">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    {p.team.name}
                  </td>
                  <td className="py-3.5 px-4 uppercase font-mono text-[11px] text-slate-400">
                    {p.position}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {p.isCaptain ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                        ⭐ CAPTAIN
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px] font-bold">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        title="Edit Player"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletePlayer(p)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                        title="Delete Player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {(isAddOpen || editPlayer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black uppercase text-white tracking-wider">
                {editPlayer ? `Edit Player: ${editPlayer.name}` : 'Register Player'}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditPlayer(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Team <span className="text-emerald-400">*</span>
                </label>
                <select
                  required
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Patel"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Jersey Number <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={99}
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="10"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Position <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="GOALKEEPER">Goalkeeper</option>
                    <option value="DEFENDER">Defender</option>
                    <option value="MIDFIELDER">Midfielder</option>
                    <option value="FORWARD">Forward</option>
                    <option value="UTILITY">Utility</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload or URL (OPTIONAL) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Player Photo (Optional)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder="Image URL or upload file below..."
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{uploading ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {photo && (
                      <button
                        type="button"
                        onClick={() => setPhoto('')}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    If omitted, a professional default sports avatar silhouette is automatically used.
                  </span>
                </div>
              </div>

              {/* Captain Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-white/10">
                <input
                  type="checkbox"
                  id="captainToggle2"
                  checked={isCaptain}
                  onChange={(e) => setIsCaptain(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
                />
                <label htmlFor="captainToggle2" className="text-xs text-slate-300 cursor-pointer font-bold">
                  Designate as Team Captain ⭐
                </label>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditPlayer(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Saving...' : 'Save Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletePlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black uppercase text-white tracking-wider">
              Delete Player?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{deletePlayer.name}</strong> (#{deletePlayer.jerseyNumber})?
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletePlayer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
