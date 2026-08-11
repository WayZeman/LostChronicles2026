"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DIAMOND_HUNT_CHANGED_EVENT,
} from "@/lib/diamond-hunt-events";
import { AUTH_ME_CHANGED_EVENT } from "@/lib/auth-me-events";
import { DiamondIcon } from "@/components/site/DiamondIcon";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

type Entry = {
  userId: number;
  displayName: string;
  score: number;
  avatarUrl: string | null;
};

export function DiamondHuntLeaderboard() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("Пошук діамантів");
  const [entries, setEntries] = useState<Entry[]>([]);

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me", { credentials: "include" });
      const meData = (await me.json()) as { user: unknown | null };
      if (!meData.user) {
        setVisible(false);
        return;
      }
      const res = await fetch("/api/diamonds/leaderboard", {
        credentials: "include",
      });
      if (res.status === 401) {
        setVisible(false);
        return;
      }
      const data = (await res.json()) as {
        active?: boolean;
        title?: string;
        entries?: Entry[];
      };
      if (!data.active) {
        setVisible(false);
        return;
      }
      setVisible(true);
      setTitle(data.title || "Пошук діамантів");
      setEntries(Array.isArray(data.entries) ? data.entries : []);
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
    const onChange = () => void load();
    window.addEventListener(AUTH_ME_CHANGED_EVENT, onChange);
    window.addEventListener(DIAMOND_HUNT_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(AUTH_ME_CHANGED_EVENT, onChange);
      window.removeEventListener(DIAMOND_HUNT_CHANGED_EVENT, onChange);
    };
  }, [load]);

  if (!visible) return null;

  return (
    <section
      className={cn(lcGlassPanelClass, "lc-interactive-panel-static")}
      aria-label="Топ збирачів діамантів"
    >
      <div className="flex items-center justify-center gap-2">
        <DiamondIcon size={22} className="size-[22px] shrink-0" />
        <h2 className="lc-section-title text-center text-lg uppercase md:text-xl">
          {title}
        </h2>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--mc-text-muted)]">
        Топ збирачів розсипаних діамантів
      </p>

      {entries.length === 0 ? (
        <p className="mt-5 text-center text-sm text-[var(--mc-text-muted)]">
          Поки ніхто не зібрав діамантів. Шукай їх на сторінках сайту!
        </p>
      ) : (
        <ol className="mt-5 space-y-2">
          {entries.map((e, i) => (
            <li
              key={e.userId}
              className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/20 px-3 py-2"
            >
              <span className="w-6 text-center text-sm font-bold tabular-nums text-[var(--mc-menu-yellow)]">
                {i + 1}
              </span>
              {e.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-md object-cover"
                />
              ) : (
                <span className="size-8 rounded-md bg-white/10" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--mc-text)]">
                {e.displayName}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-cyan-200">
                <DiamondIcon size={14} className="size-3.5 shrink-0" />
                {e.score}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
