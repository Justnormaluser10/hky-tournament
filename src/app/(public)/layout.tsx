import React from 'react';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { AnnouncementTicker } from '@/components/public/AnnouncementTicker';
import { AnnouncementModal } from '@/components/public/AnnouncementModal';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] relative">
      {/* Background Stadium Glow & Turf Grid Pattern */}
      <div className="fixed inset-0 turf-grid opacity-30 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/3 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col flex-1">
        <AnnouncementTicker />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <AnnouncementModal />
      </div>
    </div>
  );
}
