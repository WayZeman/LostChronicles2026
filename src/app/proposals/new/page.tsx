"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { cn } from "@/lib/utils";

const DURATIONS = [1, 3, 7] as const;

function ukDaysLabel(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} день`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20))
    return `${n} дні`;
  return `${n} днів`;
}

export default function NewProposalPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number } | null | undefined>(
    undefined,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(7);
  const [anonymousVoting, setAnonymousVoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = (await res.json()) as { user: { id: number } | null };
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void checkUser();
    });
    return () => cancelAnimationFrame(id);
  }, [checkUser]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          durationDays: duration,
          anonymousVoting,
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok) {
        setError(data.error || "Помилка збереження");
        setSubmitting(false);
        return;
      }
      if (data.id) router.push(`/proposals/${data.id}`);
      else router.push("/proposals");
    } catch {
      setError("Мережа недоступна");
      setSubmitting(false);
    }
  }

  if (user === undefined) {
    return (
      <main className={lcPageMainClass}>
        <div className="site-container mx-auto max-w-2xl px-4 py-12">
          <div className={cn(lcGlassPanelClass, "h-64 animate-pulse")} />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={lcPageMainClass}>
        <div className="site-container mx-auto max-w-2xl px-4 py-12">
          <div className={cn(lcGlassPanelClass, "text-center")}>
            <h1 className="text-xl font-bold text-[var(--mc-text)]">
              Увійди через Discord
            </h1>
            <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
              Щоб створити пропозицію, увійди через Discord — натисни кнопку
              нижче.
            </p>
            <a
              href={`/api/auth/discord?next=${encodeURIComponent("/proposals/new")}`}
              className="lc-focus-ring mt-6 inline-flex min-h-11 items-center justify-center rounded-md border-2 border-[#5865F2] bg-[#5865F2]/25 px-6 py-2.5 text-sm font-bold text-[var(--mc-text)]"
            >
              Увійти через Discord
            </a>
            <div className="mt-6">
              <Link
                href="/proposals"
                className="text-sm font-semibold text-[var(--mc-net-green)] underline-offset-2 hover:underline"
              >
                ← До списку
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={lcPageMainClass}>
      <div className="site-container mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        <Link
          href="/proposals"
          className="mb-4 inline-block text-sm font-semibold text-[var(--mc-net-green)] hover:underline"
        >
          ← Усі пропозиції
        </Link>
        <h1 className="mb-6 text-2xl font-extrabold text-[var(--mc-text)] sm:text-3xl">
          Нова пропозиція
        </h1>
        <form
          onSubmit={(e) => void onSubmit(e)}
          className={cn(lcGlassPanelClass, "space-y-5")}
        >
          <div>
            <label
              htmlFor="prop-title"
              className="mb-1.5 block text-sm font-bold text-[var(--mc-text)]"
            >
              Заголовок
            </label>
            <input
              id="prop-title"
              name="title"
              required
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="lc-focus-ring w-full rounded-md border border-[var(--mc-border)] bg-[var(--mc-deep)] px-3 py-2.5 text-[var(--mc-text)] placeholder:text-[var(--mc-text-subtle)]"
              placeholder="Коротко, про що ідея"
            />
          </div>
          <div>
            <label
              htmlFor="prop-desc"
              className="mb-1.5 block text-sm font-bold text-[var(--mc-text)]"
            >
              Опис
            </label>
            <textarea
              id="prop-desc"
              name="description"
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="lc-focus-ring w-full resize-y rounded-md border border-[var(--mc-border)] bg-[var(--mc-deep)] px-3 py-2.5 text-[var(--mc-text)] placeholder:text-[var(--mc-text-subtle)]"
              placeholder="Деталі, чому це варто зробити…"
            />
          </div>
          <div>
            <span className="mb-2 block text-sm font-bold text-[var(--mc-text)]">
              Тривалість голосування
            </span>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "lc-focus-ring min-h-10 rounded-md border-2 px-4 py-2 text-sm font-bold transition-colors",
                    duration === d
                      ? "border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] text-[var(--mc-green-ink)]"
                      : "border-[var(--mc-border)] bg-[var(--mc-surface-elevated)] text-[var(--mc-text-muted)] hover:bg-[var(--mc-toggle-hover-bg)]",
                  )}
                >
                  {ukDaysLabel(d)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-sm font-bold text-[var(--mc-text)]">
              Хто бачить голоси
            </span>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setAnonymousVoting(false)}
                className={cn(
                  "lc-focus-ring min-h-10 flex-1 rounded-md border-2 px-4 py-2.5 text-left text-sm font-bold transition-colors sm:min-w-[12rem]",
                  !anonymousVoting
                    ? "border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] text-[var(--mc-green-ink)]"
                    : "border-[var(--mc-border)] bg-[var(--mc-surface-elevated)] text-[var(--mc-text-muted)] hover:bg-[var(--mc-toggle-hover-bg)]",
                )}
              >
                Відкрите
                <span className="mt-0.5 block text-xs font-normal text-[var(--mc-text-subtle)]">
                  Під пропозицією видно хто, коли та як проголосував
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAnonymousVoting(true)}
                className={cn(
                  "lc-focus-ring min-h-10 flex-1 rounded-md border-2 px-4 py-2.5 text-left text-sm font-bold transition-colors sm:min-w-[12rem]",
                  anonymousVoting
                    ? "border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] text-[var(--mc-green-ink)]"
                    : "border-[var(--mc-border)] bg-[var(--mc-surface-elevated)] text-[var(--mc-text-muted)] hover:bg-[var(--mc-toggle-hover-bg)]",
                )}
              >
                Анонімне
                <span className="mt-0.5 block text-xs font-normal text-[var(--mc-text-subtle)]">
                  Лише суми 👍 / 👎, без імен
                </span>
              </button>
            </div>
          </div>
          {error ? (
            <p className="text-sm font-medium text-rose-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="lc-focus-ring min-h-11 w-full rounded-md border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] py-2.5 text-sm font-bold text-[var(--mc-green-ink)] transition-colors hover:bg-[var(--mc-vote-bg-hover)] disabled:opacity-60"
          >
            {submitting ? "Збереження…" : "Створити пропозицію"}
          </button>
        </form>
      </div>
    </main>
  );
}
