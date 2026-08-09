import Link from "next/link";
import {
  getWikiHomeTree,
  seedWikiStructureIfEmpty,
} from "@/lib/wiki-structure";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireWikiEditorUserId } from "@/lib/wiki-pages";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { WikiSearchBox } from "@/components/wiki/WikiSearchBox";
import { WikiHomeStructured } from "@/components/wiki/WikiHomeStructured";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  await seedWikiStructureIfEmpty();
  const tree = await getWikiHomeTree();
  const editorId = await requireWikiEditorUserId(
    await getSessionUserIdFromCookies(),
  );

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        {editorId ? (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/wiki/new"
              className="lc-focus-ring rounded-lg border border-[var(--mc-net-green)]/40 bg-[var(--mc-net-green)]/10 px-3 py-1.5 text-xs font-bold text-[var(--mc-net-green)]"
            >
              Нова сторінка
            </Link>
            <Link
              href="/admin?tab=wiki"
              className="lc-focus-ring rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-[var(--mc-text)]"
            >
              Керувати структурою
            </Link>
          </div>
        ) : null}

        <WikiContentFrame topSlot={<WikiSearchBox embedded />}>
          {tree.sections.length > 0 ? (
            <WikiHomeStructured tree={tree} canEdit={Boolean(editorId)} />
          ) : (
            <p
              className={cn(
                "py-12 text-center text-sm font-medium text-[var(--mc-ink-muted)]",
              )}
            >
              Вікі ще без структури. Адмін може зібрати розділи у вкладці
              «Вікі» адмін-панелі.
            </p>
          )}
        </WikiContentFrame>

        {!tree.sections.length ? (
          <p className={cn(lcGlassPanelClass, "mt-4 hidden")} />
        ) : null}
      </div>
    </main>
  );
}
