'use client';

import React, { useEffect, useState } from 'react';
import { History, Shield, RefreshCw } from 'lucide-react';

interface ActivityLog {
  id: string;
  adminEmail: string;
  action: string;
  description: string;
  createdAt: string;
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/activity');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/15 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2 shadow-sm shadow-emerald-950/40">
            <History className="w-3.5 h-3.5 text-amber-400" />
            Administrative Transparency
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            Activity Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
            Complete, immutable chronological log of score corrections, roster changes, and tournament decisions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl bg-slate-800/90 border-2 border-emerald-400/60 text-emerald-300 hover:text-white hover:border-emerald-300 transition shadow-sm"
          title="Refresh Log"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Log list */}
      <div className="rounded-2xl overflow-hidden bg-slate-900/85 backdrop-blur-md border border-white/20 shadow-xl shadow-slate-950/50">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white uppercase">No recorded actions</h3>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-mono text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                      {log.action}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      by {log.adminEmail}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {log.description}
                  </p>
                </div>

                <div className="text-[11px] font-mono text-slate-500 shrink-0 sm:text-right">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
