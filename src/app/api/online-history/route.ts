import { getLcPlanPanelServerUrl } from "@/lib/lc-plan";
import {
  fetchPlanGraphPlayersOnlineRaw,
  fetchPlanLiveForOnlineHistory,
  slicePlanGraphSeriesForPeriod,
} from "@/lib/lc-plan-online-history";
import { LC_DEFAULT_JAVA_SERVER_HOST } from "@/lib/lc-server-defaults";
import { getJavaServerStatus } from "@/lib/minecraft-java-status";
import {
  fetchOumOnlineHistory,
  getOumStatsPageUrl,
  sliceOumSeriesForPeriod,
} from "@/lib/minecraft-org-ua-online";

export const dynamic = "force-dynamic";

type Period = "day" | "week" | "month" | "all";

function isPeriod(v: string | null): v is Period {
  return v === "day" || v === "week" || v === "month" || v === "all";
}

function calcPeak(values: number[]): number | null {
  const onlineValues = values
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= 0);
  if (onlineValues.length === 0) return null;
  return Math.max(...onlineValues);
}

function withLivePeak(peak: number | null, liveOnline: number | null): number | null {
  if (typeof liveOnline !== "number" || liveOnline < 0) return peak;
  if (peak == null) return liveOnline;
  return Math.max(peak, liveOnline);
}

/** Лише https, без userinfo — зменшує ризик SSRF при помилковому/шкідливому env. */
function parseTrustedOnlineHistoryUpstream(raw: string): URL | null {
  const s = raw.trim();
  if (!s || s.length > 2048) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (!u.hostname || u.username || u.password) return null;
  return u;
}

/** Як у плагіні statusgrap: { labels, values } */
function syntheticSeries(period: Period, currentOnline: number): {
  labels: string[];
  values: number[];
} {
  const now = new Date();
  const labels: string[] = [];
  const values: number[] = [];
  const base = Math.max(0, currentOnline);

  if (period === "day") {
    for (let h = 23; h >= 0; h--) {
      const d = new Date(now);
      d.setHours(d.getHours() - h, 0, 0, 0);
      labels.push(
        d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
      );
      values.push(base);
    }
  } else if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(
        d.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric" }),
      );
      values.push(base);
    }
  } else if (period === "month") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" }));
      values.push(base);
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      labels.push(d.toLocaleDateString("uk-UA", { month: "short", year: "2-digit" }));
      values.push(base);
    }
  }

  return { labels, values };
}

type LiveSnapshot = {
  liveOnline: number | null;
  liveMax: number;
  livePlayerNames: string[];
  liveProbe: "plan" | "api" | "api-offline" | "env-fallback";
  /** Підказка піку з Plan (`serverOverview`), якщо лайв уже з Plan. */
  planPeakHint: number | null;
};

function publicLivePayload(live: LiveSnapshot) {
  const { planPeakHint: _hint, ...rest } = live;
  void _hint;
  return rest;
}

function mergeDedupeSortedPlayerNames(a: string[], b: string[]): string[] {
  const set = new Set<string>();
  for (const x of a) {
    const t = x.trim();
    if (t) set.add(t);
  }
  for (const x of b) {
    const t = x.trim();
    if (t) set.add(t);
  }
  return [...set].sort((x, y) => x.localeCompare(y, "uk"));
}

async function getLiveSnapshot(): Promise<LiveSnapshot> {
  const host =
    process.env.NEXT_PUBLIC_SERVER_IP?.trim() || LC_DEFAULT_JAVA_SERVER_HOST;
  const [status, planLive] = await Promise.all([
    getJavaServerStatus(host),
    fetchPlanLiveForOnlineHistory(),
  ]);

  if (planLive) {
    const names = mergeDedupeSortedPlayerNames(
      planLive.playerNames,
      status.playerNames,
    );
    const javaOn = status.playersOnline;
    const liveOnline = Math.max(
      planLive.liveOnline,
      javaOn != null && Number.isFinite(javaOn) && javaOn >= 0 ? javaOn : -1,
    );
    return {
      liveOnline,
      liveMax: status.playersMax,
      livePlayerNames: names,
      liveProbe: "plan",
      planPeakHint: planLive.peakHint,
    };
  }

  return {
    liveOnline: status.playersOnline,
    liveMax: status.playersMax,
    livePlayerNames: status.playerNames,
    liveProbe: status.source,
    planPeakHint: null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("period");
  const period: Period = isPeriod(raw) ? raw : "week";

  if (searchParams.get("liveOnly") === "1") {
    const live = await getLiveSnapshot();
    const allTimePeak = withLivePeak(live.planPeakHint, live.liveOnline);
    return Response.json({
      liveOnly: true,
      allTimePeak,
      ...publicLivePayload(live),
    });
  }

  const [live, planPoints] = await Promise.all([
    getLiveSnapshot(),
    fetchPlanGraphPlayersOnlineRaw(),
  ]);
  if (planPoints && planPoints.length > 0) {
    const { labels, values, maxInPeriod } = slicePlanGraphSeriesForPeriod(
      planPoints,
      period,
    );
    if (labels.length > 0) {
      let peak = maxInPeriod ?? calcPeak(values);
      if (live.planPeakHint != null) {
        peak =
          peak == null
            ? live.planPeakHint
            : Math.max(peak, live.planPeakHint);
      }
      const allTimePeak = withLivePeak(peak, live.liveOnline);
      return Response.json({
        labels,
        values,
        synthetic: false,
        source: "plan",
        historySource: "plan" as const,
        attributionUrl: getLcPlanPanelServerUrl(),
        allTimePeak,
        ...publicLivePayload(live),
      });
    }
  }

  const upstreamBase = parseTrustedOnlineHistoryUpstream(
    process.env.ONLINE_HISTORY_API_URL ?? "",
  );
  if (upstreamBase) {
    try {
      const url = new URL(upstreamBase);
      url.searchParams.set("period", period);
      const res = await fetch(url.toString(), { next: { revalidate: 60 } });
      if (res.ok) {
        const data = (await res.json()) as {
          labels?: unknown;
          values?: unknown;
          allTimePeak?: unknown;
        };
        if (Array.isArray(data.labels) && Array.isArray(data.values)) {
          const values = data.values.map((v) => Number(v) || 0);
          const upstreamPeak =
            typeof data.allTimePeak === "number" && data.allTimePeak >= 0
              ? data.allTimePeak
              : calcPeak(values);
          return Response.json({
            labels: data.labels.map(String),
            values,
            synthetic: false,
            source: "custom-api",
            historySource: "custom-api" as const,
            allTimePeak: withLivePeak(upstreamPeak, live.liveOnline),
            ...publicLivePayload(live),
          });
        }
      }
    } catch {
      /* fallback */
    }
  }

  const oumPage = getOumStatsPageUrl();
  if (oumPage) {
    try {
      const full = await fetchOumOnlineHistory(oumPage);
      if (full && full.labels.length > 0) {
        const allTimePeak = withLivePeak(calcPeak(full.values), live.liveOnline);
        const { labels, values } = sliceOumSeriesForPeriod(
          full.labels,
          full.values,
          period,
        );
        if (labels.length > 0) {
          return Response.json({
            labels,
            values,
            synthetic: false,
            source: "minecraft-org-ua",
            historySource: "minecraft-org-ua" as const,
            attributionUrl: oumPage,
            allTimePeak,
            ...publicLivePayload(live),
          });
        }
      }
    } catch {
      /* fallback */
    }
  }

  const online = live.liveOnline ?? 0;
  const { labels, values } = syntheticSeries(period, online);
  const allTimePeak = withLivePeak(calcPeak(values), live.liveOnline);

  return Response.json({
    labels,
    values,
    synthetic: true,
    historySource: "synthetic" as const,
    allTimePeak,
    ...publicLivePayload(live),
  });
}
