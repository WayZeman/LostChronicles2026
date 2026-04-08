import {
  fetchFandomPageHtml,
  getFandomNewsPageTitle,
  getFandomWikiBase,
} from "@/lib/fandom";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { cn } from "@/lib/utils";

/** Див. /wiki — Fandom підвантажується під час запиту, не на етапі `next build`. */
export const dynamic = "force-dynamic";

export default async function NewsListPage() {
  const base = getFandomWikiBase();
  const newsTitle = getFandomNewsPageTitle();
  const parsed = await fetchFandomPageHtml(newsTitle);

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        {!parsed ? (
          <p
            className={cn(
              lcGlassPanelClass,
              "py-12 text-center text-sm font-medium text-[var(--mc-ink-muted)]",
            )}
          >
            Не вдалося завантажити новини з Fandom (мережа або тимчасова недоступність). Спробуйте
            оновити сторінку пізніше.
            <span className="mt-2 block text-xs text-[var(--mc-ink-muted)] opacity-80">
              Сторінка: {newsTitle}
            </span>
          </p>
        ) : null}

        {parsed ? (
          <WikiContentFrame>
            <WikiMirrorHtml
              html={parsed.html}
              fandomBase={base}
              rewriteWikiLinksToLocal
            />
          </WikiContentFrame>
        ) : null}
      </div>
    </main>
  );
}
