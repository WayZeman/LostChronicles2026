import { getSql } from "../src/lib/db";
import { getWikiPageBySlug } from "../src/lib/wiki-pages";

async function main() {
  const slugs = [
    "Гравці",
    "Міста",
    "Поселення",
    "Мегаполіси",
    "Державні_Утворення",
    "Держави",
    "Довідник_цін",
  ];
  for (const slug of slugs) {
    const p = await getWikiPageBySlug(slug);
    console.log("\n====", slug, "len=", p?.content_html.length ?? 0);
    const html = p?.content_html ?? "";
    const links = [...html.matchAll(/href="\/wiki\/([^"#?]+)"/gi)].map((m) =>
      decodeURIComponent(m[1].replace(/\+/g, "%20")),
    );
    console.log("links:", [...new Set(links)].join(" | "));
    // also table headers
    const titles = [...html.matchAll(/<th[^>]*>\s*<b>([^<]+)<\/b>/gi)].map(
      (m) => m[1].trim(),
    );
    console.log("ths:", titles.join(" | "));
  }
}

main();
