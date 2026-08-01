"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ShoppingCart, Trash2, X } from "lucide-react";

import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

export type SupportCardView = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  price_label: string;
  quantity_enabled: boolean;
};

type Props = {
  cards: SupportCardView[];
};

type CartLine = {
  cardId: number;
  quantity: number;
};

type Phase =
  | { kind: "idle" }
  | { kind: "checkout" }
  | {
      kind: "done";
      orderId: number;
      totalLabel: string;
      nickname: string;
      payUrl: string;
      notified: boolean;
    };

const CART_KEY = "lc-support-cart-v1";
const MAX_QTY = 20;

function parseUnitUah(label: string): number | null {
  const m = label.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatUah(n: number): string {
  return `${n.toLocaleString("uk-UA")} ₴`;
}

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        const o = x as Record<string, unknown>;
        const cardId = Number(o.cardId);
        const quantity = Math.floor(Number(o.quantity));
        if (!Number.isInteger(cardId) || cardId < 1) return null;
        return {
          cardId,
          quantity: Math.min(MAX_QTY, Math.max(1, quantity || 1)),
        };
      })
      .filter((x): x is CartLine => x != null);
  } catch {
    return [];
  }
}

export function SupportOrderCards({ cards }: Props) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [nickname, setNickname] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pickQty, setPickQty] = useState<Record<number, number>>({});

  useEffect(() => {
    setCart(loadCart());
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, cartReady]);

  const cardById = useMemo(() => {
    const m = new Map<number, SupportCardView>();
    for (const c of cards) m.set(c.id, c);
    return m;
  }, [cards]);

  const cartRows = useMemo(() => {
    return cart
      .map((line) => {
        const card = cardById.get(line.cardId);
        if (!card) return null;
        const unit = parseUnitUah(card.price_label) ?? 0;
        const qty = card.quantity_enabled ? line.quantity : 1;
        return { line: { ...line, quantity: qty }, card, unit, total: unit * qty };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
  }, [cart, cardById]);

  const cartTotal = cartRows.reduce((s, r) => s + r.total, 0);
  const cartCount = cartRows.reduce((s, r) => s + r.line.quantity, 0);

  function qtyFor(cardId: number): number {
    return pickQty[cardId] ?? 1;
  }

  function setQtyFor(cardId: number, q: number) {
    setPickQty((prev) => ({
      ...prev,
      [cardId]: Math.min(MAX_QTY, Math.max(1, q)),
    }));
  }

  function addToCart(card: SupportCardView) {
    const addQty = card.quantity_enabled ? qtyFor(card.id) : 1;
    setCart((prev) => {
      const i = prev.findIndex((l) => l.cardId === card.id);
      if (i < 0) return [...prev, { cardId: card.id, quantity: addQty }];
      const next = [...prev];
      const maxAdd = card.quantity_enabled
        ? Math.min(MAX_QTY, next[i].quantity + addQty)
        : 1;
      next[i] = { ...next[i], quantity: maxAdd };
      return next;
    });
    setCartOpen(true);
  }

  function updateCartQty(cardId: number, quantity: number) {
    const card = cardById.get(cardId);
    if (!card?.quantity_enabled) return;
    setCart((prev) =>
      prev.map((l) =>
        l.cardId === cardId
          ? { ...l, quantity: Math.min(MAX_QTY, Math.max(1, quantity)) }
          : l,
      ),
    );
  }

  function removeFromCart(cardId: number) {
    setCart((prev) => prev.filter((l) => l.cardId !== cardId));
  }

  function openCheckout() {
    if (cartRows.length === 0) return;
    setError(null);
    setNickname("");
    setNote("");
    setPhase({ kind: "checkout" });
  }

  function closeOverlay() {
    if (pending) return;
    setPhase({ kind: "idle" });
    setError(null);
  }

  function submitCheckout() {
    if (phase.kind !== "checkout" || cartRows.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/support/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname,
            note,
            items: cartRows.map((r) => ({
              cardId: r.card.id,
              quantity: r.line.quantity,
            })),
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          payUrl?: string;
          notified?: boolean;
          order?: { id: number; nickname: string; amountKopecks?: number };
        };
        if (!res.ok || !data.order || !data.payUrl) {
          setError(data.error || "Не вдалося створити замовлення");
          return;
        }
        window.open(data.payUrl, "_blank", "noopener,noreferrer");
        setCart([]);
        localStorage.removeItem(CART_KEY);
        setPhase({
          kind: "done",
          orderId: data.order.id,
          totalLabel: formatUah(
            (data.order.amountKopecks ?? cartTotal * 100) / 100,
          ),
          nickname: data.order.nickname,
          payUrl: data.payUrl,
          notified: Boolean(data.notified),
        });
        setCartOpen(false);
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
          {cards.map((card) => {
            const unit = parseUnitUah(card.price_label);
            const q = qtyFor(card.id);
            return (
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
                    <p className="text-sm font-bold text-[var(--mc-text)]">
                      {card.price_label}
                    </p>
                    {card.quantity_enabled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                          К-сть
                        </span>
                        <button
                          type="button"
                          aria-label="Зменшити"
                          disabled={q <= 1}
                          onClick={() => setQtyFor(card.id, q - 1)}
                          className="lc-focus-ring inline-flex h-9 w-9 items-center justify-center border border-black/40 text-base font-bold disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm font-bold tabular-nums text-[var(--mc-text)]">
                          {q}
                        </span>
                        <button
                          type="button"
                          aria-label="Збільшити"
                          disabled={q >= MAX_QTY}
                          onClick={() => setQtyFor(card.id, q + 1)}
                          className="lc-focus-ring inline-flex h-9 w-9 items-center justify-center border border-black/40 text-base font-bold disabled:opacity-40"
                        >
                          +
                        </button>
                        {unit != null && q > 1 ? (
                          <span className="text-xs text-[var(--mc-text-muted)]">
                            = {formatUah(unit * q)}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => addToCart(card)}
                      className="lc-focus-ring lc-btn-accent mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm font-bold"
                    >
                      <ShoppingCart className="size-4" aria-hidden />
                      До кошика
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {cartCount > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          <div className="pointer-events-auto mx-auto flex max-w-4xl items-center gap-3 border border-black/50 bg-[var(--mc-panel,#1a1a1a)]/95 px-3 py-2.5 shadow-lg backdrop-blur-sm sm:px-4">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="lc-focus-ring flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <ShoppingCart className="size-5 shrink-0 text-[var(--mc-net-green)]" />
              <span className="truncate text-sm font-bold text-[var(--mc-text)]">
                Кошик · {cartCount} · {formatUah(cartTotal)}
              </span>
            </button>
            <button
              type="button"
              onClick={openCheckout}
              className="lc-focus-ring lc-btn-accent shrink-0 px-4 py-2 text-sm font-bold"
            >
              Оформити
            </button>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-cart-title"
          onClick={() => setCartOpen(false)}
        >
          <div
            className={cn(
              lcGlassPanelClass,
              "lc-interactive-panel-static max-h-[85vh] w-full max-w-md overflow-y-auto !p-5 sm:!p-6",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3
                id="support-cart-title"
                className="text-lg font-bold text-[var(--mc-text)]"
              >
                Кошик
              </h3>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="lc-focus-ring rounded border border-black/40 p-1.5 text-[var(--mc-text-muted)]"
                aria-label="Закрити"
              >
                <X className="size-4" />
              </button>
            </div>
            {cartRows.length === 0 ? (
              <p className="text-sm text-[var(--mc-text-muted)]">Порожньо.</p>
            ) : (
              <ul className="space-y-3">
                {cartRows.map(({ line, card, total }) => (
                  <li
                    key={card.id}
                    className="flex gap-3 border border-black/30 p-2.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image_url}
                      alt=""
                      className="size-14 shrink-0 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--mc-text)]">
                        {card.title}
                      </p>
                      <p className="text-xs text-[var(--mc-text-muted)]">
                        {formatUah(total)}
                      </p>
                      {card.quantity_enabled ? (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            className="lc-focus-ring h-8 w-8 border border-black/40 font-bold"
                            onClick={() =>
                              updateCartQty(card.id, line.quantity - 1)
                            }
                          >
                            −
                          </button>
                          <span className="min-w-5 text-center text-sm font-bold tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="lc-focus-ring h-8 w-8 border border-black/40 font-bold"
                            onClick={() =>
                              updateCartQty(card.id, line.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(card.id)}
                      className="lc-focus-ring self-start p-1.5 text-rose-200"
                      aria-label="Прибрати"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {cartRows.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-bold text-[var(--mc-text)]">
                  Разом: {formatUah(cartTotal)}
                </p>
                <button
                  type="button"
                  onClick={openCheckout}
                  className="lc-focus-ring lc-btn-accent inline-flex min-h-11 w-full items-center justify-center px-4 text-sm font-bold"
                >
                  Оформити замовлення
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase.kind !== "idle" ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-checkout-title"
          onClick={closeOverlay}
        >
          <div
            className={cn(
              lcGlassPanelClass,
              "lc-interactive-panel-static w-full max-w-md !p-5 sm:!p-6",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {phase.kind === "checkout" ? (
              <>
                <h3
                  id="support-checkout-title"
                  className="text-lg font-bold text-[var(--mc-text)]"
                >
                  Оформлення
                </h3>
                <p className="mt-1 text-sm text-[var(--mc-text-muted)]">
                  {cartCount} поз. · {formatUah(cartTotal)}. Адміни одразу
                  отримають замовлення в Telegram.
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
                    placeholder="Пісня / деталі"
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
                    onClick={submitCheckout}
                    className="lc-focus-ring lc-btn-accent inline-flex min-h-11 flex-1 items-center justify-center px-4 text-sm font-bold disabled:opacity-50"
                  >
                    {pending
                      ? "Створюємо…"
                      : `Оплатити ${formatUah(cartTotal)}`}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={closeOverlay}
                    className="lc-focus-ring inline-flex min-h-11 items-center justify-center border border-black/40 px-4 text-sm font-semibold text-[var(--mc-text-muted)]"
                  >
                    Назад
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3
                  id="support-checkout-title"
                  className="text-lg font-bold text-[var(--mc-text)]"
                >
                  Замовлення надіслано
                </h3>
                <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
                  #{phase.orderId} для{" "}
                  <b className="text-[var(--mc-text)]">{phase.nickname}</b> (
                  {phase.totalLabel}).
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
