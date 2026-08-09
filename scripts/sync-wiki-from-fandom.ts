/**
 * Повний синк з Fandom:
 * 1) імпорт усіх статей у wiki_pages
 * 2) розбір реєстрів (Гравці, Міста, …) і привʼязка сторінок до блоків
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-wiki-from-fandom.ts
 */
import { getSql } from "../src/lib/db";
import { importWikiFromFandom } from "../src/lib/wiki-import";
import {
  getWikiPageBySlug,
  normalizeWikiSlug,
  wikiTitleFromSlug,
} from "../src/lib/wiki-pages";
import {
  ensureWikiStructureTables,
  getWikiCategoryBySlug,
  getWikiHomeTree,
  linkExistingPageToCategory,
  seedWikiStructureIfEmpty,
} from "../src/lib/wiki-structure";

const CATEGORY_SLUGS = [
  "Лор_серверу",
  "Історія_проєкту",
  "Держави",
  "Державні_Утворення",
  "Мегаполіси",
  "Міста",
  "Поселення",
  "Гравці",
  "Довідник_цін",
] as const;

/** Додаткові ручні привʼязки, якщо в HTML реєстру биті/порожні лінки. */
const EXTRA_LINKS: Record<string, string[]> = {
  Державні_Утворення: [
    "Конфедерація_Елден",
    "Кафолична_Церква_Скальденхейму",
    "Орган_Самоуправління_Скальденхейму",
    "Торгова_Гільдія_Артолії",
    "ЗС_ТІА",
    "Рада_Префектів_ТІА",
    "Інститут_Оцінювання_\"Аксіома\"",
    "Клан_Блюмдельвінґ",
    "Пром-Цісар",
    "Цісар_ТІА",
    "Hereditas_Skaldorum",
  ],
};

function extractLinksFromHtml(html: string): string[] {
  const slugs = new Set<string>();
  const re = /href="\/wiki\/([^"#?]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let raw = m[1];
    try {
      raw = decodeURIComponent(raw.replace(/\+/g, "%20"));
    } catch {
      /* keep */
    }
    const slug = normalizeWikiSlug(raw);
    if (!slug) continue;
    if (/^(Special|File|Category|User|Template|Help|Talk):/i.test(slug)) {
      continue;
    }
    slugs.add(slug);
  }
  return [...slugs];
}

/** У картках гравців аватар веде на нік (порожній текст), а держава — окремим текстовим лінком. */
function extractPlayerSlugsFromHtml(html: string): string[] {
  const slugs: string[] = [];
  const seen = new Set<string>();
  const re = /href="\/wiki\/([^"#?]+)"([^>]*)>([^<]*)</gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let raw = m[1];
    try {
      raw = decodeURIComponent(raw.replace(/\+/g, "%20"));
    } catch {
      /* keep */
    }
    const slug = normalizeWikiSlug(raw);
    const text = (m[3] ?? "").trim();
    if (!slug || seen.has(slug.toLowerCase())) continue;
    // порожній текст ≈ картка гравця; латиниця в slug теж гравець
    if (text === "" || /^[A-Za-z][A-Za-z0-9_\-]*$/.test(slug)) {
      seen.add(slug.toLowerCase());
      slugs.push(slug);
    }
  }
  return slugs;
}

function shortCodeFromTitle(title: string): string {
  const m = title.match(/\(([A-Za-zА-Яа-яЁёІіЇїЄєҐґ0-9\-]+)\)\s*$/);
  return m?.[1] ?? "";
}

async function clearCategoryLinks(categoryId: number) {
  const sql = getSql();
  await sql`DELETE FROM wiki_category_pages WHERE category_id = ${categoryId}`;
}

async function syncCategory(slug: string) {
  const cat = await getWikiCategoryBySlug(slug);
  if (!cat) {
    console.log(`  skip (no category): ${slug}`);
    return;
  }

  const indexPage = await getWikiPageBySlug(slug);
  const fromHtml = !indexPage
    ? []
    : slug === "Гравці"
      ? extractPlayerSlugsFromHtml(indexPage.content_html)
      : extractLinksFromHtml(indexPage.content_html);
  const extras = EXTRA_LINKS[slug] ?? [];
  let candidates = [...new Set([...fromHtml, ...extras])].filter(
    (s) => normalizeWikiSlug(s).toLowerCase() !== slug.toLowerCase(),
  );

  // Для «самодостатніх» сторінок (Лор, Історія, Довідник) — сама сторінка в реєстрі
  if (
    candidates.length === 0 &&
    ["Лор_серверу", "Історія_проєкту", "Довідник_цін"].includes(slug)
  ) {
    candidates = [slug];
  }

  await clearCategoryLinks(cat.id);

  let linked = 0;
  let missing = 0;
  for (const pageSlug of candidates) {
    const page = await getWikiPageBySlug(pageSlug);
    if (!page) {
      console.log(`    missing page: ${pageSlug}`);
      missing += 1;
      continue;
    }
    // Не додаємо індексні сторінки інших реєстрів як картки
    if (
      CATEGORY_SLUGS.includes(page.slug as (typeof CATEGORY_SLUGS)[number]) &&
      page.slug !== slug
    ) {
      continue;
    }
    await linkExistingPageToCategory({
      category_id: cat.id,
      page_id: page.id,
      short_code: shortCodeFromTitle(page.title),
      card_blurb: page.summary || page.title,
    });
    linked += 1;
  }
  console.log(`  ${cat.title}: linked ${linked}, missing ${missing}`);
}

async function main() {
  const skipImport = process.argv.includes("--skip-import");
  if (!skipImport) {
    console.log("1) Import all pages from Fandom…");
    const imported = await importWikiFromFandom();
    console.log(JSON.stringify(imported, null, 2));
  } else {
    console.log("1) Skip import (--skip-import)");
  }

  console.log("2) Ensure structure…");
  await ensureWikiStructureTables();
  await seedWikiStructureIfEmpty();

  console.log("3) Sync category memberships…");
  const tree = await getWikiHomeTree();
  const categorySlugs = tree.sections.flatMap((s) =>
    s.categories.map((c) => c.slug),
  );
  for (const slug of categorySlugs) {
    if (slug === "RP_новини") {
      console.log("  RP новини: skip (Telegram)");
      continue;
    }
    await syncCategory(slug);
  }

  console.log("\n4) Summary:");
  for (const s of await getWikiHomeTree().then((t) => t.sections)) {
    console.log(`## ${s.title}`);
    for (const c of s.categories) {
      const d = await getWikiCategoryBySlug(c.slug);
      console.log(
        `  ${c.title}: ${(d?.pages ?? []).map((p) => p.page_title).join(", ") || "(empty)"}`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
