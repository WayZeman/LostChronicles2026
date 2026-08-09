"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import {
  DEFAULT_APPLY_FORM_CONFIG,
  type ApplyFieldConfig,
  type ApplyFormConfig,
} from "@/lib/application-form-config";
import { cn } from "@/lib/utils";

type ApplicationItem = {
  id: number;
  email: string;
  nickname: string;
  birthday: string;
  age: string;
  contacts: string;
  experience: string;
  previousProjects: string;
  whyServer: string;
  howFound: string;
  createdAt: string;
};

const inputClass =
  "lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]";

function moveField(
  fields: ApplyFieldConfig[],
  index: number,
  dir: -1 | 1,
): ApplyFieldConfig[] {
  const next = index + dir;
  if (next < 0 || next >= fields.length) return fields;
  const copy = fields.slice();
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

  function patchField(
    index: number,
    partial: Partial<ApplyFieldConfig>,
  ) {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === index ? { ...f, ...partial } : f,
      ),
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
      setMsg("Налаштування анкети збережено");
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
      setMsg(`Анкети #${id} видалено`);
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
          ? `Анкета #${id} повторно надіслана в Telegram`
          : `Анкета #${id}: Telegram не налаштований`,
      );
    } catch {
      setErr("Мережева помилка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--mc-text)]">
            Анкета на сайті
          </h2>
          <p className="mt-1 text-sm text-[var(--mc-text-muted)]">
            Тексти сторінки{" "}
            <a
              href="/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[var(--mc-net-green)] hover:underline"
            >
              /apply
            </a>
            , поля форми та надіслані заявки.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveConfig()}
          className="lc-focus-ring lc-btn-accent px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          Зберегти форму
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

      <section className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--mc-text-muted)]">
          Тексти сторінки
        </h3>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[var(--mc-text-muted)]">
            Заголовок
          </span>
          <input
            className={inputClass}
            value={config.pageTitle}
            onChange={(e) => patchConfig({ pageTitle: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[var(--mc-text-muted)]">
            Вступ
          </span>
          <textarea
            className={cn(inputClass, "min-h-20 resize-y")}
            value={config.pageIntro}
            onChange={(e) => patchConfig({ pageIntro: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[var(--mc-text-muted)]">
            Текст кнопки
          </span>
          <input
            className={inputClass}
            value={config.submitLabel}
            onChange={(e) => patchConfig({ submitLabel: e.target.value })}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
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
              Успіх — години розгляду
            </span>
            <input
              className={inputClass}
              value={config.successHoursNote}
              onChange={(e) =>
                patchConfig({ successHoursNote: e.target.value })
              }
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[var(--mc-text-muted)]">
            Успіх — текст
          </span>
          <textarea
            className={cn(inputClass, "min-h-20 resize-y")}
            value={config.successBody}
            onChange={(e) => patchConfig({ successBody: e.target.value })}
          />
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--mc-text-muted)]">
          Поля форми
        </h3>
        <p className="text-xs text-[var(--mc-text-subtle)]">
          Нік і Telegram/Discord завжди увімкнені та обовʼязкові. Інші поля
          можна вимкнути, змінити підписи або порядок.
        </p>
        <ul className="space-y-3">
          {config.fields.map((field, idx) => {
            const locked =
              field.key === "nickname" || field.key === "contacts";
            return (
              <li
                key={field.key}
                className="rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[var(--mc-text-subtle)]">
                    {field.key}
                  </span>
                  <label className="ml-auto flex items-center gap-1.5 text-xs font-bold text-[var(--mc-text-muted)]">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      disabled={locked || busy}
                      onChange={(e) =>
                        patchField(idx, { enabled: e.target.checked })
                      }
                    />
                    Увімкнено
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--mc-text-muted)]">
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={locked || !field.enabled || busy}
                      onChange={(e) =>
                        patchField(idx, { required: e.target.checked })
                      }
                    />
                    Обовʼязкове
                  </label>
                  <button
                    type="button"
                    disabled={busy || idx === 0}
                    className="lc-focus-ring rounded-md border border-white/12 p-1.5 disabled:opacity-40"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        fields: moveField(prev.fields, idx, -1),
                      }))
                    }
                    aria-label="Вище"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || idx >= config.fields.length - 1}
                    className="lc-focus-ring rounded-md border border-white/12 p-1.5 disabled:opacity-40"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        fields: moveField(prev.fields, idx, 1),
                      }))
                    }
                    aria-label="Нижче"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                      Підпис
                    </span>
                    <input
                      className={inputClass}
                      value={field.label}
                      disabled={busy}
                      onChange={(e) =>
                        patchField(idx, { label: e.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                      Підказка
                    </span>
                    <input
                      className={inputClass}
                      value={field.hint}
                      disabled={busy}
                      onChange={(e) =>
                        patchField(idx, { hint: e.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                      Placeholder
                    </span>
                    <input
                      className={inputClass}
                      value={field.placeholder}
                      disabled={busy}
                      onChange={(e) =>
                        patchField(idx, { placeholder: e.target.value })
                      }
                    />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveConfig()}
          className="lc-focus-ring lc-btn-accent px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          Зберегти форму
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--mc-text-muted)]">
            Надіслані анкети ({total})
          </h3>
          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className="lc-focus-ring text-xs font-bold text-[var(--mc-net-green)] hover:underline disabled:opacity-50"
          >
            Оновити список
          </button>
        </div>
        {apps.length === 0 ? (
          <p className="text-sm text-[var(--mc-text-muted)]">Поки порожньо.</p>
        ) : (
          <ul className="space-y-2">
            {apps.map((a) => {
              const open = openId === a.id;
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-white/10 bg-black/25"
                >
                  <button
                    type="button"
                    className="lc-focus-ring flex w-full items-center justify-between gap-3 px-3 py-3 text-left sm:px-4"
                    onClick={() => setOpenId(open ? null : a.id)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[var(--mc-text)]">
                        #{a.id} · {a.nickname || "—"}
                      </span>
                      <span className="block text-xs text-[var(--mc-text-muted)]">
                        {formatWhen(a.createdAt)}
                        {a.contacts ? ` · ${a.contacts}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-[var(--mc-text-subtle)]">
                      {open ? "▲" : "▼"}
                    </span>
                  </button>
                  {open ? (
                    <div className="space-y-2 border-t border-white/10 px-3 py-3 text-sm text-[var(--mc-text-muted)] sm:px-4">
                      <p>
                        <b className="text-[var(--mc-text)]">Email:</b>{" "}
                        {a.email || "—"}
                      </p>
                      <p>
                        <b className="text-[var(--mc-text)]">Вік:</b>{" "}
                        {a.age || "—"}
                      </p>
                      <p>
                        <b className="text-[var(--mc-text)]">ДН:</b>{" "}
                        {a.birthday || "—"}
                      </p>
                      <p>
                        <b className="text-[var(--mc-text)]">Контакти:</b>{" "}
                        {a.contacts || "—"}
                      </p>
                      <p>
                        <b className="text-[var(--mc-text)]">Досвід:</b>{" "}
                        {a.experience || "—"}
                      </p>
                      <p>
                        <b className="text-[var(--mc-text)]">Проєкти:</b>{" "}
                        {a.previousProjects || "—"}
                      </p>
                      <p>
                        <b className="text-[var(--mc-text)]">Чому сервер:</b>{" "}
                        {a.whyServer || "—"}
                      </p>
                      <p>
                        <b className="text-[var(--mc-text)]">Звідки:</b>{" "}
                        {a.howFound || "—"}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void resendApp(a.id)}
                          className="lc-focus-ring rounded-lg border border-white/12 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                        >
                          У Telegram знову
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removeApp(a.id)}
                          className="lc-focus-ring inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-100 disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" />
                          Видалити
                        </button>
                      </div>
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
