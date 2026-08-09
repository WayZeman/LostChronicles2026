import { seedWikiStructureIfEmpty, getWikiHomeTree } from "../src/lib/wiki-structure";

async function main() {
  const result = await seedWikiStructureIfEmpty();
  console.log(result);
  const tree = await getWikiHomeTree();
  console.log(
    JSON.stringify(
      tree.sections.map((s) => ({
        title: s.title,
        cats: s.categories.map((c) => c.title),
      })),
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
