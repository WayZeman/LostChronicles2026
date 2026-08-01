"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AuthRequiredPanel } from "@/components/site/AuthRequiredPanel";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { SoftAppear } from "@/components/site/SoftAppear";
import {
  CHOICE_OPTION_LABEL_MAX,
  CHOICE_OPTIONS_MAX,
  CHOICE_OPTIONS_MIN,
  PROPOSAL_KIND_CHOICE,
  PROPOSAL_KIND_YES_NO,
  type ProposalKind,
} from "@/lib/proposal-kinds";
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
  const [user, setUser] = useState<
    | { id: number; needsNickname?: boolean }
    | null
    | undefined
  >(undefined);
  const [kind, setKind] = useState<ProposalKind>(PROPOSAL_KIND_YES_NO);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = (await res.json()) as {
        user: { id: number; needsNickname?: boolean } | null;
      };
      setUser(data.user);
      if (data.user?.needsNickname) {
        router.replace(
          `/profile/setup?next=${encodeURIComponent("/proposals/new")}`,
        );
      }
    } catch {
      setUser(null);
    }
  }, [router]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void checkUser();
    });
    return () => cancelAnimationFrame(id);
  }, [checkUser]);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    setOptions((prev) =>
      prev.length >= CHOICE_OPTIONS_MAX ? prev : [...prev, ""],
    );
  }

  function removeOption(index: number) {
    setOptions((prev) =>
      prev.length <= CHOICE_OPTIONS_MIN
        ? prev
        : prev.filter((_, i) => i !== index),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        durationDays: duration,
        kind,
      };
      if (kind === PROPOSAL_KIND_CHOICE) {
        payload.options = options.map((o) => o.trim()).filter(Boolean);
      }
      const res = await fetch("/api/proposals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        id?: number;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (data.code === "needs_nickname") {
          router.replace(
            `/profile/setup?next=${encodeURIComponent("/proposals/new")}`,
          );
          return;
        }
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
            contentLabel="форму створення голосування"
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
          ← Усі голосування
        </Link>
        <SoftAppear>
          <h1 className="lc-hero-title mb-2 text-3xl font-bold tracking-tight text-[var(--mc-text)] sm:text-4xl">
            Нове голосування
          </h1>
          <p className="mb-6 text-sm text-[var(--mc-text-muted)]">
            Пропозиція За/Проти або вибір одного з кількох варіантів
          </p>
          <form
            onSubmit={(e) => void onSubmit(e)}
            className={cn(lcGlassPanelClass, "space-y-5")}
          >
            <div>
              <span className="mb-2 block text-sm font-semibold text-[var(--mc-text)]">
                Тип
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setKind(PROPOSAL_KIND_YES_NO)}
                  className={cn(
                    "lc-focus-ring rounded-lg border-2 px-3 py-3 text-left transition-colors",
                    kind === PROPOSAL_KIND_YES_NO
                      ? "border-[var(--mc-net-green)] bg-[var(--mc-net-green)]/15"
                      : "border-white/10 bg-black/20 hover:border-white/25",
                  )}
                >
                  <span className="block text-sm font-bold text-[var(--mc-text)]">
                    За / проти
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--mc-text-muted)]">
                    Класична пропозиція
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setKind(PROPOSAL_KIND_CHOICE)}
                  className={cn(
                    "lc-focus-ring rounded-lg border-2 px-3 py-3 text-left transition-colors",
                    kind === PROPOSAL_KIND_CHOICE
                      ? "border-[var(--mc-net-green)] bg-[var(--mc-net-green)]/15"
                      : "border-white/10 bg-black/20 hover:border-white/25",
                  )}
                >
                  <span className="block text-sm font-bold text-[var(--mc-text)]">
                    Вибір варіантів
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--mc-text-muted)]">
                    Обрати 1 з {CHOICE_OPTIONS_MIN}–{CHOICE_OPTIONS_MAX}
                  </span>
                </button>
              </div>
            </div>

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
                placeholder={
                  kind === PROPOSAL_KIND_CHOICE
                    ? "Про що голосуємо"
                    : "Про що ідея"
                }
              />
            </div>

            <div>
              <label
                htmlFor="prop-desc"
                className="mb-1.5 block text-sm font-semibold text-[var(--mc-text)]"
              >
                Опис
                {kind === PROPOSAL_KIND_CHOICE ? (
                  <span className="ml-1 font-normal text-[var(--mc-text-muted)]">
                    (необовʼязково)
                  </span>
                ) : null}
              </label>
              <textarea
                id="prop-desc"
                name="description"
                required={kind === PROPOSAL_KIND_YES_NO}
                rows={kind === PROPOSAL_KIND_CHOICE ? 3 : 6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="lc-focus-ring mc-input w-full resize-y px-3 py-2.5"
                placeholder="Деталі…"
              />
            </div>

            {kind === PROPOSAL_KIND_CHOICE ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--mc-text)]">
                    Варіанти
                  </span>
                  <span className="text-xs text-[var(--mc-text-muted)]">
                    {options.length}/{CHOICE_OPTIONS_MAX}
                  </span>
                </div>
                <ul className="space-y-2">
                  {options.map((opt, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/25 text-xs font-bold tabular-nums text-[var(--mc-text-muted)]">
                        {i + 1}
                      </span>
                      <input
                        required
                        maxLength={CHOICE_OPTION_LABEL_MAX}
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className="lc-focus-ring mc-input min-w-0 flex-1 px-3 py-2.5"
                        placeholder={`Варіант ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        disabled={options.length <= CHOICE_OPTIONS_MIN}
                        aria-label="Прибрати варіант"
                        className="lc-focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-rose-500/40 text-rose-200 disabled:opacity-35"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={addOption}
                  disabled={options.length >= CHOICE_OPTIONS_MAX}
                  className="lc-focus-ring mt-2 inline-flex min-h-10 items-center gap-1.5 px-3 text-sm font-bold text-[var(--mc-net-green)] disabled:opacity-40"
                >
                  <Plus className="size-4" aria-hidden />
                  Додати варіант
                </button>
              </div>
            ) : null}

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
