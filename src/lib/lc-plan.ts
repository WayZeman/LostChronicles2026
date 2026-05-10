import { unstable_cache } from "next/cache";

const DEFAULT_PLAN_BASE = "http://dragonseven.top:25551";
const DEFAULT_SERVER_QUERY = "Lost Chronicles Vanila";

const REVALIDATE_SEC = 120;
const PLAN_TOP_PLAYERS_REVALIDATE_SEC = 120;

export function getLcPlanBaseUrl(): string {
  return process.env.LC_PLAN_BASE_URL?.trim() || DEFAULT_PLAN_BASE;
}

/** Значення параметра `server=` у Plan API (назва сервера в Plan). */
export function getLcPlanServerQuery(): string {
  return process.env.LC_PLAN_SERVER_NAME?.trim() || DEFAULT_SERVER_QUERY;
}

export function getLcPlanPanelServerUrl(): string {
  const base = getLcPlanBaseUrl().replace(/\/$/, "");
  const name = getLcPlanServerQuery();
  return `${base}/server/${encodeURIComponent(name)}`;
}

type PlanPlayerRow = {
  playerUUID: string;
  playerName: string;
  playtimeActive: number;
};

type PlanPlayersTable = {
  players?: PlanPlayerRow[];
};

type PlanPlayerDetail = {
  info?: {
    playtime?: string;
    active_playtime?: string;
    afk_time?: string;
  };
};

export type PlanTopOnlineEntry = {
  uuid: string;
  name: string;
  /** Активний час (без AFK), мс */
  playtimeActiveMs: number;
  /** Усього: активний + AFK (одна зведена цифра), мс */
  playtimeTotalMs: number;
  /** Час у AFK, мс */
  playtimeAfkMs: number;
};

export type PlanTopOnlinePayload = {
  panelUrl: string;
  players: PlanTopOnlineEntry[];
};

/**
 * Рейтинг за загальним часом (спадання). Некоректні значення — в кінці; при рівності — ім’я (uk).
 */
export function sortPlanTopByTotalTimeDesc(
  entries: PlanTopOnlineEntry[],
): PlanTopOnlineEntry[] {
  return [...entries].sort((a, b) => {
    const tb = Number(b.playtimeTotalMs);
    const ta = Number(a.playtimeTotalMs);
    const nb = Number.isFinite(tb) ? tb : -1;
    const na = Number.isFinite(ta) ? ta : -1;
    const diff = nb - na;
    if (diff !== 0) return diff;
    return String(a.name).localeCompare(String(b.name), "uk");
  });
}

function formatPlanUrl(path: string): string {
  const base = getLcPlanBaseUrl().replace(/\/$/, "");
  const u = new URL(path, base);
  u.searchParams.set("server", getLcPlanServerQuery());
  return u.toString();
}

function formatPlanPlayerUrl(playerUuid: string): string {
  const base = getLcPlanBaseUrl().replace(/\/$/, "");
  const u = new URL("/v1/player", base);
  u.searchParams.set("server", getLcPlanServerQuery());
  u.searchParams.set("player", playerUuid);
  return u.toString();
}

async function planGetJson<T>(path: string): Promise<T | null> {
  const url = formatPlanUrl(path);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SEC },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** GET JSON з Plan (`server=` додається до шляху на кшталт `/v1/serverOverview`). */
export async function planFetchJson<T>(path: string): Promise<T | null> {
  return planGetJson<T>(path);
}

async function planGetPlayerJson(playerUuid: string): Promise<PlanPlayerDetail | null> {
  const url = formatPlanPlayerUrl(playerUuid);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SEC },
    });
    if (!res.ok) return null;
    return (await res.json()) as PlanPlayerDetail;
  } catch {
    return null;
  }
}

/** Скільки мілісекунд Plan закладає в «1 month» у рядках на кшталт «2 months, 15d …». */
const PLAN_MONTH_MS = 30 * 86_400_000;

/**
 * Парсить рядки Plan: «19d 9h 29m 56s», «2 months, 15d 20h 2m 32s» тощо.
 */
export function parsePlanDurationToMs(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  let ms = 0;
  const mo = /(\d+)\s*months?\b/.exec(s);
  const d = /(\d+)\s*d(?:ays?)?\b/.exec(s);
  const h = /(\d+)\s*h(?:ours?)?\b/.exec(s);
  const m = /(\d+)\s*m(?!s\b)(?:ins?)?\b/.exec(s);
  const sec = /(\d+)\s*s(?:ecs?)?\b/.exec(s);
  if (mo) ms += parseInt(mo[1], 10) * PLAN_MONTH_MS;
  if (d) ms += parseInt(d[1], 10) * 86_400_000;
  if (h) ms += parseInt(h[1], 10) * 3_600_000;
  if (m) ms += parseInt(m[1], 10) * 60_000;
  if (sec) ms += parseInt(sec[1], 10) * 1000;
  return ms;
}

function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  let sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86_400);
  sec %= 86_400;
  const hrs = Math.floor(sec / 3600);
  sec %= 3600;
  const mins = Math.floor(sec / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}д`);
  if (hrs > 0) parts.push(`${hrs}г`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}хв`);
  return parts.join(" ");
}

/**
 * Для таблиць і списків: «53 дн. · 1 год. · 11 хв.» — з пробілами та розділювачем.
 */
export function formatDurationMsReadable(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  let sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86_400);
  sec %= 86_400;
  const hrs = Math.floor(sec / 3600);
  sec %= 3600;
  const mins = Math.floor(sec / 60);
  const fmt = (n: number) => n.toLocaleString("uk-UA");
  const parts: string[] = [];
  if (days > 0) parts.push(`${fmt(days)} дн.`);
  if (hrs > 0) parts.push(`${fmt(hrs)} год.`);
  if (mins > 0 || parts.length === 0) parts.push(`${fmt(mins)} хв.`);
  return parts.join(" · ");
}

/** Накопичений час у цілих годинах (округлення), для простих списків. */
export function formatPlaytimeHours(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const hours = Math.round(ms / 3_600_000);
  return `${hours.toLocaleString("uk-UA")} год.`;
}

export { formatDurationMs };

const TOP_ONLINE_DEFAULT = 10;

/** Паралельних запитів `/v1/player` за раз (великі JSON — не «штормити» Plan). */
const PLAN_PLAYER_ENRICH_BATCH = 12;

/**
 * Скількох гравців з таблиці збагачувати `/v1/player` перед сортуванням за загальним часом.
 * Менше — швидше; більше — рідші помилки рейтингу для «низький активний / великий AFK».
 */
const TOP_ENRICH_POOL_MULT = 5;
const TOP_ENRICH_POOL_MIN = 48;

async function enrichPlanTableRow(p: PlanPlayerRow): Promise<PlanTopOnlineEntry> {
  const tableRaw = Number(p.playtimeActive);
  const tableActive = Number.isFinite(tableRaw) ? Math.max(0, tableRaw) : 0;
  const detail = await planGetPlayerJson(p.playerUUID);
  const info = detail?.info;

  const activeParsed = parsePlanDurationToMs(info?.active_playtime ?? "");
  const afkParsed = parsePlanDurationToMs(info?.afk_time ?? "");

  const activeFromTable = activeParsed == null ? tableActive : activeParsed;
  const playtimeActiveMs = Number.isFinite(activeFromTable)
    ? Math.max(0, activeFromTable)
    : tableActive;
  const playtimeAfkMs = Math.max(0, afkParsed ?? 0);
  const playtimeTotalMs = playtimeActiveMs + playtimeAfkMs;

  return {
    uuid: p.playerUUID,
    name: p.playerName,
    playtimeActiveMs,
    playtimeTotalMs,
    playtimeAfkMs,
  };
}

async function fetchPlanTopOnlinePlayersUncached(
  limit: number,
): Promise<PlanTopOnlinePayload | null> {
  const tableRaw = await planGetJson<PlanPlayersTable>("/v1/playersTable");
  if (!tableRaw) return null;

  const players = Array.isArray(tableRaw.players) ? tableRaw.players : [];
  const enrichCap = Math.min(
    players.length,
    Math.max(limit * TOP_ENRICH_POOL_MULT, TOP_ENRICH_POOL_MIN),
  );

  const pool = [...players]
    .sort((a, b) => (b.playtimeActive ?? 0) - (a.playtimeActive ?? 0))
    .slice(0, enrichCap);

  const enriched: PlanTopOnlineEntry[] = [];
  for (let i = 0; i < pool.length; i += PLAN_PLAYER_ENRICH_BATCH) {
    const chunk = pool.slice(i, i + PLAN_PLAYER_ENRICH_BATCH);
    const part = await Promise.all(chunk.map((p) => enrichPlanTableRow(p)));
    enriched.push(...part);
  }

  const ranked = sortPlanTopByTotalTimeDesc(enriched);
  const top = ranked.slice(0, limit);

  return {
    panelUrl: getLcPlanPanelServerUrl(),
    players: top,
  };
}

const fetchPlanTopOnlinePlayersCached = unstable_cache(
  async (limit: number, planCacheKey: string) => {
    void planCacheKey;
    return fetchPlanTopOnlinePlayersUncached(limit);
  },
  ["plan-top-online-players"],
  { revalidate: PLAN_TOP_PLAYERS_REVALIDATE_SEC },
);

/** Топ гравців за загальним часом (активний + AFK); ранжування після `/v1/player`. */
export async function fetchPlanTopOnlinePlayers(
  limit = TOP_ONLINE_DEFAULT,
): Promise<PlanTopOnlinePayload | null> {
  const planCacheKey = `${getLcPlanBaseUrl()}|${getLcPlanServerQuery()}`;
  return fetchPlanTopOnlinePlayersCached(limit, planCacheKey);
}
