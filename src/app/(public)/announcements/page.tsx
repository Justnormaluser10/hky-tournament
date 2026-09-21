import React from 'react';
import { Megaphone, Pin, Calendar, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const revalidate = 30;

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [
      { isPinned: 'desc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Megaphone className="w-3.5 h-3.5 text-amber-400" />
          Official Bulletin
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          Tournament Announcements
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Official news bulletins, scheduling notices, table updates, and qualification milestones
        </p>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
          <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white uppercase">No announcements yet</h3>
          <p className="text-xs text-slate-400 mt-1">Check back soon for tournament updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isUrgent = ann.priority === 'URGENT';
            return (
              <div
                key={ann.id}
                className={`glass-card rounded-2xl p-6 relative overflow-hidden transition ${
                  ann.isPinned
                    ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/15 via-slate-900 to-slate-900'
                    : isUrgent
                    ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/15 via-slate-900 to-slate-900'
                    : 'border-white/10'
                }`}
              >
                {/* Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/40">
                        <Pin className="w-3 h-3 fill-amber-400" /> Pinned
                      </span>
                    )}

                    {isUrgent && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/40 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Urgent
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      {ann.type}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(ann.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white leading-snug mb-2">
                  {ann.title}
                </h3>

                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {ann.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
