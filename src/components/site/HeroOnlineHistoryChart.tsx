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
  liveOnline?: number | null;
  liveMax?: number;
  liveProbe?: "api" | "api-offline" | "env-fallback";
};

export function HeroOnlineHistoryChart() {
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

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/online-history?period=month");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ChartPayload;
      if (!Array.isArray(data.labels) || !Array.isArray(data.values)) {
        throw new Error("bad payload");
      }
      if (typeof data.liveMax !== "number") {
        data.liveMax = 80;
      }
      if (!("liveOnline" in data)) {
        data.liveOnline = null;
      }
      setPayload(data);
    } catch {
      setError("Не вдалося завантажити графік");
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasOfflineTicks = Boolean(
    payload && payload.values.some((v) => v < 0),
  );

  const maxY =
    payload && payload.values.length > 0
      ? Math.max(...payload.values) + 1
      : 1;

  const animMs =
    motionTier === "none" ? 0 : motionTier === "light" ? 520 : 1400;

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
              data: payload.values,
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
        lcGlassPanelClass,
        "bg-black/38 shadow-[0_8px_36px_rgba(0,0,0,0.34)]",
      )}
    >
      <h3 className="text-center text-base font-bold text-[var(--mc-text)] md:text-lg">
        Моніторинг онлайну сервера
      </h3>

      {payload != null && payload.liveOnline != null ? (
        payload.liveProbe === "api-offline" ? (
          <p className="mt-2 text-center text-sm font-semibold text-[var(--mc-text-muted)] md:text-base">
            Не вдалося перевірити сервер — спробуйте пізніше.
          </p>
        ) : payload.liveOnline === 0 ? (
          <p className="mt-2 text-center text-sm font-semibold text-[var(--mc-net-green)] md:text-base">
            Зараз нікого немає онлайн.
          </p>
        ) : (
          <p className="mt-2 text-center text-sm font-semibold text-[var(--mc-net-green)] md:text-base">
            Зараз онлайн:{" "}
            <span className="tabular-nums">{payload.liveOnline}</span>{" "}
            {ukPlayersWord(payload.liveOnline)}
          </p>
        )
      ) : null}

      <div className="relative mt-4 h-[220px] w-full md:h-[300px] lg:h-[360px]">
        {error ? (
          <p className="flex h-full items-center justify-center text-sm text-[var(--mc-text-muted)]">
            {error}
          </p>
        ) : data ? (
          <Line
            key={`${payload?.labels?.length ?? 0}-${payload?.values?.at(-1) ?? ""}`}
            data={data}
            options={options}
          />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-[var(--mc-text-muted)]">
            Завантаження…
          </p>
        )}
      </div>
    </div>
  );
}
