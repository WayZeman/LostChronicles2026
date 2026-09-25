import Link from "next/link";

import {
  comparePlayerStates,
  WIKI_FREE_PLAYERS_LABEL,
} from "@/lib/wiki-player-roster";
import type { WikiCategoryPageRow } from "@/lib/wiki-structure";

type Props = {
  pages: WikiCategoryPageRow[];
};

export function WikiPlayersRoster({ pages }: Props) {
  const groups = new Map<string, WikiCategoryPageRow[]>();
  for (const page of pages) {
    const state = page.player_state.trim() || WIKI_FREE_PLAYERS_LABEL;
    const list = groups.get(state) ?? [];
    list.push(page);
    groups.set(state, list);
  }

  const ordered = [...groups.entries()].sort(([a], [b]) =>
    comparePlayerStates(a, b),
  );

  return (
    <div className="space-y-8">
      {ordered.map(([state, members]) => (
        <section key={state} className="space-y-3">
          <h2 className="lc-section-title text-xl text-[var(--mc-text)] sm:text-2xl">
            {state}
          </h2>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wide text-[var(--mc-text-subtle)]">
                  <th className="px-3 py-2.5 font-bold sm:px-4">Гравець</th>
                  <th className="px-3 py-2.5 font-bold sm:px-4">Посада</th>
                </tr>
              </thead>
              <tbody>
                {members.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/[0.06] last:border-b-0"
                  >
                    <td className="px-3 py-3 align-top sm:px-4">
                      <Link
                        href={`/wiki/${encodeURIComponent(p.page_slug)}`}
                        className="lc-focus-ring font-extrabold text-[var(--mc-text)] hover:text-[var(--mc-net-green)]"
                      >
                        {p.page_title}
                      </Link>
                    </td>
                    <td className="px-3 py-3 align-top text-[var(--mc-text-muted)] sm:px-4">
                      {p.player_role.trim() || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
