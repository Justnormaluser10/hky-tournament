'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';

export default function PublicPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Public Route Exception Caught:', error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="glass-card rounded-3xl p-8 sm:p-10 border border-emerald-500/30 shadow-2xl space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
          🏑
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Live Feed Refreshing
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Unable to load the requested tournament data right now. Please reload the view or return to the main dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-950/40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition border border-white/10"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
