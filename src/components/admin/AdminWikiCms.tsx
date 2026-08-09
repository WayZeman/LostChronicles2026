"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { WikiPageEditor } from "@/components/wiki/WikiPageEditor";
import type {
  WikiCategoryDetail,
  WikiHomeTree,
  WikiSocialLink,
} from "@/lib/wiki-structure";
import { cn } from "@/lib/utils";

type View =
  | { kind: "home" }
  | { kind: "category"; categoryId: number; slug: string }
  | { kind: "page"; slug: string; categorySlug?: string };

type SocialDraft = WikiSocialLink;

export function AdminWikiCms() {
  const [tree, setTree] = useState<WikiHomeTree | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const [category, setCategory] = useState<WikiCategoryDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newCatTitle, setNewCatTitle] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageCode, setNewPageCode] = useState("");

  const [pageTitle, setPageTitle] = useState("");
  const [pageHtml, setPageHtml] = useState("");
  const [pageSummary, setPageSummary] = useState("");
  const [pageSocial, setPageSocial] = useState<SocialDraft[]>([]);
  const [pageSlug, setPageSlug] = useState("");

  const loadTree = useCallback(async () => {
    const res = await fetch("/api/admin/wiki/structure", {
      credentials: "include",
    });
    const d = (await res.json()) as { tree?: WikiHomeTree; error?: string };
    if (!res.ok) throw new Error(d.error || "Не вдалося завантажити");
    setTree(d.tree ?? { sections: [] });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadTree().catch((e) =>
        setErr(e instanceof Error ? e.message : "Помилка"),
      );
    });
    return () => cancelAnimationFrame(id);
  }, [loadTree]);

  async function openCategory(categoryId: number, slug: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/wiki/categories/${categoryId}`, {
        credentials: "include",
      });
      const d = (await res.json()) as {
        category?: WikiCategoryDetail;
        error?: string;
      };
      if (!res.ok || !d.category) {
        setErr(d.error || "Не вдалося відкрити блок");
        setBusy(false);
        return;
      }
      setCategory(d.category);
      setView({ kind: "category", categoryId, slug });
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function openPage(slug: string, categorySlug?: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/wiki/pages/${encodeURIComponent(slug)}`, {
        credentials: "include",
      });
      const d = (await res.json()) as {
        page?: {
          slug: string;
          title: string;
          content_html: string;
          summary?: string;
          social_links?: SocialDraft[];
        };
        error?: string;
      };
      if (!res.ok || !d.page) {
        setErr(d.error || "Сторінку не знайдено");
        setBusy(false);
        return;
      }
      setPageSlug(d.page.slug);
      setPageTitle(d.page.title);
      setPageHtml(d.page.content_html);
      setPageSummary(d.page.summary ?? "");
      setPageSocial(d.page.social_links ?? []);
      setView({ kind: "page", slug: d.page.slug, categorySlug });
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function createSection() {
    if (!newSectionTitle.trim()) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/wiki/structure", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_section",
          title: newSectionTitle.trim(),
        }),
      });
      const d = (await res.json()) as { tree?: WikiHomeTree; error?: string };
      if (!res.ok) {
        setErr(d.error || "Помилка");
        setBusy(false);
        return;
      }
      if (d.tree) setTree(d.tree);
      setNewSectionTitle("");
      setMsg("Розділ створено.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function createCategory(sectionId: number) {
    if (!newCatTitle.trim()) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/wiki/structure", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_category",
          section_id: sectionId,
          title: newCatTitle.trim(),
          description: newCatDesc.trim(),
        }),
      });
      const d = (await res.json()) as { tree?: WikiHomeTree; error?: string };
      if (!res.ok) {
        setErr(d.error || "Помилка");
        setBusy(false);
        return;
      }
      if (d.tree) setTree(d.tree);
      setNewCatTitle("");
      setNewCatDesc("");
      setMsg("Блок (категорію) створено.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function createPageInCategory() {
    if (view.kind !== "category" || !newPageTitle.trim()) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/admin/wiki/categories/${view.categoryId}/pages`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "create",
            title: newPageTitle.trim(),
            short_code: newPageCode.trim(),
            content_html: `<p></p>`,
          }),
        },
      );
      const d = (await res.json()) as {
        category?: WikiCategoryDetail;
        error?: string;
      };
      if (!res.ok) {
        setErr(d.error || "Помилка");
        setBusy(false);
        return;
      }
      if (d.category) setCategory(d.category);
      setNewPageTitle("");
      setNewPageCode("");
      setMsg("Сторінку додано до блоку.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function savePage() {
    if (view.kind !== "page") return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/wiki/pages/${encodeURIComponent(pageSlug)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: pageTitle,
            content_html: pageHtml,
            summary: pageSummary,
            social_links: pageSocial,
          }),
        },
      );
      const d = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(d.error || "Не вдалося зберегти");
        setBusy(false);
        return;
      }
      setMsg("Сторінку збережено.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function deleteSection(id: number) {
    if (!window.confirm("Видалити розділ і всі його блоки?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/wiki/sections/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const d = (await res.json()) as { tree?: WikiHomeTree; error?: string };
      if (!res.ok) {
        setErr(d.error || "Помилка");
        setBusy(false);
        return;
      }
      if (d.tree) setTree(d.tree);
      setMsg("Розділ видалено.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function removePageLink(linkId: number) {
    if (!window.confirm("Прибрати сторінку з цього блоку?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/wiki/category-pages/${linkId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setErr("Не вдалося прибрати");
        setBusy(false);
        return;
      }
      if (view.kind === "category") {
        await openCategory(view.categoryId, view.slug);
      }
      setMsg("Прибрано з блоку.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  function addSocial() {
    setPageSocial((prev) => [
      ...prev,
      { kind: "telegram", label: "Telegram", url: "" },
    ]);
  }

  if (!tree) {
    return (
      <p className="text-sm text-[var(--mc-text-muted)]">Завантаження вікі…</p>
    );
  }

  return (
    <div className="space-y-4">
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

      {view.kind === "home" ? (
        <div className="space-y-6">
          <p className="text-sm text-[var(--mc-text-muted)]">
            Редагування структури вікі: розділи → блоки (напр. Держави) →
            сторінки (напр. Домініон Земана). Публічна вкладка «Вікі» показує
            цю структуру в стилі сайту.
          </p>

          <div className="flex flex-wrap gap-2">
            <input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Новий розділ (напр. Основні розділи світу)"
              className="lc-focus-ring min-w-[14rem] flex-1 rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-[var(--mc-text)]"
            />
            <button
              type="button"
              disabled={busy || !newSectionTitle.trim()}
              onClick={() => void createSection()}
              className="lc-focus-ring inline-flex items-center gap-1 rounded-lg border border-[var(--mc-net-green)]/40 bg-[var(--mc-net-green)]/15 px-3 py-2 text-xs font-bold text-[var(--mc-net-green)] disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              Розділ
            </button>
            <Link
              href="/wiki"
              className="lc-focus-ring rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-[var(--mc-text)]"
            >
              Відкрити вікі
            </Link>
          </div>

          {tree.sections.map((section) => (
            <div
              key={section.id}
              className="space-y-3 rounded-xl border border-white/12 bg-black/25 p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-[var(--mc-text)]">
                    {section.title}
                  </h3>
                  {section.description ? (
                    <p className="mt-0.5 text-xs text-[var(--mc-text-muted)]">
                      {section.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteSection(section.id)}
                  className="lc-focus-ring rounded-lg border border-rose-500/30 p-1.5 text-rose-100 disabled:opacity-50"
                  title="Видалити розділ"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {section.categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void openCategory(cat.id, cat.slug)}
                    className={cn(
                      "lc-focus-ring flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-left transition",
                      "hover:border-[var(--mc-net-green)]/35",
                    )}
                  >
                    <span>
                      <span className="block text-sm font-bold text-[var(--mc-text)]">
                        {cat.title}
                      </span>
                      {cat.description ? (
                        <span className="mt-0.5 line-clamp-2 block text-[11px] text-[var(--mc-text-muted)]">
                          {cat.description}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-[var(--mc-text-muted)]" />
                  </button>
                ))}
              </div>

              <div className="space-y-2 border-t border-white/10 pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Новий блок у цьому розділі
                </p>
                <input
                  value={newCatTitle}
                  onChange={(e) => setNewCatTitle(e.target.value)}
                  placeholder="Назва блоку (Держави, Міста…)"
                  className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-[var(--mc-text)]"
                />
                <input
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Короткий опис для картки"
                  className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-[var(--mc-text)]"
                />
                <button
                  type="button"
                  disabled={busy || !newCatTitle.trim()}
                  onClick={() => void createCategory(section.id)}
                  className="lc-focus-ring rounded-lg border border-sky-400/40 px-3 py-1.5 text-xs font-bold text-sky-200 disabled:opacity-50"
                >
                  Додати блок
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {view.kind === "category" && category ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setView({ kind: "home" });
              setCategory(null);
            }}
            className="lc-focus-ring inline-flex items-center gap-1.5 text-xs font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
          >
            <ArrowLeft className="size-3.5" />
            До структури
          </button>

          <header>
            <p className="text-[11px] font-bold uppercase text-[var(--mc-text-muted)]">
              {category.section_title}
            </p>
            <h3 className="text-lg font-black text-[var(--mc-text)]">
              {category.title}
            </h3>
            <p className="text-sm text-[var(--mc-text-muted)]">
              {category.description || "Реєстр сторінок цього блоку"}
            </p>
          </header>

          <ul className="space-y-2">
            {category.pages.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"
              >
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void openPage(p.page_slug, category.slug)}
                  className="lc-focus-ring min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-bold text-[var(--mc-text)]">
                    {p.page_title}
                    {p.short_code ? (
                      <span className="ml-2 text-[10px] font-bold text-[var(--mc-text-muted)]">
                        ({p.short_code})
                      </span>
                    ) : null}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removePageLink(p.id)}
                  className="lc-focus-ring rounded-lg border border-rose-500/30 px-2 py-1 text-[11px] font-bold text-rose-100"
                >
                  Прибрати
                </button>
              </li>
            ))}
          </ul>

          <div className="space-y-2 rounded-xl border border-dashed border-white/15 p-3">
            <p className="text-xs font-bold text-[var(--mc-text-muted)]">
              Додати нову сторінку до переліку
            </p>
            <input
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Назва (Домініон Земана)"
              className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-[var(--mc-text)]"
            />
            <input
              value={newPageCode}
              onChange={(e) => setNewPageCode(e.target.value)}
              placeholder="Код (ДЗ) — опційно"
              className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-[var(--mc-text)]"
            />
            <button
              type="button"
              disabled={busy || !newPageTitle.trim()}
              onClick={() => void createPageInCategory()}
              className="lc-focus-ring inline-flex items-center gap-1 rounded-lg border border-[var(--mc-net-green)]/40 px-3 py-1.5 text-xs font-bold text-[var(--mc-net-green)] disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              Створити й додати
            </button>
          </div>
        </div>
      ) : null}

      {view.kind === "page" ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              if (view.categorySlug && category) {
                setView({
                  kind: "category",
                  categoryId: category.id,
                  slug: category.slug,
                });
              } else {
                setView({ kind: "home" });
              }
            }}
            className="lc-focus-ring inline-flex items-center gap-1.5 text-xs font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
          >
            <ArrowLeft className="size-3.5" />
            Назад
          </button>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Назва
            </span>
            <input
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-[var(--mc-text)]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Короткий опис
            </span>
            <input
              value={pageSummary}
              onChange={(e) => setPageSummary(e.target.value)}
              className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-[var(--mc-text)]"
            />
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                Кнопки соцмереж / посилання
              </span>
              <button
                type="button"
                onClick={addSocial}
                className="lc-focus-ring text-[11px] font-bold text-[var(--mc-net-green)]"
              >
                + Додати
              </button>
            </div>
            {pageSocial.map((s, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-lg border border-white/10 p-2 sm:grid-cols-[7rem_1fr_1fr_auto]"
              >
                <select
                  value={s.kind}
                  onChange={(e) => {
                    const kind = e.target.value as SocialDraft["kind"];
                    setPageSocial((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, kind } : x)),
                    );
                  }}
                  className="lc-focus-ring rounded-md border border-white/12 bg-black/40 px-2 py-1.5 text-xs text-[var(--mc-text)]"
                >
                  <option value="telegram">Telegram</option>
                  <option value="discord">Discord</option>
                  <option value="youtube">YouTube</option>
                  <option value="website">Сайт</option>
                  <option value="other">Інше</option>
                </select>
                <input
                  value={s.label}
                  onChange={(e) =>
                    setPageSocial((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="Підпис"
                  className="lc-focus-ring rounded-md border border-white/12 bg-black/40 px-2 py-1.5 text-xs text-[var(--mc-text)]"
                />
                <input
                  value={s.url}
                  onChange={(e) =>
                    setPageSocial((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, url: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="https://…"
                  className="lc-focus-ring rounded-md border border-white/12 bg-black/40 px-2 py-1.5 text-xs text-[var(--mc-text)]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPageSocial((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="lc-focus-ring rounded-md border border-rose-500/30 px-2 text-rose-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-[var(--mc-text-muted)]">
              Вміст (текст / HTML)
            </span>
            <WikiPageEditor value={pageHtml} onChange={setPageHtml} disabled={busy} />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void savePage()}
            className="lc-focus-ring rounded-lg border border-[var(--mc-net-green)]/40 bg-[var(--mc-net-green)]/15 px-4 py-2 text-sm font-bold text-[var(--mc-net-green)] disabled:opacity-50"
          >
            {busy ? "Збереження…" : "Зберегти сторінку"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
