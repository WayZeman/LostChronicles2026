"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  label?: string;
};

/** Анімований скелетон лінійного графіка онлайну. */
export function OnlineChartSkeleton({
  className,
  label = "Завантаження графіка…",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const fillId = `lc-chart-skel-fill-${uid}`;
  const strokeId = `lc-chart-skel-stroke-${uid}`;

  return (
    <div
      className={cn(
        "lc-chart-skeleton relative h-full min-h-[220px] w-full overflow-hidden",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 640 320"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ECAF2D" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#ECAF2D" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ECAF2D" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#F5D06A" stopOpacity="1" />
            <stop offset="100%" stopColor="#ECAF2D" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {[56, 112, 168, 224, 280].map((y) => (
          <line
            key={y}
            x1="36"
            y1={y}
            x2="620"
            y2={y}
            className="lc-chart-skeleton-grid"
          />
        ))}
        {[140, 280, 420, 540].map((x) => (
          <line
            key={x}
            x1={x}
            y1="24"
            x2={x}
            y2="292"
            className="lc-chart-skeleton-grid lc-chart-skeleton-grid-v"
          />
        ))}

        <line
          x1="36"
          y1="24"
          x2="36"
          y2="292"
          className="lc-chart-skeleton-axis"
        />
        <line
          x1="36"
          y1="292"
          x2="620"
          y2="292"
          className="lc-chart-skeleton-axis"
        />

        <path
          className="lc-chart-skeleton-area"
          fill={`url(#${fillId})`}
          d="M36 250 C90 238 120 210 160 198 C210 182 240 220 290 205 C340 188 370 140 420 128 C470 116 510 150 560 138 C590 130 610 118 620 112 L620 292 L36 292 Z"
        />
        <path
          className="lc-chart-skeleton-line"
          d="M36 250 C90 238 120 210 160 198 C210 182 240 220 290 205 C340 188 370 140 420 128 C470 116 510 150 560 138 C590 130 610 118 620 112"
          fill="none"
          stroke={`url(#${strokeId})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="lc-chart-skeleton-sweep" aria-hidden />

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2.5 sm:bottom-5">
        <span className="lc-chart-skeleton-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <p className="lc-chart-skeleton-label text-sm font-medium text-[var(--mc-text-muted)]">
          {label}
        </p>
      </div>
    </div>
  );
}
