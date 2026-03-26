"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const PERIODS = [
  { id: "day" as const, label: "День" },
  { id: "week" as const, label: "Тиждень" },
  { id: "month" as const, label: "Місяць" },
];

const LINE_GOLD = "#ECAF2D";
const HOVER_POINT = "#00FFFF";

const chartPalette = {
  grid: "#222222",
  tick: "#aaaaaa",
  tooltipBg: "#1E1E1E",
  tooltipTitle: "#ffffff",
  tooltipBody: "#ffffff",
} as const;

type ChartPayload = {
  labels: string[];
  values: number[];
  synthetic?: boolean;
};

export function HeroOnlineHistoryChart() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("month");
  const [payload, setPayload] = useState<ChartPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: (typeof PERIODS)[number]["id"]) => {
    setError(null);
    try {
      const res = await fetch(`/api/online-history?period=${p}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ChartPayload;
      if (!Array.isArray(data.labels) || !Array.isArray(data.values)) {
        throw new Error("bad payload");
      }
      setPayload(data);
    } catch {
      setError("Не вдалося завантажити графік");
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [period, load]);

  const hasOfflineTicks = Boolean(
    payload && payload.values.some((v) => v < 0),
  );

  const maxY =
    payload && payload.values.length > 0
      ? Math.max(...payload.values) + 1
      : 1;

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
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
    [hasOfflineTicks, maxY],
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
        "bg-white/40 dark:bg-black/38 dark:shadow-[0_8px_36px_rgba(0,0,0,0.34)]",
      )}
    >
      <h3 className="text-center text-base font-bold text-[var(--mc-text)] md:text-lg">
        Моніторинг онлайну сервера
      </h3>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-sm border-2 px-3 py-1.5 text-xs font-bold transition-colors md:text-sm ${
              period === p.id
                ? "border-[#ECAF2D] bg-[#ECAF2D] text-white"
                : "border-white/10 bg-white/[0.06] text-neutral-200 hover:bg-white/[0.1]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="relative mt-4 h-[220px] w-full md:h-[300px] lg:h-[360px]">
        {error ? (
          <p className="flex h-full items-center justify-center text-sm text-[var(--mc-text-muted)]">
            {error}
          </p>
        ) : data ? (
          <Line data={data} options={options} />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-[var(--mc-text-muted)]">
            Завантаження…
          </p>
        )}
      </div>
    </div>
  );
}
