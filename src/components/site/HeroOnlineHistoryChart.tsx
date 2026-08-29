"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readClientNetworkHints } from "@/lib/client-network";
import {
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { OnlineChartSkeleton } from "@/components/site/OnlineChartSkeleton";
import { PlayerNamesStrip } from "@/components/site/PlayerNamesStrip";
import { ServerAgeCounter } from "@/components/site/ServerAgeCounter";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const LINE_GOLD = "#ECAF2D";
const HOVER_POINT = "#00FFFF";

const chartPalette = {
  grid: "#222222",
  tick: "#aaaaaa",
  tooltipBg: "#1E1E1E",
  tooltipTitle: "#ffffff",
  tooltipBody: "#ffffff",
} as const;

/** 1 гравець, 2 гравці, 5 гравців */
function ukPlayersWord(n: number): string {
  const nAbs = Math.abs(Math.trunc(n));
  const mod10 = nAbs % 10;
  const mod100 = nAbs % 100;
  if (mod10 === 1 && mod100 !== 11) return "гравець";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return "гравці";
  }
  return "гравців";
}

type ChartPayload = {
  labels: string[];
  values: number[];
  synthetic?: boolean;
  allTimePeak?: number | null;
  liveOnline?: number | null;
  liveMax?: number;
  livePlayerNames?: string[];
  liveProbe?: "plan" | "api" | "api-offline" | "env-fallback";
  /** true — ще тягнемо серію для графіка (після швидкого liveOnly). */
  chartPending?: boolean;
};

type Props = {
  /** Без зовнішньої «скляної» рамки — для вбудови в спільну картку. */
  embedded?: boolean;
};

export function HeroOnlineHistoryChart({ embedded = false }: Props) {
  const [payload, setPayload] = useState<ChartPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [motionTier, setMotionTier] = useState<"full" | "light" | "none">(
    "full",
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      const { isConstrained } = readClientNetworkHints();
      if (reduced.matches || isConstrained) setMotionTier("none");
      else if (narrow.matches) setMotionTier("light");
      else setMotionTier("full");
    };
    apply();
    reduced.addEventListener("change", apply);
    narrow.addEventListener("change", apply);
    const conn = (navigator as Navigator & { connection?: EventTarget })
      .connection;
    conn?.addEventListener?.("change", apply);
    return () => {
      reduced.removeEventListener("change", apply);
      narrow.removeEventListener("change", apply);
      conn?.removeEventListener?.("change", apply);
    };
  }, []);

  const normalizePayload = useCallback((data: ChartPayload): ChartPayload => {
    if (typeof data.liveMax !== "number") {
      data.liveMax = 80;
    }
    if (!("liveOnline" in data)) {
      data.liveOnline = null;
    }
    if (!Array.isArray(data.livePlayerNames)) {
      data.livePlayerNames = [];
    }
    if (
      data.allTimePeak != null &&
      (typeof data.allTimePeak !== "number" || data.allTimePeak < 0)
    ) {
      data.allTimePeak = null;
    }
    if (!Array.isArray(data.labels)) data.labels = [];
    if (!Array.isArray(data.values)) data.values = [];
    return data;
  }, []);

  const load = useCallback(async () => {
    setError(null);
    const mobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches;
    try {
      const liveRes = await fetch("/api/online-history?liveOnly=1", {
        cache: "no-store",
      });
      if (liveRes.ok) {
        const liveData = (await liveRes.json()) as ChartPayload;
        setPayload(
          normalizePayload({
            labels: [],
            values: [],
            chartPending: !mobile,
            liveOnline: liveData.liveOnline,
            liveMax: liveData.liveMax,
            livePlayerNames: liveData.livePlayerNames,
            liveProbe: liveData.liveProbe,
            allTimePeak: liveData.allTimePeak,
          }),
        );
      }

      // На мобільному — лише live-статус, без графіка з датами.
      if (mobile) return;

      const res = await fetch("/api/online-history?period=week", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ChartPayload;
      if (!Array.isArray(data.labels) || !Array.isArray(data.values)) {
        throw new Error("bad payload");
      }
      setPayload(normalizePayload({ ...data, chartPending: false }));
    } catch {
      setError("Не вдалося завантажити графік");
      setPayload((prev) =>
        prev
          ? normalizePayload({
              ...prev,
              chartPending: false,
            })
          : null,
      );
    }
  }, [normalizePayload]);

  useEffect(() => {
    void load();
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => {
      void load();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [load]);

  const hasOfflineTicks = Boolean(
    payload && payload.values.some((v) => v < 0),
  );

  const chartValues = useMemo(() => {
    if (!payload || payload.values.length === 0) return [];
    const values = [...payload.values];
    // Live-онлайн свіжіший за серію Plan (кеш + крок знімків) — остання точка = «зараз».
    if (
      typeof payload.liveOnline === "number" &&
      payload.liveOnline >= 0 &&
      payload.liveProbe !== "api-offline"
    ) {
      values[values.length - 1] = payload.liveOnline;
    }
    return values;
  }, [payload]);

  const maxY = useMemo(() => {
    const seriesMax =
      chartValues.length > 0 ? Math.max(...chartValues.map((v) => Math.max(0, v))) : 0;
    const live =
      payload?.liveOnline != null && payload.liveOnline >= 0
        ? payload.liveOnline
        : 0;
    return Math.max(seriesMax, live) + 1;
  }, [chartValues, payload?.liveOnline]);

  const animMs =
    motionTier === "none" ? 0 : motionTier === "light" ? 580 : 1650;

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: {
        duration: animMs,
        easing: "easeOutQuart",
      },
      animations: {
        numbers: {
          type: "number",
          properties: ["x", "y"],
          duration: animMs,
          easing: "easeOutQuart",
        },
      },
      transitions: {
        active: {
          animation: {
            duration: motionTier === "none" ? 0 : 280,
            easing: "easeOutQuad",
          },
        },
      },
      scales: {
        x: {
          ticks: { color: chartPalette.tick, maxTicksLimit: 10 },
          grid: { color: chartPalette.grid },
        },
        y: {
          min: hasOfflineTicks ? -1 : 0,
          beginAtZero: !hasOfflineTicks,
          suggestedMax: maxY,
          ticks: {
            color: chartPalette.tick,
            stepSize: 1,
            callback(value) {
              if (Number.isInteger(value)) return value as number;
              return undefined;
            },
          },
          grid: {
            color: chartPalette.grid,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: chartPalette.tooltipBg,
          titleColor: chartPalette.tooltipTitle,
          bodyColor: chartPalette.tooltipBody,
          borderColor: LINE_GOLD,
          borderWidth: 1,
          cornerRadius: 6,
          padding: 10,
          callbacks: {
            label: (ctx) => {
              const y = ctx.parsed.y;
              if (y === -1) return "Офлайн";
              return `Онлайн: ${y}`;
            },
          },
        },
      },
    }),
    [animMs, hasOfflineTicks, maxY, motionTier],
  );

  const data =
    payload && payload.labels.length
      ? {
          labels: payload.labels,
          datasets: [
            {
              label: "Онлайн",
              data: chartValues,
              borderColor: LINE_GOLD,
              backgroundColor: "transparent",
              borderWidth: 4,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: HOVER_POINT,
            },
          ],
        }
      : null;

  return (
    <div
      className={cn(
        "lc-stream-in",
        !embedded && lcGlassPanelClass,
        !embedded && "lc-interactive-panel-static",
        !embedded &&
          "bg-[color-mix(in_srgb,#000_18%,transparent)] shadow-[0_12px_44px_rgba(0,0,0,0.26)]",
        embedded &&
          "lc-interactive-panel-embed rounded-[var(--radius)] border-2 border-[var(--mc-border-card)] bg-[var(--mc-deep)] p-4 md:p-5",
      )}
    >
      {!embedded ? (
        <h3 className="text-center text-base font-bold text-[var(--mc-text)] md:text-lg">
          Моніторинг онлайну сервера
        </h3>
      ) : null}

      <ServerAgeCounter className={embedded ? "mt-0" : "mt-2"} />

      {payload != null && payload.liveOnline != null ? (
        <div className="mt-2 sm:hidden">
          {payload.liveProbe === "api-offline" ? (
            <p className="text-center text-sm font-semibold text-[var(--mc-text-muted)]">
              Сервер зараз офлайн.
            </p>
          ) : payload.liveOnline === 0 ? (
            <p className="text-center text-sm font-semibold text-[var(--mc-net-green)]">
              Зараз нікого немає онлайн.
            </p>
          ) : (
            <p className="text-center text-sm font-semibold text-[var(--mc-net-green)]">
              Зараз онлайн:{" "}
              <span className="tabular-nums">{payload.liveOnline}</span>{" "}
              {ukPlayersWord(payload.liveOnline)}
            </p>
          )}
        </div>
      ) : null}

      {payload != null &&
      payload.liveOnline != null &&
      payload.liveProbe !== "api-offline" &&
      payload.liveOnline > 0 &&
      payload.livePlayerNames &&
      payload.livePlayerNames.length > 0 ? (
        <PlayerNamesStrip
          names={payload.livePlayerNames}
          className="mt-3"
          ariaLabel="Гравці онлайн. Перетягніть смужку або натисніть на нік, щоб скопіювати."
        />
      ) : null}

      <div className="relative mt-4 hidden h-[220px] w-full overflow-hidden sm:block md:h-[300px] lg:h-[360px]">
        {error ? (
          <p className="flex h-full items-center justify-center text-sm text-[var(--mc-text-muted)]">
            {error}
          </p>
        ) : data ? (
          <Line
            key={`${payload?.labels?.length ?? 0}-${chartValues.at(-1) ?? ""}-${payload?.liveOnline ?? ""}`}
            data={data}
            options={options}
          />
        ) : (
          <OnlineChartSkeleton
            className="h-full min-h-0"
            label={
              payload?.chartPending
                ? "Завантаження графіка…"
                : "Завантаження…"
            }
          />
        )}
      </div>
      {payload != null && payload.liveOnline != null ? (
        <div className="mt-3 hidden text-center sm:block">
          {payload.liveProbe === "api-offline" ? (
            <p className="text-sm font-semibold text-[var(--mc-text-muted)] md:text-base">
              Сервер зараз офлайн.
            </p>
          ) : payload.liveOnline === 0 ? (
            <p className="text-sm font-semibold text-[var(--mc-net-green)] md:text-base">
              Зараз нікого немає онлайн.
            </p>
          ) : (
            <p className="text-sm font-semibold text-[var(--mc-net-green)] md:text-base">
              Зараз онлайн:{" "}
              <span className="tabular-nums">{payload.liveOnline}</span>{" "}
              {ukPlayersWord(payload.liveOnline)}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
