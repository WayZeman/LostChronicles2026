"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  formatPlayerCardBlurb,
  orderedPlayerGroupTitles,
  WIKI_FREE_PLAYERS_LABEL,
  WIKI_PLAYERS_SLUG,
} from "@/lib/wiki-player-roster";
import type {
  WikiCategoryDetail,
  WikiCategoryPageRow,
  WikiHomeTree,
  WikiPlayerGroupRow,
} from "@/lib/wiki-structure";
import { cn } from "@/lib/utils";

type Draft = { state: string; role: string };

const fieldClass =
  "lc-focus-ring w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-[var(--mc-text)]";

const btnSm =
  "lc-focus-ring rounded-lg border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50";

function roleDraft(role: string): string {
  const text = role.trim();
  return text === "—" ? "" : text;
}

function draftsFrom(pages: WikiCategoryPageRow[]): Record<number, Draft> {
  const out: Record<number, Draft> = {};
  for (const page of pages) {
    out[page.id] = {
      state: page.player_state.trim() || WIKI_FREE_PLAYERS_LABEL,
      role: roleDraft(page.player_role),
    };
  }
  return out;
}

function stateOptions(groups: WikiPlayerGroupRow[], current: string): string[] {
  const options = groups.map((g) => g.title);
  if (
    current &&
    current !== WIKI_FREE_PLAYERS_LABEL &&
    !options.includes(current)
  ) {
    options.push(current);
  }
  if (!options.includes(WIKI_FREE_PLAYERS_LABEL)) {
    options.push(WIKI_FREE_PLAYERS_LABEL);
  }
  return options;
}

export function AdminPlayerRoster() {
  const [category, setCategory] = useState<WikiCategoryDetail | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newNick, setNewNick] = useState("");
  const [newState, setNewState] = useState("");
  const [newRole, setNewRole] = useState("");

  const load = useCallback(async () => {
    const treeRes = await fetch("/api/admin/wiki/structure", {
      credentials: "include",
    });
    const treeBody = (await treeRes.json()) as {
      tree?: WikiHomeTree;
      error?: string;
    };
    if (!treeRes.ok || !treeBody.tree) {
      throw new Error(treeBody.error || "Не вдалося завантажити вікі");
    }
    const cat = treeBody.tree.sections
      .flatMap((section) => section.categories)
      .find((item) => item.slug.toLowerCase() === WIKI_PLAYERS_SLUG.toLowerCase());
    if (!cat) {
      throw new Error("Розділ «Гравці» у вікі не знайдено.");
    }
    const res = await fetch(`/api/admin/wiki/categories/${cat.id}`, {
      credentials: "include",
    });
    const body = (await res.json()) as {
      category?: WikiCategoryDetail;
      error?: string;
    };
    if (!res.ok || !body.category) {
      throw new Error(body.error || "Не вдалося відкрити розподіл");
    }
    setCategory(body.category);
    setDrafts(draftsFrom(body.category.pages));
    setNewState((prev) => {
      if (prev) return prev;
      return body.category?.player_groups?.[0]?.title ?? WIKI_FREE_PLAYERS_LABEL;
    });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load().catch((e) =>
        setErr(e instanceof Error ? e.message : "Помилка"),
      );
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  function patchDraft(id: number, next: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        state: prev[id]?.state ?? WIKI_FREE_PLAYERS_LABEL,
        role: prev[id]?.role ?? "",
        ...next,
      },
    }));
  }

  async function createGroup() {
    if (!newGroupTitle.trim()) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/wiki/player-groups", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newGroupTitle.trim() }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(body.error || "Не вдалося створити категорію");
        setBusy(false);
        return;
      }
      setNewGroupTitle("");
      await load();
      setMsg("Категорію додано.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function removeGroup(group: WikiPlayerGroupRow) {
    if (!window.confirm(`Видалити категорію «${group.title}»?`)) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/wiki/player-groups/${group.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(body.error || "Не вдалося видалити категорію");
        setBusy(false);
        return;
      }
      await load();
      setMsg("Категорію видалено.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function addPlayer() {
    if (!category || !newNick.trim()) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/wiki/categories/${category.id}/pages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "create",
          title: newNick.trim(),
          card_blurb: formatPlayerCardBlurb(
            newState || WIKI_FREE_PLAYERS_LABEL,
            newRole,
          ),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(body.error || "Не вдалося додати гравця");
        setBusy(false);
        return;
      }
      setNewNick("");
      setNewRole("");
      await load();
      setMsg("Гравця додано.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function savePlayer(page: WikiCategoryPageRow) {
    const draft = drafts[page.id];
    if (!draft) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/wiki/category-pages/${page.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_blurb: formatPlayerCardBlurb(draft.state, draft.role),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(body.error || "Не вдалося зберегти");
        setBusy(false);
        return;
      }
      await load();
      setMsg(`«${page.page_title}» збережено.`);
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  async function removePlayer(page: WikiCategoryPageRow) {
    if (!window.confirm(`Прибрати «${page.page_title}» з розподілу?`)) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/wiki/category-pages/${page.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setErr("Не вдалося прибрати гравця");
        setBusy(false);
        return;
      }
      await load();
      setMsg("Гравця прибрано з розподілу.");
    } catch {
      setErr("Мережа недоступна");
    }
    setBusy(false);
  }

  const groups = category?.player_groups ?? [];
  const pages = category?.pages ?? [];
  const ordered = orderedPlayerGroupTitles(pages, groups);
  const byState = new Map<string, WikiCategoryPageRow[]>();
  for (const page of pages) {
    const state = page.player_state.trim() || WIKI_FREE_PLAYERS_LABEL;
    const list = byState.get(state) ?? [];
    list.push(page);
    byState.set(state, list);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-[var(--mc-text)]">
          Розподіл гравців
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mc-text-muted)]">
          Категорія — держава. Посада пишеться окремо. Хто без держави —
          у «Вільні».
        </p>
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

      <section className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--mc-text-subtle)]">
          Категорії
        </p>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => {
            const used = pages.some((page) => page.player_state === group.title);
            return (
              <span
                key={group.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-xs text-[var(--mc-text)]"
              >
                {group.title}
                <button
                  type="button"
                  disabled={busy || used}
                  title={used ? "Спочатку перенеси гравців" : "Видалити категорію"}
                  onClick={() => void removeGroup(group)}
                  className="text-[var(--mc-text-subtle)] disabled:opacity-30"
                >
                  <Trash2 className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
            placeholder="Нова категорія (Елден)"
            className={cn(fieldClass, "min-w-[14rem] flex-1")}
          />
          <button
            type="button"
            disabled={busy || !newGroupTitle.trim()}
            onClick={() => void createGroup()}
            className={cn(
              btnSm,
              "inline-flex items-center gap-1 border-sky-400/40 text-sky-200",
            )}
          >
            <Plus className="size-3.5" />
            Додати категорію
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--mc-net-green)]/30 bg-black/25 p-3 sm:p-4">
        <p className="text-xs font-bold text-[var(--mc-net-green)]">
          Новий гравець
        </p>
        <div className="grid gap-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
          <input
            value={newNick}
            onChange={(e) => setNewNick(e.target.value)}
            placeholder="Нік"
            className={fieldClass}
          />
          <select
            value={newState || WIKI_FREE_PLAYERS_LABEL}
            onChange={(e) => setNewState(e.target.value)}
            className={fieldClass}
          >
            {stateOptions(groups, newState).map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
          <input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="Посада"
            className={fieldClass}
          />
          <button
            type="button"
            disabled={busy || !newNick.trim() || !category}
            onClick={() => void addPlayer()}
            className={cn(
              btnSm,
              "inline-flex items-center justify-center gap-1 border-[var(--mc-net-green)]/40 text-[var(--mc-net-green)]",
            )}
          >
            <Plus className="size-3.5" />
            Додати
          </button>
        </div>
      </section>

      {!category ? (
        err ? null : (
          <p className="text-sm text-[var(--mc-text-muted)]">Завантаження…</p>
        )
      ) : (
        <div className="space-y-4">
          {ordered.map((state) => {
            const members = byState.get(state) ?? [];
            return (
              <section
                key={state}
                className="overflow-hidden rounded-lg border border-white/10 bg-black/30"
              >
                <h3 className="border-b border-white/10 px-4 py-3 text-center text-base font-extrabold text-[var(--mc-text)]">
                  {state}
                </h3>
                {members.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-[var(--mc-text-subtle)]">
                    Поки немає гравців
                  </p>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)_auto] gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--mc-text-subtle)] sm:grid">
                      <span>Гравець</span>
                      <span>Категорія</span>
                      <span>Посада</span>
                      <span className="sr-only">Дії</span>
                    </div>
                    {members.map((page) => {
                      const draft = drafts[page.id] ?? {
                        state: page.player_state || WIKI_FREE_PLAYERS_LABEL,
                        role: roleDraft(page.player_role),
                      };
                      return (
                        <div
                          key={page.id}
                          className="grid gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)_auto] sm:items-center"
                        >
                          <p className="break-words text-sm font-extrabold text-[var(--mc-text)]">
                            {page.page_title}
                          </p>
                          <select
                            value={
                              stateOptions(groups, draft.state).includes(draft.state)
                                ? draft.state
                                : WIKI_FREE_PLAYERS_LABEL
                            }
                            onChange={(e) =>
                              patchDraft(page.id, { state: e.target.value })
                            }
                            className={fieldClass}
                            aria-label={`Категорія для ${page.page_title}`}
                          >
                            {stateOptions(groups, draft.state).map((title) => (
                              <option key={title} value={title}>
                                {title}
                              </option>
                            ))}
                          </select>
                          <input
                            value={draft.role}
                            onChange={(e) =>
                              patchDraft(page.id, { role: e.target.value })
                            }
                            placeholder="Посада"
                            aria-label={`Посада для ${page.page_title}`}
                            className={fieldClass}
                          />
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void savePlayer(page)}
                              className={cn(
                                btnSm,
                                "border-sky-400/40 text-sky-100",
                              )}
                            >
                              Зберегти
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void removePlayer(page)}
                              className={cn(
                                btnSm,
                                "border-rose-500/30 text-rose-100",
                              )}
                            >
                              Прибрати
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
