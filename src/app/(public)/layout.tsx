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
    <div className="flex flex-col min-h-screen bg-[#040814] relative selection:bg-cyan-500 selection:text-white">
      {/* Dynamic Field Hockey Blue Astro Turf Background Theme */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Real Blue Astro Turf Pitch Texture Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-25 mix-blend-luminosity scale-105 transition-all duration-700"
          style={{ backgroundImage: "url('/images/blue-astro-turf.jpg')" }}
        />

        {/* Stadium Floodlights Glow and Hockey Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/80 via-[#040814]/90 to-[#030712] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-sky-500/15 via-cyan-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Field Hockey Pitch Grid and Center Circle Markings */}
        <div className="absolute inset-0 turf-grid opacity-25 pointer-events-none" />
        <div className="absolute inset-0 pitch-lines-overlay opacity-30 pointer-events-none" />
      </div>

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
