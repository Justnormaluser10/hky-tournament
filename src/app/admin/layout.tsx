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
      router.push('/admin/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReturnToPublic = () => {
    router.push('/');
  };

  // Login page bypass rendered AFTER all hooks have executed
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-slate-950 border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏑</span>
          <span className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
            Amreli Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReturnToPublic}
            className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-900 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 hover:bg-emerald-950/40 transition"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Public Site</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-30 h-screen w-64 bg-slate-950/98 border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 overflow-y-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 pb-6 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-800 p-0.5 flex items-center justify-center shadow-lg border border-emerald-400/40">
              <span className="text-xl">🏑</span>
            </div>
            <div>
              <span className="font-black text-sm text-white uppercase tracking-wider block">
                Control Center
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                Amreli Hockey 7s
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="mt-6 space-y-1">
            {sidebarLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    isActive
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2 bg-slate-950">
          <button
            type="button"
            onClick={handleReturnToPublic}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs font-bold text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-950/30 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to Public Website</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 border border-rose-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-slate-950/60 border-b border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              Amreli 1st Hockey 7-Side Tournament Director Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleReturnToPublic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Website</span>
            </button>
            <span className="text-xs text-slate-400">
              Logged in as: <strong className="text-emerald-400">{adminUser?.email || 'admin'}</strong>
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
