/** Групування розділу «Гравці»: держава + посада, або «Вільні». */

export const WIKI_PLAYERS_SLUG = "Гравці";
export const WIKI_FREE_PLAYERS_LABEL = "Вільні";

const STATE_ORDER = [
  "Домініон Земана",
  "Елден",
  "Конфесодемія Теонійських Народів",
  "Скальденхейм",
  "Сьогунат Тенші",
  "Титульна Імперія Артолії",
] as const;

/** Довші збіги раніше, щоб «Артолія» не перебила точнішу назву. */
const STATE_ALIASES: Array<{ re: RegExp; title: string }> = [
  { re: /домініон\p{L}*\s+земана/iu, title: "Домініон Земана" },
  { re: /титульн\p{L}*\s+імпері|(?<![\p{L}\p{N}])тіа(?![\p{L}\p{N}])/iu, title: "Титульна Імперія Артолії" },
  { re: /конфесодем|теоній|(?<![\p{L}\p{N}])ктн(?![\p{L}\p{N}])/iu, title: "Конфесодемія Теонійських Народів" },
  { re: /скальденхейм/iu, title: "Скальденхейм" },
  { re: /сьогунат|тенші/iu, title: "Сьогунат Тенші" },
  { re: /елден/iu, title: "Елден" },
  { re: /артолі/iu, title: "Титульна Імперія Артолії" },
];

export type PlayerRosterFields = {
  state: string;
  role: string;
};

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function stripWikiCell(html: string): string {
  return decodeBasicEntities(
    html
      .replace(/<br\s*\/?>/gi, ", ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\\+/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .trim();
}

/** Значення інфобокса: підпис у першій комірці, значення в другій. */
export function wikiInfoboxField(html: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<t[hd][^>]*>\\s*(?:<[^>]+>\\s*)*${escaped}\\s*(?:</[^>]+>\\s*)*</t[hd]>\\s*<t[hd][^>]*>([\\s\\S]*?)</t[hd]>`,
    "i",
  );
  const m = html.match(re);
  return m ? stripWikiCell(m[1] ?? "") : "";
}

function matchState(text: string): string {
  const src = text.trim();
  if (!src) return "";
  for (const { re, title } of STATE_ALIASES) {
    if (re.test(src)) return title;
  }
  return "";
}

function explicitFromBlurb(
  blurb: string,
  title: string,
): { state: string; role: string } | null {
  const text = blurb.trim();
  if (!text) return null;
  if (text.toLowerCase() === title.trim().toLowerCase()) return null;
  const split = text.split(/\s+[—–]\s+/);
  if (split.length >= 2) {
    const state = split[0]!.trim();
    const role = split.slice(1).join(" — ").trim();
    if (state && role) return { state, role };
  }
  return { state: "", role: text };
}

export function playerRosterFromArticle(input: {
  title: string;
  html: string;
  cardBlurb?: string;
}): PlayerRosterFields {
  const html = input.html ?? "";
  const explicit = explicitFromBlurb(input.cardBlurb ?? "", input.title);
  const stateCell = wikiInfoboxField(html, "Держава");
  const roleOnly = wikiInfoboxField(html, "Роль");
  const postOnly = wikiInfoboxField(html, "Посада");
  const statusOnly = wikiInfoboxField(html, "Статус");
  const roleCell = roleOnly || postOnly || statusOnly;

  const inferred =
    matchState(stateCell) ||
    stateCell ||
    matchState(roleOnly) ||
    matchState(postOnly) ||
    matchState(statusOnly);

  const state =
    (explicit?.state ? matchState(explicit.state) || explicit.state : "") ||
    inferred ||
    WIKI_FREE_PLAYERS_LABEL;

  const role = explicit?.role || roleCell || "—";

  return {
    state: state === WIKI_FREE_PLAYERS_LABEL ? WIKI_FREE_PLAYERS_LABEL : state,
    role,
  };
}

export function comparePlayerStates(a: string, b: string): number {
  const ia = STATE_ORDER.indexOf(a as (typeof STATE_ORDER)[number]);
  const ib = STATE_ORDER.indexOf(b as (typeof STATE_ORDER)[number]);
  const ra = a === WIKI_FREE_PLAYERS_LABEL ? 10_000 : ia === -1 ? 5_000 : ia;
  const rb = b === WIKI_FREE_PLAYERS_LABEL ? 10_000 : ib === -1 ? 5_000 : ib;
  if (ra !== rb) return ra - rb;
  return a.localeCompare(b, "uk");
}
