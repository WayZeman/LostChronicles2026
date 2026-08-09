import { notFound, redirect } from "next/navigation";
import { isWikiHomeSlug } from "@/lib/wiki-home";
import { getWikiPageBySlug } from "@/lib/wiki-pages";
import { isRpNewsWikiSlug } from "@/lib/telegram-rp-news";
import { WikiEditClient } from "@/components/wiki/WikiEditClient";

export const dynamic = "force-dynamic";

export default async function WikiEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    /* keep */
  }

  if (isRpNewsWikiSlug(slug)) {
    redirect("/wiki/" + encodeURIComponent(slug));
  }

  const page = await getWikiPageBySlug(
    isWikiHomeSlug(slug) ? "Main_Page" : slug,
  );
  if (!page) return notFound();

  return (
    <WikiEditClient
      mode="edit"
      initialSlug={page.slug}
      initialTitle={page.title}
      initialHtml={page.content_html}
    />
  );
}
