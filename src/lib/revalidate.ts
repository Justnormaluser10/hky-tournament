import { revalidatePath } from 'next/cache';

/**
 * Safely invalidates cached public pages whenever an administrator makes mutations
 * to tournament matches, scores, teams, players, knockout brackets, or announcements.
 */
export function revalidateTournamentData() {
  try {
    revalidatePath('/', 'layout');
  } catch (err) {
    // In local development or environments without active ISR, catch and ignore
    console.warn('Cache revalidation skipped or failed:', err);
  }
}
