import { getSql } from "../src/lib/db";
import {
  ensureWikiStructureTables,
  getWikiCategoryBySlug,
  getWikiHomeTree,
} from "../src/lib/wiki-structure";
import { listWikiPages } from "../src/lib/wiki-pages";

async function main() {
  await ensureWikiStructureTables();
  const sql = getSql();
  const count = (await sql`SELECT count(*)::int AS c FROM wiki_pages`) as Array<{
    c: number;
  }>;
  console.log("pages:", count[0]?.c);
  const tree = await getWikiHomeTree();
  for (const s of tree.sections) {
    console.log("\n##", s.title);
    for (const c of s.categories) {
      const d = await getWikiCategoryBySlug(c.slug);
      console.log(`  ${c.title} (${c.slug}): ${d?.pages.length ?? 0} pages`);
      if (d?.pages.length) {
        console.log("   ->", d.pages.map((p) => p.page_title).join(", "));
      }
    }
  }
  const all = await listWikiPages(500);
  console.log("\nALL:", all.map((p) => p.title).join(" | "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
