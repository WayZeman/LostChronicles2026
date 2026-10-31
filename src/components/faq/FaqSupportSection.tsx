"use client";

import { useState, type FormEvent } from "react";

import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { discordLoginPath, googleLoginPath } from "@/lib/auth-paths";
import { cn } from "@/lib/utils";

const fieldClass =
  "lc-focus-ring mc-input w-full px-3 py-2.5 text-sm text-[var(--mc-text)]";

type Props = {
  loggedIn: boolean;
};

export function FaqSupportSection({ loggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loggedIn || pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/faq/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, body }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error || "Не вдалося надіслати. Спробуй ще раз.");
        return;
      }
      setSent(true);
      setTopic("");
      setBody("");
    } catch {
      setError("Немає зв’язку з сайтом. Спробуй ще раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-6 sm:mt-8" aria-labelledby="faq-support-title">
      <div className={cn(lcGlassPanelClass, "text-center")}>
        <h2
          id="faq-support-title"
          className="text-lg font-bold text-[var(--mc-ink)] sm:text-xl"
        >
          Підтримка
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--mc-text-muted)]">
          Не знайшов відповіді? Напиши тему і що сталося — звернення побачать
          адміни.
        </p>
        <button
          type="button"
          className="lc-focus-ring lc-btn-accent mt-4 inline-flex min-h-11 items-center justify-center px-6 text-sm"
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
          }}
        >
          {open ? "Закрити" : "Написати в підтримку"}
        </button>

        {open ? (
          <div className="mx-auto mt-5 max-w-lg text-left">
            {sent ? (
              <p
                className="rounded-[var(--radius)] border border-[var(--mc-net-green)]/40 bg-[var(--mc-net-green)]/10 px-3 py-3 text-sm text-[var(--mc-text)]"
                role="status"
              >
                Звернення надіслано. Адміни побачать його в Telegram.
              </p>
            ) : null}

            {!loggedIn ? (
              <div className="mt-3">
                <p className="text-sm leading-relaxed text-[var(--mc-text-muted)]">
                  Писати в підтримку можуть лише ті, хто увійшов на сайт.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <a
                    href={discordLoginPath("/faq")}
                    className="lc-focus-ring mc-btn-primary inline-flex min-h-11 flex-1 items-center justify-center px-4 text-sm"
                  >
                    Увійти через Discord
                  </a>
                  <a
                    href={googleLoginPath("/faq")}
                    className="lc-focus-ring mc-btn-secondary inline-flex min-h-11 flex-1 items-center justify-center px-4 text-sm"
                  >
                    Увійти через Google
                  </a>
                </div>
              </div>
            ) : (
              <form className="mt-3 space-y-3" onSubmit={onSubmit}>
                <label className="block text-sm font-semibold text-[var(--mc-text)]">
                  Тема
                  <input
                    className={cn(fieldClass, "mt-1.5 font-normal")}
                    name="topic"
                    value={topic}
                    maxLength={80}
                    required
                    placeholder="Наприклад: не можу зайти на сервер"
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </label>
                <label className="block text-sm font-semibold text-[var(--mc-text)]">
                  Опис проблеми
                  <textarea
                    className={cn(fieldClass, "mt-1.5 min-h-32 resize-y font-normal")}
                    name="body"
                    value={body}
                    maxLength={2000}
                    required
                    placeholder="Що сталося, який нік і коли"
                    onChange={(e) => setBody(e.target.value)}
                  />
                </label>
                {error ? (
                  <p className="text-sm text-rose-300" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={pending}
                  className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center justify-center px-5 text-sm disabled:opacity-60"
                >
                  {pending ? "Надсилаю…" : "Надіслати"}
                </button>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
