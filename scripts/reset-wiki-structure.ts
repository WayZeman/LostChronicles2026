import { getSql } from "../src/lib/db";
import { seedWikiStructureIfEmpty, getWikiHomeTree, ensureWikiStructureTables } from "../src/lib/wiki-structure";

async function main() {
  await ensureWikiStructureTables();
  const sql = getSql();
  await sql`DELETE FROM wiki_category_pages`;
  await sql`DELETE FROM wiki_categories`;
  await sql`DELETE FROM wiki_sections`;
  const result = await seedWikiStructureIfEmpty();
  console.log(result);
  const tree = await getWikiHomeTree();
  for (const s of tree.sections) {
    console.log("##", s.title);
    for (const c of s.categories) {
      console.log("  -", c.title, `(${c.slug})`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
