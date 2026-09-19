'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  GitFork,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  X,
  Sparkles,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';

interface TournamentProgressionCardProps {
  tournament: {
    id: string;
    name: string;
    currentStage: string;
    qualificationCount: number;
    status: string;
  };
  leagueStatus: {
    isComplete: boolean;
    teamsCount: number;
    expectedMatches: number;
    scheduledMatches: number;
    completedMatches: number;
    remainingMatches: number;
    percentComplete: number;
    expectedMatchesPerTeam?: number;
    teamsStatus?: Array<{
      teamId: string;
      name: string;
      shortName: string;
      logo?: string | null;
      completedMatches: number;
      requiredMatches: number;
      isComplete: boolean;
    }>;
  };
  qualifiedTeams: Array<{
    position: number;
    teamId: string;
    name: string;
    shortName: string;
    logo?: string | null;
    primaryColor: string;
    points: number;
  }>;
}

export function TournamentProgressionCard({
  tournament,
  leagueStatus,
  qualifiedTeams,
}: TournamentProgressionCardProps) {
  const router = useRouter();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isLeagueStage =
    tournament.currentStage === 'LEAGUE' ||
    tournament.currentStage === 'LEAGUE_COMPLETE' ||
    tournament.currentStage === 'UPCOMING';
  const isKnockoutActive =
    tournament.currentStage === 'KNOCKOUT' ||
    tournament.currentStage === 'QUARTER_FINALS' ||
    tournament.currentStage === 'SEMI_FINALS' ||
    tournament.currentStage === 'FINAL';
  const isCompleted = tournament.currentStage === 'COMPLETED';

  const handleMoveToKnockout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/knockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MOVE_TO_KNOCKOUT' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to move to knockout stage.');
      } else {
        setSuccess('Tournament successfully advanced to the Knockout Stage!');
        setConfirmModalOpen(false);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl p-5 sm:p-7 bg-slate-900/85 backdrop-blur-md border-2 border-emerald-400/50 shadow-2xl shadow-slate-950/60 space-y-6">
        {/* Header: Section 6 "TOURNAMENT PROGRESSION" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-black uppercase tracking-wider mb-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              TOURNAMENT PROGRESSION
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight drop-shadow-sm">
              {isLeagueStage
                ? 'LEAGUE STAGE'
                : isKnockoutActive
                ? 'KNOCKOUT STAGE'
                : 'TOURNAMENT COMPLETE'}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isLeagueStage && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  leagueStatus.isComplete
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 shadow-sm'
                    : 'bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-sm'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    leagueStatus.isComplete ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  }`}
                />
                {leagueStatus.isComplete ? '🟢 LEAGUE COMPLETE' : '🟡 IN PROGRESS'}
              </span>
            )}

            {isKnockoutActive && (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                🏆 KNOCKOUT ACTIVE
              </span>
            )}

            {isCompleted && (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                🏆 CHAMPION CROWNED
              </span>
            )}
          </div>
        </div>

        {/* Notifications */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* LEAGUE STAGE CONTROL */}
        {isLeagueStage && (
          <div className="space-y-5">
            {/* Progress Counter & Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-slate-300">
                  League Fixtures Completion
                </span>
                <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                  {leagueStatus.completedMatches} / {leagueStatus.expectedMatches || leagueStatus.scheduledMatches} Matches Completed ({leagueStatus.percentComplete}%)
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${leagueStatus.percentComplete}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                <span>Total Expected: {leagueStatus.expectedMatches} single round-robin matches</span>
                <span>
                  {leagueStatus.remainingMatches > 0
                    ? `${leagueStatus.remainingMatches} matches remaining`
                    : 'All matches completed'}
                </span>
              </div>
            </div>

            {/* TEAM MATCH COMPLETION STATUS (Requirement 4) */}
            {leagueStatus.teamsStatus && leagueStatus.teamsStatus.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Team Fixture Completion Verification ({leagueStatus.teamsStatus.filter((t) => t.isComplete).length}/{leagueStatus.teamsStatus.length} Teams Ready)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Requirement: {leagueStatus.expectedMatchesPerTeam} matches/team
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {leagueStatus.teamsStatus.map((team) => (
                    <div
                      key={team.teamId}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between space-y-1 transition ${
                        team.isComplete
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <span className="font-bold text-xs truncate max-w-full text-white">
                        {team.shortName || team.name}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
                        <span>
                          {team.completedMatches}/{team.requiredMatches}
                        </span>
                        <span>{team.isComplete ? '✅' : '⏳'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTION SECTION (Requirements 6 & 7) */}
            {leagueStatus.isComplete ? (
              /* LEAGUE COMPLETE: ENABLE [ 🏆 MOVE TO KNOCKOUT STAGE ] */
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-emerald-900/30 to-teal-950/50 border-2 border-emerald-500/60 space-y-4 shadow-xl">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm sm:text-base uppercase tracking-tight">
                      🟢 LEAGUE COMPLETE
                    </h4>
                    <p className="text-xs text-emerald-200/90 mt-0.5">
                      All required league matches ({leagueStatus.expectedMatches}/{leagueStatus.expectedMatches}) are finished.
                      Top {tournament.qualificationCount} teams are ready to advance.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(true)}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/80 flex items-center justify-center gap-2.5 transition transform active:scale-98 cursor-pointer"
                >
                  <Trophy className="w-5 h-5 text-amber-300 animate-bounce" />
                  <span>🏆 MOVE TO KNOCKOUT STAGE</span>
                </button>
              </div>
            ) : (
              /* LEAGUE INCOMPLETE: DISABLE BUTTON WITH LOCK ICON */
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>League stage is not complete yet.</span>
                  </p>
                  <p className="text-slate-400 text-xs pl-5">
                    Knockout stage cannot be started until all {leagueStatus.expectedMatches} league matches are completed.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <button
                    disabled
                    type="button"
                    title="Knockout stage locked until all league fixtures finish"
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                  >
                    <span>🔒 MOVE TO KNOCKOUT STAGE</span>
                  </button>

                  <Link
                    href="/admin/matches"
                    className="px-4 py-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider text-center transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Enter League Scores</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KNOCKOUT ACTIVE VIEW */}
        {isKnockoutActive && (
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/30 border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-white text-sm uppercase">🏆 Knockout Stage Active</h4>
                <p className="text-slate-300 mt-0.5">
                  Playoffs are live! Record semifinal scores to automatically populate the Grand Championship Final.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/knockout"
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-purple-950/50"
              >
                View Bracket
              </Link>
              <Link
                href="/admin/matches"
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                Enter Scores
              </Link>
            </div>
          </div>
        )}

        {/* TOURNAMENT COMPLETED VIEW */}
        {isCompleted && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-amber-300 text-sm uppercase">Tournament Completed</h4>
                <p className="text-slate-300 mt-0.5">
                  The championship decider has concluded and the official champion has been crowned.
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition shrink-0 shadow-lg"
            >
              Public Celebration →
            </Link>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL (Strict Requirement) */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-950 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-black uppercase text-white tracking-wider text-sm sm:text-base">
                  Confirm Stage Transition
                </h3>
              </div>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="space-y-1.5 text-xs sm:text-sm font-semibold text-white">
                <p>League stage is complete.</p>
                <p>All teams have completed their required matches.</p>
                <p>
                  Top <strong className="text-emerald-400 font-bold">{tournament.qualificationCount} teams</strong> will advance to the knockout stage.
                </p>
                <p className="pt-1 text-amber-300 font-bold text-sm">
                  Are you sure you want to continue?
                </p>
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-slate-900/80 border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Advancing Qualifying Teams (from Final Standings):
                </span>
                {qualifiedTeams.map((team, idx) => (
                  <div
                    key={team.teamId}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-950/70 border border-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-amber-400 w-4">
                        #{idx + 1}
                      </span>
                      <TeamLogo
                        name={team.name}
                        shortName={team.shortName}
                        logo={team.logo}
                        primaryColor={team.primaryColor}
                        size="sm"
                      />
                      <span className="font-bold text-white truncate max-w-[170px]">
                        {team.name}
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-400">
                      {team.points} pts
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400">
                This action will automatically generate the playoff bracket structure. All league standings, player statistics, and results will remain 100% accessible.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition border border-white/10 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleMoveToKnockout}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Generating...' : 'Move to Knockout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
