/**
 * Статистика онлайну зі сторінки каталогу ОУМ: у HTML вбудовані масиви
 * `var xValues = ['YYYY-MM-DD HH:mm', ...]` та `var yValues = [0, -1, ...]`
 * (-1 = сервер офлайн, як на сайті).
 */

export type OumHistoryPeriod = "day" | "week" | "month" | "all";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Наближено київський час у відповіді (фіксований +02:00; для графіка достатньо). */
function oumLabelToUtcMs(label: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(label.trim());
  if (!m) return NaN;
  const [, y, mo, d, h, mi] = m;
  return new Date(
    `${y}-${mo}-${d}T${h}:${mi}:00+02:00`,
  ).getTime();
}

export function extractOumSeriesFromHtml(html: string): {
  labels: string[];
  values: number[];
} | null {
  const xm = html.match(/var xValues = (\[[\s\S]*?\]);/);
  const ym = html.match(/var yValues = (\[[\s\S]*?\]);/);
  if (!xm?.[1] || !ym?.[1]) return null;

  const xJson = xm[1].trim().replace(/'/g, '"');
  let labels: unknown;
  let values: unknown;
  try {
    labels = JSON.parse(xJson);
    values = JSON.parse(ym[1].trim());
  } catch {
    return null;
  }
  if (!Array.isArray(labels) || !Array.isArray(values)) return null;
  if (labels.length !== values.length || labels.length === 0) return null;

  const nums = values.map((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });
  const strLabels = labels.map((l) => String(l));

  return { labels: strLabels, values: nums };
}

export function sliceOumSeriesForPeriod(
  labels: string[],
  values: number[],
  period: OumHistoryPeriod,
  maxPoints = 360,
): { labels: string[]; values: number[] } {
  const pairs = labels
    .map((l, i) => ({
      l,
      v: values[i] ?? 0,
      t: oumLabelToUtcMs(l),
    }))
    .filter((p) => Number.isFinite(p.t));

  if (pairs.length === 0) return { labels: [], values: [] };

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

  if (filtered.length > maxPoints) {
    const step = Math.ceil(filtered.length / maxPoints);
    filtered = filtered.filter(
      (_, i) => i % step === 0 || i === filtered.length - 1,
    );
  }

  const fmt = (label: string) => {
    const t = oumLabelToUtcMs(label);
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
    labels: filtered.map((p) => fmt(p.l)),
    values: filtered.map((p) => p.v),
  };
}

const DEFAULT_OUM_STATS_PAGE =
  "https://minecraft.org.ua/minecraft-servers/Lost-Chronicles/3210";

export function getOumStatsPageUrl(): string | null {
  const raw = process.env.OUM_ONLINE_STATS_PAGE_URL?.trim();
  if (raw === "0" || raw === "false") return null;
  if (raw) return raw;
  return DEFAULT_OUM_STATS_PAGE;
}

export async function fetchOumOnlineHistory(
  pageUrl: string,
): Promise<{ labels: string[]; values: number[] } | null> {
  const res = await fetch(pageUrl, {
    next: { revalidate: 300 },
    headers: {
      "User-Agent":
        "LostChroniclesSite/1.0 (+https://lost-chronicles.site; public stats)",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) return null;
  const html = await res.text();
  return extractOumSeriesFromHtml(html);
}
