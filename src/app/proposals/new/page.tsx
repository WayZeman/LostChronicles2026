"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthRequiredPanel } from "@/components/site/AuthRequiredPanel";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { SoftAppear } from "@/components/site/SoftAppear";
import { PROPOSAL_MIN_VOTES_FOR_RESULT } from "@/lib/proposal-ui";
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
        <div className="site-container mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-12">
          <AuthRequiredPanel
            nextPath="/proposals/new"
            contentLabel="форму створення пропозиції"
            title="Потрібна авторизація"
            homeHref="/proposals"
          />
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
        <SoftAppear>
        <h1 className="lc-hero-title mb-6 text-3xl font-bold tracking-tight text-[var(--mc-text)] sm:text-4xl">
          Нова пропозиція
        </h1>
          <form
            onSubmit={(e) => void onSubmit(e)}
            className={cn(lcGlassPanelClass, "space-y-5")}
          >
            <div>
              <label
                htmlFor="prop-title"
                className="mb-1.5 block text-sm font-semibold text-[var(--mc-text)]"
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
                className="lc-focus-ring mc-input w-full px-3 py-2.5"
                placeholder="Про що ідея"
              />
            </div>
            <div>
              <label
                htmlFor="prop-desc"
                className="mb-1.5 block text-sm font-semibold text-[var(--mc-text)]"
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
                className="lc-focus-ring mc-input w-full resize-y px-3 py-2.5"
                placeholder="Деталі…"
              />
            </div>
            <div>
              <span className="mb-2 block text-sm font-semibold text-[var(--mc-text)]">
                Термін · мін. {PROPOSAL_MIN_VOTES_FOR_RESULT} голосів
              </span>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      "lc-focus-ring min-h-10 px-4 py-2 text-sm font-bold transition-[transform,filter] active:translate-y-px",
                      duration === d ? "mc-badge" : "mc-btn-secondary",
                    )}
                  >
                    {ukDaysLabel(d)}
                  </button>
                ))}
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
              className="lc-focus-ring lc-btn-accent min-h-12 w-full py-2.5 text-sm disabled:opacity-60"
            >
              {submitting ? "…" : "Опублікувати"}
            </button>
          </form>
        </SoftAppear>
      </div>
    </main>
  );
}
