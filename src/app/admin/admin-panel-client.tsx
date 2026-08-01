"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react";
import { FaqRichEditor } from "@/components/admin/FaqRichEditor";
import { SoftAppear } from "@/components/site/SoftAppear";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { compressImageFile } from "@/lib/compress-image";
import { cn } from "@/lib/utils";

type Tab = "faq" | "connect" | "support" | "voting" | "admins";

type FaqDraft = { key: string; question: string; answer_html: string };

type ConnectDraft = {
  javaIp: string;
  javaVersion: string;
  bedrockAddress: string;
  bedrockPort: string;
};

type CatalogLink = { href: string; label: string; shortLabel: string };

type SupportDraft = {
  monoJarUrl: string;
  blurb: string;
  catalogLinks: CatalogLink[];
};

type SupportCardDraft = {
  key: string;
  title: string;
  description: string;
  image_url: string;
  price_label: string;
  button_url: string;
  quantity_enabled: boolean;
};

type AdminUser = {
  id: number;
  username: string;
  game_nickname: string | null;
  role: "user" | "admin";
};

function newFaqKey(): string {
  return `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newCardKey(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AdminPanelClient() {
  const [tab, setTab] = useState<Tab>("faq");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [faq, setFaq] = useState<FaqDraft[]>([]);
  const [connect, setConnect] = useState<ConnectDraft>({
    javaIp: "",
    javaVersion: "",
    bedrockAddress: "",
    bedrockPort: "",
  });
  const [support, setSupport] = useState<SupportDraft>({
    monoJarUrl: "",
    blurb: "",
    catalogLinks: [],
  });
  const [supportCards, setSupportCards] = useState<SupportCardDraft[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const me = (await meRes.json()) as {
        user: { isAdmin?: boolean } | null;
      };
      if (!me.user?.isAdmin) {
        setAllowed(false);
        return;
      }
      setAllowed(true);

      const [faqRes, settingsRes, cardsRes, usersRes] = await Promise.all([
        fetch("/api/admin/faq", { credentials: "include" }),
        fetch("/api/admin/settings", { credentials: "include" }),
        fetch("/api/admin/support-cards", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
      ]);

      if (faqRes.ok) {
        const d = (await faqRes.json()) as {
          items: { question: string; answer_html: string }[];
        };
        setFaq(
          (d.items ?? []).map((i) => ({
            key: newFaqKey(),
            question: i.question,
            answer_html: i.answer_html,
          })),
        );
      }
      if (settingsRes.ok) {
        const d = (await settingsRes.json()) as {
          connect: ConnectDraft;
          support: SupportDraft;
        };
        setConnect(d.connect);
        setSupport(d.support);
      }
      if (cardsRes.ok) {
        const d = (await cardsRes.json()) as {
          items: {
            title: string;
            description: string;
            image_url: string;
            price_label: string;
            button_url: string;
            quantity_enabled?: boolean;
          }[];
        };
        setSupportCards(
          (d.items ?? []).map((i) => ({
            key: newCardKey(),
            title: i.title,
            description: i.description,
            image_url: i.image_url,
            price_label: i.price_label,
            button_url: i.button_url ?? "",
            quantity_enabled: i.quantity_enabled !== false,
          })),
        );
      }
      if (usersRes.ok) {
        const d = (await usersRes.json()) as { users: AdminUser[] };
        setUsers(d.users ?? []);
      }
    } catch {
      setAllowed(false);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadAll();
    });
    return () => cancelAnimationFrame(id);
  }, [loadAll]);

  async function saveFaq() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const payload = faq.map(({ question, answer_html }) => ({
        question,
        answer_html,
      }));
      const res = await fetch("/api/admin/faq", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const d = (await res.json()) as {
        error?: string;
        items?: { question: string; answer_html: string }[];
      };
      if (!res.ok) {
        setErr(d.error || "Помилка збереження FAQ");
        setBusy(false);
        return;
      }
      if (d.items) {
        setFaq(
          d.items.map((i, idx) => ({
            key: faq[idx]?.key ?? newFaqKey(),
            question: i.question,
            answer_html: i.answer_html,
          })),
        );
      }
      setMsg("FAQ збережено.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function saveSettings(kind: "connect" | "support" | "voting") {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "connect" ? { connect } : { support },
        ),
      });
      const d = (await res.json()) as {
        error?: string;
        connect?: ConnectDraft;
        support?: SupportDraft;
      };
      if (!res.ok) {
        setErr(d.error || "Помилка збереження");
        setBusy(false);
        return;
      }
      if (d.connect) setConnect(d.connect);
      if (d.support) setSupport(d.support);
      setMsg(
        kind === "connect"
          ? "Підключення збережено."
          : kind === "voting"
            ? "Голосування збережено."
            : "Підтримку збережено.",
      );
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function saveSupportCards() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const payload = supportCards.map(
        ({
          title,
          description,
          image_url,
          price_label,
          button_url,
          quantity_enabled,
        }) => ({
          title,
          description,
          image_url,
          price_label,
          button_url,
          quantity_enabled,
        }),
      );
      const res = await fetch("/api/admin/support-cards", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const d = (await res.json()) as {
        error?: string;
        items?: {
          title: string;
          description: string;
          image_url: string;
          price_label: string;
          button_url: string;
          quantity_enabled?: boolean;
        }[];
      };
      if (!res.ok) {
        setErr(d.error || "Помилка збереження карток");
        setBusy(false);
        return;
      }
      if (d.items) {
        setSupportCards(
          d.items.map((i, idx) => ({
            key: supportCards[idx]?.key ?? newCardKey(),
            title: i.title,
            description: i.description,
            image_url: i.image_url,
            price_label: i.price_label,
            button_url: i.button_url ?? "",
            quantity_enabled: i.quantity_enabled !== false,
          })),
        );
      }
      setMsg("Картки підтримки збережено.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  function moveCard(index: number, dir: -1 | 1) {
    setSupportCards((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index]!;
      next[index] = next[j]!;
      next[j] = tmp;
      return next;
    });
  }

  async function setRole(userId: number, role: "user" | "admin") {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const d = (await res.json()) as {
        error?: string;
        users?: AdminUser[];
      };
      if (!res.ok) {
        setErr(d.error || "Не вдалося змінити роль");
        setBusy(false);
        return;
      }
      if (d.users) setUsers(d.users);
      setMsg(role === "admin" ? "Адміна призначено." : "Роль знято.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  if (allowed === null) {
    return (
      <main className={lcPageMainClass}>
        <div className="site-container mx-auto max-w-3xl px-3 py-10">
          <div className={cn(lcGlassPanelClass, "h-40 animate-pulse")} />
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className={lcPageMainClass}>
        <div className="site-container mx-auto max-w-lg px-3 py-12 text-center">
          <p className="text-[var(--mc-text-muted)]">
            Доступ лише для адміністраторів.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block font-bold text-[var(--mc-net-green)] hover:underline"
          >
            ← На головну
          </Link>
        </div>
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "faq", label: "FAQ" },
    { id: "connect", label: "Підключення" },
    { id: "support", label: "Підтримка" },
    { id: "voting", label: "Голосування" },
    { id: "admins", label: "Адміни" },
  ];

  async function onCardImageFile(idx: number, file: File | null) {
    if (!file) return;
    setErr(null);
    try {
      const dataUrl = await compressImageFile(file);
      setSupportCards((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, image_url: dataUrl } : c)),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не вдалося завантажити фото");
    }
  }

  return (
    <main className={lcPageMainClass}>
      <div className="site-container mx-auto w-full max-w-3xl px-3 py-8 sm:px-4 sm:py-12">
        <SoftAppear>
          <header className="mb-6 text-center sm:mb-8 sm:text-left">
            <Link
              href="/"
              className="text-sm font-semibold text-[var(--mc-net-green)] hover:underline"
            >
              ← На головну
            </Link>
            <h1 className="lc-hero-title mt-3 text-2xl font-extrabold text-[var(--mc-text)] sm:text-3xl">
              Керування сайтом
            </h1>
            <p className="mt-1 text-sm text-[var(--mc-text-muted)]">
              FAQ, підключення, підтримка та призначення адмінів.
            </p>
          </header>

          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setMsg(null);
                  setErr(null);
                }}
                className={cn(
                  "lc-focus-ring rounded-lg px-3 py-2 text-xs font-bold",
                  tab === t.id
                    ? "bg-[var(--mc-net-green)]/20 text-[var(--mc-net-green)]"
                    : "border border-white/10 text-[var(--mc-text-muted)] hover:bg-white/[0.04]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {msg ? (
            <p className="mb-3 text-sm text-emerald-200" role="status">
              {msg}
            </p>
          ) : null}
          {err ? (
            <p className="mb-3 text-sm text-rose-300" role="alert">
              {err}
            </p>
          ) : null}

          <div className={cn(lcGlassPanelClass, "!p-4 sm:!p-6")}>
            {tab === "faq" ? (
              <div className="space-y-4">
                <p className="text-xs text-[var(--mc-text-muted)]">
                  Виділи текст і натисни кнопки зверху редактора: жирний, курсив,
                  посилання. Стрілки змінюють порядок питань.
                </p>
                {faq.map((item, idx) => (
                  <div
                    key={item.key}
                    className="space-y-2 rounded-lg border border-white/10 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                        #{idx + 1}
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          title="Вище"
                          aria-label="Перемістити вище"
                          disabled={busy || idx === 0}
                          onClick={() =>
                            setFaq((prev) => {
                              if (idx === 0) return prev;
                              const next = [...prev];
                              const tmp = next[idx - 1]!;
                              next[idx - 1] = next[idx]!;
                              next[idx] = tmp;
                              return next;
                            })
                          }
                          className="lc-focus-ring inline-flex size-8 items-center justify-center rounded-md border border-white/12 text-[var(--mc-text)] hover:bg-white/[0.06] disabled:opacity-35"
                        >
                          <ArrowUp className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          title="Нижче"
                          aria-label="Перемістити нижче"
                          disabled={busy || idx >= faq.length - 1}
                          onClick={() =>
                            setFaq((prev) => {
                              if (idx >= prev.length - 1) return prev;
                              const next = [...prev];
                              const tmp = next[idx + 1]!;
                              next[idx + 1] = next[idx]!;
                              next[idx] = tmp;
                              return next;
                            })
                          }
                          className="lc-focus-ring inline-flex size-8 items-center justify-center rounded-md border border-white/12 text-[var(--mc-text)] hover:bg-white/[0.06] disabled:opacity-35"
                        >
                          <ArrowDown className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          title="Видалити"
                          aria-label="Видалити питання"
                          disabled={busy || faq.length <= 1}
                          onClick={() =>
                            setFaq((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="lc-focus-ring inline-flex size-8 items-center justify-center rounded-md border border-rose-500/30 text-rose-200 hover:bg-rose-500/15 disabled:opacity-35"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>
                    <input
                      value={item.question}
                      onChange={(e) =>
                        setFaq((prev) =>
                          prev.map((p, i) =>
                            i === idx
                              ? { ...p, question: e.target.value }
                              : p,
                          ),
                        )
                      }
                      className="lc-focus-ring mc-input w-full px-2.5 py-2 text-sm font-semibold"
                      placeholder="Питання"
                    />
                    <FaqRichEditor
                      value={item.answer_html}
                      disabled={busy}
                      onChange={(html) =>
                        setFaq((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, answer_html: html } : p,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setFaq((prev) => [
                        ...prev,
                        {
                          key: newFaqKey(),
                          question: "Нове питання",
                          answer_html: "<p></p>",
                        },
                      ])
                    }
                    className="lc-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold hover:bg-white/[0.05]"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Додати питання
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveFaq()}
                    className="lc-focus-ring lc-btn-accent px-4 py-2 text-xs disabled:opacity-50"
                  >
                    Зберегти FAQ
                  </button>
                </div>
              </div>
            ) : null}

            {tab === "connect" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["javaIp", "Java IP"],
                    ["javaVersion", "Версія Java"],
                    ["bedrockAddress", "Bedrock адреса"],
                    ["bedrockPort", "Bedrock порт"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-xs font-semibold text-[var(--mc-text-muted)]">
                    {label}
                    <input
                      value={connect[key]}
                      onChange={(e) =>
                        setConnect((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm font-normal text-[var(--mc-text)]"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveSettings("connect")}
                  className="lc-focus-ring lc-btn-accent sm:col-span-2 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Зберегти підключення
                </button>
              </div>
            ) : null}

            {tab === "support" ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[var(--mc-text-muted)]">
                  Посилання Monobank jar
                  <input
                    value={support.monoJarUrl}
                    onChange={(e) =>
                      setSupport((prev) => ({
                        ...prev,
                        monoJarUrl: e.target.value,
                      }))
                    }
                    className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm font-normal text-[var(--mc-text)]"
                  />
                </label>
                <label className="block text-xs font-semibold text-[var(--mc-text-muted)]">
                  Текст під заголовком (опційно)
                  <input
                    value={support.blurb}
                    onChange={(e) =>
                      setSupport((prev) => ({ ...prev, blurb: e.target.value }))
                    }
                    className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm font-normal text-[var(--mc-text)]"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveSettings("support")}
                  className="lc-focus-ring lc-btn-accent px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Зберегти банку / текст
                </button>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[var(--mc-text)]">
                        Товари на /support
                      </p>
                      <p className="text-xs text-[var(--mc-text-muted)]">
                        Фото з пристрою або URL, ціна, увімкнення кількості.
                      </p>
                    </div>
                    <Link
                      href="/support"
                      className="text-xs font-semibold text-[var(--mc-net-green)] hover:underline"
                    >
                      Відкрити сторінку ↗
                    </Link>
                  </div>

                  <ul className="space-y-4">
                    {supportCards.map((card, idx) => (
                      <li
                        key={card.key}
                        className="space-y-3 border-2 border-black bg-[color-mix(in_srgb,#101010_88%,#1f1f1f)] p-3.5 shadow-[4px_4px_0_rgba(0,0,0,0.45)] sm:p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex min-w-8 items-center justify-center border-2 border-black bg-[var(--mc-net-green)] px-1.5 py-0.5 text-xs font-extrabold text-black">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            disabled={busy || idx === 0}
                            onClick={() => moveCard(idx, -1)}
                            className="lc-focus-ring rounded border border-white/15 p-1.5 disabled:opacity-35"
                            aria-label="Вище"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busy || idx === supportCards.length - 1}
                            onClick={() => moveCard(idx, 1)}
                            className="lc-focus-ring rounded border border-white/15 p-1.5 disabled:opacity-35"
                            aria-label="Нижче"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                          <label className="ml-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[var(--mc-text-muted)]">
                            <input
                              type="checkbox"
                              checked={card.quantity_enabled}
                              onChange={(e) =>
                                setSupportCards((prev) =>
                                  prev.map((c, i) =>
                                    i === idx
                                      ? {
                                          ...c,
                                          quantity_enabled: e.target.checked,
                                        }
                                      : c,
                                  ),
                                )
                              }
                              className="size-3.5 accent-[var(--mc-net-green)]"
                            />
                            Кількість
                          </label>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setSupportCards((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="lc-focus-ring ml-auto rounded border border-rose-500/40 p-1.5 text-rose-200"
                            aria-label="Видалити"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <input
                          value={card.title}
                          onChange={(e) =>
                            setSupportCards((prev) =>
                              prev.map((c, i) =>
                                i === idx
                                  ? { ...c, title: e.target.value }
                                  : c,
                              ),
                            )
                          }
                          placeholder="Заголовок"
                          className="lc-focus-ring mc-input w-full px-2.5 py-2 text-sm"
                        />
                        <textarea
                          value={card.description}
                          onChange={(e) =>
                            setSupportCards((prev) =>
                              prev.map((c, i) =>
                                i === idx
                                  ? { ...c, description: e.target.value }
                                  : c,
                              ),
                            )
                          }
                          placeholder="Опис"
                          rows={3}
                          className="lc-focus-ring mc-input w-full resize-y px-2.5 py-2 text-sm"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          {card.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={card.image_url}
                              alt=""
                              className="size-14 object-cover border border-white/10"
                            />
                          ) : null}
                          <label className="lc-focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-[var(--mc-text)]">
                            <Upload className="size-3.5" />
                            Завантажити фото
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                void onCardImageFile(idx, f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            value={
                              card.image_url.startsWith("data:")
                                ? ""
                                : card.image_url
                            }
                            onChange={(e) =>
                              setSupportCards((prev) =>
                                prev.map((c, i) =>
                                  i === idx
                                    ? { ...c, image_url: e.target.value }
                                    : c,
                                ),
                              )
                            }
                            placeholder="або URL фото"
                            className="lc-focus-ring mc-input px-2.5 py-2 text-sm"
                          />
                          <input
                            value={card.price_label}
                            onChange={(e) =>
                              setSupportCards((prev) =>
                                prev.map((c, i) =>
                                  i === idx
                                    ? { ...c, price_label: e.target.value }
                                    : c,
                                ),
                              )
                            }
                            placeholder="Ціна (25 ₴)"
                            className="lc-focus-ring mc-input px-2.5 py-2 text-sm"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setSupportCards((prev) => [
                          ...prev,
                          {
                            key: newCardKey(),
                            title: "",
                            description: "",
                            image_url: "/support-gold-pile.png",
                            price_label: "",
                            button_url: "",
                            quantity_enabled: true,
                          },
                        ])
                      }
                      className="lc-focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-sm font-bold text-[var(--mc-text)]"
                    >
                      <Plus className="size-4" />
                      Додати товар
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveSupportCards()}
                      className="lc-focus-ring lc-btn-accent px-4 py-2.5 text-sm disabled:opacity-50"
                    >
                      Зберегти товари
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "voting" ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--mc-text-muted)]">
                  Пункти голосування на сайтах, де рекламуємо сервер (головна →
                  блок підтримки).
                </p>
                {support.catalogLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 rounded-lg border border-white/10 p-3 sm:grid-cols-3"
                  >
                    <input
                      value={link.label}
                      onChange={(e) =>
                        setSupport((prev) => ({
                          ...prev,
                          catalogLinks: prev.catalogLinks.map((l, i) =>
                            i === idx ? { ...l, label: e.target.value } : l,
                          ),
                        }))
                      }
                      placeholder="Назва"
                      className="lc-focus-ring mc-input px-2 py-1.5 text-sm"
                    />
                    <input
                      value={link.shortLabel}
                      onChange={(e) =>
                        setSupport((prev) => ({
                          ...prev,
                          catalogLinks: prev.catalogLinks.map((l, i) =>
                            i === idx
                              ? { ...l, shortLabel: e.target.value }
                              : l,
                          ),
                        }))
                      }
                      placeholder="Коротка"
                      className="lc-focus-ring mc-input px-2 py-1.5 text-sm"
                    />
                    <input
                      value={link.href}
                      onChange={(e) =>
                        setSupport((prev) => ({
                          ...prev,
                          catalogLinks: prev.catalogLinks.map((l, i) =>
                            i === idx ? { ...l, href: e.target.value } : l,
                          ),
                        }))
                      }
                      placeholder="URL"
                      className="lc-focus-ring mc-input px-2 py-1.5 text-sm sm:col-span-3"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setSupport((prev) => ({
                          ...prev,
                          catalogLinks: prev.catalogLinks.filter(
                            (_, i) => i !== idx,
                          ),
                        }))
                      }
                      className="lc-focus-ring inline-flex items-center gap-1 justify-self-start rounded border border-rose-500/40 px-2 py-1 text-xs font-bold text-rose-200 sm:col-span-3"
                    >
                      <Trash2 className="size-3.5" />
                      Видалити
                    </button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setSupport((prev) => ({
                        ...prev,
                        catalogLinks: [
                          ...prev.catalogLinks,
                          { href: "", label: "", shortLabel: "" },
                        ],
                      }))
                    }
                    className="lc-focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-sm font-bold text-[var(--mc-text)]"
                  >
                    <Plus className="size-4" />
                    Додати пункт
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveSettings("voting")}
                    className="lc-focus-ring lc-btn-accent px-4 py-2.5 text-sm disabled:opacity-50"
                  >
                    Зберегти голосування
                  </button>
                </div>
              </div>
            ) : null}

            {tab === "admins" ? (
              <ul className="space-y-2">
                {users.map((u) => {
                  const label = u.game_nickname || u.username;
                  return (
                    <li
                      key={u.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--mc-text)]">
                          {label}
                        </p>
                        <p className="text-[11px] text-[var(--mc-text-muted)]">
                          {u.role === "admin" ? "Адмін" : "Гравець"}
                          {u.game_nickname
                            ? ` · oauth: ${u.username}`
                            : null}
                        </p>
                      </div>
                      {u.role === "admin" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void setRole(u.id, "user")}
                          className="lc-focus-ring rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-xs font-bold text-rose-100 disabled:opacity-50"
                        >
                          Зняти адміна
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void setRole(u.id, "admin")}
                          className="lc-focus-ring rounded-lg border border-[var(--mc-net-green)]/40 px-2.5 py-1.5 text-xs font-bold text-[var(--mc-net-green)] disabled:opacity-50"
                        >
                          Зробити адміном
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </SoftAppear>
      </div>
    </main>
  );
}
