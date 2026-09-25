import Link from "next/link";
import { Fragment, type ReactNode } from "react";

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
  rowActions?: (page: WikiCategoryPageRow) => ReactNode;
  onOpen?: (page: WikiCategoryPageRow) => void;
};

export function WikiPlayersRoster({ pages, groups, rowActions, onOpen }: Props) {
  const byState = new Map<string, WikiCategoryPageRow[]>();
  for (const page of pages) {
    const state = page.player_state.trim() || WIKI_FREE_PLAYERS_LABEL;
    const list = byState.get(state) ?? [];
    list.push(page);
    byState.set(state, list);
  }

  const ordered = orderedPlayerGroupTitles(pages, groups).map((state) => ({
    state,
    members: byState.get(state) ?? [],
  }));

  if (ordered.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/15 px-4 py-10 text-center text-sm text-[var(--mc-text-muted)]">
        У цьому розділі ще немає категорій.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5">
      {ordered.map(({ state, members }, index) => {
        const lone = ordered.length % 2 === 1 && index === ordered.length - 1;
        return (
          <section
            key={state}
            className={cn(
              "flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-black/30",
              lone && "md:col-span-2 md:mx-auto md:w-[calc(50%-0.625rem)]",
            )}
          >
            <h2 className="border-b border-white/10 px-4 py-3 text-center text-lg font-extrabold tracking-tight text-[var(--mc-text)]">
              {state}
            </h2>
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col className="w-1/2" />
                <col className="w-1/2" />
              </colgroup>
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wide text-[var(--mc-text-subtle)]">
                  <th className="w-1/2 px-3 py-2.5 text-center font-bold sm:px-4">
                    Гравець
                  </th>
                  <th className="w-1/2 border-l border-white/10 px-3 py-2.5 text-center font-bold sm:px-4">
                    Посада
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-sm text-[var(--mc-text-subtle)]"
                    >
                      Поки немає гравців
                    </td>
                  </tr>
                ) : (
                  members.map((p) => (
                    <Fragment key={p.id}>
                    <tr
                      className="border-b border-white/[0.06]"
                    >
                      <td className="w-1/2 px-3 py-3 align-middle sm:px-4">
                        {onOpen ? (
                          <button
                            type="button"
                            onClick={() => onOpen(p)}
                            className="lc-focus-ring block w-full break-words text-center font-extrabold text-[var(--mc-text)] hover:text-[var(--mc-net-green)]"
                          >
                            {p.page_title}
                          </button>
                        ) : (
                          <Link
                            href={`/wiki/${encodeURIComponent(p.page_slug)}`}
                            className="lc-focus-ring block break-words text-center font-extrabold text-[var(--mc-text)] hover:text-[var(--mc-net-green)]"
                          >
                            {p.page_title}
                          </Link>
                        )}
                      </td>
                      <td className="w-1/2 border-l border-white/10 px-3 py-3 align-middle text-center text-[var(--mc-text-muted)] sm:px-4">
                        <span className="block break-words">
                          {p.player_role.trim() || "—"}
                        </span>
                      </td>
                    </tr>
                    {rowActions ? (
                      <tr className="border-b border-white/[0.06] last:border-b-0">
                        <td colSpan={2} className="px-3 pb-3 text-center">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {rowActions(p)}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
