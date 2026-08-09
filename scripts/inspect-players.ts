import { getWikiPageBySlug } from "../src/lib/wiki-pages";

async function main() {
  const p = await getWikiPageBySlug("Гравці");
  const html = p?.content_html ?? "";
  const links = [
    ...html.matchAll(/href="\/wiki\/([^"#?]+)"[^>]*>([^<]*)</gi),
  ].map((m) => ({
    slug: decodeURIComponent(m[1].replace(/\+/g, "%20")),
    text: m[2].trim(),
  }));
  console.log(JSON.stringify(links, null, 2));
}

main();
