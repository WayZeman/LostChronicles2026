import {
  fetchTelegramNewsPosts,
  formatTelegramNewsDate,
  getTelegramNewsPostBodyPlain,
  getTelegramNewsPostTitle,
  type TelegramNewsPost,
  type TelegramNewsTopic,
} from "@/lib/telegram-news";

const DEFAULT_RP_TOPIC_URL = "https://t.me/lostchronicles23/409370";
const RP_NEWS_LIMIT = 50;

/** Тема RP-новин у Telegram (гілка форуму). */
export function getTelegramRpNewsTopic(): TelegramNewsTopic {
  const urlRaw =
    process.env.TELEGRAM_RP_NEWS_TOPIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_RP_NEWS_TOPIC_URL?.trim() ||
    DEFAULT_RP_TOPIC_URL;

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

  const username =
    process.env.TELEGRAM_RP_NEWS_USERNAME?.trim() || "lostchronicles23";
  const topicId =
    process.env.TELEGRAM_RP_NEWS_TOPIC_ID?.trim() || "409370";

  return {
    username,
    topicId,
    topicUrl: `https://t.me/${username}/${topicId}`,
  };
}

/** Чи це сторінка вікі «RP новини» (будь-який регістр / підкреслення). */
export function isRpNewsWikiSlug(slug: string): boolean {
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    /* raw */
  }
  const normalized = s.replace(/_/g, " ").toLowerCase().replace(/\s+/g, " ").trim();
  return (
    normalized === "rp новини" ||
    normalized === "рп новини" ||
    normalized === "rp news"
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Kyiv",
  }).formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return `${day}.${month}.${year}`;
}

function postGoldTitle(post: TelegramNewsPost): string {
  const title = getTelegramNewsPostTitle(post);
  if (title) return title;
  // Перший рядок без емодзі-шуму, якщо короткий
  const line = post.textPlain.split(/\n+/)[0]?.trim() ?? "";
  if (line.length >= 3 && line.length <= 80) return line;
  return post.author || "RP новина";
}

function postBodyHtml(post: TelegramNewsPost, goldTitle: string): string {
  const title = getTelegramNewsPostTitle(post);
  let html = post.html;
  if (title && goldTitle === title) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html
      .replace(
        new RegExp(
          `^(?:[^<]{0,24})?<b>\\s*${escaped}\\s*<\\/b>\\s*(?:<br\\s*\\/?>)*`,
          "i",
        ),
        "",
      )
      .trim();
  }
  if (!html) {
    const plain = getTelegramNewsPostBodyPlain(post, title);
    if (plain && plain !== goldTitle) {
      html = escapeHtml(plain);
    }
  }
  return html;
}

/**
 * HTML у стилі Fandom «RP новини»: дата-заголовки + картки (час | вісник).
 * Div-структура краще лягає на мобільні, ніж wikitable.
 */
export function buildRpNewsWikiMirrorHtml(posts: TelegramNewsPost[]): string {
  if (posts.length === 0) return "";

  const parts: string[] = ['<div class="mw-parser-output wiki-rp-news">'];
  let lastDateKey = "";

  for (const post of posts) {
    const dateKey = formatDateHeader(post.dateIso);
    if (dateKey !== lastDateKey) {
      parts.push(
        `<p class="wiki-rp-date"><b>${escapeHtml(dateKey)}</b></p>`,
      );
      lastDateKey = dateKey;
    }

    const { time } = formatTelegramNewsDate(post.dateIso);
    const goldTitle = postGoldTitle(post);
    const body = postBodyHtml(post, goldTitle);
    const imagesHtml = post.images
      .map(
        (src) =>
          `<figure class="wiki-rp-figure"><img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></figure>`,
      )
      .join("");

    parts.push(
      `<article class="wiki-rp-post">`,
      `<p class="wiki-rp-meta">` +
        `<span class="wiki-rp-time">${escapeHtml(time || "—")}</span>` +
        ` <span class="wiki-rp-title">${escapeHtml(goldTitle)}</span>` +
        `</p>`,
      body ? `<div class="wiki-rp-body">${body}</div>` : "",
      imagesHtml ? `<div class="wiki-rp-media">${imagesHtml}</div>` : "",
      `</article>`,
    );
  }

  parts.push("</div>");
  return parts.join("\n");
}

/** Завантажити RP-новини з Telegram і зібрати wiki-mirror HTML. */
export async function fetchRpNewsWikiContent(): Promise<{
  title: string;
  html: string;
} | null> {
  const topic = getTelegramRpNewsTopic();
  const posts = await fetchTelegramNewsPosts({
    topic,
    limit: RP_NEWS_LIMIT,
  });
  if (!posts || posts.length === 0) return null;
  return {
    title: "RP новини",
    html: buildRpNewsWikiMirrorHtml(posts),
  };
}
