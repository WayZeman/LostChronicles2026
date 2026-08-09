/**
 * One-time (or force) seed: Fandom → Neon wiki_pages.
 * Usage: npx tsx --env-file=.env.local scripts/import-wiki.ts
 */
import { importWikiFromFandom } from "../src/lib/wiki-import";
import { countWikiPages } from "../src/lib/wiki-pages";

async function main() {
  const force = process.argv.includes("--force");
  const before = await countWikiPages();
  console.log(`wiki_pages before: ${before}`);
  if (before > 0 && !force) {
    console.error(
      'Wiki already has pages. Re-run with --force to overwrite from Fandom.',
    );
    process.exit(1);
  }
  const result = await importWikiFromFandom();
  console.log(JSON.stringify(result, null, 2));
  const after = await countWikiPages();
  console.log(`wiki_pages after: ${after}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
