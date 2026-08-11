"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { notifyDiamondHuntChanged } from "@/lib/diamond-hunt-events";
import { AUTH_ME_CHANGED_EVENT } from "@/lib/auth-me-events";
import { DiamondIcon } from "@/components/site/DiamondIcon";
import { cn } from "@/lib/utils";

type Spot = { id: string; top: number; left: number };

type StatePayload = {
  active?: boolean;
  spotsOnPage?: Spot[];
  balance?: number;
  todayCollected?: number;
  todayTotal?: number;
};

export function DiamondHuntLayer() {
  const pathname = usePathname() || "/";
  const [spots, setSpots] = useState<Spot[]>([]);
  const [active, setActive] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const load = useCallback(async () => {
    if (pathname.startsWith("/admin")) {
      setSpots([]);
      setActive(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/diamonds/state?path=${encodeURIComponent(pathname)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as StatePayload & { user?: number | null };
      const isUser = Boolean(data.user);
      setLoggedIn(isUser);
      setActive(Boolean(data.active) && isUser);
      setSpots(
        isUser && data.active && Array.isArray(data.spotsOnPage)
          ? data.spotsOnPage
          : [],
      );
      if (isUser && data.active) {
        notifyDiamondHuntChanged({
          balance: data.balance,
          todayCollected: data.todayCollected,
          todayTotal: data.todayTotal,
        });
      }
    } catch {
      setSpots([]);
      setActive(false);
    }
  }, [pathname]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  useEffect(() => {
    const onAuth = () => void load();
    window.addEventListener(AUTH_ME_CHANGED_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_ME_CHANGED_EVENT, onAuth);
  }, [load]);

  async function onCollect(spotId: string) {
    if (busyId) return;
    setBusyId(spotId);
    setSpots((prev) => prev.filter((s) => s.id !== spotId));
    try {
      const res = await fetch("/api/diamonds/collect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        balance?: number;
        todayCollected?: number;
        todayTotal?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        void load();
        setBusyId(null);
        return;
      }
      notifyDiamondHuntChanged({
        balance: data.balance,
        todayCollected: data.todayCollected,
        todayTotal: data.todayTotal,
      });
    } catch {
      void load();
    }
    setBusyId(null);
  }

  if (!active || !loggedIn || spots.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[45] overflow-hidden"
      aria-hidden={false}
    >
      {spots.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-label="Зібрати діамант"
          disabled={busyId === s.id}
          onClick={() => void onCollect(s.id)}
          className={cn(
            "pointer-events-auto absolute",
            "lc-focus-ring size-9 rounded-full sm:size-10",
            "animate-[lc-diamond-bob_2.4s_ease-in-out_infinite]",
            "transition-[filter] hover:brightness-110 active:brightness-90",
            "drop-shadow-[0_0_10px_rgba(80,200,255,0.55)]",
          )}
          style={{ top: `${s.top}%`, left: `${s.left}%` }}
        >
          <DiamondIcon size={40} className="size-full" />
        </button>
      ))}
    </div>
  );
}
