import { HeroOnlineMonitorClient } from "@/components/site/HeroOnlineMonitorClient";

/**
 * Картка з графіком онлайну. Дані: GET /api/online-history (ОУМ / custom API / fallback).
 */
export function HeroOnlineMonitor() {
  return <HeroOnlineMonitorClient />;
}
