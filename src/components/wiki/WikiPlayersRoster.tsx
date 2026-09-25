import Link from "next/link";
import type { ReactNode } from "react";

import {
  orderedPlayerGroupTitles,
  type PlayerGroupRef,
  WIKI_FREE_PLAYERS_LABEL,
} from "@/lib/wiki-player-roster";
import type { WikiCategoryPageRow } from "@/lib/wiki-structure";
import { cn } from "@/lib/utils";

type Props = {
  pages: WikiCategoryPageRow[];
  groups?: PlayerGroupRef[];
  /** В адмінці показувати порожні категорії. */
  showEmpty?: boolean;
  rowActions?: (page: WikiCategoryPageRow) => ReactNode;
  onOpen?: (page: WikiCategoryPageRow) => void;
};

function initials(title: string): string {
  const parts = title.trim().split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return title.trim().slice(0, 2).toUpperCase();
}

function PlayerName({
  page,
  onOpen,
}: {
  page: WikiCategoryPageRow;
  onOpen?: (page: WikiCategoryPageRow) => void;
}) {
  const className =
    "lc-focus-ring min-w-0 break-words text-left text-[15px] font-extrabold leading-snug text-[var(--mc-text)] hover:text-[var(--mc-net-green)]";
  if (onOpen) {
    return (
      <button type="button" onClick={() => onOpen(page)} className={className}>
        {page.page_title}
      </button>
    );
  }
  return (
    <Link href={`/wiki/${encodeURIComponent(page.page_slug)}`} className={className}>
      {page.page_title}
    </Link>
  );
}

export function WikiPlayersRoster({
  pages,
  groups,
  showEmpty,
  rowActions,
  onOpen,
}: Props) {
  const byState = new Map<string, WikiCategoryPageRow[]>();
  for (const page of pages) {
    const state = page.player_state.trim() || WIKI_FREE_PLAYERS_LABEL;
    const list = byState.get(state) ?? [];
    list.push(page);
    byState.set(state, list);
  }

  const ordered = orderedPlayerGroupTitles(pages, groups)
    .map((state) => ({
      state,
      members: byState.get(state) ?? [],
    }))
    .filter((group) => showEmpty || group.members.length > 0);

  if (ordered.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/15 px-4 py-10 text-center text-sm text-[var(--mc-text-muted)]">
        У цьому розділі ще немає гравців.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
      {ordered.map(({ state, members }, index) => {
        const lone = ordered.length % 2 === 1 && index === ordered.length - 1;
        return (
          <section
            key={state}
            className={cn(
              "overflow-hidden rounded-lg border border-white/10 bg-black/30",
              lone && "lg:col-span-2",
            )}
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/25 px-3 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-5 w-1 shrink-0 rounded-full bg-[#ffd54f]"
                  aria-hidden
                />
                <h2 className="truncate text-base font-extrabold tracking-tight text-[var(--mc-text)] sm:text-lg">
                  {state}
                </h2>
              </div>
              <span className="shrink-0 rounded-md border border-[#ffd54f]/30 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#ffd54f]">
                {members.length}
              </span>
            </header>

            {members.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--mc-text-subtle)]">
                Поки немає гравців
              </p>
            ) : (
              <ul>
                <li className="hidden border-b border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--mc-text-subtle)] sm:grid sm:grid-cols-2 sm:gap-6">
                  <span className="pl-11">Гравець</span>
                  <span>Посада</span>
                </li>
                {members.map((page) => {
                  const role = page.player_role.trim();
                  return (
                    <li
                      key={page.id}
                      className="border-b border-white/[0.06] last:border-b-0"
                    >
                      <div className="flex flex-col gap-2.5 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
                        <div className="grid min-w-0 flex-1 grid-cols-1 gap-1 sm:grid-cols-2 sm:items-center sm:gap-6">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-[#ffd54f]/30 bg-black/45 text-[10px] font-black tracking-wide text-[#ffd54f]"
                              aria-hidden
                            >
                              {initials(page.page_title)}
                            </span>
                            <PlayerName page={page} onOpen={onOpen} />
                          </div>
                          <p className="pl-11 text-sm leading-snug text-[var(--mc-text-muted)] sm:pl-0">
                            {role && role !== "—" ? role : "—"}
                          </p>
                        </div>
                        {rowActions ? (
                          <div className="flex flex-wrap gap-1.5 pl-11 sm:shrink-0 sm:pl-0">
                            {rowActions(page)}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
