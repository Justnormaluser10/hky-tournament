interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: string;
  isPinned?: boolean;
}

interface AnnouncementsResponse {
  announcements: Announcement[];
  latestAnnouncement: Announcement | null;
}

let cachedData: AnnouncementsResponse | null = null;
let pendingPromise: Promise<AnnouncementsResponse | null> | null = null;

export async function fetchPublicAnnouncements(): Promise<AnnouncementsResponse | null> {
  if (cachedData) {
    return cachedData;
  }

  if (pendingPromise) {
    return pendingPromise;
  }

  pendingPromise = fetch('/api/public/announcements')
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as AnnouncementsResponse;
      cachedData = data;
      pendingPromise = null;
      return data;
    })
    .catch((err) => {
      console.error('Failed to fetch announcements:', err);
      pendingPromise = null;
      return null;
    });

  return pendingPromise;
}
