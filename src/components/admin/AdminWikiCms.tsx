"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { WikiPageEditor } from "@/components/wiki/WikiPageEditor";
import { WikiHomeStructured } from "@/components/wiki/WikiHomeStructured";
import { WikiCategoryView } from "@/components/wiki/WikiCategoryView";
import type {
  WikiCategoryDetail,
  WikiCategoryPageRow,
  WikiCategoryRow,
  WikiHomeTree,
  WikiSocialLink,
} from "@/lib/wiki-structure";
import { compressImageFile } from "@/lib/compress-image";
import { cn } from "@/lib/utils";

type View =
  | { kind: "home" }
  | { kind: "category"; categoryId: number; slug: string }
  | { kind: "page"; slug: string; fromCategory?: boolean };

type SocialDraft = WikiSocialLink;

const btnSm =
  "lc-focus-ring rounded-lg border px-2.5 py-1 text-[11px] font-bold disabled:opacity-50";

export function AdminWikiCms() {
  const [tree, setTree] = useState<WikiHomeTree | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const [category, setCategory] = useState<WikiCategoryDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDesc, setNewSectionDesc] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [addingCatFor, setAddingCatFor] = useState<number | null>(null);
  const [newCatTitle, setNewCatTitle] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [addingPage, setAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageCode, setNewPageCode] = useState("");

  const [pageTitle, setPageTitle] = useState("");
  const [pageHtml, setPageHtml] = useState("");
  const [pageSummary, setPageSummary] = useState("");
  const [pageSocial, setPageSocial] = useState<SocialDraft[]>([]);
  const [pageSlug, setPageSlug] = useState("");
  const [editingPage, setEditingPage] = useState(false);
  const cardPhotoInputRef = useRef<HTMLInputElement>(null);
  const cardPhotoLinkIdRef = useRef<number | null>(null);

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

  async function openCategory(cat: WikiCategoryRow) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/wiki/categories/${cat.id}`, {
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
      setView({ kind: "category", categoryId: cat.id, slug: cat.slug });
      setAddingPage(false);
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function openPage(page: WikiCategoryPageRow) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/wiki/pages/${encodeURIComponent(page.page_slug)}`,
        { credentials: "include" },
      );
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
      setEditingPage(true);
      setView({ kind: "page", slug: d.page.slug, fromCategory: true });
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
          description: newSectionDesc.trim(),
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
      setNewSectionDesc("");
      setAddingSection(false);
      setMsg("Розділ додано.");
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
      setAddingCatFor(null);
      setMsg("Блок додано.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function deleteSection(id: number) {
    if (!window.confirm("Видалити розділ і всі його блоки зі структури?")) return;
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

  async function deleteCategory(id: number) {
    if (!window.confirm("Видалити цей блок зі структури?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/wiki/categories/${id}`, {
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
      if (view.kind === "category" && view.categoryId === id) {
        setView({ kind: "home" });
        setCategory(null);
      }
      setMsg("Блок видалено.");
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
            content_html: "<p></p>",
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
      setAddingPage(false);
      setMsg("Сторінку додано. Відкрий її, щоб редагувати вміст.");
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
      if (view.kind === "category" && category) {
        await openCategory({
          id: category.id,
          section_id: category.section_id,
          slug: category.slug,
          title: category.title,
          description: category.description,
          sort_order: category.sort_order,
        });
      }
      setMsg("Прибрано з блоку.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function setCardImage(linkId: number, image_url: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/wiki/category-pages/${linkId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url }),
      });
      if (!res.ok) {
        setErr("Не вдалося оновити фото картки");
        setBusy(false);
        return;
      }
      setCategory((prev) =>
        prev
          ? {
              ...prev,
              pages: prev.pages.map((p) =>
                p.id === linkId ? { ...p, image_url } : p,
              ),
            }
          : prev,
      );
      setMsg(image_url ? "Фото картки збережено." : "Повернено стандартну обкладинку.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function onCardPhotoFile(linkId: number, file: File | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const dataUrl = await compressImageFile(file, {
        maxEdge: 1200,
        quality: 0.8,
      });
      const up = await fetch("/api/admin/media", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const d = (await up.json()) as { url?: string; error?: string };
      if (!up.ok || !d.url) {
        setErr(d.error || "Не вдалося завантажити фото");
        setBusy(false);
        return;
      }
      await setCardImage(linkId, d.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не вдалося завантажити фото");
      setBusy(false);
    }
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
      setEditingPage(false);
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <p className="text-sm font-black text-[var(--mc-text)]">
            Редактор вікі
          </p>
          <p className="text-xs text-[var(--mc-text-muted)]">
            Вигляд як на сайті + кнопки редагування (текст і HTML).
          </p>
        </div>
        {view.kind === "home" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setAddingSection((v) => !v)}
            className={cn(
              btnSm,
              "border-[var(--mc-net-green)]/40 text-[var(--mc-net-green)]",
            )}
          >
            <span className="inline-flex items-center gap-1">
              <Plus className="size-3.5" />
              Додати розділ
            </span>
          </button>
        ) : null}
      </div>

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
        <div className="space-y-4">
          {addingSection ? (
            <div className="space-y-2 rounded-xl border border-[var(--mc-net-green)]/30 bg-black/30 p-3">
              <input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Назва розділу"
                className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]"
              />
              <input
                value={newSectionDesc}
                onChange={(e) => setNewSectionDesc(e.target.value)}
                placeholder="Опис (опційно)"
                className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !newSectionTitle.trim()}
                  onClick={() => void createSection()}
                  className={cn(
                    btnSm,
                    "border-[var(--mc-net-green)]/40 text-[var(--mc-net-green)]",
                  )}
                >
                  Зберегти розділ
                </button>
                <button
                  type="button"
                  onClick={() => setAddingSection(false)}
                  className={cn(btnSm, "border-white/15 text-[var(--mc-text-muted)]")}
                >
                  Скасувати
                </button>
              </div>
            </div>
          ) : null}

          <WikiHomeStructured
            tree={tree}
            editMode
            onOpenCategory={(cat) => void openCategory(cat)}
            sectionActions={(sectionId) => (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAddingCatFor(sectionId);
                    setNewCatTitle("");
                    setNewCatDesc("");
                  }}
                  className={cn(btnSm, "border-sky-400/40 text-sky-200")}
                >
                  + Блок
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteSection(sectionId)}
                  className={cn(btnSm, "border-rose-500/30 text-rose-100")}
                >
                  Видалити розділ
                </button>
              </>
            )}
            categoryActions={(cat) => (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void openCategory(cat);
                  }}
                  className={cn(btnSm, "border-white/15 text-[var(--mc-text)]")}
                >
                  Відкрити
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteCategory(cat.id);
                  }}
                  className={cn(btnSm, "border-rose-500/30 text-rose-100")}
                >
                  Видалити
                </button>
              </>
            )}
            footer={
              addingCatFor !== null ? (
                <div className="mt-6 space-y-2 rounded-xl border border-sky-400/30 bg-black/30 p-3">
                  <p className="text-xs font-bold text-sky-200">
                    Новий блок у розділі
                  </p>
                  <input
                    value={newCatTitle}
                    onChange={(e) => setNewCatTitle(e.target.value)}
                    placeholder="Назва (Держави, Міста…)"
                    className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]"
                  />
                  <input
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Опис картки"
                    className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || !newCatTitle.trim()}
                      onClick={() => void createCategory(addingCatFor)}
                      className={cn(btnSm, "border-sky-400/40 text-sky-200")}
                    >
                      Додати блок
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingCatFor(null)}
                      className={cn(
                        btnSm,
                        "border-white/15 text-[var(--mc-text-muted)]",
                      )}
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              ) : null
            }
          />
        </div>
      ) : null}

      {view.kind === "category" && category ? (
        <WikiCategoryView
          category={category}
          editMode
          onBack={() => {
            setView({ kind: "home" });
            setCategory(null);
            void loadTree();
          }}
          onOpenPage={(p) => void openPage(p)}
          headerActions={
            <button
              type="button"
              disabled={busy}
              onClick={() => setAddingPage((v) => !v)}
              className={cn(
                btnSm,
                "inline-flex items-center gap-1 border-[var(--mc-net-green)]/40 text-[var(--mc-net-green)]",
              )}
            >
              <Plus className="size-3.5" />
              Додати сторінку
            </button>
          }
          pageActions={(p) => (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  void openPage(p);
                }}
                className={cn(
                  btnSm,
                  "inline-flex items-center gap-1 border-white/15 text-[var(--mc-text)]",
                )}
              >
                <Pencil className="size-3" />
                Редагувати
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  cardPhotoLinkIdRef.current = p.id;
                  cardPhotoInputRef.current?.click();
                }}
                className={cn(
                  btnSm,
                  "inline-flex items-center gap-1 border-sky-400/30 text-sky-100",
                )}
              >
                <ImagePlus className="size-3" />
                {p.image_url ? "Змінити фото" : "Своє фото"}
              </button>
              {p.image_url ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void setCardImage(p.id, "");
                  }}
                  className={cn(btnSm, "border-white/15 text-[var(--mc-text-muted)]")}
                >
                  Стандартне
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  void removePageLink(p.id);
                }}
                className={cn(btnSm, "border-rose-500/30 text-rose-100")}
              >
                Прибрати
              </button>
            </>
          )}
          footer={
            <>
              <input
                ref={cardPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  const linkId = cardPhotoLinkIdRef.current;
                  cardPhotoLinkIdRef.current = null;
                  e.target.value = "";
                  if (linkId != null) {
                    void onCardPhotoFile(linkId, file);
                  }
                }}
              />
            {addingPage ? (
              <div className="mt-4 space-y-2 rounded-xl border border-[var(--mc-net-green)]/30 bg-black/30 p-3">
                <p className="text-xs font-bold text-[var(--mc-net-green)]">
                  Нова сторінка в «{category.title}»
                </p>
                <input
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Назва (Домініон Земана)"
                  className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]"
                />
                <input
                  value={newPageCode}
                  onChange={(e) => setNewPageCode(e.target.value)}
                  placeholder="Код (ДЗ) — опційно"
                  className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !newPageTitle.trim()}
                    onClick={() => void createPageInCategory()}
                    className={cn(
                      btnSm,
                      "border-[var(--mc-net-green)]/40 text-[var(--mc-net-green)]",
                    )}
                  >
                    Створити
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingPage(false)}
                    className={cn(
                      btnSm,
                      "border-white/15 text-[var(--mc-text-muted)]",
                    )}
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            ) : null}
            </>
          }
        />
      ) : null}

      {view.kind === "page" ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              if (view.fromCategory && category) {
                setView({
                  kind: "category",
                  categoryId: category.id,
                  slug: category.slug,
                });
              } else {
                setView({ kind: "home" });
              }
              setEditingPage(false);
            }}
            className="lc-focus-ring text-xs font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
          >
            ← Назад
          </button>

          {!editingPage ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEditingPage(true)}
                className={cn(
                  btnSm,
                  "inline-flex items-center gap-1 border-white/15 text-[var(--mc-text)]",
                )}
              >
                <Pencil className="size-3.5" />
                Редагувати
              </button>
            </div>
          ) : null}

          {editingPage ? (
            <div className="space-y-4 rounded-xl border border-white/12 bg-black/25 p-3 sm:p-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                  Назва
                </span>
                <input
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[var(--mc-text-muted)]">
                  Короткий опис
                </span>
                <input
                  value={pageSummary}
                  onChange={(e) => setPageSummary(e.target.value)}
                  className="lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]"
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
                    className="text-[11px] font-bold text-[var(--mc-net-green)]"
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
                        setPageSocial((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
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
                  Вміст статті
                </span>
                <p className="text-[11px] text-[var(--mc-text-subtle)]">
                  За замовчуванням — візуальний редактор (як на Fandom). Вкладка
                  «Вихідний код» — для HTML.
                </p>
                <WikiPageEditor
                  key={`editor-${pageSlug}`}
                  value={pageHtml}
                  onChange={setPageHtml}
                  disabled={busy}
                  initialMode="visual"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void savePage()}
                  className={cn(
                    btnSm,
                    "border-[var(--mc-net-green)]/40 bg-[var(--mc-net-green)]/15 px-4 py-2 text-sm text-[var(--mc-net-green)]",
                  )}
                >
                  {busy ? "Збереження…" : "Зберегти"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditingPage(false)}
                  className={cn(
                    btnSm,
                    "border-white/15 px-4 py-2 text-sm text-[var(--mc-text-muted)]",
                  )}
                >
                  Скасувати
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h1 className="text-2xl font-black text-[var(--mc-text)]">
                {pageTitle}
              </h1>
              {pageSummary ? (
                <p className="text-sm text-[var(--mc-text-muted)]">
                  {pageSummary}
                </p>
              ) : null}
              <div
                className="wiki-mirror prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: pageHtml }}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
