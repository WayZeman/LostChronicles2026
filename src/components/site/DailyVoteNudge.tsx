"use client";

import { ExternalLink, ThumbsUp, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const STORAGE_OPTOUT = "lc-vote-nudge-optout";
const STORAGE_DAY = "lc-vote-nudge-day";
const EXIT_MS = 320;

const VOTE_LINKS = [
  {
    href: "https://monicore.com.ua/server/281/lostchronicles",
    label: "MoniCore",
    hint: "Моніторинг",
  },
  {
    href: "https://minecraft.org.ua/minecraft-servers/Lost-Chronicles/3210",
    label: "ОУМ",
    hint: "Організація",
  },
  {
    href: "https://allmc.in.ua/play-lost-chronicles-site",
    label: "AllMC",
    hint: "Каталог",
  },
] as const;

type Phase = "closed" | "open" | "leaving";

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function waitForIntroDone(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (!document.documentElement.classList.contains("lc-intro-pending")) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const root = document.documentElement;
    const done = () => {
      if (root.classList.contains("lc-intro-pending")) return;
      observer.disconnect();
      window.clearTimeout(fallback);
      resolve();
    };
    const observer = new MutationObserver(done);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    const fallback = window.setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 12000);
    done();
  });
}

/**
 * Раз на добу просить проголосувати на моніторингах.
 * Закрити = знову завтра; «Не надсилати більше» = назавжди.
 */
export function DailyVoteNudge() {
  const pathname = usePathname();
  const titleId = useId();
  const [phase, setPhase] = useState<Phase>("closed");
  const leaveTimer = useRef<number | null>(null);
  const closeAction = useRef<"today" | "forever" | null>(null);

  const skipPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth");

  useEffect(() => {
    if (skipPath) {
      setPhase("closed");
      return;
    }

    let cancelled = false;

    void (async () => {
      if (readStorage(STORAGE_OPTOUT) === "1") return;
      if (readStorage(STORAGE_DAY) === todayKey()) return;

      await waitForIntroDone();
      if (cancelled) return;
      await new Promise<void>((r) => window.setTimeout(r, 520));
      if (cancelled) return;
      if (readStorage(STORAGE_OPTOUT) === "1") return;
      if (readStorage(STORAGE_DAY) === todayKey()) return;
      setPhase("open");
    })();

    return () => {
      cancelled = true;
      if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
    };
  }, [skipPath, pathname]);

  function finishClose() {
    const action = closeAction.current;
    closeAction.current = null;
    if (action === "forever") {
      writeStorage(STORAGE_OPTOUT, "1");
      writeStorage(STORAGE_DAY, todayKey());
    } else {
      writeStorage(STORAGE_DAY, todayKey());
    }
    setPhase("closed");
  }

  function beginClose(action: "today" | "forever") {
    if (phase !== "open") return;
    closeAction.current = action;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finishClose();
      return;
    }
    setPhase("leaving");
    if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(finishClose, EXIT_MS);
  }

  if (phase === "closed") return null;

  const leaving = phase === "leaving";

  return (
    <div
      className={cn(
        "lc-vote-nudge",
        leaving && "lc-vote-nudge--leaving",
      )}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Закрити"
        className="lc-vote-nudge__scrim"
        onClick={() => beginClose("today")}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="lc-vote-nudge__card mc-frame"
      >
        <div className="lc-vote-nudge__shine" aria-hidden />
        <div className="lc-vote-nudge__glow" aria-hidden />

        <button
          type="button"
          onClick={() => beginClose("today")}
          className="lc-vote-nudge__close lc-focus-ring"
          aria-label="Закрити на сьогодні"
        >
          <X className="size-3.5" aria-hidden />
        </button>

        <div className="lc-vote-nudge__hero">
          <div className="lc-vote-nudge__icon-wrap mc-slot" aria-hidden>
            <ThumbsUp className="lc-vote-nudge__icon" strokeWidth={2.25} />
          </div>
          <div className="lc-vote-nudge__copy">
            <p className="lc-vote-nudge__eyebrow">Раз на день</p>
            <h2 id={titleId} className="lc-vote-nudge__title">
              Підтримай сервер голосом
            </h2>
          </div>
        </div>

        <ul className="lc-vote-nudge__links">
          {VOTE_LINKS.map(({ href, label, hint }, i) => (
            <li
              key={href}
              className="lc-vote-nudge__link-item"
              style={{ ["--i" as string]: i }}
            >
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="lc-vote-nudge__link lc-focus-ring"
              >
                <span className="lc-vote-nudge__link-label">{label}</span>
                <span className="lc-vote-nudge__link-hint">{hint}</span>
                <ExternalLink
                  className="lc-vote-nudge__link-icon"
                  aria-hidden
                />
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => beginClose("forever")}
          className="lc-vote-nudge__optout lc-focus-ring"
        >
          Не надсилати мені більше
        </button>
      </div>
    </div>
  );
}
