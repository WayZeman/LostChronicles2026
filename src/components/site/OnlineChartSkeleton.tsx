"use client";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Для screen reader; на екрані не показується. */
  label?: string;
};

/** Мінімалістичний лоадер зони графіка онлайну — лише спінер. */
export function OnlineChartSkeleton({
  className,
  label = "Завантаження графіка…",
}: Props) {
  return (
    <div
      className={cn(
        "lc-chart-skeleton relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <span className="lc-chart-skeleton-spinner" aria-hidden />
    </div>
  );
}
