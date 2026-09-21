'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Layout Exception Caught:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#040e24] text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
            🏑
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              LATE KISHAN BARAIYA(PAJI) HOCKEY CHAMPIONSHIP
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              The tournament portal experienced a temporary interface issue. Click below to reload cleanly.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-950/50"
            >
              Reload Platform
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
