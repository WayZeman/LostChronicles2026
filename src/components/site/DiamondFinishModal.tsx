"use client";

import { useEffect, useState } from "react";
import {
  DIAMOND_HUNT_CHANGED_EVENT,
  type DiamondHuntChangedDetail,
} from "@/lib/diamond-hunt-events";
import { DiamondIcon } from "@/components/site/DiamondIcon";
import { cn } from "@/lib/utils";

const SEEN_KEY = "lc-diamond-finish-seen";

export function DiamondFinishModal() {
  const [place, setPlace] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onHunt = (e: Event) => {
      const d = (e as CustomEvent<DiamondHuntChangedDetail>).detail;
      if (d?.justFinished && d.finishPlace) {
        setPlace(d.finishPlace);
        setOpen(true);
        try {
          sessionStorage.setItem(SEEN_KEY, String(d.finishPlace));
        } catch {
          /* ignore */
        }
        return;
      }
      if (d?.finishPlace && d.balance !== undefined && d.total !== undefined) {
        if (d.balance >= d.total && d.finishPlace > 0) {
          try {
            const seen = sessionStorage.getItem(SEEN_KEY);
            if (seen !== String(d.finishPlace)) {
              setPlace(d.finishPlace);
              setOpen(true);
              sessionStorage.setItem(SEEN_KEY, String(d.finishPlace));
            }
          } catch {
            /* ignore */
          }
        }
      }
    };
    window.addEventListener(DIAMOND_HUNT_CHANGED_EVENT, onHunt);
    return () => window.removeEventListener(DIAMOND_HUNT_CHANGED_EVENT, onHunt);
  }, []);

  if (!open || !place) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lc-diamond-finish-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
        aria-label="Закрити"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--mc-menu-yellow)]/40",
          "bg-[linear-gradient(165deg,rgba(40,32,12,0.98),rgba(14,16,12,0.98))]",
          "p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.6)]",
        )}
      >
        <div className="mx-auto flex justify-center gap-1">
          <DiamondIcon size={28} />
          <DiamondIcon size={36} />
          <DiamondIcon size={28} />
        </div>
        <h2
          id="lc-diamond-finish-title"
          className="lc-hero-title mt-4 text-xl font-extrabold text-[var(--mc-menu-yellow)]"
        >
          Вітаємо!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--mc-text)]">
          Ти знайшов усі{" "}
          <span className="font-bold text-cyan-200">100 діамантів</span> на
          сайті Lost Chronicles.
        </p>
        <p className="mt-4 font-[family-name:var(--font-minecraft)] text-3xl font-bold tabular-nums text-[var(--mc-menu-yellow)]">
          #{place}
        </p>
        <p className="mt-1 text-xs text-[var(--mc-text-muted)]">
          Ти {place}-й гравець, хто зібрав усі діаманти
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lc-focus-ring lc-btn-accent mt-5 w-full py-2.5 text-xs"
        >
          Класно!
        </button>
      </div>
    </div>
  );
}
