"use client";

import dynamic from "next/dynamic";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

function ChartLoading({ embedded }: { embedded: boolean }) {
  if (embedded) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] w-full items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[var(--mc-border-card)] bg-[var(--mc-deep)] md:min-h-[300px] lg:min-h-[360px]",
          "lc-skeleton-breathe",
        )}
      >
        <p className="text-sm text-[var(--mc-text-muted)]">Завантаження графіка…</p>
      </div>
    );
  }
  return (
    <div
      className={cn(
        lcGlassPanelClass,
        "bg-[color-mix(in_srgb,#000_20%,transparent)] shadow-[0_12px_44px_rgba(0,0,0,0.26)]",
        "lc-skeleton-breathe",
      )}
    >
      <h3 className="text-center text-base font-bold text-[var(--mc-text)] md:text-lg">
        Моніторинг онлайну сервера
      </h3>
      <div className="relative mt-4 flex h-[220px] w-full items-center justify-center md:h-[300px] lg:h-[360px]">
        <p className="text-sm text-[var(--mc-text-muted)]">Завантаження графіка…</p>
      </div>
    </div>
  );
}

const HeroOnlineHistoryChartEmbedded = dynamic(
  () =>
    import("@/components/site/HeroOnlineHistoryChart").then((m) => ({
      default: m.HeroOnlineHistoryChart,
    })),
  {
    ssr: false,
    loading: () => <ChartLoading embedded />,
  },
);

const HeroOnlineHistoryChartStandalone = dynamic(
  () =>
    import("@/components/site/HeroOnlineHistoryChart").then((m) => ({
      default: m.HeroOnlineHistoryChart,
    })),
  {
    ssr: false,
    loading: () => <ChartLoading embedded={false} />,
  },
);

type Props = { embedded?: boolean };

/** Графік онлайну; при `embedded` — без окремої скляної картки (для спільної панелі). */
export function HeroOnlineMonitorClient({ embedded = false }: Props) {
  if (embedded) {
    return (
      <div className="w-full">
        <HeroOnlineHistoryChartEmbedded embedded />
      </div>
    );
  }
  return (
    <div className="w-full">
      <HeroOnlineHistoryChartStandalone embedded={false} />
    </div>
  );
}
