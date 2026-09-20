'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings2,
  Users,
  UserCheck,
  Calendar,
  GitFork,
  Megaphone,
  History,
  LogOut,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Tournament Config', href: '/admin/tournament', icon: Settings2 },
  { name: 'Teams & Rosters', href: '/admin/teams', icon: Users },
  { name: 'Players Registry', href: '/admin/players', icon: UserCheck },
  { name: 'Matches & Scores', href: '/admin/matches', icon: Calendar },
  { name: 'Knockout Stages', href: '/admin/knockout', icon: GitFork },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Activity Audit Log', href: '/admin/activity', icon: History },
  { name: 'System Settings', href: '/admin/settings', icon: Settings2 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Unconditional session verification (Rules of Hooks: all hooks called unconditionally)
  useEffect(() => {
    // If already on login page, skip authentication check
    if (pathname === '/admin/login') return;

    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.authenticated) {
          router.push('/admin/login');
        } else if (isMounted) {
          setAdminUser(data.admin);
        }
      } catch {
        router.push('/admin/login');
      }
    }
    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    router.push('/admin/login');
    router.refresh();
  };

  const handleReturnToPublic = () => {
    router.push('/');
  };

  // Login page bypass rendered AFTER all hooks have executed
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#040e24] text-slate-100 flex flex-col md:flex-row relative selection:bg-cyan-500 selection:text-white">
      {/* Field Hockey Blue Astro Turf Background Theme for Admin */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-40 scale-105"
          style={{ backgroundImage: "url('/images/blue-astro-turf.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#051126]/75 via-[#030d20]/82 to-[#020917]/90 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[700px] h-[380px] bg-cyan-500/18 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 turf-grid opacity-25 pointer-events-none" />
      </div>

      {/* Mobile Top bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-[#030e24]/95 border-b border-white/15 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏑</span>
          <span className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
            Amreli Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReturnToPublic}
            className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-800/90 border border-emerald-400/50 text-[11px] font-bold text-emerald-300 hover:bg-emerald-950/50 transition"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Public Site</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-30 h-screen w-64 bg-[#030e24]/92 backdrop-blur-xl border-r border-white/15 flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 overflow-y-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 pb-6 border-b border-white/15">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-600 p-0.5 flex items-center justify-center shadow-lg border border-emerald-300/50">
              <span className="text-xl">🏑</span>
            </div>
            <div>
              <span className="font-black text-sm text-white uppercase tracking-wider block">
                Control Center
              </span>
              <span className="text-[11px] text-emerald-300 font-mono font-bold">
                Amreli Hockey 7s
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="mt-6 space-y-1.5">
            {sidebarLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/15 text-emerald-200 border border-emerald-400/60 shadow-md font-black'
                      : 'text-slate-200 hover:text-white hover:bg-white/10 hover:border-white/20 border border-transparent font-bold'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-300' : 'text-sky-300 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/15 space-y-2 bg-[#020b1c]/80 backdrop-blur-md">
          <button
            type="button"
            onClick={handleReturnToPublic}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/90 border border-emerald-400/50 text-xs font-bold text-slate-100 hover:text-white hover:border-emerald-300 hover:bg-emerald-950/40 transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to Public Website</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-950/50 border border-rose-500/30 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-[#030e24]/85 border-b border-white/15 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
            <span className="text-xs font-black uppercase text-slate-100 tracking-wider">
              Late Kishan Baraiya(Paji) Hockey Championship Director Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleReturnToPublic}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-white/20 text-xs font-bold text-slate-100 hover:text-white hover:border-emerald-400/60 hover:bg-slate-700/90 transition shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Website</span>
            </button>
            <span className="text-xs text-slate-300">
              Logged in as: <strong className="text-emerald-300 font-extrabold">{adminUser?.name || adminUser?.email || 'Admin'}</strong>
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
