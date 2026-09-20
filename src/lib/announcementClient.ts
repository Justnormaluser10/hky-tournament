let cachedData: any = null;
let lastFetchTime = 0;
let pendingPromise: Promise<any> | null = null;

export async function getPublicAnnouncements() {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < 30_000) {
    return cachedData;
  }
  if (pendingPromise) {
    return pendingPromise;
  }
  pendingPromise = (async () => {
    try {
      const res = await fetch('/api/public/announcements');
      if (!res.ok) return { announcements: [], latestAnnouncement: null };
      const data = await res.json();
      cachedData = data;
      lastFetchTime = Date.now();
      return data;
    } catch (e) {
      console.error('Failed to fetch announcements client:', e);
      return { announcements: [], latestAnnouncement: null };
    } finally {
      pendingPromise = null;
    }
  })();
  return pendingPromise;
}
