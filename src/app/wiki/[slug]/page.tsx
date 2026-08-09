import { notFound, redirect } from "next/navigation";
import { isWikiHomeSlug } from "@/lib/wiki-home";
import {
  fetchRpNewsWikiContent,
  isRpNewsWikiSlug,
} from "@/lib/telegram-rp-news";
import {
  getWikiPageBySlug,
  requireWikiEditorUserId,
} from "@/lib/wiki-pages";
import {
  getWikiCategoryBySlug,
  parseSocialLinks,
  seedWikiStructureIfEmpty,
} from "@/lib/wiki-structure";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";
import { WikiCategoryView } from "@/components/wiki/WikiCategoryView";
import { WikiArticleView } from "@/components/wiki/WikiArticleView";
import { WikiMirrorHtml } from "@/components/wiki/WikiMirrorHtml";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

  const canEdit = Boolean(
    await requireWikiEditorUserId(await getSessionUserIdFromCookies()),
  );

  if (isRpNewsWikiSlug(slug)) {
    const rp = await fetchRpNewsWikiContent();
    if (!rp) return notFound();

    return (
      <main className={lcPageMainClass}>
        <div className={lcPageContainerClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
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
    return (
      <main className={lcPageMainClass}>
        <div className={lcPageContainerClass}>
          <WikiContentFrame>
            <WikiCategoryView category={category} canEdit={canEdit} />
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
            canEdit={canEdit}
          />
        </WikiContentFrame>
      </div>
    </main>
  );
}
