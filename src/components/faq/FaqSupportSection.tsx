"use client";

import { useState, type FormEvent } from "react";
import { LifeBuoy, Send } from "lucide-react";

import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { discordLoginPath, googleLoginPath } from "@/lib/auth-paths";
import { cn } from "@/lib/utils";

const fieldClass =
  "lc-focus-ring mc-input w-full px-3 py-2.5 text-sm text-[var(--mc-text)] placeholder:text-[var(--mc-text-muted)]";

const TOPIC_MAX = 80;
const BODY_MAX = 2000;

type Props = {
  loggedIn: boolean;
};

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

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
    <section className="mt-8 sm:mt-10" aria-labelledby="faq-support-title">
      <div className={cn(lcGlassPanelClass, "overflow-hidden p-0")}>
        <div
          className="h-[3px] bg-[var(--mc-net-green)] shadow-[0_1px_0_#000]"
          aria-hidden
        />
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5 md:p-6">
          <div
            className="mx-auto flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-slot)] border-2 border-[var(--mc-outline)] bg-[var(--mc-surface-elevated)] text-[var(--mc-net-green)] shadow-[inset_0_2px_0_rgba(255,255,255,0.08),inset_0_-3px_0_rgba(0,0,0,0.35)] sm:mx-0"
            aria-hidden
          >
            <LifeBuoy className="size-7" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--mc-net-green)]">
              Підтримка
            </p>
            <h2
              id="faq-support-title"
              className="lc-section-title mt-1 text-lg text-[var(--mc-ink)] sm:text-xl"
            >
              Залишилось питання?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--mc-text)]">
              Напиши тему і що сталося. Звернення одразу прийде адмінам у Telegram.
            </p>
          </div>
          <button
            type="button"
            className="lc-focus-ring lc-btn-accent inline-flex min-h-11 w-full shrink-0 items-center justify-center px-5 text-sm sm:w-auto"
            aria-expanded={open}
            aria-controls="faq-support-panel"
            onClick={() => {
              setOpen((v) => !v);
              setError(null);
            }}
          >
            {open ? "Згорнути" : "Написати звернення"}
          </button>
        </div>

        {open ? (
          <div
            id="faq-support-panel"
            className="border-t border-[var(--mc-border-card)] bg-black/20 px-4 py-4 sm:px-5 sm:py-5 md:px-6"
          >
            {sent ? (
              <div
                className="mx-auto max-w-lg rounded-[var(--radius)] border border-[var(--mc-net-green)]/35 bg-[var(--mc-net-green)]/10 px-4 py-4 text-center"
                role="status"
              >
                <p className="text-base font-bold text-[var(--mc-ink)]">
                  Звернення надіслано
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                  Адміни побачать його в Telegram і зможуть відповісти.
                </p>
                <button
                  type="button"
                  className="lc-focus-ring mc-btn-secondary mt-4 inline-flex min-h-11 items-center justify-center px-4 text-sm"
                  onClick={() => setSent(false)}
                >
                  Написати ще
                </button>
              </div>
            ) : !loggedIn ? (
              <div className="mx-auto max-w-lg text-center">
                <p className="text-sm leading-relaxed text-[var(--mc-text)]">
                  Звернення можуть надсилати лише ті, хто увійшов на сайт.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <a
                    href={discordLoginPath("/faq")}
                    className="lc-focus-ring mc-btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm"
                  >
                    <DiscordMark className="size-5 shrink-0" />
                    Discord
                  </a>
                  <a
                    href={googleLoginPath("/faq")}
                    className="lc-focus-ring mc-btn-secondary inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm"
                  >
                    <GoogleMark className="size-5 shrink-0" />
                    Google
                  </a>
                </div>
              </div>
            ) : (
              <form className="mx-auto max-w-xl space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="flex items-baseline justify-between gap-3 text-sm font-semibold text-[var(--mc-text)]">
                    Тема
                    <span className="text-xs font-normal tabular-nums text-[var(--mc-text-muted)]">
                      {topic.length}/{TOPIC_MAX}
                    </span>
                  </span>
                  <input
                    className={cn(fieldClass, "mt-1.5 font-normal")}
                    name="topic"
                    value={topic}
                    maxLength={TOPIC_MAX}
                    required
                    placeholder="Не можу зайти на сервер"
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="flex items-baseline justify-between gap-3 text-sm font-semibold text-[var(--mc-text)]">
                    Що сталося
                    <span className="text-xs font-normal tabular-nums text-[var(--mc-text-muted)]">
                      {body.length}/{BODY_MAX}
                    </span>
                  </span>
                  <textarea
                    className={cn(fieldClass, "mt-1.5 min-h-36 resize-y font-normal")}
                    name="body"
                    value={body}
                    maxLength={BODY_MAX}
                    required
                    placeholder="Нік, коли це було і що вже пробував"
                    onChange={(e) => setBody(e.target.value)}
                  />
                </label>
                {error ? (
                  <p
                    className="rounded-[var(--radius)] border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={pending}
                    className="lc-focus-ring lc-btn-accent inline-flex min-h-11 w-full items-center justify-center gap-2 px-5 text-sm disabled:opacity-60 sm:w-auto"
                  >
                    <Send className="size-4" aria-hidden />
                    {pending ? "Надсилаю…" : "Надіслати адмінам"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
