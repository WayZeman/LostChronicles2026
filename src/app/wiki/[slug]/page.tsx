import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isWikiHomeSlug } from "@/lib/wiki-home-slug";
import {
  fetchRpNewsWikiContent,
  isRpNewsWikiSlug,
} from "@/lib/telegram-rp-news";
import {
  getCachedWikiCategoryBySlug,
  getCachedWikiPageBySlug,
} from "@/lib/public-content-cache";
import {
  parseSocialLinks,
  seedWikiStructureIfEmpty,
} from "@/lib/wiki-structure";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import {
  DiamondPageRoot,
  DiamondSlotStrip,
} from "@/components/site/DiamondSlot";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { WikiCategoryView } from "@/components/wiki/WikiCategoryView";
import { WikiArticleView } from "@/components/wiki/WikiArticleView";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";

export const revalidate = 60;

const WIKI_SUB_STRIP = ["wiki-sub-0", "wiki-sub-1", "wiki-sub-2", "wiki-sub-3"];

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
        <DiamondPageRoot className={lcPageContainerClass}>
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
          <DiamondSlotStrip ids={WIKI_SUB_STRIP} />
        </DiamondPageRoot>
      </main>
    );
  }

  const category = await getCachedWikiCategoryBySlug(slug);
  if (category) {
    const onlySelf =
      category.pages.length === 1 &&
      category.pages[0]!.page_slug.toLowerCase() === category.slug.toLowerCase();
    if (onlySelf) {
      const page = await getCachedWikiPageBySlug(category.slug);
      if (page) {
        return (
          <main className={lcPageMainClass}>
            <DiamondPageRoot className={lcPageContainerClass}>
              <WikiContentFrame>
                <WikiArticleView
                  title={page.title}
                  slug={page.slug}
                  html={page.content_html}
                  summary={page.summary}
                  socialLinks={parseSocialLinks(page.social_links_raw)}
                />
              </WikiContentFrame>
              <DiamondSlotStrip
                ids={["wiki-pagecard-0", "wiki-pagecard-1", "wiki-pagecard-2"]}
              />
            </DiamondPageRoot>
          </main>
        );
      }
    }

    return (
      <main className={lcPageMainClass}>
        <DiamondPageRoot className={lcPageContainerClass}>
          <WikiContentFrame>
            <WikiCategoryView category={category} />
          </WikiContentFrame>
          <DiamondSlotStrip ids={["wiki-sub-1", "wiki-sub-2", "wiki-sub-3"]} />
        </DiamondPageRoot>
      </main>
    );
  }

  const page = await getCachedWikiPageBySlug(slug);
  if (!page) return notFound();

  return (
    <main className={lcPageMainClass}>
      <DiamondPageRoot className={lcPageContainerClass}>
        <WikiContentFrame>
          <WikiArticleView
            title={page.title}
            slug={page.slug}
            html={page.content_html}
            summary={page.summary}
            socialLinks={parseSocialLinks(page.social_links_raw)}
          />
        </WikiContentFrame>
        <DiamondSlotStrip
          ids={["wiki-pagecard-0", "wiki-pagecard-1", "wiki-pagecard-2"]}
        />
      </DiamondPageRoot>
    </main>
  );
}
