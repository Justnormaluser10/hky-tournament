'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Filter, Trophy, X, Flame } from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface MatchEvent {
  id: string;
  type: string;
  minute: number;
  notes?: string | null;
  player?: {
    id: string;
    name: string;
    jerseyNumber: number;
  } | null;
  team: {
    id: string;
    shortName: string;
  };
}

interface Match {
  id: string;
  matchNumber: number;
  round: string;
  date: string;
  time: string;
  venue: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';
  teamAScore: number;
  teamBScore: number;
  winnerId?: string | null;
  notes?: string | null;
  teamA?: {
    id: string;
    name: string;
    shortName: string;
    logo?: string | null;
    primaryColor: string;
  } | null;
  teamB?: {
    id: string;
    name: string;
    shortName: string;
    logo?: string | null;
    primaryColor: string;
  } | null;
  knockout?: {
    seedLabelA?: string | null;
    seedLabelB?: string | null;
    stage?: string | null;
  } | null;
  events: MatchEvent[];
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roundFilter, setRoundFilter] = useState('ALL');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (statusFilter !== 'ALL') query.set('status', statusFilter);
        if (roundFilter !== 'ALL') query.set('round', roundFilter);

        const res = await fetch(`/api/public/matches?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [statusFilter, roundFilter]);

  const statusTabs = [
    { label: 'All Matches', value: 'ALL' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Upcoming', value: 'UPCOMING' },
    { label: 'Live', value: 'LIVE' },
  ];

  const roundTabs = [
    { label: 'All Stages', value: 'ALL' },
    { label: 'League', value: 'LEAGUE' },
    { label: 'Quarter Finals', value: 'QUARTER_FINAL' },
    { label: 'Semi Finals', value: 'SEMI_FINAL' },
    { label: 'Final', value: 'FINAL' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Match Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Tournament Fixtures & Results
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time schedule, broadcast scorelines, and match events
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/10">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === tab.value
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Round filters */}
        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex flex-wrap items-center gap-1">
            {roundTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRoundFilter(tab.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  roundFilter === tab.value
                    ? 'bg-white/20 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white uppercase">No matches found</h3>
          <p className="text-xs text-slate-400 mt-1">Fixtures are being prepared or none match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => {
            const isCompleted = match.status === 'COMPLETED';
            const isLive = match.status === 'LIVE';

            return (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Status & Round Header */}
                <div className="flex items-center justify-between gap-2 mb-4 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      M#{match.matchNumber}
                    </span>
                    <span className="text-xs uppercase font-bold text-slate-400">
                      {match.round.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    {isCompleted ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                        Full Time
                      </span>
                    ) : isLive ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-500/30 animate-pulse">
                        LIVE NOW
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                        {match.time}
                      </span>
                    )}
                  </div>
                </div>

                {/* Scoreboard */}
                <div className="space-y-4 my-2">
                  {/* Team A */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {match.teamA ? (
                        <TeamLogo
                          name={match.teamA.name}
                          shortName={match.teamA.shortName}
                          logo={match.teamA.logo}
                          primaryColor={match.teamA.primaryColor}
                          size="md"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-dashed border-amber-500/40 flex items-center justify-center text-xs text-amber-400 font-mono shrink-0 shadow-inner">
                          🏆
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-extrabold text-white text-base block truncate">
                          {match.teamA?.name || match.knockout?.seedLabelA || 'TBD Qualifier'}
                        </span>
                        {!match.teamA && match.knockout?.seedLabelA && (
                          <span className="text-[10px] text-slate-500 font-mono block truncate">
                            {match.knockout.seedLabelA}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {isCompleted || isLive ? (
                        <span className="text-3xl font-black font-mono text-white">
                          {match.teamAScore}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-500">—</span>
                      )}
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {match.teamB ? (
                        <TeamLogo
                          name={match.teamB.name}
                          shortName={match.teamB.shortName}
                          logo={match.teamB.logo}
                          primaryColor={match.teamB.primaryColor}
                          size="md"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-dashed border-amber-500/40 flex items-center justify-center text-xs text-amber-400 font-mono shrink-0 shadow-inner">
                          🏆
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-extrabold text-white text-base block truncate">
                          {match.teamB?.name || match.knockout?.seedLabelB || 'TBD Qualifier'}
                        </span>
                        {!match.teamB && match.knockout?.seedLabelB && (
                          <span className="text-[10px] text-slate-500 font-mono block truncate">
                            {match.knockout.seedLabelB}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {isCompleted || isLive ? (
                        <span className="text-3xl font-black font-mono text-white">
                          {match.teamBScore}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-500">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Info & Scorers teaser */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{match.venue}</span>
                  </div>

                  <span className="text-emerald-400 font-bold hover:underline shrink-0">
                    {match.events.length > 0 ? `${match.events.length} Events` : 'Details'} →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Detail Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-6">
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-1">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                Match #{selectedMatch.matchNumber} • {selectedMatch.round}
              </span>
              <p className="text-xs text-slate-400">{selectedMatch.venue}</p>
            </div>

            {/* Big Score banner */}
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
              <div className="flex-1 text-center min-w-0">
                {selectedMatch.teamA ? (
                  <TeamLogo
                    name={selectedMatch.teamA.name}
                    shortName={selectedMatch.teamA.shortName}
                    logo={selectedMatch.teamA.logo}
                    primaryColor={selectedMatch.teamA.primaryColor}
                    size="md"
                    className="mx-auto mb-2"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-dashed border-amber-500/40 flex items-center justify-center text-lg text-amber-400 font-mono mx-auto mb-2 shadow-inner">
                    🏆
                  </div>
                )}
                <span className="font-bold text-sm text-white block truncate">
                  {selectedMatch.teamA?.name || selectedMatch.knockout?.seedLabelA || 'TBD Qualifier'}
                </span>
                {!selectedMatch.teamA && selectedMatch.knockout?.seedLabelA && (
                  <span className="text-[10px] text-slate-500 font-mono block truncate mt-0.5">
                    {selectedMatch.knockout.seedLabelA}
                  </span>
                )}
              </div>

              <div className="px-4 text-center shrink-0">
                {selectedMatch.status === 'COMPLETED' ? (
                  <div className="font-black font-mono text-3xl text-emerald-400">
                    {selectedMatch.teamAScore} — {selectedMatch.teamBScore}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-amber-400 uppercase">
                    {selectedMatch.status}
                  </div>
                )}
                <span className="text-[10px] text-slate-500 block mt-1">{selectedMatch.time}</span>
              </div>

              <div className="flex-1 text-center min-w-0">
                {selectedMatch.teamB ? (
                  <TeamLogo
                    name={selectedMatch.teamB.name}
                    shortName={selectedMatch.teamB.shortName}
                    logo={selectedMatch.teamB.logo}
                    primaryColor={selectedMatch.teamB.primaryColor}
                    size="md"
                    className="mx-auto mb-2"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-dashed border-amber-500/40 flex items-center justify-center text-lg text-amber-400 font-mono mx-auto mb-2 shadow-inner">
                    🏆
                  </div>
                )}
                <span className="font-bold text-sm text-white block truncate">
                  {selectedMatch.teamB?.name || selectedMatch.knockout?.seedLabelB || 'TBD Qualifier'}
                </span>
                {!selectedMatch.teamB && selectedMatch.knockout?.seedLabelB && (
                  <span className="text-[10px] text-slate-500 font-mono block truncate mt-0.5">
                    {selectedMatch.knockout.seedLabelB}
                  </span>
                )}
              </div>
            </div>

            {/* Match Events Timeline */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3">
                Match Events & Timeline
              </h4>

              {selectedMatch.events.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-xl">
                  No recorded events for this match.
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedMatch.events.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 w-8">{e.minute}&apos;</span>
                        <span className="text-base">
                          {e.type === 'GOAL'
                            ? '⚽'
                            : e.type === 'YELLOW_CARD'
                            ? '🟨'
                            : e.type === 'RED_CARD'
                            ? '🟥'
                            : '🟩'}
                        </span>
                        <span className="font-bold text-white">
                          {e.player ? e.player.name : e.team.shortName}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono uppercase text-[10px]">
                        {e.team.shortName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedMatch.notes && (
              <p className="text-xs text-slate-400 bg-slate-950/30 p-3 rounded-xl border border-white/5 italic">
                &ldquo;{selectedMatch.notes}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
