"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  APPLY_QUESTION_TYPE_LABELS,
  APPLY_QUESTION_TYPES,
  createBlankQuestion,
  DEFAULT_APPLY_FORM_CONFIG,
  formatAnswerValue,
  type ApplyFormConfig,
  type ApplyQuestion,
  type ApplyQuestionType,
} from "@/lib/application-form-config";
import { cn } from "@/lib/utils";

type ApplicationItem = {
  id: number;
  nickname: string;
  contacts: string;
  email: string;
  createdAt: string;
  answers: Record<string, string | string[]>;
  serverStatus?: "pending" | "accepted" | "rejected";
};

const inputClass =
  "lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]";

function moveItem<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const next = index + dir;
  if (next < 0 || next >= arr.length) return arr;
  const copy = arr.slice();
  const tmp = copy[index]!;
  copy[index] = copy[next]!;
  copy[next] = tmp;
  return copy;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function needsOptions(type: ApplyQuestionType): boolean {
  return (
    type === "single_choice" ||
    type === "multi_choice" ||
    type === "dropdown"
  );
}

export function AdminApplyCms() {
  const [config, setConfig] = useState<ApplyFormConfig>(
    DEFAULT_APPLY_FORM_CONFIG,
  );
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [addType, setAddType] = useState<ApplyQuestionType>("short_text");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/admin/apply", { credentials: "include" });
      if (!res.ok) {
        setErr("Не вдалося завантажити анкету");
        return;
      }
      const data = (await res.json()) as {
        config: ApplyFormConfig;
        applications: ApplicationItem[];
        total: number;
      };
      setConfig(data.config ?? DEFAULT_APPLY_FORM_CONFIG);
      setApps(data.applications ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setErr("Мережева помилка");
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  function patchConfig(partial: Partial<ApplyFormConfig>) {
    setConfig((prev) => ({ ...prev, ...partial }));
  }

  function patchQuestion(index: number, partial: Partial<ApplyQuestion>) {
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== index) return q;
        const next = { ...q, ...partial };
        if (partial.type && needsOptions(partial.type) && next.options.length === 0) {
          next.options = ["Варіант 1", "Варіант 2"];
        }
        if (partial.type && !needsOptions(partial.type)) {
          next.options = [];
        }
        return next;
      }),
    }));
  }

  async function saveConfig() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/admin/apply", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        config?: ApplyFormConfig;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Не збережено");
        return;
      }
      if (data.config) setConfig(data.config);
      setMsg("Анкети збережено");
    } catch {
      setErr("Мережева помилка");
    } finally {
      setBusy(false);
    }
  }

  async function removeApp(id: number) {
    if (!confirm(`Видалити анкету #${id}?`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/apply?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErr(data.error || "Не видалено");
        return;
      }
      setApps((prev) => prev.filter((a) => a.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      if (openId === id) setOpenId(null);
      setMsg(`#${id} видалено`);
    } catch {
      setErr("Мережева помилка");
    } finally {
      setBusy(false);
    }
  }

  async function resendApp(id: number) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/apply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        telegram?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Не надіслано");
        return;
      }
      setMsg(
        data.telegram
          ? `#${id} надіслано в Telegram`
          : `#${id}: Telegram не налаштований`,
      );
    } catch {
      setErr("Мережева помилка");
    } finally {
      setBusy(false);
    }
  }

  function addQuestion() {
    setConfig((prev) => ({
      ...prev,
      questions: [...prev.questions, createBlankQuestion(addType)],
    }));
  }

  function removeQuestion(index: number) {
    const q = config.questions[index];
    if (!q) return;
    if (!confirm(`Видалити питання «${q.label}»?`)) return;
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--mc-text)]">
            Конструктор анкети
          </h2>
          <p className="mt-1 text-sm text-[var(--mc-text-muted)]">
            Як Google Form: типи питань, варіанти відповідей. Публічна сторінка{" "}
            <a
              href="/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[var(--mc-net-green)] hover:underline"
            >
              /apply
            </a>
            .
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveConfig()}
          className="lc-focus-ring lc-btn-accent px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          Зберегти
        </button>
      </div>

      {msg ? (
        <p className="text-sm font-bold text-[var(--mc-net-green)]">{msg}</p>
      ) : null}
      {err ? (
        <p className="text-sm font-bold text-rose-200" role="alert">
          {err}
        </p>
      ) : null}

      <section className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--mc-text-muted)]">
          Тексти сторінки
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Заголовок
            </span>
            <input
              className={inputClass}
              value={config.pageTitle}
              onChange={(e) => patchConfig({ pageTitle: e.target.value })}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Вступ
            </span>
            <textarea
              className={cn(inputClass, "min-h-16 resize-y")}
              value={config.pageIntro}
              onChange={(e) => patchConfig({ pageIntro: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Блок «Доєднайся» — заголовок
            </span>
            <input
              className={inputClass}
              value={config.joinTitle}
              onChange={(e) => patchConfig({ joinTitle: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Кнопка відправки
            </span>
            <input
              className={inputClass}
              value={config.submitLabel}
              onChange={(e) => patchConfig({ submitLabel: e.target.value })}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Блок «Доєднайся» — текст
            </span>
            <textarea
              className={cn(inputClass, "min-h-16 resize-y")}
              value={config.joinBlurb}
              onChange={(e) => patchConfig({ joinBlurb: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Успіх — заголовок
            </span>
            <input
              className={inputClass}
              value={config.successTitle}
              onChange={(e) => patchConfig({ successTitle: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Успіх — години
            </span>
            <input
              className={inputClass}
              value={config.successHoursNote}
              onChange={(e) =>
                patchConfig({ successHoursNote: e.target.value })
              }
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Успіх — текст
            </span>
            <textarea
              className={cn(inputClass, "min-h-16 resize-y")}
              value={config.successBody}
              onChange={(e) => patchConfig({ successBody: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--mc-text-muted)]">
            Питання ({config.questions.length})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={cn(inputClass, "w-auto min-w-[11rem]")}
              value={addType}
              onChange={(e) =>
                setAddType(e.target.value as ApplyQuestionType)
              }
            >
              {APPLY_QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {APPLY_QUESTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={addQuestion}
              className="lc-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold hover:bg-white/[0.05] disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              Додати
            </button>
          </div>
        </div>

        <ul className="space-y-3">
          {config.questions.map((q, idx) => (
            <li
              key={q.id}
              className="rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--mc-text-subtle)]">
                  {APPLY_QUESTION_TYPE_LABELS[q.type]}
                </span>
                <label className="ml-auto flex items-center gap-1.5 text-xs font-bold text-[var(--mc-text-muted)]">
                  <input
                    type="checkbox"
                    checked={q.enabled}
                    disabled={busy}
                    onChange={(e) =>
                      patchQuestion(idx, { enabled: e.target.checked })
                    }
                  />
                  Увімк.
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--mc-text-muted)]">
                  <input
                    type="checkbox"
                    checked={q.required}
                    disabled={busy || !q.enabled}
                    onChange={(e) =>
                      patchQuestion(idx, { required: e.target.checked })
                    }
                  />
                  Обовʼяз.
                </label>
                <button
                  type="button"
                  disabled={busy || idx === 0}
                  className="lc-focus-ring rounded-md border border-white/12 p-1.5 disabled:opacity-40"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      questions: moveItem(prev.questions, idx, -1),
                    }))
                  }
                  aria-label="Вище"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={busy || idx >= config.questions.length - 1}
                  className="lc-focus-ring rounded-md border border-white/12 p-1.5 disabled:opacity-40"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      questions: moveItem(prev.questions, idx, 1),
                    }))
                  }
                  aria-label="Нижче"
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={busy || config.questions.length <= 1}
                  className="lc-focus-ring rounded-md border border-rose-500/30 p-1.5 text-rose-100 disabled:opacity-40"
                  onClick={() => removeQuestion(idx)}
                  aria-label="Видалити"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                    Текст питання
                  </span>
                  <input
                    className={inputClass}
                    value={q.label}
                    disabled={busy}
                    onChange={(e) =>
                      patchQuestion(idx, { label: e.target.value })
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                    Тип
                  </span>
                  <select
                    className={inputClass}
                    value={q.type}
                    disabled={busy}
                    onChange={(e) =>
                      patchQuestion(idx, {
                        type: e.target.value as ApplyQuestionType,
                      })
                    }
                  >
                    {APPLY_QUESTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {APPLY_QUESTION_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                    Підказка
                  </span>
                  <input
                    className={inputClass}
                    value={q.hint}
                    disabled={busy}
                    onChange={(e) =>
                      patchQuestion(idx, { hint: e.target.value })
                    }
                  />
                </label>
                {!needsOptions(q.type) ? (
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                      Placeholder
                    </span>
                    <input
                      className={inputClass}
                      value={q.placeholder}
                      disabled={busy}
                      onChange={(e) =>
                        patchQuestion(idx, { placeholder: e.target.value })
                      }
                    />
                  </label>
                ) : (
                  <div className="space-y-2 sm:col-span-2">
                    <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                      Варіанти відповідей
                    </span>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex gap-2">
                        <input
                          className={inputClass}
                          value={opt}
                          disabled={busy}
                          onChange={(e) => {
                            const options = q.options.slice();
                            options[oi] = e.target.value;
                            patchQuestion(idx, { options });
                          }}
                        />
                        <button
                          type="button"
                          disabled={busy || q.options.length <= 1}
                          className="lc-focus-ring shrink-0 rounded-lg border border-rose-500/30 px-2 text-rose-100 disabled:opacity-40"
                          onClick={() =>
                            patchQuestion(idx, {
                              options: q.options.filter((_, i) => i !== oi),
                            })
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={busy || q.options.length >= 30}
                      className="lc-focus-ring text-xs font-bold text-[var(--mc-net-green)] hover:underline disabled:opacity-50"
                      onClick={() =>
                        patchQuestion(idx, {
                          options: [
                            ...q.options,
                            `Варіант ${q.options.length + 1}`,
                          ],
                        })
                      }
                    >
                      + варіант
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          disabled={busy}
          onClick={() => void saveConfig()}
          className="lc-focus-ring lc-btn-accent px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          Зберегти анкету
        </button>
      </section>

      <section className="space-y-2 border-t border-white/10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--mc-text-muted)]">
            Пройдені анкети · {total}
          </h3>
          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className="lc-focus-ring text-xs font-bold text-[var(--mc-net-green)] hover:underline disabled:opacity-50"
          >
            Оновити
          </button>
        </div>

        {apps.length === 0 ? (
          <p className="text-sm text-[var(--mc-text-muted)]">Поки порожньо.</p>
        ) : (
          <ul className="divide-y divide-white/8 overflow-hidden rounded-xl border border-white/10 bg-black/25">
            {apps.map((a) => {
              const open = openId === a.id;
              return (
                <li key={a.id}>
                  <div className="flex items-stretch gap-1">
                    <button
                      type="button"
                      className="lc-focus-ring min-w-0 flex-1 px-3 py-2.5 text-left hover:bg-white/[0.03]"
                      onClick={() => setOpenId(open ? null : a.id)}
                    >
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-bold text-[var(--mc-text)]">
                          #{a.id}
                        </span>
                        <span className="truncate text-sm text-[var(--mc-text)]">
                          {a.nickname || "—"}
                        </span>
                        {a.serverStatus === "accepted" ? (
                          <span className="text-[11px] font-semibold text-[var(--mc-net-green)]">
                            на сервері
                          </span>
                        ) : a.serverStatus === "rejected" ? (
                          <span className="text-[11px] font-semibold text-rose-300/90">
                            не прийнято
                          </span>
                        ) : null}
                        <span className="text-[11px] text-[var(--mc-text-subtle)]">
                          {formatWhen(a.createdAt)}
                        </span>
                      </span>
                      {a.contacts ? (
                        <span className="mt-0.5 block truncate text-xs text-[var(--mc-text-muted)]">
                          {a.contacts}
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      title="Видалити"
                      className="lc-focus-ring shrink-0 px-2.5 text-rose-200/90 hover:bg-rose-500/10 disabled:opacity-40"
                      onClick={() => void removeApp(a.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {open ? (
                    <div className="space-y-1.5 border-t border-white/8 bg-black/30 px-3 py-2.5 text-xs text-[var(--mc-text-muted)]">
                      {config.questions
                        .filter((q) => q.enabled)
                        .map((q) => (
                          <p key={q.id}>
                            <b className="text-[var(--mc-text)]">{q.label}:</b>{" "}
                            {formatAnswerValue(a.answers[q.id])}
                          </p>
                        ))}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void resendApp(a.id)}
                        className="lc-focus-ring mt-1 rounded-md border border-white/12 px-2 py-1 text-[11px] font-bold disabled:opacity-50"
                      >
                        У Telegram знову
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
