import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isWikiHomeSlug } from "@/lib/wiki-home-slug";
import {
  fetchRpNewsWikiContent,
  isRpNewsWikiSlug,
} from "@/lib/telegram-rp-news";
import { getWikiPageBySlug } from "@/lib/wiki-pages";
import {
  getWikiCategoryBySlug,
  parseSocialLinks,
  seedWikiStructureIfEmpty,
} from "@/lib/wiki-structure";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { WikiCategoryView } from "@/components/wiki/WikiCategoryView";
import { WikiArticleView } from "@/components/wiki/WikiArticleView";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";

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

  await seedWikiStructureIfEmpty();

  if (isRpNewsWikiSlug(slug)) {
    const rp = await fetchRpNewsWikiContent();
    if (!rp) return notFound();

    return (
      <main className={lcPageMainClass}>
        <div className={lcPageContainerClass}>
          <div className="mb-5 sm:mb-8">
            <Link
              href="/wiki"
              className="lc-focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] transition-colors hover:text-[var(--mc-net-green)]"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Головна вікі
            </Link>
          </div>

          <WikiContentFrame>
            <WikiMirrorHtml
              html={`<h1 class="wiki-rp-heading">RP новини</h1>${rp.html}`}
              rewriteWikiLinksToLocal={false}
            />
          </WikiContentFrame>
        </div>
      </main>
    );
  }

  const category = await getWikiCategoryBySlug(slug);
  if (category) {
    // Якщо в блоці лише сама індексна сторінка (напр. Довідник цін) — показуємо статтю одразу
    const onlySelf =
      category.pages.length === 1 &&
      category.pages[0]!.page_slug.toLowerCase() === category.slug.toLowerCase();
    if (onlySelf) {
      const page = await getWikiPageBySlug(category.slug);
      if (page) {
        return (
          <main className={lcPageMainClass}>
            <div className={lcPageContainerClass}>
              <WikiContentFrame>
                <WikiArticleView
                  title={page.title}
                  slug={page.slug}
                  html={page.content_html}
                  summary={page.summary}
                  socialLinks={parseSocialLinks(page.social_links_raw)}
                />
              </WikiContentFrame>
            </div>
          </main>
        );
      }
    }

    return (
      <main className={lcPageMainClass}>
        <div className={lcPageContainerClass}>
          <WikiContentFrame>
            <WikiCategoryView category={category} />
          </WikiContentFrame>
        </div>
      </main>
    );
  }

  const page = await getWikiPageBySlug(slug);
  if (!page) return notFound();

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        <WikiContentFrame>
          <WikiArticleView
            title={page.title}
            slug={page.slug}
            html={page.content_html}
            summary={page.summary}
            socialLinks={parseSocialLinks(page.social_links_raw)}
          />
        </WikiContentFrame>
      </div>
    </main>
  );
}
