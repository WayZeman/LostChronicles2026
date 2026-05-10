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

function getPlayerHeadUrl(nick: string): string {
  const skinUrl = `http://skinsystem.ely.by/skins/${encodeURIComponent(nick)}.png`;
  return `https://ely.by/services/skins-renderer?url=${encodeURIComponent(skinUrl)}&scale=18.9&renderFace=1`;
}

function getPlayerHeadFallbackUrl(nick: string): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/48`;
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
            chartPending: true,
            liveOnline: liveData.liveOnline,
            liveMax: liveData.liveMax,
            livePlayerNames: liveData.livePlayerNames,
            liveProbe: liveData.liveProbe,
            allTimePeak: liveData.allTimePeak,
          }),
        );
      }

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
  }, [load]);

  const hasOfflineTicks = Boolean(
    payload && payload.values.some((v) => v < 0),
  );

  const chartValues = useMemo(() => {
    if (!payload || payload.values.length === 0) return [];
    return [...payload.values];
  }, [payload]);

  const maxY = chartValues.length > 0 ? Math.max(...chartValues) + 1 : 1;
  const peakOnline = useMemo(() => {
    if (payload && typeof payload.allTimePeak === "number") {
      return payload.allTimePeak;
    }
    if (chartValues.length === 0) return null;
    const onlyOnlineValues = chartValues.filter((v) => v >= 0);
    if (onlyOnlineValues.length === 0) return null;
    return Math.max(...onlyOnlineValues);
  }, [chartValues, payload]);

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
        !embedded && lcGlassPanelClass,
        !embedded && "lc-interactive-panel-static",
        !embedded &&
          "bg-[color-mix(in_srgb,#000_18%,transparent)] shadow-[0_12px_44px_rgba(0,0,0,0.26)]",
        embedded &&
          "rounded-2xl border border-white/[0.08] bg-[color-mix(in_srgb,#000_24%,transparent)] p-4 md:p-5",
      )}
    >
      {!embedded ? (
        <h3 className="text-center text-base font-bold text-[var(--mc-text)] md:text-lg">
          Моніторинг онлайну сервера
        </h3>
      ) : null}

      {payload != null && payload.liveOnline != null ? (
        payload.liveProbe === "api-offline" ? (
          <p
            className={cn(
              "text-center text-sm font-semibold text-[var(--mc-text-muted)] md:text-base",
              embedded ? "mt-0" : "mt-2",
            )}
          >
            Сервер зараз офлайн.
          </p>
        ) : payload.liveOnline === 0 ? (
          <p
            className={cn(
              "text-center text-sm font-semibold text-[var(--mc-net-green)] md:text-base",
              embedded ? "mt-0" : "mt-2",
            )}
          >
            Зараз нікого немає онлайн.
          </p>
        ) : (
          <>
            <p
              className={cn(
                "text-center text-sm font-semibold text-[var(--mc-net-green)] md:text-base",
                embedded ? "mt-0" : "mt-2",
              )}
            >
              Зараз онлайн:{" "}
              <span className="tabular-nums">{payload.liveOnline}</span>{" "}
              {ukPlayersWord(payload.liveOnline)}
            </p>
            {payload.livePlayerNames && payload.livePlayerNames.length > 0 ? (
              <div className="mt-3">
                <ul className="mx-auto flex w-full max-w-3xl flex-wrap justify-center gap-2">
                  {payload.livePlayerNames.map((nick) => (
                    <li
                      key={nick}
                      className="lc-player-card flex w-[calc(50%-0.25rem)] min-w-[140px] max-w-[190px] items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-2.5 py-2 sm:w-[calc(33.333%-0.34rem)] lg:w-[calc(25%-0.375rem)]"
                    >
                      <img
                        src={getPlayerHeadUrl(nick)}
                        alt={`Скін гравця ${nick}`}
                        width={24}
                        height={24}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          const img = event.currentTarget;
                          if (img.dataset.fallbackApplied === "1") return;
                          img.dataset.fallbackApplied = "1";
                          img.src = getPlayerHeadFallbackUrl(nick);
                        }}
                        className="size-6 shrink-0 rounded-[4px] border border-white/[0.2]"
                      />
                      <span
                        className="min-w-0 truncate text-center text-xs text-[var(--mc-text-muted)] md:text-sm"
                        title={nick}
                      >
                        {nick}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )
      ) : null}

      <div className="relative mt-4 h-[220px] w-full md:h-[300px] lg:h-[360px]">
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
          <p className="flex h-full items-center justify-center text-sm text-[var(--mc-text-muted)]">
            {payload?.chartPending
              ? "Завантаження графіка…"
              : "Завантаження…"}
          </p>
        )}
      </div>
      {peakOnline != null ? (
        <p className="mt-3 text-center text-sm font-semibold text-[var(--mc-net-green)] md:text-base">
          Пік онлайну: <span className="tabular-nums">{peakOnline}</span>{" "}
          {ukPlayersWord(peakOnline)}
        </p>
      ) : null}
    </div>
  );
}
