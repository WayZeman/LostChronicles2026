import {
  LC_PROMO_YOUTUBE_WATCH_URL,
  LC_YOUTUBE_UPLOADS_CHANNEL_ID,
} from "@/data/lc-youtube-promo";

const FEED_REVALIDATE_SECONDS = 300;
const OEMBED_REVALIDATE_SECONDS = 900;

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

function normalizeFeedTitle(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toLowerCase();
}

function isLikelyStreamTitle(rawTitle: string): boolean {
  const t = normalizeFeedTitle(rawTitle);
  return (
    t.includes("стрім") ||
    t.includes("стрим") ||
    t.includes("трансляц") ||
    t.includes("прямий ефір") ||
    t.includes("live stream") ||
    t.includes("livestream") ||
    t.includes(" live")
  );
}

type FeedEntry = { id: string; title: string; publishedMs: number };

function parseFeedEntries(xml: string, maxEntries: number): FeedEntry[] {
  const out: FeedEntry[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null && out.length < maxEntries) {
    const block = m[1];
    const idMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = block.match(/<title(?:[^>]*)>([^<]*)<\/title>/);
    const publishedMatch = block.match(/<published>([^<]+)<\/published>/);
    const id = idMatch?.[1]?.trim();
    if (!id || !isLikelyYoutubeVideoId(id)) continue;
    const title = titleMatch?.[1]?.trim() ?? "";
    const published = publishedMatch?.[1]?.trim();
    const publishedMs = published ? Date.parse(published) : Number.NaN;
    out.push({
      id,
      title,
      publishedMs: Number.isFinite(publishedMs) ? publishedMs : 0,
    });
  }
  return out;
}

function pickHeroVideoIdFromEntries(entries: FeedEntry[]): string | null {
  if (entries.length === 0) return null;

  // 1) Пріоритет: найсвіжіша записана трансляція (VOD стріму).
  for (const e of entries) {
    if (isLikelyStreamTitle(e.title)) return e.id;
  }

  // 2) Якщо у фіді немає стрімів, беремо будь-який найсвіжіший запис.
  for (const e of entries) {
    if (isLikelyYoutubeVideoId(e.id)) return e.id;
  }

  return null;
}

async function isEmbeddableYoutubeVideoId(videoId: string): Promise<boolean> {
  if (!isLikelyYoutubeVideoId(videoId)) return false;
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const res = await fetch(url, {
      next: { revalidate: OEMBED_REVALIDATE_SECONDS },
      headers: { "User-Agent": "LostChroniclesSite/1.0 (+https://lost-chronicles.site)" },
    });
    return res.ok;
  } catch {
    return false;
  }
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
    const entries = parseFeedEntries(xml, 15);
    const primary = pickHeroVideoIdFromEntries(entries);
    if (primary && (await isEmbeddableYoutubeVideoId(primary))) return primary;

    // Fallback 1: embeddable записаний стрім.
    for (const entry of entries) {
      if (isLikelyStreamTitle(entry.title) && (await isEmbeddableYoutubeVideoId(entry.id))) {
        return entry.id;
      }
    }

    // Fallback 2: будь-який embeddable ролик серед свіжих записів.
    for (const entry of entries) {
      if (await isEmbeddableYoutubeVideoId(entry.id)) return entry.id;
    }

    return fallback;
  } catch {
    return fallback;
  }
}
