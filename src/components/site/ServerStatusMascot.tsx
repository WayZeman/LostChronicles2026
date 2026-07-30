"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LivePayload = {
  liveOnline?: number | null;
  liveProbe?: "plan" | "api" | "api-offline" | "env-fallback";
};

type Status = "online" | "offline" | "unknown";

function statusFromLive(data: LivePayload | null): Status {
  if (!data) return "unknown";
  if (data.liveProbe === "api-offline") return "offline";
  if (typeof data.liveOnline === "number" && data.liveOnline >= 0) return "online";
  return "unknown";
}

/**
 * Персонаж «сидить» на лівому верхньому краю панелі онлайну.
 * ONLINE / OFFLINE залежно від live-статусу сервера.
 */
export function ServerStatusMascot({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>("unknown");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/online-history?liveOnly=1", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as LivePayload;
        if (!cancelled) setStatus(statusFromLive(data));
      } catch {
        /* лишаємо попередній стан */
      }
    };

    void load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (status === "unknown") return null;

  const src =
    status === "online"
      ? "/server-status-online.png?v=8"
      : "/server-status-offline.png?v=8";
  const alt =
    status === "online"
      ? "Сервер онлайн"
      : "Сервер офлайн";

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-0 top-0 z-20 -translate-y-[86%]",
        "w-[6.25rem] sm:left-1 sm:w-[7.5rem] md:w-[8.5rem]",
        className,
      )}
      aria-hidden
    >
      <Image
        src={src}
        alt={alt}
        width={512}
        height={748}
        className="h-auto w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
        priority={false}
        unoptimized
      />
    </div>
  );
}
