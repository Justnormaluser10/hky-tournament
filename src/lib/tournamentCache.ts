import { prisma } from '@/lib/prisma';
import { toCleanLogoUrl } from '@/lib/logoUrl';
import { invalidatePublicTeamsCache } from '@/app/api/public/teams/route';
import { invalidatePublicStatisticsCache } from '@/app/api/public/statistics/route';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const TTL_MS = 30 * 1000; // 30 seconds TTL for background freshness

// In-memory server-side cache
const cache = {
  tournament: null as CacheItem<any> | null,
  teams: null as CacheItem<any[]> | null,
  matches: null as CacheItem<any[]> | null,
  standings: null as CacheItem<any> | null,
  topScorers: null as CacheItem<any[]> | null,
  topGoalkeepers: null as CacheItem<any[]> | null,
  teamStats: null as CacheItem<any> | null,
  leagueStatus: null as CacheItem<any> | null,
  announcements: null as CacheItem<any> | null,
};

function isFresh<T>(item: CacheItem<T> | null): item is CacheItem<T> {
  if (!item) return false;
  return Date.now() - item.timestamp < TTL_MS;
}

/**
 * Get tournament config with memory cache
 */
export async function getCachedTournament() {
  if (isFresh(cache.tournament)) {
    return cache.tournament.data;
  }
  const tournament = await prisma.tournament.findFirst();
  if (tournament) {
    cache.tournament = { data: tournament, timestamp: Date.now() };
  }
  return tournament;
}

/**
 * Get teams with lightweight logo URLs
 */
export async function getCachedTeams(tournamentId?: string) {
  if (isFresh(cache.teams)) {
    return cache.teams.data;
  }

  const tid = tournamentId || (await getCachedTournament())?.id;
  const teams = await prisma.team.findMany({
    where: tid ? { tournamentId: tid } : undefined,
    select: {
      id: true,
      tournamentId: true,
      name: true,
      shortName: true,
      coach: true,
      description: true,
      primaryColor: true,
      captainId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: 'asc' },
  });

  const cleaned = teams.map((t) => ({
    ...t,
    logo: `/api/public/teams/${t.id}/logo`,
  }));

  cache.teams = { data: cleaned, timestamp: Date.now() };
  return cleaned;
}

/**
 * Get all matches with lightweight logo URLs
 */
export async function getCachedMatches(tournamentId?: string) {
  if (isFresh(cache.matches)) {
    return cache.matches.data;
  }

  const tid = tournamentId || (await getCachedTournament())?.id;
  const matches = await prisma.match.findMany({
    where: tid ? { tournamentId: tid } : undefined,
    include: {
      teamA: {
        select: {
          id: true,
          name: true,
          shortName: true,
          primaryColor: true,
        },
      },
      teamB: {
        select: {
          id: true,
          name: true,
          shortName: true,
          primaryColor: true,
        },
      },
      events: {
        include: {
          player: {
            select: {
              id: true,
              name: true,
              jerseyNumber: true,
            },
          },
          team: {
            select: {
              id: true,
              shortName: true,
            },
          },
        },
        orderBy: { minute: 'asc' },
      },
      knockout: true,
    },
    orderBy: [{ date: 'asc' }, { matchNumber: 'asc' }],
  });

  const cleaned = matches.map((m) => ({
    ...m,
    teamA: m.teamA
      ? { ...m.teamA, logo: `/api/public/teams/${m.teamA.id}/logo` }
      : null,
    teamB: m.teamB
      ? { ...m.teamB, logo: `/api/public/teams/${m.teamB.id}/logo` }
      : null,
  }));

  cache.matches = { data: cleaned, timestamp: Date.now() };
  return cleaned;
}

/**
 * In-memory cache for standings and engine calculations
 */
export function getCachedEngineData() {
  return {
    standings: isFresh(cache.standings) ? cache.standings.data : null,
    topScorers: isFresh(cache.topScorers) ? cache.topScorers.data : null,
    topGoalkeepers: isFresh(cache.topGoalkeepers) ? cache.topGoalkeepers.data : null,
    teamStats: isFresh(cache.teamStats) ? cache.teamStats.data : null,
    leagueStatus: isFresh(cache.leagueStatus) ? cache.leagueStatus.data : null,
  };
}

export function setCachedStandings(data: any) {
  cache.standings = { data, timestamp: Date.now() };
}

export function setCachedTopScorers(data: any[]) {
  cache.topScorers = { data, timestamp: Date.now() };
}

export function setCachedTopGoalkeepers(data: any[]) {
  cache.topGoalkeepers = { data, timestamp: Date.now() };
}

export function setCachedTeamStats(data: any) {
  cache.teamStats = { data, timestamp: Date.now() };
}

export function setCachedLeagueStatus(data: any) {
  cache.leagueStatus = { data, timestamp: Date.now() };
}

/**
 * Get announcements with memory cache
 */
export async function getCachedAnnouncements(tournamentId?: string) {
  if (isFresh(cache.announcements)) {
    return cache.announcements.data;
  }

  const tid = tournamentId || (await getCachedTournament())?.id;
  const announcements = await prisma.announcement.findMany({
    where: tid ? { tournamentId: tid } : undefined,
    orderBy: [
      { isPinned: 'desc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const latestAnnouncement = announcements.length > 0 ? announcements[0] : null;
  const payload = { announcements, latestAnnouncement };

  cache.announcements = { data: payload, timestamp: Date.now() };
  return payload;
}

let photoPlayerIdsCache: { set: Set<string>; timestamp: number } | null = null;

export async function getCachedPhotoPlayerIds(): Promise<Set<string>> {
  if (photoPlayerIdsCache && Date.now() - photoPlayerIdsCache.timestamp < TTL_MS) {
    return photoPlayerIdsCache.set;
  }
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM Player WHERE photo IS NOT NULL AND photo != ''
    `;
    const set = new Set(rows.map((r) => r.id));
    photoPlayerIdsCache = { set, timestamp: Date.now() };
    return set;
  } catch (err) {
    console.error('Failed to query photo player IDs:', err);
    return new Set();
  }
}

export function invalidatePhotoPlayerIdsCache() {
  photoPlayerIdsCache = null;
}

/**
 * Instant cache invalidation called by Admin mutations
 */
export function invalidateTournamentCache(
  key?: 'matches' | 'teams' | 'tournament' | 'announcements' | 'scorers' | 'all'
) {
  invalidatePhotoPlayerIdsCache();
  invalidatePublicStatisticsCache();
  if (!key || key === 'all' || key === 'tournament') {
    cache.tournament = null;
    cache.teams = null;
    cache.matches = null;
    cache.standings = null;
    cache.topScorers = null;
    cache.topGoalkeepers = null;
    cache.teamStats = null;
    cache.leagueStatus = null;
    cache.announcements = null;
    invalidatePublicTeamsCache();
    return;
  }

  if (key === 'matches') {
    cache.matches = null;
    cache.standings = null;
    cache.topScorers = null;
    cache.topGoalkeepers = null;
    cache.teamStats = null;
    cache.leagueStatus = null;
  } else if (key === 'teams') {
    cache.teams = null;
    cache.standings = null;
    cache.topScorers = null;
    cache.topGoalkeepers = null;
    cache.teamStats = null;
    cache.leagueStatus = null;
    invalidatePublicTeamsCache();
  } else if (key === 'scorers') {
    cache.topScorers = null;
    cache.topGoalkeepers = null;
  } else if (key === 'announcements') {
    cache.announcements = null;
  }
}
