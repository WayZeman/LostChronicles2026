"use client";

import { useState, useTransition } from "react";

import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

export type SupportCardView = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  price_label: string;
};

type Props = {
  cards: SupportCardView[];
  jarUrl: string;
};

type Phase =
  | { kind: "idle" }
  | { kind: "form"; card: SupportCardView }
  | {
      kind: "done";
      orderId: number;
      title: string;
      priceLabel: string;
      nickname: string;
      payUrl: string;
      notified: boolean;
    };

export function SupportOrderCards({ cards, jarUrl }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [nickname, setNickname] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openForm(card: SupportCardView) {
    setError(null);
    setNickname("");
    setNote("");
    setPhase({ kind: "form", card });
  }

  function closeOverlay() {
    if (pending) return;
    setPhase({ kind: "idle" });
    setError(null);
  }

  function submitOrder() {
    if (phase.kind !== "form") return;
    const card = phase.card;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/support/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: card.id,
            nickname,
            note,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          payUrl?: string;
          notified?: boolean;
          order?: {
            id: number;
            title: string;
            priceLabel: string;
            nickname: string;
          };
        };
        if (!res.ok || !data.order || !data.payUrl) {
          setError(data.error || "Не вдалося створити замовлення");
          return;
        }
        window.open(data.payUrl, "_blank", "noopener,noreferrer");
        setPhase({
          kind: "done",
          orderId: data.order.id,
          title: data.order.title,
          priceLabel: data.order.priceLabel,
          nickname: data.order.nickname,
          payUrl: data.payUrl,
          notified: Boolean(data.notified),
        });
      } catch {
        setError("Мережева помилка. Спробуй ще раз.");
      }
    });
  }

  return (
    <>
      {cards.length === 0 ? (
        <div
          className={cn(
            lcGlassPanelClass,
            "lc-interactive-panel-static py-12 text-center text-sm text-[var(--mc-text-muted)]",
          )}
        >
          Пропозицій поки немає.
        </div>
      ) : (
        <ul className="lc-stagger grid gap-4 sm:grid-cols-2 sm:gap-5">
          {cards.map((card) => (
            <li key={card.id}>
              <article
                className={cn(
                  lcGlassPanelClass,
                  "lc-interactive-panel-static flex h-full flex-col overflow-hidden !p-0",
                )}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                  <h2 className="text-lg font-bold leading-snug text-[var(--mc-text)] [overflow-wrap:anywhere]">
                    {card.title}
                  </h2>
                  <p className="flex-1 text-sm leading-relaxed text-[var(--mc-text-muted)] [overflow-wrap:anywhere]">
                    {card.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => openForm(card)}
                    className="lc-focus-ring lc-btn-accent mt-auto inline-flex min-h-11 w-full items-center justify-center px-4 text-sm font-bold"
                  >
                    {card.price_label}
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex justify-center sm:mt-10">
        <a
          href={jarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[var(--mc-text-muted)] underline-offset-2 hover:text-[var(--mc-net-green)] hover:underline"
        >
          Або відкрити банку Monobank без вибору картки
        </a>
      </div>

      {phase.kind !== "idle" ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-order-title"
          onClick={closeOverlay}
        >
          <div
            className={cn(
              lcGlassPanelClass,
              "lc-interactive-panel-static w-full max-w-md !p-5 sm:!p-6",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {phase.kind === "form" ? (
              <>
                <h3
                  id="support-order-title"
                  className="text-lg font-bold text-[var(--mc-text)]"
                >
                  {phase.card.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--mc-text-muted)]">
                  Вкажи ігровий нік — адміни одразу побачать замовлення в
                  Telegram, далі оплати в Monobank.
                </p>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Нікнейм
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={64}
                    autoFocus
                    placeholder="Steve"
                    className="lc-focus-ring mt-1.5 w-full border border-black/40 bg-black/25 px-3 py-2.5 text-sm text-[var(--mc-text)] placeholder:text-[var(--mc-text-muted)]"
                  />
                </label>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Коментар (опційно)
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    placeholder="Префікс / деталі"
                    className="lc-focus-ring mt-1.5 w-full border border-black/40 bg-black/25 px-3 py-2.5 text-sm text-[var(--mc-text)] placeholder:text-[var(--mc-text-muted)]"
                  />
                </label>
                {error ? (
                  <p className="mt-3 text-sm text-red-300" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={pending || nickname.trim().length < 2}
                    onClick={submitOrder}
                    className="lc-focus-ring lc-btn-accent inline-flex min-h-11 flex-1 items-center justify-center px-4 text-sm font-bold disabled:opacity-50"
                  >
                    {pending
                      ? "Створюємо…"
                      : `Оплатити ${phase.card.price_label}`}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={closeOverlay}
                    className="lc-focus-ring inline-flex min-h-11 items-center justify-center border border-black/40 px-4 text-sm font-semibold text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
                  >
                    Скасувати
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3
                  id="support-order-title"
                  className="text-lg font-bold text-[var(--mc-text)]"
                >
                  Замовлення надіслано
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                  #{phase.orderId}: {phase.title} для{" "}
                  <b className="text-[var(--mc-text)]">{phase.nickname}</b> (
                  {phase.priceLabel}).
                </p>
                <p className="mt-2 text-sm text-[var(--mc-net-green)]" role="status">
                  {phase.notified
                    ? "Адмінам уже пішло повідомлення в Telegram. Залишилось оплатити в Monobank."
                    : "Замовлення створено. Відкрий банку Monobank і заверши оплату."}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <a
                    href={phase.payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lc-focus-ring lc-btn-accent inline-flex min-h-11 w-full items-center justify-center px-4 text-sm font-bold"
                  >
                    Відкрити банку знову
                  </a>
                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="text-sm text-[var(--mc-text-muted)] underline-offset-2 hover:underline"
                  >
                    Закрити
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
