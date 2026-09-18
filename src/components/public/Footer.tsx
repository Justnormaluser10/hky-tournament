import React from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-400 text-sm mb-14 lg:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏑</span>
              <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                AMRELI 1st HOCKEY <span className="text-amber-400">7-SIDE</span> TOURNAMENT
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              The premier field hockey championship of Saurashtra, uniting Gujarat clubs in a fast-paced 7-side clash for the Amreli Silver Stick Trophy.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-1">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Amreli District Sports Complex Ground, Amreli, Gujarat, India</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-3">
              Tournament Hub
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/matches" className="hover:text-emerald-400 transition">
                  Fixtures & Match Results
                </Link>
              </li>
              <li>
                <Link href="/standings" className="hover:text-emerald-400 transition">
                  Official League Table
                </Link>
              </li>
              <li>
                <Link href="/teams" className="hover:text-emerald-400 transition">
                  Participating Teams & Squads
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="hover:text-emerald-400 transition">
                  Top Scorers & Goalkeeping Stats
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Community */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-3">
              Information
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/tournament" className="hover:text-emerald-400 transition">
                  Format & Playing Rules
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="hover:text-emerald-400 transition">
                  Official Announcements
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition flex items-center gap-1 mt-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Control Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 Amreli 1st Hockey 7-Side Tournament Committee. All Rights Reserved.</p>
          <p className="flex items-center gap-1">
            Dedicated to grassroots field hockey excellence in Saurashtra
          </p>
        </div>
      </div>
    </footer>
  );
}
