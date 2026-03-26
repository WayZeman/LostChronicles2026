import { getFandomWikiBase } from "@/lib/fandom";
import { resolveWikiHomeContent } from "@/lib/wiki-home";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";

/** Не пререндерити під час білду — інакше на Vercel fetch до Fandom часто падає і «запікається» порожня сторінка. */
export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  const base = getFandomWikiBase();
  const home = await resolveWikiHomeContent();

  return (
    <main className="relative flex-1">
      <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <div className="site-container relative z-10 mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
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
          <p className="rounded-sm border-2 border-[var(--mc-border)] bg-[var(--mc-surface)] px-6 py-12 text-center text-sm font-medium text-[var(--mc-ink-muted)] shadow-sm">
            Не вдалося завантажити вікі з Fandom (мережа або тимчасова недоступність). Спробуйте
            оновити сторінку пізніше.
          </p>
        ) : null}
      </div>
    </main>
  );
}
