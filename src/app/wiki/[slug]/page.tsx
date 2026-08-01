import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  fetchFandomPageHtml,
  fandomTitleFromWikiSlug,
  getFandomWikiBase,
} from "@/lib/fandom";
import { isWikiHomeSlug } from "@/lib/wiki-home";
import {
  fetchRpNewsWikiContent,
  isRpNewsWikiSlug,
} from "@/lib/telegram-rp-news";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";

export const dynamic = "force-dynamic";

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isWikiHomeSlug(slug)) {
    redirect("/wiki");
  }

  const fandomBase = getFandomWikiBase();

  // RP новини — з Telegram-гілки, у стилі Fandom wikitable
  if (isRpNewsWikiSlug(slug)) {
    const rp = await fetchRpNewsWikiContent();
    if (!rp) return notFound();

    return (
      <main className={lcPageMainClass}>
        <div className={lcPageContainerClass}>
          <Link
            href="/wiki"
            className="lc-focus-ring mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] transition-colors hover:text-[var(--mc-net-green)] sm:mb-8"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Головна вікі
          </Link>

          <WikiContentFrame>
            <WikiMirrorHtml
              html={`<h1 class="wiki-rp-heading">RP новини</h1>${rp.html}`}
              fandomBase={fandomBase}
              rewriteWikiLinksToLocal={false}
            />
          </WikiContentFrame>
        </div>
      </main>
    );
  }

  const parsed = await fetchFandomPageHtml(fandomTitleFromWikiSlug(slug));
  if (!parsed) return notFound();

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        <Link
          href="/wiki"
          className="lc-focus-ring mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] transition-colors hover:text-[var(--mc-net-green)] sm:mb-8"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Головна вікі
        </Link>

        <WikiContentFrame>
          <WikiMirrorHtml
            html={parsed.html}
            fandomBase={fandomBase}
            rewriteWikiLinksToLocal
          />
        </WikiContentFrame>
      </div>
    </main>
  );
}
