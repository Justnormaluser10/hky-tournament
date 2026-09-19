'use client';

import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Pin,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isPinned: boolean;
  createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setTitle('');
    setMessage('');
    setType('GENERAL');
    setPriority('NORMAL');
    setIsPinned(false);
    setIsModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditId(a.id);
    setTitle(a.title);
    setMessage(a.message);
    setType(a.type);
    setPriority(a.priority);
    setIsPinned(a.isPinned);
    setIsModalOpen(true);
  };

  const applyTemplate = (tmplType: string) => {
    if (tmplType === 'TABLE') {
      setTitle('🏆 TABLE UPDATE: New Standings Leader');
      setMessage('Amreli Hockey Club have taken 1st position in the league table following their decisive victory.');
      setType('TABLE_UPDATE');
      setPriority('URGENT');
    } else if (tmplType === 'FULL_TIME') {
      setTitle('🔥 FULL TIME RESULT: Thrilling 7-Side Clash');
      setMessage('Gir Lions Hockey Academy secured a crucial 3–1 win with exceptional penalty corner conversions.');
      setType('RESULT');
      setPriority('NORMAL');
    } else if (tmplType === 'QUALIFIED') {
      setTitle('⚡ QUALIFICATION CONFIRMED: Semi-Finals Berth Secured');
      setMessage('With today’s result, both Amreli Hockey Club and Gir Lions have officially booked their spots in the Semi-Finals.');
      setType('QUALIFICATION');
      setPriority('URGENT');
      setIsPinned(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    const isEdit = Boolean(editId);
    const method = isEdit ? 'PUT' : 'POST';
    const body = {
      id: editId,
      title,
      message,
      type,
      priority,
      isPinned,
    };

    try {
      const res = await fetch('/api/admin/announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to save announcement.');
      } else {
        setActionSuccess(isEdit ? 'Announcement updated.' : 'Announcement published.');
        setIsModalOpen(false);
        fetchAnnouncements();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/announcements?id=${deleteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setActionError('Failed to delete announcement.');
      } else {
        setActionSuccess('Announcement deleted.');
        setDeleteId(null);
        fetchAnnouncements();
      }
    } catch (err) {
      setActionError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/40">
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            Communications & Alerts
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            Announcements Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
            Broadcast official tournament bulletins, table updates, and match results
          </p>
        </div>

        <button
          onClick={openAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:via-teal-300 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 border-2 border-emerald-300/80 hover:border-emerald-200 flex items-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 text-white stroke-[3] drop-shadow-sm" />
          <span className="drop-shadow-sm">New Announcement</span>
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

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-32 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" />
        ) : announcements.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
            <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white uppercase">No announcements posted</h3>
            <p className="text-xs text-slate-400 mt-1">Click &ldquo;New Announcement&rdquo; to post an update.</p>
          </div>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className={`glass-card rounded-2xl p-5 border transition ${
                a.isPinned
                  ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/15 via-slate-900 to-slate-900'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.isPinned && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-amber-400" /> Pinned
                      </span>
                    )}

                    {a.priority === 'URGENT' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/30 animate-pulse">
                        Urgent
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">
                      {a.type}
                    </span>

                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white">{a.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {a.message}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(a)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                    title="Edit Announcement"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(a.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black uppercase text-white tracking-wider">
                {editId ? 'Edit Announcement' : 'Create Tournament Announcement'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates */}
            {!editId && (
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Instant Announcement Templates:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyTemplate('TABLE')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-amber-300 border border-amber-500/20"
                  >
                    Table Leader Update
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('FULL_TIME')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-emerald-300 border border-emerald-500/20"
                  >
                    Match Result
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('QUALIFIED')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-teal-300 border border-teal-500/20"
                  >
                    Knockout Qualified
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Announcement Headline <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 🔥 Clash of Titans: AHC vs GLA Tonight!"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Full Message Content <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write the detailed bulletin announcement here..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  >
                    <option value="GENERAL">General Notice</option>
                    <option value="RESULT">Match Result</option>
                    <option value="TABLE_UPDATE">Table Update</option>
                    <option value="QUALIFICATION">Qualification</option>
                    <option value="CHAMPION">Champion Crowned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent (Triggers Popup)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-white/10">
                <input
                  type="checkbox"
                  id="pinToggle"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="pinToggle" className="text-xs text-slate-300 cursor-pointer font-bold">
                  Pin to Top of Feed 📌
                </label>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Saving...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black uppercase text-white tracking-wider">
              Delete Announcement?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this announcement?
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
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
