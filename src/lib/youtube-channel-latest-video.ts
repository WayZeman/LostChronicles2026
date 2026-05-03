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

function normalizeFeedTitle(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toLowerCase();
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

/**
 * Якщо зверху фіду кілька записів з однаковою назвою (типовий дубль «живий ефір / VOD»),
 * беремо найраніше опублікований id — у вбудованому плеєрі він зазвичай стабільніший за «свіжий» дубль.
 */
function pickHeroVideoIdFromEntries(entries: FeedEntry[]): string | null {
  if (entries.length === 0) return null;
  const headTitle = normalizeFeedTitle(entries[0].title);
  const sameTitle: FeedEntry[] = [];
  for (const e of entries) {
    if (normalizeFeedTitle(e.title) === headTitle) sameTitle.push(e);
    else break;
  }
  if (sameTitle.length >= 2) {
    const oldest = sameTitle.reduce((a, b) =>
      a.publishedMs <= b.publishedMs ? a : b,
    );
    return oldest.id;
  }
  return entries[0].id;
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
    const picked = pickHeroVideoIdFromEntries(entries);
    if (picked && isLikelyYoutubeVideoId(picked)) return picked;

    return fallback;
  } catch {
    return fallback;
  }
}
