'use client';

import React, { useEffect, useState } from 'react';
import { Settings2, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminTournamentConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    sport: '',
    location: '',
    venue: '',
    status: 'LIVE',
    format: 'LEAGUE_KNOCKOUT',
    currentStage: 'LEAGUE',
    qualificationCount: 4,
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    tieBreakerRules: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    async function loadTournament() {
      try {
        const res = await fetch('/api/admin/tournament');
        if (res.ok) {
          const data = await res.json();
          const t = data.tournament;
          if (t) {
            setForm({
              name: t.name || '',
              description: t.description || '',
              sport: t.sport || '',
              location: t.location || '',
              venue: t.venue || '',
              status: t.status || 'LIVE',
              format: t.format || 'LEAGUE_KNOCKOUT',
              currentStage: t.currentStage || 'LEAGUE',
              qualificationCount: t.qualificationCount || 4,
              pointsForWin: t.pointsForWin ?? 3,
              pointsForDraw: t.pointsForDraw ?? 1,
              pointsForLoss: t.pointsForLoss ?? 0,
              tieBreakerRules: t.tieBreakerRules || '',
              startDate: t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : '',
              endDate: t.endDate ? new Date(t.endDate).toISOString().slice(0, 10) : '',
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTournament();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/tournament', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save tournament configuration.');
      } else {
        setMessage('Tournament configuration saved successfully.');
      }
    } catch (e) {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading tournament settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="border-b border-white/15 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/40">
          <Settings2 className="w-3.5 h-3.5 text-amber-400" />
          Master Settings
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
          Tournament Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
          Customize tournament branding, playing format, points calculation, and playoff rules
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-400/50 text-xs font-bold text-emerald-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-400/50 text-xs font-bold text-rose-200 flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-2xl p-6 sm:p-8 space-y-6 bg-slate-900/85 backdrop-blur-md border border-white/20 shadow-xl shadow-slate-950/50">
        {/* Basic Branding */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-emerald-300 tracking-wider">
            1. Official Identity & Location
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Tournament Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Sport & Format
              </label>
              <input
                type="text"
                name="sport"
                required
                value={form.sport}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                required
                value={form.location}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Host Venue
            </label>
            <input
              type="text"
              name="venue"
              required
              value={form.venue}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Tournament Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Tournament Progression & Format */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <h2 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
            2. Stages & Qualification Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Current Stage
              </label>
              <select
                name="currentStage"
                value={form.currentStage}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="LEAGUE">LEAGUE</option>
                <option value="LEAGUE_COMPLETED">LEAGUE_COMPLETED</option>
                <option value="KNOCKOUT">KNOCKOUT</option>
                <option value="QUARTER_FINALS">QUARTER_FINALS</option>
                <option value="SEMI_FINALS">SEMI_FINALS</option>
                <option value="FINAL">FINAL</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Tournament Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="UPCOMING">UPCOMING</option>
                <option value="LIVE">LIVE</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Knockout Qualifiers
              </label>
              <select
                name="qualificationCount"
                value={form.qualificationCount}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value={2}>Top 2 Teams (Direct Final)</option>
                <option value={4}>Top 4 Teams (Semi-Finals)</option>
                <option value={6}>Top 6 Teams (Playoffs)</option>
                <option value={8}>Top 8 Teams (Quarter-Finals)</option>
                <option value={16}>Top 16 Teams (Round of 16)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Points System */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <h2 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
            3. Points System & Tie-Breaker
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Win Points
              </label>
              <input
                type="number"
                name="pointsForWin"
                required
                value={form.pointsForWin}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Draw Points
              </label>
              <input
                type="number"
                name="pointsForDraw"
                required
                value={form.pointsForDraw}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Loss Points
              </label>
              <input
                type="number"
                name="pointsForLoss"
                required
                value={form.pointsForLoss}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Tie-Breaker Rule Description
            </label>
            <input
              type="text"
              name="tieBreakerRules"
              value={form.tieBreakerRules}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-white/15 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:via-teal-300 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 border-2 border-emerald-300/80 hover:border-emerald-200 flex items-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-white stroke-[2.5]" />
            <span>{saving ? 'Saving Configuration...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
