import React from 'react';
import { prisma } from '@/lib/prisma';
import { Trophy, Calendar, MapPin, CheckCircle2, Shield, Info, HelpCircle } from 'lucide-react';

export const revalidate = 300; // Format and rules rarely change, 5m revalidation

export default async function TournamentPage() {
  const tournament = await prisma.tournament.findFirst();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          Official Information & Rules
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          {tournament?.name}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {tournament?.description}
        </p>
      </div>

      {/* Key Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6 border-emerald-500/20">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 w-fit mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Sport Format</span>
          <h3 className="text-lg font-black text-white mt-1">{tournament?.sport}</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            7 players per side on synthetic turf pitch with rapid 20-minute halves.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border-emerald-500/20">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 w-fit mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Host Venue</span>
          <h3 className="text-lg font-black text-white mt-1">Amreli, Gujarat</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {tournament?.venue}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border-emerald-500/20">
          <div className="p-3 rounded-xl bg-teal-500/20 text-teal-400 w-fit mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Dates</span>
          <h3 className="text-lg font-black text-white mt-1">
            {tournament?.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Sept 2026'} –{' '}
            {tournament?.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'Sept 2026'}
          </h3>
          <p className="text-xs text-emerald-400 font-semibold mt-2">
            Status: {tournament?.status}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border-emerald-500/20">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 w-fit mb-4">
            <Trophy className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Championship</span>
          <h3 className="text-lg font-black text-white mt-1">League + Knockout</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Top {tournament?.qualificationCount || 4} teams qualify for Semi-Finals & Final.
          </p>
        </div>
      </div>

      {/* Rules & Points System */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Official Points System
              </h2>
              <span className="text-xs text-slate-400">Standings ranking methodology</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 text-center">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {tournament?.pointsForWin ?? 3}
              </span>
              <span className="block text-xs font-bold text-slate-400 uppercase mt-1">Win</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 text-center">
              <span className="text-2xl font-black text-slate-300 font-mono">
                {tournament?.pointsForDraw ?? 1}
              </span>
              <span className="block text-xs font-bold text-slate-400 uppercase mt-1">Draw</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 text-center">
              <span className="text-2xl font-black text-rose-400 font-mono">
                {tournament?.pointsForLoss ?? 0}
              </span>
              <span className="block text-xs font-bold text-slate-400 uppercase mt-1">Loss</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Tie-Breaker Hierarchy:
            </h4>
            <p className="text-slate-400 leading-relaxed font-mono">
              {tournament?.tieBreakerRules || 'Points > Goal Difference > Goals For > Head-to-Head'}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                7-Side Hockey Regulations
              </h2>
              <span className="text-xs text-slate-400">Field hockey playing rules</span>
            </div>
          </div>

          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Team Composition:</strong> 7 players on pitch including 1 designated Goalkeeper with full protective gear. Unlimited substitutions allowed rolling.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Match Duration:</strong> Two halves of 20 minutes each with a 5-minute halftime interval.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Disciplinary Cards:</strong> Green card (2 min suspension), Yellow card (5 min suspension), Red card (permanent expulsion).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Knockout Deciders:</strong> If tied at full time during knockout rounds, a sudden-death penalty shootout determines the winner.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
