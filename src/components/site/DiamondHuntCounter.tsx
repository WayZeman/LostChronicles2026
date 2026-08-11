"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DIAMOND_HUNT_CHANGED_EVENT,
  type DiamondHuntChangedDetail,
} from "@/lib/diamond-hunt-events";
import { AUTH_ME_CHANGED_EVENT } from "@/lib/auth-me-events";
import { DiamondIcon } from "@/components/site/DiamondIcon";
import { DIAMOND_EVENT_TOTAL } from "@/data/diamond-spots";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function DiamondHuntCounter({ className }: Props) {
  const [visible, setVisible] = useState(false);
  const [balance, setBalance] = useState(0);
  const [total, setTotal] = useState(DIAMOND_EVENT_TOTAL);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/diamonds/state?path=/", {
        credentials: "include",
      });
      const data = (await res.json()) as {
        user?: number | null;
        active?: boolean;
        balance?: number;
        total?: number;
      };
      if (!data.user || !data.active) {
        setVisible(false);
        return;
      }
      setVisible(true);
      setBalance(data.balance ?? 0);
      setTotal(data.total ?? DIAMOND_EVENT_TOTAL);
    } catch {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  useEffect(() => {
    const onAuth = () => void load();
    const onHunt = (e: Event) => {
      const detail = (e as CustomEvent<DiamondHuntChangedDetail>).detail;
      if (detail?.active === false) {
        setVisible(false);
        return;
      }
      if (detail?.balance !== undefined) setBalance(detail.balance);
      if (detail?.total !== undefined) setTotal(detail.total);
      if (detail?.active === true) setVisible(true);
    };
    window.addEventListener(AUTH_ME_CHANGED_EVENT, onAuth);
    window.addEventListener(DIAMOND_HUNT_CHANGED_EVENT, onHunt);
    return () => {
      window.removeEventListener(AUTH_ME_CHANGED_EVENT, onAuth);
      window.removeEventListener(DIAMOND_HUNT_CHANGED_EVENT, onHunt);
    };
  }, [load]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "lc-stream-in relative z-10 mt-2 flex justify-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-cyan-400/25",
          "bg-[linear-gradient(180deg,rgba(20,40,48,0.9),rgba(12,22,28,0.92))]",
          "px-3 py-1.5 text-xs font-bold text-cyan-100 shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
        )}
      >
        <DiamondIcon size={18} className="size-[18px] shrink-0" />
        <span className="tabular-nums text-[var(--mc-menu-yellow)]">
          {balance}/{total}
        </span>
      </div>
    </div>
  );
}
