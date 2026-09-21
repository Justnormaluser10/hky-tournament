'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { fetchPublicAnnouncements } from '@/lib/announcementsClient';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: string;
}

const STORAGE_KEY = 'amreli_last_seen_announcement_id';

export function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function checkLatestAnnouncement() {
      try {
        const data = await fetchPublicAnnouncements();
        const latest: Announcement | null = data?.latestAnnouncement || null;

        if (latest) {
          const lastSeenId = localStorage.getItem(STORAGE_KEY);
          // Only show if the user hasn't seen THIS specific announcement ID before
          if (lastSeenId !== latest.id) {
            setAnnouncement(latest);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to check announcements:', err);
      }
    }

    checkLatestAnnouncement();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      // Mark as seen permanently for this browser
      localStorage.setItem(STORAGE_KEY, announcement.id);
    }
    setIsOpen(false);
  };

  if (!isOpen || !announcement) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 shadow-2xl shadow-emerald-950/50 overflow-hidden"
        >
          {/* Top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close Announcement"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
                Official Tournament Announcement
              </span>
              <span className="block text-xs text-slate-400">
                {new Date(announcement.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-white leading-snug mb-3">
            {announcement.title}
          </h3>

          {/* Message */}
          <p className="text-slate-300 text-sm leading-relaxed mb-6 whitespace-pre-line bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
            {announcement.message}
          </p>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
            <Link
              href="/announcements"
              onClick={handleDismiss}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              View All Announcements <ChevronRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleDismiss}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition transform active:scale-95"
            >
              Got it, thanks!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
