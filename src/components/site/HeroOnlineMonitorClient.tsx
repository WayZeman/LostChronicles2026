"use client";

import { HeroOnlineHistoryChart } from "@/components/site/HeroOnlineHistoryChart";

/** Вміст усередині спільної «фігури» з навбаром на сторінці (без окремого am-glass). */
export function HeroOnlineMonitorClient() {
  return (
    <div className="w-full">
      <HeroOnlineHistoryChart />
    </div>
  );
}
