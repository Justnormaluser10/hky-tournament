'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client-side error for debugging
    console.error('Antigravity Caught Client Exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#040e24] text-slate-100 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl max-w-md w-full p-6 text-center space-y-4 border border-emerald-500/30 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-xl">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">
            Tournament Portal Update
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            A temporary client exception occurred while rendering this view. Please try reloading.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-900/40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition border border-white/10"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
