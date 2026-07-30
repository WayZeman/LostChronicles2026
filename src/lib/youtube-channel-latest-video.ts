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

function decodeXmlText(raw: string): string {
  return raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Запис з каналу, знятий під час ефіру (VOD стріму), за заголовком і описом з RSS. */
function isLikelyLiveRecording(title: string, description: string): boolean {
  if (isLikelyStreamTitle(title)) return true;
  const d = normalizeFeedTitle(description);
  if (d.includes("streamed live")) return true;
  if (d.includes("streaming live")) return true;
  if (d.includes("was live")) return true;
  if (d.includes("прямий ефір")) return true;
  if (d.includes("наживо") && (d.includes("трансляц") || d.includes("stream"))) return true;
  if (d.includes("запис") && d.includes("трансляц")) return true;
  if (d.includes("live on youtube") || d.includes("live on twitch")) return true;
  return false;
}

export type YoutubeFeedEntry = {
  id: string;
  title: string;
  description: string;
  publishedMs: number;
  /** У RSS для Shorts alternate link вказує на /shorts/{id}. */
  isShort: boolean;
};

function entryLooksLikeShort(block: string, title: string, description: string): boolean {
  if (/href=["']https?:\/\/(?:www\.)?youtube\.com\/shorts\//i.test(block)) {
    return true;
  }
  const hay = `${title}\n${description}`.toLowerCase();
  return hay.includes("#shorts") || /\bshorts\b/.test(hay);
}

function parseFeedEntries(xml: string, maxEntries: number): YoutubeFeedEntry[] {
  const out: YoutubeFeedEntry[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null && out.length < maxEntries) {
    const block = m[1];
    const idMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = block.match(/<title(?:[^>]*)>([^<]*)<\/title>/);
    const publishedMatch = block.match(/<published>([^<]+)<\/published>/);
    const descMatch = block.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const id = idMatch?.[1]?.trim();
    if (!id || !isLikelyYoutubeVideoId(id)) continue;
    const title = decodeXmlText(titleMatch?.[1]?.trim() ?? "");
    const description = decodeXmlText(descMatch?.[1]?.trim() ?? "");
    const published = publishedMatch?.[1]?.trim();
    const publishedMs = published ? Date.parse(published) : Number.NaN;
    out.push({
      id,
      title,
      description,
      publishedMs: Number.isFinite(publishedMs) ? publishedMs : 0,
      isShort: entryLooksLikeShort(block, title, description),
    });
  }
  return out;
}

function pickHeroVideoIdFromEntries(entries: YoutubeFeedEntry[]): string | null {
  if (entries.length === 0) return null;

  for (const e of entries) {
    if (isLikelyLiveRecording(e.title, e.description)) return e.id;
  }

  for (const e of entries) {
    if (isLikelyStreamTitle(e.title)) return e.id;
  }

  for (const e of entries) {
    if (isLikelyYoutubeVideoId(e.id)) return e.id;
  }

  return null;
}

/**
 * Записи з публічного RSS каналу (без YouTube Data API).
 */
export async function getYoutubeChannelFeedEntries(
  maxEntries: number,
): Promise<YoutubeFeedEntry[]> {
  const channelId =
    process.env.LC_YOUTUBE_CHANNEL_ID?.trim() || LC_YOUTUBE_UPLOADS_CHANNEL_ID;

  if (!channelId) return [];

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const res = await fetch(feedUrl, {
      next: { revalidate: FEED_REVALIDATE_SECONDS },
      headers: { "User-Agent": "LostChroniclesSite/1.0 (+https://lost-chronicles.site)" },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    return parseFeedEntries(xml, maxEntries);
  } catch {
    return [];
  }
}

/**
 * Останнє відео з публічного RSS каналу (те саме, що «Відео» на YouTube за датою).
 * Підходить для нових трансляцій / VOD без YouTube Data API.
 */
export async function getLatestHeroYoutubeVideoId(): Promise<string> {
  const fallback = fallbackPromoVideoId();
  const entries = await getYoutubeChannelFeedEntries(15);
  if (entries.length === 0) return fallback;
  const primary = pickHeroVideoIdFromEntries(entries);
  return primary ?? fallback;
}

/**
 * Останній YouTube Short з RSS каналу (link на /shorts/… або #shorts у тексті).
 */
export async function getLatestYoutubeShort(): Promise<YoutubeFeedEntry | null> {
  const entries = await getYoutubeChannelFeedEntries(25);
  return entries.find((e) => e.isShort && isLikelyYoutubeVideoId(e.id)) ?? null;
}
