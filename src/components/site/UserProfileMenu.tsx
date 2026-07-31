"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { gameNicknameError } from "@/lib/game-nickname";
import { cn } from "@/lib/utils";

export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
  gameNickname: string | null;
  needsNickname: boolean;
  avatarUrl: string;
  hasCustomAvatar: boolean;
};

const AUTH_ME_EVENT = "lc:auth-me-changed";

export function notifyAuthMeChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_ME_EVENT));
  }
}

async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function UserProfileMenu() {
  const pathname = usePathname() ?? "";
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    window.addEventListener(AUTH_ME_EVENT, onChange);
    return () => window.removeEventListener(AUTH_ME_EVENT, onChange);
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
    } catch {
      setError("Мережа недоступна");
    }
    setBusy(false);
  }

  async function onAvatarPick(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Обери зображення (PNG/JPG/WebP).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customAvatar: dataUrl }),
      });
      const data = (await res.json()) as {
        user?: AuthUser;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Не вдалося завантажити аватар");
        setBusy(false);
        return;
      }
      if (data.user) setUser(data.user);
      notifyAuthMeChanged();
    } catch {
      setError("Не вдалося обробити зображення");
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

  const loginHref = `/auth-required?next=${encodeURIComponent(pathname || "/")}`;

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto fixed right-[max(0.75rem,env(safe-area-inset-right,0px))] top-[max(0.65rem,env(safe-area-inset-top,0px))] z-[60]"
    >
      {user === undefined ? (
        <div
          className="size-10 animate-pulse rounded-full border border-white/10 bg-black/40"
          aria-hidden
        />
      ) : user === null ? (
        <Link
          href={loginHref}
          className="lc-focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-bold text-[var(--mc-text)] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md hover:border-[var(--mc-net-green)]/40 hover:text-white"
        >
          <LogIn className="size-3.5 opacity-90" aria-hidden />
          Увійти
        </Link>
      ) : (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className="lc-focus-ring flex size-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/55 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-md hover:border-[var(--mc-net-green)]/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl}
              alt=""
              width={40}
              height={40}
              className="size-full object-cover"
            />
            <span className="sr-only">Профіль {user.displayName}</span>
          </button>

          {open ? (
            <div
              id={panelId}
              role="dialog"
              aria-label="Профіль"
              className={cn(
                "absolute right-0 mt-2 w-[min(18.5rem,calc(100vw-1.5rem))] rounded-xl border border-white/12",
                "bg-[linear-gradient(180deg,rgba(28,32,30,0.97),rgba(14,16,15,0.98))] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl",
              )}
            >
              <div className="mb-3 flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatarUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-full border border-white/15 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[var(--mc-text)]">
                    {user.displayName}
                  </p>
                  <p className="truncate text-[11px] text-[var(--mc-text-muted)]">
                    {user.gameNickname
                      ? "Ігровий нік"
                      : "Вкажи нік у грі"}
                  </p>
                </div>
              </div>

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

              <div className="mt-3 space-y-2 border-t border-white/[0.08] pt-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) =>
                    void onAvatarPick(e.target.files?.[0] ?? null)
                  }
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="lc-focus-ring flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-2 py-2 text-xs font-bold text-[var(--mc-text)] hover:bg-white/[0.08] disabled:opacity-50"
                >
                  <UserRound className="size-3.5" aria-hidden />
                  Завантажити аватар
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void logout()}
                  className="lc-focus-ring flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-2 text-xs font-bold text-rose-100 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <LogOut className="size-3.5" aria-hidden />
                  Вийти
                </button>
              </div>

              {error ? (
                <p className="mt-2 text-xs text-rose-300" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
