"use client";

import dynamic from "next/dynamic";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

const HeroOnlineHistoryChart = dynamic(
  () =>
    import("@/components/site/HeroOnlineHistoryChart").then((m) => ({
      default: m.HeroOnlineHistoryChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className={cn(
          lcGlassPanelClass,
          "bg-black/38 shadow-[0_8px_36px_rgba(0,0,0,0.34)]",
        )}
      >
        <h3 className="text-center text-base font-bold text-[var(--mc-text)] md:text-lg">
          Моніторинг онлайну сервера
        </h3>
        <div className="relative mt-4 flex h-[220px] w-full items-center justify-center md:h-[300px] lg:h-[360px]">
          <p className="text-sm text-[var(--mc-text-muted)]">Завантаження графіка…</p>
        </div>
      </div>
    ),
  },
);

/** Вміст усередині спільної «фігури» з навбаром на сторінці (без окремого am-glass). */
export function HeroOnlineMonitorClient() {
  return (
    <div className="w-full">
      <HeroOnlineHistoryChart />
    </div>
  );
}
