'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Trophy,
  Calendar,
  TableProperties,
  BarChart3,
  Users,
  Megaphone,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

const mainNavItems = [
  { name: 'Home', href: '/', icon: Trophy },
  { name: 'Matches', href: '/matches', icon: Calendar },
  { name: 'Standings', href: '/standings', icon: TableProperties },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Stats', href: '/statistics', icon: BarChart3 },
];

const secondaryNavItems = [
  { name: 'Official Rules', href: '/tournament', icon: Info },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/95 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Tournament Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 p-0.5 shadow-lg shadow-emerald-950/60 border border-emerald-400/40 group-hover:scale-105 transition-transform flex items-center justify-center">
                <span className="text-xl sm:text-2xl drop-shadow">🏑</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-white text-xs sm:text-base tracking-tight uppercase group-hover:text-emerald-400 transition-colors">
                    LATE KISHAN BARAIYA(PAJI) <span className="text-amber-400">HOCKEY CHAMPIONSHIP</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-widest uppercase border border-emerald-500/40">
                    7s
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wide">
                  Gujarat Field Hockey Championship
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {[...mainNavItems, ...secondaryNavItems].map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action: Admin Login button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href={`/admin?from=${encodeURIComponent(pathname)}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Admin</span>
              </Link>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer for secondary items */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-slate-950 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[...mainNavItems, ...secondaryNavItems].map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-400" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/10">
              <Link
                href={`/admin?from=${encodeURIComponent(pathname)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider hover:bg-emerald-600/40 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* MOBILE STICKY BOTTOM QUICK-BAR (Best Mobile Sports UX) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-white/10 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                isActive
                  ? 'text-emerald-400 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-400'}`} />
              <span className="text-[10px] uppercase font-bold tracking-wider">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
