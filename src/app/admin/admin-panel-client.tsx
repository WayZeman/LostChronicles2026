"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SoftAppear } from "@/components/site/SoftAppear";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { cn } from "@/lib/utils";

type Tab = "faq" | "connect" | "support" | "admins";

type FaqDraft = { question: string; answer_html: string };

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

type AdminUser = {
  id: number;
  username: string;
  game_nickname: string | null;
  role: "user" | "admin";
};

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

      const [faqRes, settingsRes, usersRes] = await Promise.all([
        fetch("/api/admin/faq", { credentials: "include" }),
        fetch("/api/admin/settings", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
      ]);

      if (faqRes.ok) {
        const d = (await faqRes.json()) as {
          items: { question: string; answer_html: string }[];
        };
        setFaq(
          (d.items ?? []).map((i) => ({
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
      const res = await fetch("/api/admin/faq", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: faq }),
      });
      const d = (await res.json()) as { error?: string; items?: FaqDraft[] };
      if (!res.ok) {
        setErr(d.error || "Помилка збереження FAQ");
        setBusy(false);
        return;
      }
      if (d.items) setFaq(d.items);
      setMsg("FAQ збережено.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function saveSettings(kind: "connect" | "support") {
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
          : "Підтримку збережено.",
      );
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
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
    { id: "admins", label: "Адміни" },
  ];

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
                {faq.map((item, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 rounded-lg border border-white/10 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={busy || faq.length <= 1}
                        onClick={() =>
                          setFaq((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-xs font-bold text-rose-300 hover:underline disabled:opacity-40"
                      >
                        Видалити
                      </button>
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
                      className="lc-focus-ring mc-input w-full px-2.5 py-2 text-sm"
                      placeholder="Питання"
                    />
                    <textarea
                      value={item.answer_html}
                      onChange={(e) =>
                        setFaq((prev) =>
                          prev.map((p, i) =>
                            i === idx
                              ? { ...p, answer_html: e.target.value }
                              : p,
                          ),
                        )
                      }
                      rows={5}
                      className="lc-focus-ring mc-input w-full resize-y px-2.5 py-2 font-mono text-xs"
                      placeholder="Відповідь (HTML)"
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
                        { question: "", answer_html: "<p></p>" },
                      ])
                    }
                    className="lc-focus-ring rounded-lg border border-white/15 px-3 py-2 text-xs font-bold"
                  >
                    + Пункт FAQ
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
                  Текст під заголовком
                  <input
                    value={support.blurb}
                    onChange={(e) =>
                      setSupport((prev) => ({ ...prev, blurb: e.target.value }))
                    }
                    className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm font-normal text-[var(--mc-text)]"
                  />
                </label>
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
                <p className="text-xs font-semibold text-[var(--mc-text-muted)]">
                  Каталоги для голосування
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
                  </div>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveSettings("support")}
                  className="lc-focus-ring lc-btn-accent px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Зберегти підтримку
                </button>
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
