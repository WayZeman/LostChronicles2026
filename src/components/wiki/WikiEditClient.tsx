"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { WikiPageEditor } from "@/components/wiki/WikiPageEditor";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import { cn } from "@/lib/utils";

type Props = {
  mode: "create" | "edit";
  initialSlug?: string;
  initialTitle?: string;
  initialHtml?: string;
};

export function WikiEditClient({
  mode,
  initialSlug = "",
  initialTitle = "",
  initialHtml = "",
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [html, setHtml] = useState(initialHtml);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const d = (await res.json()) as {
          user?: { canEditWiki?: boolean } | null;
        };
        if (!cancelled) setAllowed(Boolean(d.user?.canEditWiki));
      } catch {
        if (!cancelled) setAllowed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "create") {
        const res = await fetch("/api/wiki/pages", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            slug: slug.trim() || undefined,
            content_html: html,
          }),
        });
        const d = (await res.json()) as {
          error?: string;
          page?: { slug: string };
        };
        if (!res.ok) {
          setErr(d.error || "Не вдалося створити");
          setBusy(false);
          return;
        }
        const nextSlug = d.page?.slug;
        if (nextSlug) {
          router.push(`/wiki/${encodeURIComponent(nextSlug)}`);
          router.refresh();
          return;
        }
      } else {
        const res = await fetch(
          `/api/wiki/pages/${encodeURIComponent(initialSlug)}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              content_html: html,
            }),
          },
        );
        const d = (await res.json()) as {
          error?: string;
          page?: { slug: string };
        };
        if (!res.ok) {
          setErr(d.error || "Не вдалося зберегти");
          setBusy(false);
          return;
        }
        setMsg("Збережено.");
        const nextSlug = d.page?.slug ?? initialSlug;
        router.push(`/wiki/${encodeURIComponent(nextSlug)}`);
        router.refresh();
        return;
      }
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function remove() {
    if (mode !== "edit") return;
    if (!window.confirm("Видалити цю сторінку вікі?")) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/wiki/pages/${encodeURIComponent(initialSlug)}`,
        { method: "DELETE", credentials: "include" },
      );
      const d = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(d.error || "Не вдалося видалити");
        setBusy(false);
        return;
      }
      router.push("/wiki");
      router.refresh();
    } catch {
      setErr("Мережа недоступна");
      setBusy(false);
    }
  }

  if (allowed === null) {
    return (
      <main className={lcPageMainClass}>
        <div className={lcPageContainerClass}>
          <p className="text-sm text-[var(--mc-text-muted)]">Перевірка доступу…</p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className={lcPageMainClass}>
        <div className={lcPageContainerClass}>
          <div className={cn(lcGlassPanelClass, "p-6 text-center")}>
            <p className="text-sm text-[var(--mc-text)]">
              Редагувати вікі можуть лише адміністратори та вікі-редактори.
            </p>
            <Link
              href="/wiki"
              className="mt-4 inline-block text-sm font-bold text-[var(--mc-net-green)]"
            >
              Назад до вікі
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={
              mode === "edit"
                ? `/wiki/${encodeURIComponent(initialSlug)}`
                : "/wiki"
            }
            className="lc-focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Назад
          </Link>
          <h1 className="text-lg font-black text-[var(--mc-text)]">
            {mode === "create" ? "Нова стаття вікі" : "Редагування статті"}
          </h1>
        </div>

        <div className={cn(lcGlassPanelClass, "space-y-4 p-4 sm:p-5")}>
          {msg ? (
            <p className="text-sm text-emerald-200" role="status">
              {msg}
            </p>
          ) : null}
          {err ? (
            <p className="text-sm text-rose-300" role="alert">
              {err}
            </p>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Назва
            </span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (mode === "create" && !slug) {
                  /* slug auto from title on save */
                }
              }}
              disabled={busy}
              className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-[var(--mc-text)]"
              placeholder="Назва сторінки"
            />
          </label>

          {mode === "create" ? (
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                Slug (URL) — опційно
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "_"))}
                disabled={busy}
                className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 font-mono text-sm text-[var(--mc-text)]"
                placeholder="Авто з назви, напр. Історія_проєкту"
              />
            </label>
          ) : (
            <p className="text-xs text-[var(--mc-text-muted)]">
              URL:{" "}
              <span className="font-mono text-[var(--mc-text)]">
                /wiki/{initialSlug}
              </span>
            </p>
          )}

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Вміст
            </span>
            <WikiPageEditor value={html} onChange={setHtml} disabled={busy} />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy || !title.trim()}
              onClick={() => void save()}
              className="lc-focus-ring rounded-lg border border-[var(--mc-net-green)]/40 bg-[var(--mc-net-green)]/15 px-4 py-2 text-sm font-bold text-[var(--mc-net-green)] disabled:opacity-50"
            >
              {busy ? "Збереження…" : "Зберегти"}
            </button>
            {mode === "edit" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="lc-focus-ring rounded-lg border border-rose-500/30 px-4 py-2 text-sm font-bold text-rose-100 disabled:opacity-50"
              >
                Видалити
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
