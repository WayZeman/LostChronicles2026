import {
  getCachedWikiHomeContent,
  getCachedWikiHomeTree,
} from "@/lib/public-content-cache";
import { seedWikiStructureIfEmpty } from "@/lib/wiki-structure";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { SoftAppear } from "@/components/site/SoftAppear";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { WikiSearchBox } from "@/components/wiki/WikiSearchBox";
import { WikiHomeStructured } from "@/components/wiki/WikiHomeStructured";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";

/** Публічна вікі: ISR ~1 хв + data cache (див. public-content-cache). */
export const revalidate = 60;

export default async function WikiIndexPage() {
  await seedWikiStructureIfEmpty();
  const [tree, home] = await Promise.all([
    getCachedWikiHomeTree(),
    getCachedWikiHomeContent(),
  ]);
  const homeHtml = home?.html?.trim() ?? "";
  const hasHomeHtml = homeHtml.length > 0;

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        <WikiContentFrame
          topSlot={
            <WikiSearchBox
              embedded
              placeholder="Шукати державу, місто, гравця…"
            />
          }
        >
          {tree.sections.length > 0 || hasHomeHtml ? (
            <WikiHomeStructured
              tree={tree}
              hideBrandHeader={hasHomeHtml}
              intro={
                hasHomeHtml ? (
                  <SoftAppear>
                    <WikiMirrorHtml html={homeHtml} rewriteWikiLinksToLocal />
                  </SoftAppear>
                ) : null
              }
            />
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
