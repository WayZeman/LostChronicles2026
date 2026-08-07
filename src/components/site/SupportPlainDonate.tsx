"use client";

import Link from "next/link";
import { ExternalLink, Loader2, X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useState, useTransition } from "react";

import { AUTH_ME_CHANGED_EVENT } from "@/lib/auth-me-events";
import { authRequiredPath } from "@/lib/auth-paths";
import { cn } from "@/lib/utils";

type AuthMe = {
  gameNickname: string | null;
  needsNickname: boolean;
} | null;

type Props = {
  /** Куди повернутись після логіну */
  nextPath?: string;
  className?: string;
};

const btnClass =
  "lc-focus-ring mc-slot inline-flex min-h-10 w-full items-center justify-center gap-2 px-4 text-center text-sm font-semibold text-[var(--mc-text)] hover:bg-[#242424] hover:text-[var(--mc-grass-bright)]";

/**
 * «Просто підтримати»: кнопка по центру → для авторизованих модалка з сумою → банка.
 */
export function SupportPlainDonate({ nextPath = "/", className }: Props) {
  const titleId = useId();
  const [me, setMe] = useState<AuthMe | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [pending, startPending] = useTransition();

  const refreshMe = useEffectEvent(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = (await res.json()) as {
        user?: {
          gameNickname: string | null;
          needsNickname: boolean;
        } | null;
      };
      setMe(
        data.user
          ? {
              gameNickname: data.user.gameNickname,
              needsNickname: Boolean(data.user.needsNickname),
            }
          : null,
      );
    } catch {
      setMe(null);
    }
  });

  useEffect(() => {
    void refreshMe();
    const onChange = () => void refreshMe();
    window.addEventListener(AUTH_ME_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(AUTH_ME_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending]);

  function openModal() {
    setError(null);
    setPayUrl(null);
    setAmount("50");
    setOpen(true);
  }

  function closeModal() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function submitDonate() {
    setError(null);
    setPayUrl(null);
    startPending(async () => {
      try {
        const res = await fetch("/api/support/donate", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountUah: amount }),
        });
        const data = (await res.json()) as {
          error?: string;
          payUrl?: string;
        };
        if (!res.ok || !data.payUrl) {
          setError(data.error || "Не вдалося відкрити банку");
          if (res.status === 401) {
            window.location.href = authRequiredPath(nextPath);
          }
          return;
        }
        setPayUrl(data.payUrl);
        window.open(data.payUrl, "_blank", "noopener,noreferrer");
      } catch {
        setError("Мережева помилка. Спробуй ще раз.");
      }
    });
  }

  if (me === undefined) {
    return (
      <div
        className={cn(
          "flex min-h-10 w-full items-center justify-center text-[var(--mc-text-muted)]",
          className,
        )}
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
        <span className="sr-only">Завантаження</span>
      </div>
    );
  }

  if (!me) {
    return (
      <div className={cn("flex w-full justify-center", className)}>
        <Link href={authRequiredPath(nextPath)} className={btnClass}>
          Просто підтримати
        </Link>
      </div>
    );
  }

  if (me.needsNickname || !me.gameNickname) {
    return (
      <div className={cn("flex w-full justify-center", className)}>
        <Link
          href={`/profile/setup?next=${encodeURIComponent(nextPath)}`}
          className={btnClass}
        >
          Просто підтримати
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full justify-center", className)}>
      <button type="button" onClick={openModal} className={btnClass}>
        Просто підтримати
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm border-2 border-black bg-[color-mix(in_srgb,var(--mc-panel,#1a1a1a)_96%,#000)] p-4 shadow-[6px_6px_0_rgba(0,0,0,0.55)] sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 text-left">
                <h3
                  id={titleId}
                  className="text-base font-extrabold text-[var(--mc-text)] sm:text-lg"
                >
                  Просто підтримати
                </h3>
                <p className="mt-1 text-xs text-[var(--mc-text-muted)]">
                  Як{" "}
                  <span className="font-semibold text-[var(--mc-text)]">
                    {me.gameNickname}
                  </span>
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={closeModal}
                className="lc-focus-ring shrink-0 p-1 text-[var(--mc-text-muted)] hover:text-[var(--mc-text)] disabled:opacity-40"
                aria-label="Закрити"
              >
                <X className="size-5" />
              </button>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wide text-[var(--mc-text-muted)]">
              Сума
              <span className="relative mt-1.5 block">
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={500000}
                  step={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={pending}
                  autoFocus
                  placeholder="50"
                  className="lc-focus-ring w-full border-2 border-black bg-black/30 px-3 py-2.5 pr-9 text-sm font-semibold tabular-nums text-[var(--mc-text)] placeholder:text-[var(--mc-text-muted)]"
                />
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--mc-net-green)]"
                  aria-hidden
                >
                  ₴
                </span>
              </span>
            </label>

            {error ? (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}

            {payUrl ? (
              <p className="mt-3 text-xs text-[var(--mc-text-muted)]">
                Банка не відкрилась?{" "}
                <a
                  href={payUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--mc-net-green)] underline-offset-2 hover:underline"
                >
                  Відкрити знову
                </a>
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={pending}
                onClick={closeModal}
                className="lc-focus-ring inline-flex min-h-11 items-center justify-center border-2 border-black bg-black/35 px-4 text-sm font-bold text-[var(--mc-text)] disabled:opacity-40"
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={pending || !amount.trim()}
                onClick={submitDonate}
                className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-bold disabled:opacity-40"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ExternalLink className="size-3.5" aria-hidden />
                )}
                {pending ? "…" : "До банки"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
