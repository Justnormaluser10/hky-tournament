'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Plus,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  Shield,
} from 'lucide-react';
import { SportsAvatar } from '@/components/ui/SportsAvatar';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  photo: string | null;
  status: string;
  isCaptain: boolean;
  matchEvents?: any[];
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  coach: string | null;
  description: string | null;
  primaryColor: string;
  logo: string | null;
  players: Player[];
}

export default function AdminTeamSquadPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: teamId } = params;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Player Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);

  const [name, setName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('');
  const [position, setPosition] = useState('FORWARD');
  const [photo, setPhoto] = useState('');
  const [isCaptain, setIsCaptain] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Team Logo Edit State
  const [isLogoOpen, setIsLogoOpen] = useState(false);
  const [teamLogo, setTeamLogo] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/public/teams/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const openAddModal = () => {
    setName('');
    setJerseyNumber('');
    setPosition('FORWARD');
    setPhoto('');
    setIsCaptain(false);
    setStatus('ACTIVE');
    setIsAddOpen(true);
  };

  const openLogoModal = () => {
    setTeamLogo(team?.logo || '');
    setIsLogoOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setTeamLogo(data.url);
      }
    } catch (err) {
      console.error('Failed to upload logo:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveTeamLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: team.id,
          name: team.name,
          shortName: team.shortName,
          logo: teamLogo.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to update team logo.');
      } else {
        setActionSuccess(`Logo for team "${team.name}" updated successfully.`);
        setIsLogoOpen(false);
        fetchTeam();
      }
    } catch {
      setActionError('Failed to save team logo.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (p: Player) => {
    setEditPlayer(p);
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

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          name,
          jerseyNumber: Number(jerseyNumber),
          position,
          photo: photo || null,
          isCaptain,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to add player.');
      } else {
        setActionSuccess(`Player ${data.player.name} added to roster.`);
        setIsAddOpen(false);
        fetchTeam();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlayer) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editPlayer.id,
          teamId,
          name,
          jerseyNumber: Number(jerseyNumber),
          position,
          photo: photo || null,
          isCaptain,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to update player.');
      } else {
        setActionSuccess(`Player ${data.player.name} updated.`);
        setEditPlayer(null);
        fetchTeam();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlayer = async () => {
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
        fetchTeam();
      }
    } catch (err) {
      setActionError('An error occurred while deleting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !team) {
    return <div className="p-8 text-center text-slate-400">Loading squad roster...</div>;
  }

  const captain = team.players.find((p) => p.isCaptain);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <Link
        href="/admin/teams"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Teams Management
      </Link>

      {/* Team Banner */}
      <div className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 bg-slate-900/85 backdrop-blur-md border border-white/20 shadow-xl shadow-slate-950/50">
        <div className="flex items-center gap-4">
          <TeamLogo
            name={team.name}
            shortName={team.shortName}
            logo={team.logo}
            primaryColor={team.primaryColor}
            size="xl"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase drop-shadow-sm">
              {team.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1">
              Coach: <strong className="text-white font-bold">{team.coach || 'None'}</strong> •
              Captain:{' '}
              <strong className="text-amber-300 font-black">
                {captain ? `${captain.name} (#${captain.jerseyNumber})` : 'Not assigned'}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={openLogoModal}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 border-2 border-emerald-400/60 hover:border-emerald-300 text-slate-100 hover:text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>Change Logo</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:via-teal-300 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 border-2 border-emerald-300/80 hover:border-emerald-200 flex items-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
          >
            <Plus className="w-4 h-4 text-white stroke-[3] drop-shadow-sm" />
            <span className="drop-shadow-sm">+ Add Player to Squad</span>
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
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Squad Roster Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <span>Squad Roster</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono">
              {team.players.length} Players (Unlimited Allowed)
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4 text-center">#</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Position</th>
                <th className="py-3.5 px-4 text-center">Captain</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-medium">
              {team.players.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition">
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
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

      {/* ADD / EDIT PLAYER MODAL */}
      {(isAddOpen || editPlayer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black uppercase text-white tracking-wider">
                {editPlayer ? `Edit Player: ${editPlayer.name}` : 'Add Player to Squad'}
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

            <form
              onSubmit={editPlayer ? handleUpdatePlayer : handleCreatePlayer}
              className="space-y-4"
            >
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
                  id="captainToggle"
                  checked={isCaptain}
                  onChange={(e) => setIsCaptain(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
                />
                <label htmlFor="captainToggle" className="text-xs text-slate-300 cursor-pointer font-bold">
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

      {/* DELETE CONFIRMATION MODAL */}
      {deletePlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black uppercase text-white tracking-wider">
              Delete Player?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{deletePlayer.name}</strong> from the squad roster?
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
                onClick={handleDeletePlayer}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CHANGE TEAM LOGO MODAL */}
      {isLogoOpen && team && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black uppercase text-white tracking-wider">
                Change Team Logo: {team.name}
              </h3>
              <button
                onClick={() => setIsLogoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamLogo} className="space-y-4">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
                <TeamLogo
                  logo={teamLogo || null}
                  name={team.name}
                  shortName={team.shortName}
                  primaryColor={team.primaryColor}
                  size="xl"
                />
                <span className="text-xs text-slate-400 font-medium">Logo Preview</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Logo URL or Upload Image
                </label>
                <input
                  type="text"
                  value={teamLogo}
                  onChange={(e) => setTeamLogo(e.target.value)}
                  placeholder="Paste URL or upload image below..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition">
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {teamLogo && (
                  <button
                    type="button"
                    onClick={() => setTeamLogo('')}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Remove Logo
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogoOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingLogo}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Logo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
