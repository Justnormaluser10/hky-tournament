/**
 * Converts heavy base64 data URIs into lightweight cached image endpoint URLs,
 * shrinking API and page payloads from ~52MB down to ~25KB.
 */
export function toCleanLogoUrl(teamId: string | null | undefined, logo: string | null | undefined): string | null {
  if (!logo || typeof logo !== 'string' || logo.trim() === '') return null;
  const trimmed = logo.trim();
  if (trimmed.startsWith('data:')) {
    return teamId ? `/api/public/teams/${teamId}/logo` : trimmed;
  }
  return trimmed;
}

export function toCleanPhotoUrl(playerId: string | null | undefined, photo: string | null | undefined): string | null {
  if (!photo || typeof photo !== 'string' || photo.trim() === '') return null;
  const trimmed = photo.trim();
  if (trimmed.startsWith('data:')) {
    return playerId ? `/api/public/players/${playerId}/photo` : trimmed;
  }
  return trimmed;
}

export function sanitizeTeamWithCleanLogo<T extends { id: string; logo?: string | null }>(team: T | null | undefined): T | null | undefined {
  if (!team) return team;
  return {
    ...team,
    logo: toCleanLogoUrl(team.id, team.logo),
  };
}
