"use client";

import { HeroOnlineHistoryChart } from "@/components/site/HeroOnlineHistoryChart";

/** Обгортка для графіка онлайну (картка — у HeroOnlineHistoryChart). */
export function HeroOnlineMonitorClient() {
  return (
    <div className="w-full">
      <HeroOnlineHistoryChart />
    </div>
  );
}
