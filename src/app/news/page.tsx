import {
  fetchFandomPageHtml,
  getFandomNewsPageTitle,
  getFandomWikiBase,
} from "@/lib/fandom";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
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
    <main className="relative flex-1">
      <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <div className="site-container relative z-10 mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
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
