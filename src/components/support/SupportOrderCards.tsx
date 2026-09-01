"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";

import { LcModalPortal } from "@/components/site/LcModalPortal";
import { AUTH_ME_CHANGED_EVENT } from "@/lib/auth-me-events";
import { fetchAuthMe } from "@/lib/fetch-auth-me";
import { authRequiredPath } from "@/lib/auth-paths";
import {
  effectivePriceTiers,
  type SupportPriceTier,
} from "@/lib/support-price-tiers";
import { cn } from "@/lib/utils";

export type SupportCardView = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  price_label: string;
  price_tiers?: SupportPriceTier[];
  quantity_enabled: boolean;
};

type Props = {
  cards: SupportCardView[];
};

type CartLine = {
  cardId: number;
  tierIndex: number;
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

type AuthMe = {
  gameNickname: string | null;
  needsNickname: boolean;
} | null;

const CART_KEY = "lc-support-cart-v2";
const MAX_QTY = 20;
const SUPPORT_NEXT = "/support";


function parseUnitUah(label: string): number | null {
  const m = label.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatUah(n: number): string {
  return `${n.toLocaleString("uk-UA")} ₴`;
}

function cardTiers(card: SupportCardView): SupportPriceTier[] {
  return effectivePriceTiers(card.price_label, card.price_tiers ?? []);
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
        const tierIndex = Math.max(0, Math.floor(Number(o.tierIndex ?? 0)) || 0);
        if (!Number.isInteger(cardId) || cardId < 1) return null;
        return {
          cardId,
          tierIndex,
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
  const [tierPick, setTierPick] = useState<{
    card: SupportCardView;
    qty: number;
  } | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [me, setMe] = useState<AuthMe | undefined>(undefined);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pickQty, setPickQty] = useState<Record<number, number>>({});
  const [justAdded, setJustAdded] = useState<number | null>(null);

  useEffect(() => {
    setCart(loadCart());
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, cartReady]);

  useEffect(() => {
    async function loadMe() {
      const { user, unavailable } = await fetchAuthMe();
      if (unavailable) return;
      setMe(
        user
          ? {
              gameNickname: user.gameNickname,
              needsNickname: Boolean(user.needsNickname),
            }
          : null,
      );
    }
    void loadMe();
    const onChange = () => void loadMe();
    window.addEventListener(AUTH_ME_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(AUTH_ME_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (justAdded == null) return;
    const t = window.setTimeout(() => setJustAdded(null), 1400);
    return () => window.clearTimeout(t);
  }, [justAdded]);

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
        const tiers = cardTiers(card);
        if (tiers.length === 0) return null;
        const tier = tiers[Math.min(line.tierIndex, tiers.length - 1)]!;
        const unit = parseUnitUah(tier.price_label) ?? 0;
        const qty = card.quantity_enabled ? line.quantity : 1;
        const displayTitle =
          tiers.length > 1 && tier.label
            ? `${card.title} (${tier.label})`
            : card.title;
        return {
          line: { ...line, quantity: qty },
          card,
          tier,
          displayTitle,
          unit,
          total: unit * qty,
        };
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

  function addToCartWithTier(
    card: SupportCardView,
    tierIndex: number,
    addQty: number,
  ) {
    setCart((prev) => {
      const i = prev.findIndex(
        (l) => l.cardId === card.id && l.tierIndex === tierIndex,
      );
      if (i < 0) {
        return [...prev, { cardId: card.id, tierIndex, quantity: addQty }];
      }
      const next = [...prev];
      const maxAdd = card.quantity_enabled
        ? Math.min(MAX_QTY, next[i]!.quantity + addQty)
        : 1;
      next[i] = { ...next[i]!, quantity: maxAdd };
      return next;
    });
    setJustAdded(card.id);
    setTierPick(null);
  }

  function requestAddToCart(card: SupportCardView) {
    const tiers = cardTiers(card);
    const addQty = card.quantity_enabled ? qtyFor(card.id) : 1;
    if (tiers.length > 1) {
      setTierPick({ card, qty: addQty });
      return;
    }
    addToCartWithTier(card, 0, addQty);
  }

  function updateCartQty(cardId: number, tierIndex: number, quantity: number) {
    const card = cardById.get(cardId);
    if (!card?.quantity_enabled) return;
    setCart((prev) =>
      prev.map((l) =>
        l.cardId === cardId && l.tierIndex === tierIndex
          ? { ...l, quantity: Math.min(MAX_QTY, Math.max(1, quantity)) }
          : l,
      ),
    );
  }

  function removeFromCart(cardId: number, tierIndex: number) {
    setCart((prev) =>
      prev.filter((l) => !(l.cardId === cardId && l.tierIndex === tierIndex)),
    );
  }

  function continueShopping() {
    setCartOpen(false);
  }

  function openCheckout() {
    if (cartRows.length === 0) return;
    setCartOpen(false);
    setError(null);
    setNote("");
    if (!me) {
      window.location.href = authRequiredPath(SUPPORT_NEXT);
      return;
    }
    if (me.needsNickname || !me.gameNickname) {
      window.location.href = `/profile/setup?next=${encodeURIComponent(SUPPORT_NEXT)}`;
      return;
    }
    setPhase({ kind: "checkout" });
  }

  function closeOverlay() {
    if (pending) return;
    setPhase({ kind: "idle" });
    setError(null);
  }

  function submitCheckout() {
    if (phase.kind !== "checkout" || cartRows.length === 0) return;
    if (!me?.gameNickname) {
      setError("Увійди в акаунт і вкажи Minecraft-нік.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/support/orders", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note,
            items: cartRows.map((r) => ({
              cardId: r.card.id,
              quantity: r.line.quantity,
              tierIndex: r.line.tierIndex,
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
          if (res.status === 401) {
            window.location.href = authRequiredPath(SUPPORT_NEXT);
          }
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
      } catch {
        setError("Мережева помилка. Спробуй ще раз.");
      }
    });
  }

  const modalShell =
    "border-2 border-black bg-[color-mix(in_srgb,var(--mc-panel,#1a1a1a)_96%,#000)] shadow-[6px_6px_0_rgba(0,0,0,0.55)]";

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
        <div className="flex min-w-0 items-center gap-2.5">
          <ShoppingBag
            className="size-5 shrink-0 text-[var(--mc-net-green)] sm:size-6"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
              Магазин бонусів
            </p>
            <p className="text-sm text-[var(--mc-text-muted)]">
              {cards.length} {cards.length === 1 ? "товар" : "товарів"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="lc-focus-ring relative inline-flex min-h-11 items-center gap-2 border-2 border-black bg-black/35 px-3.5 text-sm font-bold text-[var(--mc-text)]"
        >
          <ShoppingCart className="size-4" aria-hidden />
          <span className="hidden xs:inline sm:inline">Кошик</span>
          {cartCount > 0 ? (
            <span className="inline-flex min-w-6 items-center justify-center bg-[var(--mc-net-green)] px-1.5 py-0.5 text-xs font-extrabold text-black">
              {cartCount}
            </span>
          ) : (
            <span className="text-xs text-[var(--mc-text-muted)]">0</span>
          )}
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="border-2 border-black/60 bg-black/25 py-14 text-center text-sm text-[var(--mc-text-muted)]">
          Товарів поки немає.
        </div>
      ) : (
        <ul className="flex flex-wrap justify-center gap-4 pb-8 sm:gap-5">
          {cards.map((card, cardIndex) => {
            const q = qtyFor(card.id);
            const added = justAdded === card.id;
            const tiers = cardTiers(card);
            const badge =
              tiers.length > 1
                ? card.price_label ||
                  (tiers[0] ? `від ${tiers[0].price_label}` : "")
                : (tiers[0]?.price_label ?? card.price_label);
            return (
              <li
                key={card.id}
                className="w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
              >
                <article
                  className={cn(
                    "relative flex h-full flex-col overflow-hidden border-2 border-black bg-black/30",
                    "shadow-[4px_4px_0_rgba(0,0,0,0.45)] transition-[transform,box-shadow] duration-150",
                    "hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(0,0,0,0.5)]",
                  )}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#121212]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute bottom-2 right-2 border-2 border-black bg-black/80 px-2.5 py-1.5 text-xl font-black tabular-nums leading-none text-[var(--mc-net-green)] sm:text-2xl">
                      {badge}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
                    <h2 className="text-base font-extrabold leading-snug text-[var(--mc-text)] [overflow-wrap:anywhere] sm:text-lg">
                      {card.title}
                    </h2>
                    <p className="flex-1 text-sm leading-relaxed text-[var(--mc-text-muted)] [overflow-wrap:anywhere]">
                      {card.description}
                    </p>
                    {card.quantity_enabled ? (
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          aria-label="Зменшити"
                          disabled={q <= 1}
                          onClick={() => setQtyFor(card.id, q - 1)}
                          className="lc-focus-ring inline-flex h-9 w-9 items-center justify-center border-2 border-black bg-black/40 text-base font-bold disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="min-w-7 text-center text-base font-extrabold tabular-nums text-[var(--mc-text)]">
                          {q}
                        </span>
                        <button
                          type="button"
                          aria-label="Збільшити"
                          disabled={q >= MAX_QTY}
                          onClick={() => setQtyFor(card.id, q + 1)}
                          className="lc-focus-ring inline-flex h-9 w-9 items-center justify-center border-2 border-black bg-black/40 text-base font-bold disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => requestAddToCart(card)}
                      className={cn(
                        "lc-focus-ring lc-btn-accent mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm font-bold",
                        added && "!bg-[var(--mc-net-green)] !text-black",
                      )}
                    >
                      <ShoppingCart className="size-4" aria-hidden />
                      {added
                        ? "Додано"
                        : tiers.length > 1
                          ? "Обрати варіант"
                          : "У кошик"}
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {cartCount > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div
            className={cn(
              "pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2 border-2 border-black bg-[color-mix(in_srgb,#141414_94%,#000)] p-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:flex-row sm:items-center sm:gap-3 sm:p-3",
            )}
          >
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="lc-focus-ring flex min-w-0 flex-1 items-center justify-center gap-2 px-2 py-2 text-sm font-bold text-[var(--mc-text)] sm:justify-start"
            >
              <ShoppingCart className="size-5 shrink-0 text-[var(--mc-net-green)]" />
              <span className="truncate">
                Кошик · {cartCount} · {formatUah(cartTotal)}
              </span>
            </button>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="lc-focus-ring inline-flex min-h-11 items-center justify-center border-2 border-black bg-black/40 px-3 text-sm font-bold text-[var(--mc-text)]"
              >
                Кошик
              </button>
              <button
                type="button"
                onClick={openCheckout}
                className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold"
              >
                Оформити
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tierPick ? (
        <LcModalPortal
          open
          onClose={() => setTierPick(null)}
          ariaLabelledBy="support-tier-title"
        >
          <div
            className={cn(
              modalShell,
              "max-h-[min(90vh,36rem)] w-full max-w-md overflow-y-auto p-4 sm:p-5",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3
                  id="support-tier-title"
                  className="text-lg font-extrabold text-[var(--mc-text)]"
                >
                  Обери варіант
                </h3>
                <p className="mt-0.5 text-sm text-[var(--mc-text-muted)]">
                  {tierPick.card.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTierPick(null)}
                className="lc-focus-ring border-2 border-black p-1.5 text-[var(--mc-text-muted)]"
                aria-label="Закрити"
              >
                <X className="size-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {cardTiers(tierPick.card).map((tier, idx) => (
                <li key={`${tier.label}-${tier.price_label}-${idx}`}>
                  <button
                    type="button"
                    onClick={() =>
                      addToCartWithTier(tierPick.card, idx, tierPick.qty)
                    }
                    className="lc-focus-ring flex w-full items-center justify-between gap-3 border-2 border-black bg-black/35 px-3.5 py-3 text-left transition-colors hover:bg-black/50"
                  >
                    <span className="min-w-0 font-bold text-[var(--mc-text)] [overflow-wrap:anywhere]">
                      {tier.label || `Варіант ${idx + 1}`}
                    </span>
                    <span className="shrink-0 text-base font-black tabular-nums text-[var(--mc-net-green)]">
                      {tier.price_label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </LcModalPortal>
      ) : null}

      <LcModalPortal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        ariaLabelledBy="support-cart-title"
      >
          <div
            className={cn(
              modalShell,
              "flex max-h-[min(88vh,40rem)] w-full max-w-lg flex-col overflow-hidden",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-black/50 px-4 py-3 sm:px-5">
              <div>
                <h3
                  id="support-cart-title"
                  className="text-lg font-extrabold text-[var(--mc-text)]"
                >
                  Чек
                </h3>
                <p className="text-[11px] uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Lost Chronicles · магазин
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="lc-focus-ring border-2 border-black p-1.5 text-[var(--mc-text-muted)]"
                aria-label="Закрити"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
              {cartRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--mc-text-muted)]">
                  Кошик порожній.
                </p>
              ) : (
                <div className="border-2 border-dashed border-black/40 bg-[#0d0d0d] px-3 py-3 font-mono sm:px-4">
                  <ul className="space-y-0 divide-y divide-dashed divide-white/15">
                    {cartRows.map(({ line, card, displayTitle, unit, total }, idx) => (
                      <li
                        key={`${card.id}:${line.tierIndex}`}
                        className="py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold leading-snug text-[var(--mc-text)] [overflow-wrap:anywhere]">
                              {idx + 1}. {displayTitle}
                            </p>
                            <p className="mt-1 text-xs text-[var(--mc-text-muted)]">
                              {line.quantity} × {formatUah(unit)}
                            </p>
                            {card.quantity_enabled ? (
                              <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                                <button
                                  type="button"
                                  className="lc-focus-ring h-8 w-8 border-2 border-black bg-black/40 font-bold"
                                  onClick={() =>
                                    updateCartQty(
                                      card.id,
                                      line.tierIndex,
                                      line.quantity - 1,
                                    )
                                  }
                                >
                                  −
                                </button>
                                <span className="min-w-5 text-center text-sm font-extrabold tabular-nums">
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="lc-focus-ring h-8 w-8 border-2 border-black bg-black/40 font-bold"
                                  onClick={() =>
                                    updateCartQty(
                                      card.id,
                                      line.tierIndex,
                                      line.quantity + 1,
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-sm font-extrabold tabular-nums text-[var(--mc-net-green)]">
                              {formatUah(total)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(card.id, line.tierIndex)
                              }
                              className="lc-focus-ring p-1 text-rose-200/90"
                              aria-label="Прибрати"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t-2 border-dashed border-white/25 pt-3">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-bold uppercase tracking-wide text-[var(--mc-text-muted)]">
                        Разом
                      </span>
                      <span className="text-lg font-black tabular-nums text-[var(--mc-text)]">
                        {formatUah(cartTotal)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--mc-text-muted)]">
                      Позицій: {cartCount}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-black/50 px-4 py-3 sm:px-5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={continueShopping}
                  className="lc-focus-ring inline-flex min-h-11 items-center justify-center border-2 border-black bg-black/35 px-4 text-sm font-bold text-[var(--mc-text)]"
                >
                  Продовжити покупки
                </button>
                <button
                  type="button"
                  disabled={cartRows.length === 0}
                  onClick={openCheckout}
                  className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold disabled:opacity-40"
                >
                  Оформити покупку
                </button>
              </div>
            </div>
          </div>
      </LcModalPortal>

      <LcModalPortal
        open={phase.kind !== "idle"}
        onClose={closeOverlay}
        ariaLabelledBy="support-checkout-title"
      >
          <div
            className={cn(
              modalShell,
              "max-h-[min(90vh,36rem)] w-full max-w-md overflow-y-auto p-4 sm:p-6",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {phase.kind === "checkout" ? (
              <>
                <h3
                  id="support-checkout-title"
                  className="text-lg font-extrabold text-[var(--mc-text)]"
                >
                  Оформлення покупки
                </h3>
                <p className="mt-1 text-sm text-[var(--mc-text-muted)]">
                  {cartCount} поз. · {formatUah(cartTotal)}
                </p>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Нікнейм
                </p>
                <p className="mt-1.5 border-2 border-black bg-black/30 px-3 py-2.5 text-sm font-semibold text-[var(--mc-text)]">
                  {me?.gameNickname}
                </p>
                <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Коментар (опційно)
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    autoFocus
                    placeholder="Пісня / деталі"
                    className="lc-focus-ring mt-1.5 w-full border-2 border-black bg-black/30 px-3 py-2.5 text-sm text-[var(--mc-text)] placeholder:text-[var(--mc-text-muted)]"
                  />
                </label>
                {error ? (
                  <p className="mt-3 text-sm text-red-300" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      closeOverlay();
                      setCartOpen(true);
                    }}
                    className="lc-focus-ring inline-flex min-h-11 items-center justify-center border-2 border-black bg-black/35 px-4 text-sm font-bold text-[var(--mc-text-muted)]"
                  >
                    Назад до кошика
                  </button>
                  <button
                    type="button"
                    disabled={pending || !me?.gameNickname}
                    onClick={submitCheckout}
                    className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold disabled:opacity-50"
                  >
                    {pending
                      ? "Створюємо…"
                      : `Оплатити ${formatUah(cartTotal)}`}
                  </button>
                </div>
              </>
            ) : phase.kind === "done" ? (
              <>
                <h3
                  id="support-checkout-title"
                  className="text-lg font-extrabold text-[var(--mc-text)]"
                >
                  Замовлення прийнято
                </h3>
                <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
                  #{phase.orderId} · {phase.nickname} · {phase.totalLabel}
                </p>
                <p
                  className="mt-2 text-sm text-[var(--mc-net-green)]"
                  role="status"
                >
                  {phase.notified
                    ? "Адмінам уже пішло в Telegram. Залиш оплатити в Monobank."
                    : "Замовлення створено. Відкрий банку Monobank."}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <a
                    href={phase.payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lc-focus-ring lc-btn-accent inline-flex min-h-11 w-full items-center justify-center px-4 text-sm font-bold"
                  >
                    Відкрити банку
                  </a>
                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="lc-focus-ring inline-flex min-h-11 items-center justify-center border-2 border-black px-4 text-sm font-bold text-[var(--mc-text-muted)]"
                  >
                    Назад у магазин
                  </button>
                </div>
              </>
            ) : null}
          </div>
      </LcModalPortal>
    </>
  );
}
