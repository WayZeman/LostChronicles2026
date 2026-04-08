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
  liveProbe: "api" | "api-offline" | "env-fallback";
};

async function getLiveSnapshot(): Promise<LiveSnapshot> {
  const host =
    process.env.NEXT_PUBLIC_SERVER_IP?.trim() || LC_DEFAULT_JAVA_SERVER_HOST;
  const status = await getJavaServerStatus(host);
  return {
    liveOnline: status.playersOnline,
    liveMax: status.playersMax,
    liveProbe: status.source,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("period");
  const period: Period = isPeriod(raw) ? raw : "week";

  const live = await getLiveSnapshot();

  const upstreamBase = parseTrustedOnlineHistoryUpstream(
    process.env.ONLINE_HISTORY_API_URL ?? "",
  );
  if (upstreamBase) {
    try {
      const url = new URL(upstreamBase);
      url.searchParams.set("period", period);
      const res = await fetch(url.toString(), { next: { revalidate: 60 } });
      if (res.ok) {
        const data = (await res.json()) as { labels?: unknown; values?: unknown };
        if (Array.isArray(data.labels) && Array.isArray(data.values)) {
          return Response.json({
            labels: data.labels.map(String),
            values: data.values.map((v) => Number(v) || 0),
            synthetic: false,
            source: "custom-api",
            historySource: "custom-api" as const,
            ...live,
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
            ...live,
          });
        }
      }
    } catch {
      /* fallback */
    }
  }

  const online = live.liveOnline ?? 0;
  const { labels, values } = syntheticSeries(period, online);

  return Response.json({
    labels,
    values,
    synthetic: true,
    historySource: "synthetic" as const,
    liveOnline: live.liveOnline,
    liveMax: live.liveMax,
    liveProbe: live.liveProbe,
  });
}
