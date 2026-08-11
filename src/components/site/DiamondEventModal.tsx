"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  DIAMOND_HUNT_CHANGED_EVENT,
  type DiamondHuntChangedDetail,
} from "@/lib/diamond-hunt-events";
import { AUTH_ME_CHANGED_EVENT } from "@/lib/auth-me-events";
import { DiamondIcon } from "@/components/site/DiamondIcon";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "lc-diamond-event-dismiss";

function formatRemain(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}д ${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function DiamondEventModal() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [title, setTitle] = useState("Пошук діамантів");
  const [blurb, setBlurb] = useState("");
  const [endAt, setEndAt] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [remain, setRemain] = useState("");
  const [active, setActive] = useState(false);

  const load = useCallback(async () => {
    if (pathname.startsWith("/admin")) {
      setActive(false);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/diamonds/state?path=${encodeURIComponent(pathname)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        user?: number | null;
        active?: boolean;
        title?: string;
        blurb?: string;
        endAt?: string | null;
        balance?: number;
      };
      const isActive = Boolean(data.active);
      setActive(isActive);
      setLoggedIn(Boolean(data.user));
      if (data.title) setTitle(data.title);
      if (data.blurb) setBlurb(data.blurb);
      setEndAt(data.endAt ?? null);
      setBalance(data.balance ?? 0);

      if (!isActive) {
        setOpen(false);
        return;
      }

      const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
      setMinimized(dismissed);
      setOpen(!dismissed);
    } catch {
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
    const onHunt = (e: Event) => {
      const d = (e as CustomEvent<DiamondHuntChangedDetail>).detail;
      if (d?.active === false) {
        setActive(false);
        setOpen(false);
        return;
      }
      if (d?.balance !== undefined) setBalance(d.balance);
      if (d?.endAt !== undefined) setEndAt(d.endAt ?? null);
      if (d?.title) setTitle(d.title);
      if (d?.blurb) setBlurb(d.blurb);
      if (d?.active) setActive(true);
    };
    window.addEventListener(AUTH_ME_CHANGED_EVENT, onAuth);
    window.addEventListener(DIAMOND_HUNT_CHANGED_EVENT, onHunt);
    return () => {
      window.removeEventListener(AUTH_ME_CHANGED_EVENT, onAuth);
      window.removeEventListener(DIAMOND_HUNT_CHANGED_EVENT, onHunt);
    };
  }, [load]);

  useEffect(() => {
    if (!endAt || !active) {
      setRemain("");
      return;
    }
    const tick = () => {
      const ms = new Date(endAt).getTime() - Date.now();
      setRemain(formatRemain(ms));
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [endAt, active]);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
    setMinimized(true);
  }

  function reopen() {
    sessionStorage.removeItem(DISMISS_KEY);
    setMinimized(false);
    setOpen(true);
  }

  if (!active) return null;

  if (minimized && !open) {
    return (
      <button
        type="button"
        onClick={reopen}
        className={cn(
          "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-[60]",
          "lc-focus-ring inline-flex items-center gap-2 rounded-xl border border-cyan-400/30",
          "bg-[rgba(12,24,32,0.94)] px-3 py-2 text-xs font-bold text-cyan-100 shadow-lg",
          "sm:bottom-[calc(5.75rem+env(safe-area-inset-bottom))] sm:right-4",
        )}
        aria-label="Відкрити вікно події"
      >
        <DiamondIcon size={18} />
        <span className="tabular-nums">{remain || "Подія"}</span>
      </button>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lc-diamond-event-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Закрити"
        onClick={dismiss}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-cyan-400/25",
          "bg-[linear-gradient(165deg,rgba(18,36,44,0.98),rgba(10,16,20,0.98))]",
          "p-5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] sm:p-6",
        )}
      >
        <div className="flex items-start gap-3">
          <DiamondIcon size={36} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2
              id="lc-diamond-event-title"
              className="lc-hero-title text-lg font-extrabold text-[var(--mc-text)] sm:text-xl"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--mc-text-muted)]">
              {blurb ||
                "Якось випадковим чином по сайту Lost Chronicles розсипались діаманти. Вони ховаються в куточках сторінок, у відповідях FAQ і серед товарів магазину — шукай і збирай, поки триває подія."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
              До кінця
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-minecraft)] text-sm font-bold tabular-nums text-[var(--mc-menu-yellow)]">
              {remain || "—"}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
              Зібрано
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-cyan-200">
              {loggedIn ? balance : "—"}
            </p>
          </div>
        </div>

        {!loggedIn ? (
          <p className="mt-3 text-center text-xs text-[var(--mc-text-muted)]">
            Увійди в акаунт, щоб збирати діаманти.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {!loggedIn ? (
            <Link
              href={`/auth-required?next=${encodeURIComponent(pathname)}`}
              className="lc-focus-ring lc-btn-accent flex-1 px-4 py-2.5 text-center text-xs"
              onClick={dismiss}
            >
              Увійти
            </Link>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="lc-focus-ring lc-btn-accent flex-1 px-4 py-2.5 text-xs"
            >
              Шукати діаманти
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="lc-focus-ring rounded-lg border border-white/12 px-4 py-2.5 text-xs font-bold text-[var(--mc-text-muted)] hover:bg-white/[0.04]"
          >
            Згорнути
          </button>
        </div>
      </div>
    </div>
  );
}
