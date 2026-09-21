'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, ChevronRight } from 'lucide-react';
import { fetchPublicAnnouncements } from '@/lib/announcementsClient';

interface Announcement {
  id: string;
  title: string;
  type: string;
  priority: string;
}

export function AnnouncementTicker() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPublicAnnouncements();
        if (data?.announcements) {
          setAnnouncements(data.announcements);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/20 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold uppercase tracking-wider text-[10px] shrink-0">
            <Megaphone className="w-3 h-3 text-amber-400" />
            {current.priority === 'URGENT' ? 'Breaking' : 'Update'}
          </span>

          <span className="text-slate-300 font-medium truncate">
            {current.title}
          </span>
        </div>

        <Link
          href="/announcements"
          className="text-emerald-400 hover:text-emerald-300 shrink-0 font-semibold flex items-center gap-0.5 hover:underline"
        >
          All News <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
