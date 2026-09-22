'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  UploadCloud,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  isCaptain: boolean;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  coach: string | null;
  description: string | null;
  primaryColor: string;
  logo: string | null;
  captainId: string | null;
  players: Player[];
  _count?: {
    players: number;
  };
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [captainTeam, setCaptainTeam] = useState<Team | null>(null);
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>('');

  // Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [coach, setCoach] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [logo, setLogo] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setUploadError('Image must be 1 MB or smaller.');
      setActionError('Image must be 1 MB or smaller.');
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);
    setUploadError(null);
    setActionError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Image must be 1 MB or smaller.');
        setActionError(data.error || 'Image must be 1 MB or smaller.');
        return;
      }
      if (data.url) {
        setLogo(data.url);
      }
    } catch (err) {
      console.error('Failed to upload logo:', err);
      setUploadError('Failed to upload logo');
      setActionError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openAddModal = () => {
    setName('');
    setShortName('');
    setCoach('');
    setDescription('');
    setPrimaryColor('#059669');
    setLogo('');
    setUploadError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (t: Team) => {
    setEditTeam(t);
    setName(t.name);
    setShortName(t.shortName);
    setCoach(t.coach || '');
    setDescription(t.description || '');
    setPrimaryColor(t.primaryColor || '#059669');
    setLogo(t.logo || '');
    setUploadError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          shortName,
          coach,
          description,
          primaryColor,
          logo: logo.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to create team.');
      } else {
        setActionSuccess(`Team "${data.team.name}" added successfully.`);
        setIsAddOpen(false);
        fetchTeams();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeam) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTeam.id,
          name,
          shortName,
          coach,
          description,
          primaryColor,
          logo: logo.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to update team.');
      } else {
        setActionSuccess(`Team "${data.team.name}" updated successfully.`);
        setEditTeam(null);
        fetchTeams();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTeam) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/teams?id=${deleteTeam.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setActionError('Failed to delete team.');
      } else {
        setActionSuccess(`Team "${deleteTeam.name}" deleted successfully.`);
        setDeleteTeam(null);
        fetchTeams();
      }
    } catch (err) {
      setActionError('An error occurred while deleting.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCaptainModal = (team: Team) => {
    setCaptainTeam(team);
    const activeCaptain = team.players.find((p) => p.isCaptain);
    setSelectedCaptainId(activeCaptain ? activeCaptain.id : '');
  };

  const handleCaptainChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captainTeam) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/teams/${captainTeam.id}/captain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: selectedCaptainId || null }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to update captain.');
      } else {
        setActionSuccess(data.message || 'Captain updated successfully.');
        setCaptainTeam(null);
        fetchTeams();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/40">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Club Rosters & Management
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            Team Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
            Register clubs, designate official captains, set coaching staff, and manage player squads
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:via-teal-300 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 border-2 border-emerald-300/80 hover:border-emerald-200 flex items-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 text-white stroke-[3] drop-shadow-sm" />
          <span className="drop-shadow-sm">Add New Team</span>
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

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/60 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-300">
          <Users className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-black text-white uppercase">No teams registered yet</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">Click &ldquo;Add New Team&rdquo; to register the first club.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((t) => {
            const captain = t.players.find((p) => p.isCaptain);
            return (
              <div
                key={t.id}
                className="rounded-2xl p-6 bg-slate-900/85 backdrop-blur-md border border-white/20 hover:border-emerald-400/60 shadow-xl shadow-slate-950/50 space-y-4 flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <TeamLogo
                        name={t.name}
                        shortName={t.shortName}
                        logo={t.logo}
                        primaryColor={t.primaryColor}
                        size="lg"
                      />
                      <div>
                        <h3 className="text-lg font-black text-white">{t.name}</h3>
                        <span className="text-xs font-mono text-amber-400 font-bold block">
                          [{t.shortName}]
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Coach: <strong className="text-slate-200">{t.coach || 'None'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                        title="Edit Team"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTeam(t)}
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
                        title="Delete Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Captain Banner */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-slate-300 font-medium">
                        Captain:{' '}
                        {captain ? (
                          <strong className="text-white font-bold">
                            {captain.name} (#{captain.jerseyNumber})
                          </strong>
                        ) : (
                          <em className="text-slate-500">Not assigned</em>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => openCaptainModal(t)}
                      className="text-xs font-bold text-amber-400 hover:underline"
                    >
                      {captain ? 'Switch' : 'Assign'}
                    </button>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">
                    {t.players.length} Players Registered
                  </span>

                  <Link
                    href={`/admin/teams/${t.id}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 font-bold transition flex items-center gap-1.5"
                  >
                    <span>Manage Squad</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD TEAM MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black uppercase text-white tracking-wider">
                Register New Team
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Team Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amreli Hockey Club"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Short Name (3-4 Chars) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  placeholder="e.g. AHC"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Head Coach
                </label>
                <input
                  type="text"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value)}
                  placeholder="e.g. Haresh Vala"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-xs text-slate-400">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Team Bio / Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short club background or regional affiliation..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Team Logo Upload */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Team Logo (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <TeamLogo
                      logo={logo || null}
                      name={name || 'Team'}
                      shortName={shortName || 'TM'}
                      primaryColor={primaryColor}
                      size="md"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        placeholder="Image URL or upload file below..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                  {uploadError && (
                    <p className="text-[11px] font-bold text-rose-400 mt-1">
                      {uploadError}
                    </p>
                  )}
                  <span className="text-[11px] text-slate-500 block">
                    Supports PNG, JPG, WebP, SVG. If omitted, a dynamic team crest with colors and initials will be displayed.
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Registering...' : 'Save Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black uppercase text-white tracking-wider">
                Edit Team: {editTeam.name}
              </h3>
              <button
                onClick={() => setEditTeam(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Short Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Head Coach
                </label>
                <input
                  type="text"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-xs text-slate-400">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Team Bio / Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Team Logo Upload */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Team Logo (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <TeamLogo
                      logo={logo || null}
                      name={name || 'Team'}
                      shortName={shortName || 'TM'}
                      primaryColor={primaryColor}
                      size="md"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        placeholder="Image URL or upload file below..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                  {uploadError && (
                    <p className="text-[11px] font-bold text-rose-400 mt-1">
                      {uploadError}
                    </p>
                  )}
                  <span className="text-[11px] text-slate-500 block">
                    Supports PNG, JPG, WebP, SVG. If omitted, a dynamic team crest with colors and initials will be displayed.
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTeam(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN / SWITCH CAPTAIN MODAL */}
      {captainTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Designate Captain
                </h3>
                <span className="text-xs text-slate-400">{captainTeam.name}</span>
              </div>
              <button
                onClick={() => setCaptainTeam(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCaptainChange} className="space-y-4">
              <p className="text-xs text-slate-300">
                Select an active player to designate as the official team captain. The system will automatically remove captaincy from any previously assigned player.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Choose Player
                </label>
                <select
                  value={selectedCaptainId}
                  onChange={(e) => setSelectedCaptainId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- No Captain Assigned --</option>
                  {captainTeam.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber} {p.name} ({p.position}) {p.isCaptain ? '⭐ (Current Captain)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCaptainTeam(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Updating...' : 'Assign Captain ⭐'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black uppercase text-white tracking-wider">
              Delete Team?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{deleteTeam.name}</strong>?
              All associated player profiles and match assignments will be removed.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTeam(null)}
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
