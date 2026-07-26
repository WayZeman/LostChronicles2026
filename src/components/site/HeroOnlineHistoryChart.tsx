"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
import { SoftAppear } from "@/components/site/SoftAppear";
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

/** Швидкий рендер голови (Mojang); для Ely-акаунтів підставляється резерв нижче. */
function getMcHeadAvatarUrl(nick: string, size: 32 | 48 = 32): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/${size}`;
}

/** Ely — лише як fallback: менший scale швидше віддає PNG. */
function getElyPlayerHeadUrl(nick: string): string {
  const skinUrl = `http://skinsystem.ely.by/skins/${encodeURIComponent(nick)}.png`;
  return `https://ely.by/services/skins-renderer?url=${encodeURIComponent(skinUrl)}&scale=10&renderFace=1`;
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

function PlayerHead({
  nick,
  eager,
}: {
  nick: string;
  eager?: boolean;
}) {
  return (
    <img
      src={getMcHeadAvatarUrl(nick)}
      alt=""
      width={22}
      height={22}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      data-player={nick}
      data-head-stage="mc"
      onError={(event) => {
        const img = event.currentTarget;
        const playerNick = img.dataset.player ?? "";
        const stage = img.dataset.headStage ?? "mc";
        if (stage === "mc") {
          img.dataset.headStage = "ely";
          img.src = getElyPlayerHeadUrl(playerNick);
          return;
        }
        if (stage === "ely") {
          img.dataset.headStage = "steve";
          img.src = getMcHeadAvatarUrl("steve");
        }
      }}
      className="pointer-events-none size-[22px] shrink-0 rounded-[3px] border border-white/20"
      aria-hidden
    />
  );
}

function PlayerNamesStrip({ names }: { names: string[] }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copiedNick, setCopiedNick] = useState<string | null>(null);

  const stripRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const hoverPausedRef = useRef(false);
  const lastXRef = useRef(0);
  const dragDistRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const halfWidthRef = useRef(0);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const marquee = names.length > 4 && !reduceMotion;

  const applyTransform = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    let half = halfWidthRef.current;
    if (half <= 0) {
      half = track.scrollWidth / 2;
      halfWidthRef.current = half;
    }
    if (half > 0) {
      let x = offsetRef.current % half;
      if (x > 0) x -= half;
      offsetRef.current = x;
    }
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  }, []);

  useEffect(() => {
    if (!marquee) {
      if (trackRef.current) trackRef.current.style.transform = "";
      return;
    }

    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      halfWidthRef.current = track.scrollWidth / 2;
    };
    measure();

    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);

    const SPEED = 28; // px/s
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(32, now - last) / 1000;
      last = now;
      if (!draggingRef.current && !hoverPausedRef.current) {
        offsetRef.current -= SPEED * dt;
        applyTransform();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [marquee, names, applyTransform]);

  const pauseAuto = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    pauseAuto();
    resumeTimerRef.current = setTimeout(() => {
      hoverPausedRef.current = false;
      resumeTimerRef.current = null;
    }, 1400);
  }, [pauseAuto]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!marquee) return;
    const el = stripRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      const dx =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (dx === 0) return;
      e.preventDefault();
      pauseAuto();
      hoverPausedRef.current = true;
      offsetRef.current -= dx;
      applyTransform();
      scheduleResume();
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [marquee, applyTransform, pauseAuto, scheduleResume]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!marquee) return;
    if (e.button !== 0) return;
    pauseAuto();
    draggingRef.current = true;
    hoverPausedRef.current = true;
    setDragging(true);
    lastXRef.current = e.clientX;
    dragDistRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!marquee || !draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    dragDistRef.current += Math.abs(dx);
    offsetRef.current += dx;
    applyTransform();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!marquee) return;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    scheduleResume();
  };

  const copyNick = async (nick: string) => {
    if (dragDistRef.current > 8) return;
    try {
      await navigator.clipboard.writeText(nick);
      setCopiedNick(nick);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedNick(null), 1600);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const chip = (nick: string, key: string, eager?: boolean) => (
    <li key={key} className="list-none">
      <button
        type="button"
        className={cn(
          "lc-player-chip inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--mc-border-card)] bg-[var(--mc-surface-elevated)] px-2 py-1.5",
          "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--mc-net-green)]",
          copiedNick === nick && "lc-player-chip-copied",
        )}
        title={
          copiedNick === nick ? "Скопійовано" : `Скопіювати нік: ${nick}`
        }
        aria-label={`Скопіювати нік ${nick}`}
        onClick={() => void copyNick(nick)}
      >
        <PlayerHead nick={nick} eager={eager} />
        <span className="max-w-[7.5rem] truncate text-xs font-medium text-[var(--mc-text)] sm:max-w-[9rem] sm:text-[13px]">
          {copiedNick === nick ? "Скопійовано" : nick}
        </span>
      </button>
    </li>
  );

  return (
    <div
      ref={stripRef}
      className={cn(
        "lc-player-strip mt-3",
        marquee ? "lc-player-strip-marquee" : "lc-player-strip-static",
        marquee && (dragging ? "lc-player-strip-dragging" : "lc-player-strip-grab"),
      )}
      role="list"
      aria-label="Гравці онлайн. Перетягніть смужку або натисніть на нік, щоб скопіювати."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerEnter={() => {
        if (!marquee) return;
        pauseAuto();
        hoverPausedRef.current = true;
      }}
      onPointerLeave={() => {
        if (!marquee || draggingRef.current) return;
        scheduleResume();
      }}
    >
      <ul ref={trackRef} className="lc-player-strip-track">
        {names.map((nick, i) => chip(nick, nick, i < 8))}
        {marquee
          ? names.map((nick) => chip(nick, `dup-${nick}`, false))
          : null}
      </ul>
    </div>
  );
}

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
    <SoftAppear slow>
      <div
        className={cn(
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
              <PlayerNamesStrip names={payload.livePlayerNames} />
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
      {peakOnline != null ? (
        <p className="mt-3 text-center text-sm font-semibold text-[var(--mc-net-green)] md:text-base">
          Пік онлайну: <span className="tabular-nums">{peakOnline}</span>{" "}
          {ukPlayersWord(peakOnline)}
        </p>
      ) : null}
      </div>
    </SoftAppear>
  );
}
