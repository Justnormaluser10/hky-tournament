import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#040e24] text-slate-100 flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-white">
      <div className="glass-card rounded-3xl max-w-md w-full p-8 text-center space-y-5 border border-emerald-500/30 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
          🏑
        </div>
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
            404 — Fixture Not Found
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The page or match you requested does not exist or has been rescheduled.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-950/40"
          >
            <Home className="w-4 h-4" />
            <span>Return to Tournament Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
