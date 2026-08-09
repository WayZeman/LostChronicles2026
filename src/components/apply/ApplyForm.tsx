"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  LC_DEFAULT_DISCORD_URL,
  LC_DEFAULT_TELEGRAM_URL,
} from "@/data/lc-social-defaults";
import {
  DEFAULT_APPLY_FORM_CONFIG,
  type ApplyFieldConfig,
  type ApplyFieldKey,
  type ApplyFormConfig,
} from "@/lib/application-form-config";
import { cn } from "@/lib/utils";

const fieldClass =
  "lc-focus-ring mc-input w-full px-3 py-2.5 text-sm text-[var(--mc-text)]";
const labelClass =
  "mb-1.5 block text-left text-sm font-bold text-[var(--mc-text)]";
const hintClass = "mt-1 text-left text-xs text-[var(--mc-text-muted)]";

type FormState = Record<ApplyFieldKey, string> & { website: string };

function emptyState(): FormState {
  return {
    email: "",
    nickname: "",
    birthday: "",
    age: "",
    contacts: "",
    experience: "",
    previousProjects: "",
    whyServer: "",
    howFound: "",
    website: "",
  };
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: ApplyFieldConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `apply-${field.key}`;
  const common = {
    id,
    required: field.required,
    className: fieldClass,
    value,
    placeholder: field.placeholder || undefined,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
  };

  if (field.kind === "textarea") {
    return (
      <textarea
        {...common}
        rows={3}
        maxLength={2000}
        className={cn(fieldClass, "min-h-20 resize-y")}
      />
    );
  }

  return (
    <input
      {...common}
      type={
        field.kind === "email"
          ? "email"
          : field.kind === "date"
            ? "date"
            : field.kind === "number"
              ? "number"
              : "text"
      }
      min={field.kind === "number" ? 8 : undefined}
      max={field.kind === "number" ? 99 : undefined}
      inputMode={field.kind === "number" ? "numeric" : undefined}
      autoComplete={
        field.key === "email"
          ? "email"
          : field.key === "nickname"
            ? "nickname"
            : undefined
      }
      maxLength={
        field.key === "howFound"
          ? 500
          : field.key === "contacts"
            ? 200
            : 120
      }
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
  const [form, setForm] = useState<FormState>(emptyState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<number | null>(null);

  const discord =
    process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || LC_DEFAULT_DISCORD_URL;
  const telegram =
    process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || LC_DEFAULT_TELEGRAM_URL;

  useEffect(() => {
    if (initialConfig) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/apply/config");
        if (!res.ok) return;
        const data = (await res.json()) as { config?: ApplyFormConfig };
        if (!cancelled && data.config) setConfig(data.config);
      } catch {
        /* defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialConfig]);

  function setField(key: ApplyFieldKey, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      setForm(emptyState());
    } catch {
      setError("Мережева помилка. Спробуй ще раз.");
    } finally {
      setSubmitting(false);
    }
  }

  if (doneId !== null) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-bold text-[var(--mc-net-green)]">
          {config.successTitle}
        </p>
        <p className="text-sm leading-relaxed text-[var(--mc-text-muted)]">
          {config.successBody}
          {doneId > 0 ? ` (#${doneId})` : ""}
        </p>
        {config.successHoursNote ? (
          <p className="text-xs text-[var(--mc-text-subtle)]">
            {config.successHoursNote}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="lc-focus-ring mc-btn-secondary inline-flex min-h-11 items-center justify-center px-5 text-sm"
          >
            Telegram
          </a>
          <a
            href={discord}
            target="_blank"
            rel="noopener noreferrer"
            className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center justify-center px-5 text-sm"
          >
            Discord
          </a>
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

  const enabled = config.fields.filter((f) => f.enabled);

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, website: e.target.value }))
            }
          />
        </label>
      </div>

      {enabled.map((field) => (
        <div key={field.key}>
          <label className={labelClass} htmlFor={`apply-${field.key}`}>
            {field.label}
            {field.required ? (
              <span className="text-rose-300"> *</span>
            ) : null}
          </label>
          <FieldControl
            field={field}
            value={form[field.key]}
            onChange={(v) => setField(field.key, v)}
          />
          {field.hint ? <p className={hintClass}>{field.hint}</p> : null}
        </div>
      ))}

      {error ? (
        <p className="text-sm font-bold text-rose-200" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="lc-focus-ring lc-btn-accent inline-flex min-h-11 w-full items-center justify-center px-6 text-sm font-bold disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Надсилаємо…" : config.submitLabel}
      </button>
    </form>
  );
}
