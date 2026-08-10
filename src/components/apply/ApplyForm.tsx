"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  LC_DEFAULT_DISCORD_URL,
  LC_DEFAULT_TELEGRAM_URL,
} from "@/data/lc-social-defaults";
import {
  DEFAULT_APPLY_FORM_CONFIG,
  type ApplyFormConfig,
  type ApplyQuestion,
} from "@/lib/application-form-config";
import { cn } from "@/lib/utils";

const fieldClass =
  "lc-focus-ring mc-input w-full px-3 py-2.5 text-sm text-[var(--mc-text)]";

type AnswersState = Record<string, string | string[]>;

function emptyAnswers(questions: ApplyQuestion[]): AnswersState {
  const out: AnswersState = {};
  for (const q of questions) {
    out[q.id] = q.type === "multi_choice" ? [] : "";
  }
  return out;
}

function ChoiceOption({
  selected,
  onSelect,
  children,
  multi,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "lc-focus-ring flex w-full items-center gap-3 border-2 px-3 py-2.5 text-left text-sm font-bold transition-[transform,filter,background-color,border-color]",
        selected
          ? "border-[var(--mc-net-green)] bg-[var(--mc-net-green)]/15 text-[var(--mc-text)]"
          : "border-white/12 bg-black/35 text-[var(--mc-text)] hover:border-[var(--mc-net-green)]/45 hover:bg-black/50",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center border-2 border-black text-[10px]",
          multi ? "" : "rounded-full",
          selected
            ? "bg-[var(--mc-net-green)] text-[var(--mc-green-ink)]"
            : "bg-black/50 text-transparent",
        )}
        aria-hidden
      >
        {selected ? "✓" : "·"}
      </span>
      <span className="min-w-0 flex-1 font-semibold leading-snug">{children}</span>
    </button>
  );
}

function QuestionControl({
  q,
  value,
  onChange,
}: {
  q: ApplyQuestion;
  value: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  const id = `apply-${q.id}`;

  if (q.type === "long_text") {
    return (
      <textarea
        id={id}
        required={q.required}
        rows={4}
        maxLength={2000}
        className={cn(fieldClass, "min-h-24 resize-y")}
        value={typeof value === "string" ? value : ""}
        placeholder={q.placeholder || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (q.type === "single_choice") {
    return (
      <div className="grid gap-2" role="radiogroup" aria-labelledby={`${id}-label`}>
        {q.options.map((opt) => (
          <ChoiceOption
            key={opt}
            selected={value === opt}
            onSelect={() => onChange(opt)}
          >
            {opt}
          </ChoiceOption>
        ))}
        {/* hidden required radio for native validation if needed */}
        <input
          type="text"
          tabIndex={-1}
          className="sr-only"
          required={q.required}
          value={typeof value === "string" ? value : ""}
          onChange={() => {}}
          aria-hidden
        />
      </div>
    );
  }

  if (q.type === "multi_choice") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="grid gap-2">
        {q.options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <ChoiceOption
              key={opt}
              multi
              selected={checked}
              onSelect={() => {
                if (checked) onChange(selected.filter((x) => x !== opt));
                else onChange([...selected, opt]);
              }}
            >
              {opt}
            </ChoiceOption>
          );
        })}
      </div>
    );
  }

  if (q.type === "dropdown") {
    return (
      <select
        id={id}
        required={q.required}
        className={fieldClass}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Обери варіант…</option>
        {q.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      id={id}
      required={q.required}
      className={fieldClass}
      value={typeof value === "string" ? value : ""}
      placeholder={q.placeholder || undefined}
      type={
        q.type === "email"
          ? "email"
          : q.type === "date"
            ? "date"
            : q.type === "number"
              ? "number"
              : "text"
      }
      min={q.type === "number" ? 0 : undefined}
      inputMode={q.type === "number" ? "numeric" : undefined}
      autoComplete={q.type === "email" ? "email" : undefined}
      maxLength={q.type === "email" ? 120 : 500}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ApplyForm({
  initialConfig,
}: {
  initialConfig?: ApplyFormConfig;
}) {
  const [config, setConfig] = useState<ApplyFormConfig>(
    initialConfig ?? DEFAULT_APPLY_FORM_CONFIG,
  );
  const [answers, setAnswers] = useState<AnswersState>(() =>
    emptyAnswers((initialConfig ?? DEFAULT_APPLY_FORM_CONFIG).questions),
  );
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<number | null>(null);

  const discord =
    process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || LC_DEFAULT_DISCORD_URL;
  const telegram =
    process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || LC_DEFAULT_TELEGRAM_URL;

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setAnswers(emptyAnswers(initialConfig.questions));
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/apply/config");
        if (!res.ok) return;
        const data = (await res.json()) as { config?: ApplyFormConfig };
        if (!cancelled && data.config) {
          setConfig(data.config);
          setAnswers(emptyAnswers(data.config.questions));
        }
      } catch {
        /* defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialConfig]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, website }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        id?: number;
      };
      if (!res.ok) {
        setError(data.error || "Не вдалося надіслати анкету.");
        return;
      }
      setDoneId(typeof data.id === "number" ? data.id : 0);
      setAnswers(emptyAnswers(config.questions));
    } catch {
      setError("Мережева помилка. Спробуй ще раз.");
    } finally {
      setSubmitting(false);
    }
  }

  if (doneId !== null) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center border-2 border-black bg-[var(--mc-net-green)] text-xl font-black text-[var(--mc-green-ink)] shadow-[2px_2px_0_#000]">
          ✓
        </div>
        <div className="space-y-2">
          <p className="lc-hero-display text-xl font-extrabold text-[var(--mc-text)] sm:text-2xl">
            {config.successTitle}
          </p>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--mc-text-muted)]">
            {config.successBody}
            {doneId > 0 ? ` (#${doneId})` : ""}
          </p>
          {config.successHoursNote ? (
            <p className="text-xs text-[var(--mc-text-subtle)]">
              {config.successHoursNote}
            </p>
          ) : null}
        </div>

        <div className="border-t border-white/10 pt-5">
          <p className="text-sm font-extrabold text-[var(--mc-text)]">
            {config.joinTitle}
          </p>
          {config.joinBlurb ? (
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--mc-text-muted)]">
              {config.joinBlurb}
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="lc-focus-ring mc-btn-secondary inline-flex min-h-11 items-center justify-center px-6 text-sm font-bold"
            >
              Telegram
            </a>
            <a
              href={discord}
              target="_blank"
              rel="noopener noreferrer"
              className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center justify-center px-6 text-sm font-bold"
            >
              Discord
            </a>
          </div>
        </div>

        <button
          type="button"
          className="lc-focus-ring text-xs font-bold text-[var(--mc-text-muted)] underline-offset-2 hover:underline"
          onClick={() => setDoneId(null)}
        >
          Надіслати ще одну анкету
        </button>
      </div>
    );
  }

  const enabled = config.questions.filter((q) => q.enabled);

  return (
    <form onSubmit={onSubmit} className="space-y-0" noValidate>
      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div className="divide-y divide-white/10">
        {enabled.map((q) => (
          <div key={q.id} className="py-5 first:pt-0 last:pb-5">
            <label
              className="mb-2.5 block text-left text-sm font-extrabold leading-snug text-[var(--mc-text)] sm:text-[0.9375rem]"
              htmlFor={`apply-${q.id}`}
              id={`apply-${q.id}-label`}
            >
              {q.label}
            </label>
            <QuestionControl
              q={q}
              value={answers[q.id] ?? (q.type === "multi_choice" ? [] : "")}
              onChange={(v) =>
                setAnswers((prev) => ({
                  ...prev,
                  [q.id]: v,
                }))
              }
            />
            {q.hint ? (
              <p className="mt-2 text-left text-xs leading-relaxed text-[var(--mc-text-muted)]">
                {q.hint}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {error ? (
        <p
          className="mt-4 border-2 border-rose-500/40 bg-rose-500/10 px-3 py-2 text-center text-sm font-bold text-rose-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-center border-t border-white/10 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="lc-focus-ring lc-btn-accent inline-flex min-h-11 min-w-[12rem] items-center justify-center px-8 text-sm font-bold disabled:opacity-50"
        >
          {submitting ? "Надсилаємо…" : config.submitLabel}
        </button>
      </div>
    </form>
  );
}
