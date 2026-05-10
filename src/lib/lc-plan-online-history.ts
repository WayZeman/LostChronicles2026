import { unstable_cache } from "next/cache";
import {
  getLcPlanBaseUrl,
  getLcPlanServerQuery,
  planFetchJson,
} from "@/lib/lc-plan";

const DAY_MS = 86_400_000;

/** Кеш сирого графіка Plan (великий JSON) — рідкі повторні завантаження. */
const PLAN_GRAPH_RAW_REVALIDATE_SEC = 90;
/** Кеш лайв-знімка Plan (overview + sessions). */
const PLAN_LIVE_REVALIDATE_SEC = 25;

export type PlanOnlineHistoryPeriod = "day" | "week" | "month" | "all";

type PlanServerOverview = {
  numbers?: {
    online_players?: number;
    best_peak_players?: string | number;
    last_peak_players?: string | number;
  };
};

type PlanSessionsPayload = {
  sessions?: Array<{
    server_name?: string;
    start?: string;
    player_name?: string;
    name?: string;
  }>;
};

function parsePlanPeakField(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(0, Math.floor(raw));
  }
  if (typeof raw === "string") {
    const n = parseInt(raw.replace(/\s/g, ""), 10);
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }
  return null;
}

async function fetchPlanGraphPlayersOnlineRawUncached(
  baseTrimmed: string,
  server: string,
): Promise<[number, number][] | null> {
  const u = new URL("/v1/graph", baseTrimmed);
  u.searchParams.set("server", server);
  u.searchParams.set("type", "playersOnline");
  try {
    const res = await fetch(u.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { playersOnline?: unknown };
    const raw = data.playersOnline;
    if (!Array.isArray(raw)) return null;
    const out: [number, number][] = [];
    for (const row of raw) {
      if (!Array.isArray(row) || row.length < 2) continue;
      const t = Number(row[0]);
      const v = Number(row[1]);
      if (!Number.isFinite(t)) continue;
      const y = Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
      out.push([t, y]);
    }
    if (out.length === 0) return null;
    out.sort((a, b) => a[0] - b[0]);
    return out;
  } catch {
    return null;
  }
}

const getCachedPlanGraphRaw = unstable_cache(
  async (baseTrimmed: string, server: string) =>
    fetchPlanGraphPlayersOnlineRawUncached(baseTrimmed, server),
  ["plan-players-online-graph-raw"],
  { revalidate: PLAN_GRAPH_RAW_REVALIDATE_SEC },
);

/**
 * Серія «гравців онлайн» з Plan: `/v1/graph?type=playersOnline`.
 * Результат кешується (Data Cache), щоб не тягнути мегабайти на кожен запит.
 */
export async function fetchPlanGraphPlayersOnlineRaw(): Promise<
  [number, number][] | null
> {
  const base = getLcPlanBaseUrl().replace(/\/$/, "");
  const server = getLcPlanServerQuery();
  return getCachedPlanGraphRaw(base, server);
}

/** Прорідження: у кожному вікні лишаємо точку з максимальним онлайном (піки не губляться). */
function downsampleOnlineSeriesPreservePeaks(
  pairs: { t: number; v: number }[],
  maxPoints: number,
): { t: number; v: number }[] {
  if (pairs.length <= maxPoints) return pairs;
  const step = Math.ceil(pairs.length / maxPoints);
  const out: { t: number; v: number }[] = [];
  for (let i = 0; i < pairs.length; i += step) {
    const chunk = pairs.slice(i, Math.min(i + step, pairs.length));
    let best = chunk[0]!;
    for (const p of chunk) {
      if (p.v > best.v) best = p;
      else if (p.v === best.v && p.t > best.t) best = p;
    }
    out.push(best);
  }
  const last = pairs[pairs.length - 1]!;
  if (!out.some((p) => p.t === last.t)) out.push(last);
  return out;
}

export function slicePlanGraphSeriesForPeriod(
  points: [number, number][],
  period: PlanOnlineHistoryPeriod,
  maxPoints = 800,
): {
  labels: string[];
  values: number[];
  /** Макс. онлайн у вибраному вікні (усі точки Plan до прорідження). */
  maxInPeriod: number | null;
} {
  const pairs = points.map(([t, v]) => ({ t, v }));
  if (pairs.length === 0) {
    return { labels: [], values: [], maxInPeriod: null };
  }

  const now = Date.now();
  const cut =
    period === "day"
      ? now - DAY_MS
      : period === "week"
        ? now - 7 * DAY_MS
        : period === "month"
          ? now - 30 * DAY_MS
          : 0;

  let filtered =
    cut > 0 ? pairs.filter((p) => p.t >= cut) : [...pairs];
  if (filtered.length === 0) {
    filtered = pairs.slice(-Math.min(maxPoints * 2, pairs.length));
  }

  const maxInPeriod =
    filtered.length > 0
      ? Math.max(...filtered.map((p) => p.v))
      : null;

  let display =
    filtered.length > maxPoints
      ? downsampleOnlineSeriesPreservePeaks(filtered, maxPoints)
      : filtered;

  const fmt = (t: number) => {
    const d = new Date(t);
    if (period === "day") {
      return d.toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (period === "week") {
      return d.toLocaleDateString("uk-UA", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    }
    if (period === "month") {
      return d.toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "short",
      });
    }
    return d.toLocaleDateString("uk-UA", {
      month: "short",
      year: "2-digit",
    });
  };

  return {
    labels: display.map((p) => fmt(p.t)),
    values: display.map((p) => p.v),
    maxInPeriod:
      maxInPeriod != null && Number.isFinite(maxInPeriod)
        ? Math.max(0, Math.round(maxInPeriod))
        : null,
  };
}

/**
 * Для яких `server_name` у `/v1/sessions` збираємо ніки «(Online)».
 * За замовчуванням — основний сервер + Proxy Server (частина гравців лише на проксі).
 * `LC_PLAN_EXTRA_SESSION_SERVERS` — додаткові назви через кому; `0` / `false` / порожньо — лише основний.
 */
function planSessionServerAllowlist(
  mainServer: string,
  cacheExtrasKey: string,
): Set<string> {
  const set = new Set<string>([mainServer]);
  if (cacheExtrasKey === "__def__") {
    set.add("Proxy Server");
    return set;
  }
  const empty =
    cacheExtrasKey === "" ||
    cacheExtrasKey === "0" ||
    cacheExtrasKey.toLowerCase() === "false";
  if (empty) return set;
  for (const part of cacheExtrasKey.split(",")) {
    const t = part.trim();
    if (t) set.add(t);
  }
  return set;
}

async function fetchPlanLiveForOnlineHistoryUncached(
  mainServer: string,
  cacheExtrasKey: string,
): Promise<{
  liveOnline: number;
  peakHint: number | null;
  playerNames: string[];
} | null> {
  const overview = await planFetchJson<PlanServerOverview>(
    "/v1/serverOverview",
  );
  const onlineRaw = overview?.numbers?.online_players;
  if (typeof onlineRaw !== "number" || !Number.isFinite(onlineRaw)) {
    return null;
  }
  const liveOnline = Math.max(0, Math.floor(onlineRaw));

  const best = parsePlanPeakField(overview?.numbers?.best_peak_players);
  const last = parsePlanPeakField(overview?.numbers?.last_peak_players);
  const peakHint =
    best != null || last != null
      ? Math.max(best ?? 0, last ?? 0, liveOnline)
      : null;

  const allow = planSessionServerAllowlist(mainServer, cacheExtrasKey);
  const sessions = await planFetchJson<PlanSessionsPayload>("/v1/sessions");
  const names = new Set<string>();
  for (const s of sessions?.sessions ?? []) {
    if (!allow.has(String(s.server_name ?? ""))) continue;
    const start = String(s.start ?? "");
    if (!start.includes("Online")) continue;
    const name = String(s.player_name ?? s.name ?? "").trim();
    if (name) names.add(name);
  }

  return {
    liveOnline,
    peakHint,
    playerNames: [...names].sort((a, b) => a.localeCompare(b, "uk")),
  };
}

const getCachedPlanLive = unstable_cache(
  async (mainServer: string, cacheExtrasKey: string) =>
    fetchPlanLiveForOnlineHistoryUncached(mainServer, cacheExtrasKey),
  ["plan-live-online-history"],
  { revalidate: PLAN_LIVE_REVALIDATE_SEC },
);

/** Поточний онлайн і ніки з Plan (`serverOverview` + активні сесії на цьому сервері). */
export async function fetchPlanLiveForOnlineHistory(): Promise<{
  liveOnline: number;
  peakHint: number | null;
  playerNames: string[];
} | null> {
  const main = getLcPlanServerQuery();
  const raw = process.env.LC_PLAN_EXTRA_SESSION_SERVERS;
  const cacheExtrasKey =
    raw === undefined ? "__def__" : raw.trim();
  return getCachedPlanLive(main, cacheExtrasKey);
}
