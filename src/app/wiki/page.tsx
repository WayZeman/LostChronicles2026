import { getCachedWikiHomeTree } from "@/lib/public-content-cache";
import { seedWikiStructureIfEmpty } from "@/lib/wiki-structure";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { DiamondPageRoot, DiamondSlot } from "@/components/site/DiamondSlot";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { WikiSearchBox } from "@/components/wiki/WikiSearchBox";
import { WikiHomeStructured } from "@/components/wiki/WikiHomeStructured";

/** Публічна вікі: ISR ~1 хв + data cache (див. public-content-cache). */
export const revalidate = 60;

export default async function WikiIndexPage() {
  await seedWikiStructureIfEmpty();
  const tree = await getCachedWikiHomeTree();

  return (
    <main className={lcPageMainClass}>
      <DiamondPageRoot className={lcPageContainerClass}>
        <WikiContentFrame
          topSlot={
            <div className="relative">
              <DiamondSlot
                id="wiki-search"
                className="!absolute !right-2 !top-1/2 !z-[5] !-translate-y-1/2"
              />
              <WikiSearchBox
                embedded
                placeholder="Шукати державу, місто, гравця…"
              />
            </div>
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
      </DiamondPageRoot>
    </main>
  );
}
