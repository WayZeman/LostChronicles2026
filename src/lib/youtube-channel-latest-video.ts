import {
  LC_PROMO_YOUTUBE_WATCH_URL,
  LC_YOUTUBE_UPLOADS_CHANNEL_ID,
} from "@/data/lc-youtube-promo";

const FEED_REVALIDATE_SECONDS = 300;

function fallbackPromoVideoId(): string {
  try {
    return new URL(LC_PROMO_YOUTUBE_WATCH_URL).searchParams.get("v") ?? "OQpRfs5GKyk";
  } catch {
    return "OQpRfs5GKyk";
  }
}

/** YouTube video id: 11 символів з [A-Za-z0-9_-]. */
function isLikelyYoutubeVideoId(id: string): boolean {
  return /^[\w-]{11}$/.test(id);
}

/**
 * Останнє відео з публічного RSS каналу (те саме, що «Відео» на YouTube за датою).
 * Підходить для нових трансляцій / VOD без YouTube Data API.
 */
export async function getLatestHeroYoutubeVideoId(): Promise<string> {
  const channelId =
    process.env.LC_YOUTUBE_CHANNEL_ID?.trim() || LC_YOUTUBE_UPLOADS_CHANNEL_ID;
  const fallback = fallbackPromoVideoId();

  if (!channelId) return fallback;

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const res = await fetch(feedUrl, {
      next: { revalidate: FEED_REVALIDATE_SECONDS },
      headers: { "User-Agent": "LostChroniclesSite/1.0 (+https://lost-chronicles.site)" },
    });

    if (!res.ok) return fallback;

    const xml = await res.text();
    const firstEntry = xml.match(/<entry>[\s\S]*?<\/entry>/);
    if (!firstEntry) return fallback;

    const idMatch = firstEntry[0].match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const id = idMatch?.[1]?.trim();
    if (id && isLikelyYoutubeVideoId(id)) return id;

    return fallback;
  } catch {
    return fallback;
  }
}
