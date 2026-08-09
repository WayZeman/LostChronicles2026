import {
  getWikiHomeTree,
  seedWikiStructureIfEmpty,
} from "@/lib/wiki-structure";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { WikiSearchBox } from "@/components/wiki/WikiSearchBox";
import { WikiHomeStructured } from "@/components/wiki/WikiHomeStructured";

export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  await seedWikiStructureIfEmpty();
  const tree = await getWikiHomeTree();

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
