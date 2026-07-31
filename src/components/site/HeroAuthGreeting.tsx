"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { LogOut } from "lucide-react";
import {
  AUTH_ME_CHANGED_EVENT,
  notifyAuthMeChanged,
} from "@/lib/auth-me-events";
import { gameNicknameError } from "@/lib/game-nickname";
import { cn } from "@/lib/utils";

type AuthUser = {
  id: number;
  displayName: string;
  gameNickname: string | null;
  needsNickname: boolean;
  avatarUrl: string;
  isAdmin?: boolean;
  role?: string;
};

export function HeroAuthGreeting() {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [nickDraft, setNickDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = (await res.json()) as { user: AuthUser | null };
      setUser(data.user);
      if (data.user?.gameNickname) {
        setNickDraft(data.user.gameNickname);
      } else if (data.user) {
        setNickDraft("");
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadMe();
    });
    return () => cancelAnimationFrame(id);
  }, [loadMe]);

  useEffect(() => {
    const onChange = () => void loadMe();
    window.addEventListener(AUTH_ME_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(AUTH_ME_CHANGED_EVENT, onChange);
  }, [loadMe]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function saveNickname(e: React.FormEvent) {
    e.preventDefault();
    const err = gameNicknameError(nickDraft);
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameNickname: nickDraft.trim() }),
      });
      const data = (await res.json()) as {
        user?: AuthUser;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Не вдалося зберегти");
        setBusy(false);
        return;
      }
      if (data.user) setUser(data.user);
      notifyAuthMeChanged();
      setOpen(false);
    } catch {
      setError("Мережа недоступна");
    }
    setBusy(false);
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setOpen(false);
      notifyAuthMeChanged();
    } catch {
      /* ignore */
    }
    setBusy(false);
  }

  if (user === undefined) {
    return (
      <div
        className="mx-auto mt-2.5 h-5 w-16 animate-pulse rounded bg-white/10"
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <div className="relative z-10 mt-2.5 flex justify-center">
        <Link
          href="/auth-required?next=%2F"
          className="lc-focus-ring lc-login-soft-pulse inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-[var(--mc-text-subtle)] underline-offset-2 transition-colors hover:text-[var(--mc-text-muted)] hover:underline"
        >
          УВІЙТИ
        </Link>
      </div>
    );
  }

  const name = user.gameNickname?.trim() || user.displayName;

  return (
    <div ref={rootRef} className="relative z-20 mt-3 flex justify-center">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="lc-focus-ring rounded-lg px-3 py-2 text-base font-bold text-[var(--mc-text)] transition-colors hover:text-[var(--mc-net-green)] sm:text-lg"
      >
        Вітаємо,{" "}
        <span className="font-extrabold text-[var(--mc-menu-yellow)] underline decoration-white/30 underline-offset-[5px]">
          {name}
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Профіль"
          className={cn(
            "absolute left-1/2 top-full z-30 mt-2 w-[min(18.5rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-xl border border-white/12",
            "bg-[linear-gradient(180deg,rgba(28,32,30,0.97),rgba(14,16,15,0.98))] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl",
          )}
        >
          <form onSubmit={(e) => void saveNickname(e)} className="space-y-2">
            <label
              htmlFor={`${panelId}-nick`}
              className="block text-[11px] font-semibold text-[var(--mc-text-muted)]"
            >
              Нікнейм у грі
            </label>
            <input
              id={`${panelId}-nick`}
              value={nickDraft}
              onChange={(e) => setNickDraft(e.target.value)}
              maxLength={16}
              placeholder="Steve_UA"
              className="lc-focus-ring mc-input w-full px-2.5 py-2 text-sm"
              autoComplete="username"
            />
            <button
              type="submit"
              disabled={busy}
              className="lc-focus-ring lc-btn-accent w-full py-2 text-xs disabled:opacity-50"
            >
              {busy ? "…" : "Зберегти нік"}
            </button>
          </form>

          {user.isAdmin ? (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="lc-focus-ring mt-3 flex w-full items-center justify-center rounded-lg border border-[var(--mc-net-green)]/35 bg-[var(--mc-net-green)]/10 px-2 py-2 text-xs font-bold text-[var(--mc-net-green)] hover:bg-[var(--mc-net-green)]/20"
            >
              Керування сайтом
            </Link>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => void logout()}
            className="lc-focus-ring mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-2 text-xs font-bold text-rose-100 hover:bg-rose-500/20 disabled:opacity-50"
          >
            <LogOut className="size-3.5" aria-hidden />
            Вийти
          </button>

          {error ? (
            <p className="mt-2 text-xs text-rose-300" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
