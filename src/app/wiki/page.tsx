import { getFandomWikiBase } from "@/lib/fandom";
import { resolveWikiHomeContent } from "@/lib/wiki-home";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { cn } from "@/lib/utils";

/** Не пререндерити під час білду — інакше на Vercel fetch до Fandom часто падає і «запікається» порожня сторінка. */
export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  const base = getFandomWikiBase();
  const home = await resolveWikiHomeContent();

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        {home ? (
          <WikiContentFrame>
            <WikiMirrorHtml
              html={home.html}
              fandomBase={base}
              rewriteWikiLinksToLocal
            />
          </WikiContentFrame>
        ) : null}

        {!home ? (
          <p
            className={cn(
              lcGlassPanelClass,
              "py-12 text-center text-sm font-medium text-[var(--mc-ink-muted)]",
            )}
          >
            Не вдалося завантажити вікі з Fandom (мережа або тимчасова недоступність). Спробуйте
            оновити сторінку пізніше.
          </p>
        ) : null}
      </div>
    </main>
  );
}
