import type { Metadata } from "next";

import { getCachedWikiHomeTree } from "@/lib/public-content-cache";
import { seedWikiStructureIfEmpty } from "@/lib/wiki-structure";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { WikiSearchBox } from "@/components/wiki/WikiSearchBox";
import { WikiHomeStructured } from "@/components/wiki/WikiHomeStructured";
import { LC_SEO_WIKI_TITLE } from "@/data/lc-seo-terms";
import { buildLcPageMetadata } from "@/lib/seo";

/** Публічна вікі: ISR ~5 хв + data cache (див. public-content-cache). */
export const revalidate = 300;

export const metadata: Metadata = buildLcPageMetadata({
  title: LC_SEO_WIKI_TITLE,
  description:
    "Офіційна вікі Lost Chronicles: лор світу, правила сервера, гайди для гравців Minecraft Java/Bedrock. Пошук по статтях.",
  path: "/wiki",
});

export default async function WikiIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  await seedWikiStructureIfEmpty();
  const tree = await getCachedWikiHomeTree();

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        <WikiContentFrame
          topSlot={
            <WikiSearchBox
              embedded
              placeholder="Шукати державу, місто, гравця…"
              defaultQuery={typeof q === "string" ? q : ""}
            />
          }
        >
          {tree.sections.length > 0 ? (
            <WikiHomeStructured tree={tree} />
          ) : (
            <p className="py-12 text-center text-sm font-medium text-[var(--mc-ink-muted)]">
              Вікі ще без структури.
            </p>
          )}
        </WikiContentFrame>
      </div>
    </main>
  );
}
