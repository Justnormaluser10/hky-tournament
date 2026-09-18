'use client';

import React, { useState } from 'react';
import { Settings2, Lock, RotateCcw, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setUpdatingPassword(true);

    try {
      const res = await fetch('/api/admin/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to update password.');
      } else {
        setPasswordSuccess('Admin password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError('An error occurred.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleResetDatabase = async () => {
    setResetting(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await fetch('/api/admin/settings/reset', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Failed to reset database.');
      } else {
        setResetSuccess(data.message || 'Database restored to initial seed state.');
        setConfirmResetOpen(false);
      }
    } catch (err) {
      setResetError('An error occurred during database reset.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Settings2 className="w-3.5 h-3.5 text-amber-400" />
          Platform Administration
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          System Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Admin credential security and database maintenance operations
        </p>
      </div>

      {/* Password Update Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-5 border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white tracking-wide">
              Change Admin Password
            </h2>
            <p className="text-xs text-slate-400">
              Update password for the master tournament director account
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              New Password (Min 6 Chars)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
          >
            {updatingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Database Maintenance & Re-seed Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-5 border-rose-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white tracking-wide">
              Reset & Re-Seed Database
            </h2>
            <p className="text-xs text-slate-400">
              Restore the database to the official initial seed dataset (6 Amreli clubs, players, fixtures, and standings)
            </p>
          </div>
        </div>

        {resetSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {resetError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{resetError}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Running a database reset will clear existing records and re-populate the SQLite database with the official Amreli 1st Hockey 7-Side Tournament setup.
          </p>

          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600/30 text-rose-300 hover:bg-rose-600/40 border border-rose-500/30 text-xs font-bold uppercase tracking-wider transition"
          >
            Restore Default Tournament Data
          </button>
        </div>
      </div>

      {/* CONFIRM RESET MODAL */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black uppercase text-white tracking-wider">
              Confirm Database Reset?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will overwrite modifications and reseed the initial 6 teams, players, completed matches, and announcements.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={resetting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
