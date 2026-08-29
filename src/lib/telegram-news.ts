import { LC_DEFAULT_TELEGRAM_URL } from "@/data/lc-social-defaults";
import { LC_MARKETING_SITE_ORIGIN } from "@/lib/lc-domains";

const FEED_REVALIDATE_SECONDS = 120;
const DEFAULT_TOPIC_URL = "https://t.me/lostchronicles23/10";
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 94;

export type TelegramNewsPost = {
  id: string;
  dateIso: string;
  author: string;
  /** Безпечний HTML (br/b/i/a/code). */
  html: string;
  textPlain: string;
  images: string[];
  url: string;
};

export type TelegramNewsTopic = {
  username: string;
  topicId: string;
  topicUrl: string;
};

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number.parseInt(n, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => {
      const code = Number.parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Тема новин у Telegram-групі.
 * Пріоритет: TELEGRAM_NEWS_TOPIC_URL → TELEGRAM_NEWS_USERNAME + TELEGRAM_NEWS_TOPIC_ID
 * → https://t.me/lostchronicles23/10
 */
export function getTelegramNewsTopic(): TelegramNewsTopic {
  const urlRaw =
    process.env.TELEGRAM_NEWS_TOPIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_NEWS_TOPIC_URL?.trim();

  if (urlRaw) {
    try {
      const u = new URL(urlRaw);
      const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
      if (parts.length >= 2 && parts[0] && /^\d+$/.test(parts[1])) {
        return {
          username: parts[0],
          topicId: parts[1],
          topicUrl: `https://t.me/${parts[0]}/${parts[1]}`,
        };
      }
    } catch {
      /* fallthrough */
    }
  }

  const username =
    process.env.TELEGRAM_NEWS_USERNAME?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_NEWS_USERNAME?.trim() ||
    "lostchronicles23";
  const topicId =
    process.env.TELEGRAM_NEWS_TOPIC_ID?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_NEWS_TOPIC_ID?.trim() ||
    "10";

  return {
    username,
    topicId,
    topicUrl: `https://t.me/${username}/${topicId}`,
  };
}

export function getTelegramNewsChannelUrl(): string {
  const topic = getTelegramNewsTopic();
  return `https://t.me/${topic.username}`;
}

function parseLimit(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_LIMIT);
}

/** Залишає безпечні теги з Telegram discussion HTML. */
export function sanitizeTelegramHtml(raw: string): string {
  let html = raw;
  // Емодзі-віджети → видимий символ
  html = html.replace(
    /<i class="emoji"[^>]*>\s*<b>([\s\S]*?)<\/b>\s*<\/i>/gi,
    "$1",
  );
  // Прибрати вкладені обгортки tgme_widget_message_text
  html = html.replace(
    /<\/?div\b[^>]*>/gi,
    "",
  );

  html = html.replace(/<(?!\/?(?:br|b|strong|i|em|a|code)\b)[^>]*>/gi, "");
  html = html.replace(/<br\s*\/?>/gi, "<br/>");

  html = html.replace(/<a\b([^>]*)>/gi, (_full, attrs: string) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    const href = hrefMatch?.[1]?.trim() ?? "";
    if (!/^https?:\/\//i.test(href) && !href.startsWith("tg://") && !href.startsWith("mailto:")) {
      return "";
    }
    const safe = href.replace(/"/g, "&quot;");
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">`;
  });
  html = html.replace(/<\/a>/gi, "</a>");

  return decodeHtmlEntities(html).trim();
}

function htmlToPlain(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();
}

function extractImages(block: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  // Лише фото повідомлення, не аватар / reply thumb
  const photoBlocks = block.matchAll(
    /class="[^"]*tgme_widget_message_photo_wrap[^"]*"[\s\S]*?<\/a>/gi,
  );
  for (const photo of photoBlocks) {
    const re =
      /background-image:\s*url\(['"]?(https:\/\/cdn\d*\.telesco\.pe\/[^'")\s]+)['"]?\)/i;
    const m = photo[0].match(re);
    if (m && !seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

function extractAuthor(block: string): string {
  const m = block.match(
    /class="tgme_widget_message_author_name"[^>]*>([\s\S]*?)<\/span>/i,
  );
  if (!m) return "Lost Chronicles";
  return htmlToPlain(m[1]) || "Lost Chronicles";
}

function extractDate(block: string): string | null {
  const m = block.match(/datetime="([^"]+)"/i);
  return m?.[1] ?? null;
}

function extractTextHtml(block: string): string {
  // Найглибший js-message_text (не reply)
  const matches = [
    ...block.matchAll(
      /class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/gi,
    ),
  ];
  if (matches.length === 0) return "";
  // Останній збіг зазвичай внутрішній повний текст
  const inner = matches[matches.length - 1][1];
  return sanitizeTelegramHtml(inner);
}

function parseDiscussionHtml(
  pageHtml: string,
  topic: TelegramNewsTopic,
): TelegramNewsPost[] {
  const posts: TelegramNewsPost[] = [];
  const seen = new Set<string>();

  const blockRe =
    /<div class="tgme_widget_message\b[^"]*"[^>]*data-post-id="(\d+)"[^>]*>([\s\S]*?)(?=<div class="tgme_widget_message\b|<div class="tgme_post_discussion_footer|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(pageHtml)) !== null) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const block = match[0];
    const dateIso = extractDate(block);
    if (!dateIso) continue;

    const html = extractTextHtml(block);
    const images = extractImages(block);
    if (!html && images.length === 0) continue;

    posts.push({
      id,
      dateIso,
      author: extractAuthor(block),
      html,
      textPlain: htmlToPlain(html),
      images,
      url: `${topic.topicUrl}?comment=${id}`,
    });
  }

  posts.sort(
    (a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime(),
  );
  return posts;
}

/**
 * Останні пости з гілки новин (Telegram discussion widget).
 * @param limitOrOpts — ліміт або { topic, limit }
 */
export async function fetchTelegramNewsPosts(
  limitOrOpts?: number | { topic?: TelegramNewsTopic; limit?: number },
): Promise<TelegramNewsPost[] | null> {
  const opts =
    typeof limitOrOpts === "number"
      ? { limit: limitOrOpts }
      : limitOrOpts ?? {};
  const topic = opts.topic ?? getTelegramNewsTopic();
  const resolvedLimit = parseLimit(
    opts.limit !== undefined
      ? String(opts.limit)
      : process.env.TELEGRAM_NEWS_LIMIT?.trim(),
    DEFAULT_LIMIT,
  );

  const url =
    `https://t.me/${topic.username}/${topic.topicId}` +
    `?embed=1&discussion=1&comments_limit=${resolvedLimit}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          `Mozilla/5.0 (compatible; LostChroniclesBot/1.0; +${LC_MARKETING_SITE_ORIGIN})`,
        "Accept-Language": "uk,en;q=0.8",
      },
      next: { revalidate: FEED_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const pageHtml = await res.text();
    if (!pageHtml.includes("data-post-id=")) return null;
    const posts = parseDiscussionHtml(pageHtml, topic);
    return posts.length > 0 ? posts : null;
  } catch {
    return null;
  }
}

/** Посилання на Telegram для fallback UI. */
export function getTelegramNewsFallbackUrl(): string {
  return getTelegramNewsTopic().topicUrl || LC_DEFAULT_TELEGRAM_URL;
}

/** Короткий окремий заголовок, якщо є; інакше null. */
export function getTelegramNewsPostTitle(post: TelegramNewsPost): string | null {
  const firstBr = post.html.search(/<br\s*\/?>/i);
  const firstBold = post.html.search(/<b>/i);
  if (firstBold >= 0 && (firstBr < 0 || firstBold < firstBr)) {
    const bold = post.html.slice(firstBold).match(/^<b>([\s\S]*?)<\/b>/i);
    if (bold) {
      const t = bold[1]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (t.length >= 3 && t.length <= 110) return t;
    }
  }

  const line = post.textPlain.split(/\n+/)[0]?.trim() ?? "";
  if (line.length >= 3 && line.length <= 72) return line;
  return null;
}

export function getTelegramNewsPostBodyPlain(
  post: TelegramNewsPost,
  title: string | null,
): string {
  let plain = post.textPlain.trim();
  if (title && plain.toLowerCase().startsWith(title.toLowerCase())) {
    plain = plain.slice(title.length).replace(/^[\s:.\-–—]+/, "").trim();
  }
  return plain;
}

export function formatTelegramNewsDate(iso: string): {
  day: string;
  time: string;
  full: string;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { day: iso, time: "", full: iso };
  }
  const day = new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Kyiv",
  }).format(d);
  const time = new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  }).format(d);
  const full = new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  }).format(d);
  return { day, time, full };
}

