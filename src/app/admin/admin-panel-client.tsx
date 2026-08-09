"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Ban, Clock, ExternalLink, Plus, Trash2, Upload } from "lucide-react";
import { FaqRichEditor } from "@/components/admin/FaqRichEditor";
import { SoftAppear } from "@/components/site/SoftAppear";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { compressImageFile } from "@/lib/compress-image";
import { proposalKindLabelUk, type ProposalKind } from "@/lib/proposal-kinds";
import {
  formatTimeRemainingUk,
  isProposalVotingOpenClient,
} from "@/lib/proposal-ui";
import {
  normalizePriceTiers,
  summarizePriceLabel,
  type SupportPriceTier,
} from "@/lib/support-price-tiers";
import { cn } from "@/lib/utils";
import "@/components/proposals/proposal-vote.css";

type Tab = "faq" | "connect" | "support" | "voting" | "proposals" | "admins";

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
  price_tiers: SupportPriceTier[];
  button_url: string;
  quantity_enabled: boolean;
};

type AdminUser = {
  id: number;
  username: string;
  game_nickname: string | null;
  role: "user" | "admin";
};

type AdminProposal = {
  id: number;
  title: string;
  description: string;
  kind: string;
  status: string;
  cancel_reason: string | null;
  created_at: string;
  ends_at: string;
  author_username: string;
  yes_votes: number;
  no_votes: number;
  total_votes: number;
  voting_open: boolean;
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
  const [proposals, setProposals] = useState<AdminProposal[]>([]);
  const [cancelReasons, setCancelReasons] = useState<Record<number, string>>(
    {},
  );
  const [cancellingId, setCancellingId] = useState<number | null>(null);

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

      const [faqRes, settingsRes, cardsRes, usersRes, proposalsRes] =
        await Promise.all([
          fetch("/api/admin/faq", { credentials: "include" }),
          fetch("/api/admin/settings", { credentials: "include" }),
          fetch("/api/admin/support-cards", { credentials: "include" }),
          fetch("/api/admin/users", { credentials: "include" }),
          fetch("/api/admin/proposals", { credentials: "include" }),
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
            price_tiers?: SupportPriceTier[];
            button_url: string;
            quantity_enabled?: boolean;
          }[];
        };
        setSupportCards(
          (d.items ?? []).map((i) => {
            const tiers = normalizePriceTiers(i.price_tiers ?? []);
            return {
              key: newCardKey(),
              title: i.title,
              description: i.description,
              image_url: i.image_url,
              price_tiers:
                tiers.length > 0
                  ? tiers
                  : i.price_label.trim()
                    ? [{ label: "", price_label: i.price_label.trim() }]
                    : [{ label: "", price_label: "" }],
              button_url: i.button_url ?? "",
              quantity_enabled: i.quantity_enabled !== false,
            };
          }),
        );
      }
      if (usersRes.ok) {
        const d = (await usersRes.json()) as { users: AdminUser[] };
        setUsers(d.users ?? []);
      }
      if (proposalsRes.ok) {
        const d = (await proposalsRes.json()) as {
          proposals: AdminProposal[];
        };
        setProposals(d.proposals ?? []);
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

  async function uploadCardImage(dataUrl: string): Promise<string> {
    const res = await fetch("/api/admin/media", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    const d = (await res.json()) as { error?: string; url?: string };
    if (!res.ok || !d.url) {
      throw new Error(d.error || "Не вдалося завантажити фото");
    }
    return d.url;
  }

  async function saveSupportCards() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      // Старі data URL у БД / локальному стейті — виносимо по одному, щоб PUT не впирався в ліміт тіла.
      const resolvedUrls: string[] = [];
      for (const card of supportCards) {
        if (card.image_url.startsWith("data:")) {
          resolvedUrls.push(await uploadCardImage(card.image_url));
        } else {
          resolvedUrls.push(card.image_url);
        }
      }

      const payload = supportCards.map(
        (
          { title, description, price_tiers, button_url, quantity_enabled },
          i,
        ) => ({
          title,
          description,
          image_url: resolvedUrls[i]!,
          price_tiers: normalizePriceTiers(price_tiers),
          price_label: summarizePriceLabel(normalizePriceTiers(price_tiers)),
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
          price_tiers?: SupportPriceTier[];
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
          d.items.map((i, idx) => {
            const tiers = normalizePriceTiers(i.price_tiers ?? []);
            return {
              key: supportCards[idx]?.key ?? newCardKey(),
              title: i.title,
              description: i.description,
              image_url: i.image_url,
              price_tiers:
                tiers.length > 0
                  ? tiers
                  : i.price_label.trim()
                    ? [{ label: "", price_label: i.price_label.trim() }]
                    : [{ label: "", price_label: "" }],
              button_url: i.button_url ?? "",
              quantity_enabled: i.quantity_enabled !== false,
            };
          }),
        );
      }
      setMsg("Картки підтримки збережено.");
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Мережа недоступна",
      );
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

  async function cancelProposal(proposalId: number) {
    const reason = (cancelReasons[proposalId] ?? "").trim();
    if (!reason) {
      setErr("Вкажи причину скасування в полі примітки.");
      setMsg(null);
      return;
    }
    setCancellingId(proposalId);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const d = (await res.json()) as {
        error?: string;
        cancel_reason?: string;
      };
      if (!res.ok) {
        setErr(d.error || "Не вдалося скасувати пропозицію");
        setCancellingId(null);
        return;
      }
      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? {
                ...p,
                status: "cancelled",
                voting_open: false,
                cancel_reason: d.cancel_reason ?? reason,
              }
            : p,
        ),
      );
      setCancelReasons((prev) => {
        const next = { ...prev };
        delete next[proposalId];
        return next;
      });
      setMsg("Пропозицію скасовано. Сповіщення надіслано в Telegram і Discord.");
    } catch {
      setErr("Мережа недоступна");
    }
    setCancellingId(null);
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
    { id: "proposals", label: "Пропозиції" },
    { id: "admins", label: "Адміни" },
  ];

  async function onCardImageFile(idx: number, file: File | null) {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const dataUrl = await compressImageFile(file);
      const url = await uploadCardImage(dataUrl);
      setSupportCards((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, image_url: url } : c)),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не вдалося завантажити фото");
    }
    setBusy(false);
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
              FAQ, підключення, підтримка, пропозиції та призначення адмінів.
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
                            className="lc-focus-ring mc-input px-2.5 py-2 text-sm sm:col-span-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--mc-text-muted)]">
                              Ціни / варіанти
                            </p>
                            <button
                              type="button"
                              disabled={busy || card.price_tiers.length >= 12}
                              onClick={() =>
                                setSupportCards((prev) =>
                                  prev.map((c, i) =>
                                    i === idx
                                      ? {
                                          ...c,
                                          price_tiers: [
                                            ...c.price_tiers,
                                            {
                                              label:
                                                c.price_tiers.length === 0
                                                  ? ""
                                                  : "Новий варіант",
                                              price_label: "",
                                            },
                                          ],
                                        }
                                      : c,
                                  ),
                                )
                              }
                              className="lc-focus-ring inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[11px] font-bold text-[var(--mc-text)] disabled:opacity-40"
                            >
                              <Plus className="size-3" />
                              Додати ціну
                            </button>
                          </div>
                          {card.price_tiers.map((tier, tIdx) => (
                            <div
                              key={tIdx}
                              className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]"
                            >
                              <input
                                value={tier.label}
                                onChange={(e) =>
                                  setSupportCards((prev) =>
                                    prev.map((c, i) =>
                                      i === idx
                                        ? {
                                            ...c,
                                            price_tiers: c.price_tiers.map(
                                              (t, j) =>
                                                j === tIdx
                                                  ? {
                                                      ...t,
                                                      label: e.target.value,
                                                    }
                                                  : t,
                                            ),
                                          }
                                        : c,
                                    ),
                                  )
                                }
                                placeholder={
                                  card.price_tiers.length > 1
                                    ? "Назва (Рідкісна / Епічна…)"
                                    : "Назва варіанту (опційно)"
                                }
                                className="lc-focus-ring mc-input px-2.5 py-2 text-sm"
                              />
                              <input
                                value={tier.price_label}
                                onChange={(e) =>
                                  setSupportCards((prev) =>
                                    prev.map((c, i) =>
                                      i === idx
                                        ? {
                                            ...c,
                                            price_tiers: c.price_tiers.map(
                                              (t, j) =>
                                                j === tIdx
                                                  ? {
                                                      ...t,
                                                      price_label:
                                                        e.target.value,
                                                    }
                                                  : t,
                                            ),
                                          }
                                        : c,
                                    ),
                                  )
                                }
                                placeholder="20 ₴"
                                className="lc-focus-ring mc-input px-2.5 py-2 text-sm"
                              />
                              <button
                                type="button"
                                disabled={
                                  busy || card.price_tiers.length <= 1
                                }
                                onClick={() =>
                                  setSupportCards((prev) =>
                                    prev.map((c, i) =>
                                      i === idx
                                        ? {
                                            ...c,
                                            price_tiers: c.price_tiers.filter(
                                              (_, j) => j !== tIdx,
                                            ),
                                          }
                                        : c,
                                    ),
                                  )
                                }
                                className="lc-focus-ring inline-flex items-center justify-center rounded border border-rose-500/40 px-2 py-2 text-rose-200 disabled:opacity-35"
                                aria-label="Прибрати ціну"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          ))}
                          {card.price_tiers.length > 1 ? (
                            <p className="text-[11px] text-[var(--mc-text-muted)]">
                              На вітрині:{" "}
                              {summarizePriceLabel(
                                normalizePriceTiers(card.price_tiers),
                              ) || "—"}{" "}
                              · при «У кошик» гравець обере варіант
                            </p>
                          ) : null}
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
                            price_tiers: [{ label: "", price_label: "" }],
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

            {tab === "proposals" ? (
              <div className="space-y-4">
                {(() => {
                  const activeList = proposals.filter(
                    (p) =>
                      p.status === "active" ||
                      isProposalVotingOpenClient(p.status, p.ends_at),
                  );
                  const cancelledAdmin = proposals.filter(
                    (p) =>
                      p.status === "cancelled" && Boolean(p.cancel_reason),
                  );
                  return (
                    <>
                      <div className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
                        <div className="border-b-2 border-black bg-[#143d10] px-3.5 py-2">
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--mc-grass-bright)]">
                            Модерація голосувань
                          </p>
                        </div>
                        <div className="flex flex-col gap-3 bg-[color-mix(in_srgb,var(--mc-surface)_92%,#000)] p-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-4">
                          <div className="min-w-0">
                            <h2 className="text-base font-black tracking-tight text-[var(--mc-text)] sm:text-xl">
                              Пропозиції гравців
                            </h2>
                            <p className="mt-1 max-w-md text-xs leading-relaxed text-[var(--mc-text-muted)]">
                              Скасування з причиною → Telegram і Discord.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <div className="min-w-0 flex-1 border-2 border-black bg-black/40 px-2 py-1.5 text-center sm:min-w-[4.5rem] sm:flex-none sm:px-2.5">
                              <p className="text-lg font-black tabular-nums text-[var(--mc-grass-bright)] sm:text-xl">
                                {activeList.length}
                              </p>
                              <p className="text-[9px] font-black uppercase tracking-wide text-[var(--mc-text-muted)]">
                                активні
                              </p>
                            </div>
                            <div className="min-w-0 flex-1 border-2 border-black bg-black/40 px-2 py-1.5 text-center sm:min-w-[4.5rem] sm:flex-none sm:px-2.5">
                              <p className="text-lg font-black tabular-nums text-[#f87171] sm:text-xl">
                                {cancelledAdmin.length}
                              </p>
                              <p className="text-[9px] font-black uppercase tracking-wide text-[var(--mc-text-muted)]">
                                скасовані
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {activeList.length === 0 ? (
                        <div className="border-2 border-dashed border-black/70 bg-black/25 px-4 py-10 text-center">
                          <Ban
                            className="mx-auto size-8 text-[var(--mc-text-muted)] opacity-40"
                            aria-hidden
                          />
                          <p className="mt-3 text-sm text-[var(--mc-text-muted)]">
                            Немає активних пропозицій для модерації.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-4">
                          {activeList.map((p) => {
                            const open = isProposalVotingOpenClient(
                              p.status,
                              p.ends_at,
                            );
                            const kindLabel = proposalKindLabelUk(
                              (p.kind === "choice"
                                ? "choice"
                                : "yes_no") as ProposalKind,
                            );
                            const reason = cancelReasons[p.id] ?? "";
                            const busyThis = cancellingId === p.id;
                            return (
                              <li
                                key={p.id}
                                className="overflow-hidden border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.45)]"
                              >
                                <div
                                  className={cn(
                                    "flex flex-wrap items-center justify-between gap-2 border-b-2 border-black px-3.5 py-2",
                                    open ? "bg-[#143d10]" : "bg-black/55",
                                  )}
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        "inline-flex items-center border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
                                        open
                                          ? "lc-vote-status-live bg-[#1a5c12] text-[#e8ffe0]"
                                          : "bg-[#2a2a2a] text-[var(--mc-text-muted)]",
                                      )}
                                    >
                                      {open ? "Триває" : "Активна"}
                                    </span>
                                    <span className="border border-black/60 bg-black/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--mc-text-muted)]">
                                      {kindLabel}
                                    </span>
                                  </div>
                                  <Link
                                    href={`/proposals/${p.id}`}
                                    className="lc-focus-ring inline-flex items-center gap-1 border-2 border-black bg-black/35 px-2 py-1 text-[11px] font-black text-[var(--mc-net-green)] hover:bg-black/55"
                                  >
                                    На сайті
                                    <ExternalLink
                                      className="size-3 opacity-80"
                                      aria-hidden
                                    />
                                  </Link>
                                </div>

                                <div className="bg-[color-mix(in_srgb,var(--mc-surface)_92%,#000)] p-3.5 sm:p-4">
                                  <h3 className="text-base font-black leading-snug text-[var(--mc-text)] [overflow-wrap:anywhere] sm:text-lg">
                                    {p.title}
                                  </h3>
                                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--mc-text-muted)]">
                                    <span className="font-semibold text-[var(--mc-text)]/85">
                                      {p.author_username}
                                    </span>
                                    <span className="inline-flex items-center gap-1 tabular-nums font-semibold">
                                      <Clock
                                        className="size-3 opacity-70"
                                        aria-hidden
                                      />
                                      {open
                                        ? formatTimeRemainingUk(p.ends_at)
                                        : "термін вийшов"}
                                    </span>
                                    <span className="tabular-nums font-semibold text-[var(--mc-net-green)]">
                                      {p.total_votes} голосів
                                    </span>
                                  </div>

                                  {p.description.trim() ? (
                                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-[var(--mc-text-muted)] [overflow-wrap:anywhere]">
                                      {p.description}
                                    </p>
                                  ) : null}

                                  <div className="mt-3.5 border-2 border-[#7f1d1d] bg-[#2a0f0f] p-3">
                                    <label className="block space-y-1.5">
                                      <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#fecaca]">
                                        <Ban
                                          className="size-3.5 opacity-90"
                                          aria-hidden
                                        />
                                        Причина скасування
                                      </span>
                                      <textarea
                                        value={reason}
                                        onChange={(e) =>
                                          setCancelReasons((prev) => ({
                                            ...prev,
                                            [p.id]: e.target.value,
                                          }))
                                        }
                                        rows={2}
                                        maxLength={500}
                                        placeholder="Чому скасовуємо цю пропозицію…"
                                        className="lc-focus-ring w-full resize-y border-2 border-black bg-black/50 px-3 py-2 text-sm text-[var(--mc-text)] placeholder:text-[var(--mc-text-muted)]/60"
                                      />
                                    </label>
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                                      <p className="text-[10px] font-semibold text-[var(--mc-text-muted)]">
                                        {reason.trim().length}/500 · Telegram +
                                        Discord
                                      </p>
                                      <button
                                        type="button"
                                        disabled={
                                          busy || busyThis || !reason.trim()
                                        }
                                        onClick={() =>
                                          void cancelProposal(p.id)
                                        }
                                        className="lc-focus-ring inline-flex min-h-11 w-full items-center justify-center gap-1.5 border-2 border-black bg-[#7f1d1d] px-3.5 py-2 text-xs font-black text-[#fecaca] touch-manipulation hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:w-auto"
                                      >
                                        <Trash2
                                          className="size-3.5"
                                          aria-hidden
                                        />
                                        {busyThis
                                          ? "Скасовуємо…"
                                          : "Скасувати"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {cancelledAdmin.length > 0 ? (
                        <div className="space-y-3 pt-2">
                          <div className="border-2 border-black bg-[#4a1515] px-3 py-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#fecaca]">
                              Скасовані адміном
                            </p>
                          </div>
                          <ul className="space-y-2">
                            {cancelledAdmin.slice(0, 8).map((p) => (
                              <li
                                key={`cancelled-${p.id}`}
                                className="border-2 border-black bg-[#2a0f0f] px-3.5 py-3 shadow-[3px_3px_0_rgba(0,0,0,0.4)]"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <p className="min-w-0 flex-1 text-sm font-black text-[var(--mc-text)] [overflow-wrap:anywhere]">
                                    {p.title}
                                  </p>
                                  <Link
                                    href={`/proposals/${p.id}`}
                                    className="shrink-0 text-[11px] font-bold text-[#f87171] hover:underline"
                                  >
                                    відкрити
                                  </Link>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-[#fecaca]/80">
                                  <span className="font-black text-[#fecaca]">
                                    Причина:
                                  </span>{" "}
                                  {p.cancel_reason}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  );
                })()}
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
