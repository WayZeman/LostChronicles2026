"use client";

import dynamic from "next/dynamic";
import { OnlineChartSkeleton } from "@/components/site/OnlineChartSkeleton";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

function ChartLoading({ embedded }: { embedded: boolean }) {
  if (embedded) {
    return (
      <div
        className={cn(
          "w-full overflow-hidden mc-slot",
          "h-[220px] md:h-[300px] lg:h-[360px]",
        )}
      >
        <OnlineChartSkeleton className="h-full min-h-0" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        lcGlassPanelClass,
        "bg-[color-mix(in_srgb,#000_20%,transparent)] shadow-[0_12px_44px_rgba(0,0,0,0.26)]",
      )}
    >
      <h3 className="text-center text-base font-bold text-[var(--mc-text)] md:text-lg">
        Моніторинг онлайну сервера
      </h3>
      <div className="relative mt-4 h-[220px] w-full overflow-hidden md:h-[300px] lg:h-[360px]">
        <OnlineChartSkeleton className="h-full min-h-0" />
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
