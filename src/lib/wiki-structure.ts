import { getSql } from "@/lib/db";
import {
  ensureWikiTables,
  getWikiPageBySlug,
  normalizeWikiSlug,
  upsertWikiPage,
  wikiSlugFromTitle,
  type WikiPageRecord,
} from "@/lib/wiki-pages";

function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

let structureEnsured = false;

export type WikiSocialLink = {
  kind: "telegram" | "discord" | "youtube" | "website" | "other";
  label: string;
  url: string;
};

export type WikiSectionRow = {
  id: number;
  title: string;
  description: string;
  sort_order: number;
};

export type WikiCategoryRow = {
  id: number;
  section_id: number;
  slug: string;
  title: string;
  description: string;
  sort_order: number;
};

export type WikiCategoryPageRow = {
  id: number;
  category_id: number;
  page_id: number;
  short_code: string;
  card_blurb: string;
  sort_order: number;
  page_slug: string;
  page_title: string;
  page_summary: string;
};

export type WikiHomeTree = {
  sections: Array<
    WikiSectionRow & {
      categories: WikiCategoryRow[];
    }
  >;
};

export type WikiCategoryDetail = WikiCategoryRow & {
  pages: WikiCategoryPageRow[];
  section_title: string;
};

export async function ensureWikiStructureTables(): Promise<void> {
  if (structureEnsured) return;
  await ensureWikiTables();
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS wiki_sections (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS wiki_categories (
      id SERIAL PRIMARY KEY,
      section_id INT NOT NULL REFERENCES wiki_sections (id) ON DELETE CASCADE,
      slug VARCHAR(255) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT wiki_categories_slug_uidx UNIQUE (slug)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS wiki_categories_section_idx
    ON wiki_categories (section_id, sort_order ASC, id ASC)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS wiki_category_pages (
      id SERIAL PRIMARY KEY,
      category_id INT NOT NULL REFERENCES wiki_categories (id) ON DELETE CASCADE,
      page_id INT NOT NULL REFERENCES wiki_pages (id) ON DELETE CASCADE,
      short_code VARCHAR(32) NOT NULL DEFAULT '',
      card_blurb TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      CONSTRAINT wiki_category_pages_uidx UNIQUE (category_id, page_id)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS wiki_category_pages_cat_idx
    ON wiki_category_pages (category_id, sort_order ASC, id ASC)
  `;
  await sql`
    ALTER TABLE wiki_pages
    ADD COLUMN IF NOT EXISTS social_links TEXT NOT NULL DEFAULT '[]'
  `;
  await sql`
    ALTER TABLE wiki_pages
    ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT ''
  `;
  structureEnsured = true;
}

export function parseSocialLinks(raw: unknown): WikiSocialLink[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: WikiSocialLink[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const url = String(o.url ?? "").trim();
      if (!url) continue;
      const kindRaw = String(o.kind ?? "other").toLowerCase();
      const kind: WikiSocialLink["kind"] =
        kindRaw === "telegram" ||
        kindRaw === "discord" ||
        kindRaw === "youtube" ||
        kindRaw === "website"
          ? kindRaw
          : "other";
      out.push({
        kind,
        label: String(o.label ?? kind).trim() || kind,
        url,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeSocialLinks(links: WikiSocialLink[]): string {
  return JSON.stringify(
    links
      .filter((l) => l.url.trim())
      .map((l) => ({
        kind: l.kind,
        label: l.label.trim() || l.kind,
        url: l.url.trim(),
      })),
  );
}

function mapSection(r: Record<string, unknown>): WikiSectionRow {
  return {
    id: num(r.id),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    sort_order: num(r.sort_order),
  };
}

function mapCategory(r: Record<string, unknown>): WikiCategoryRow {
  return {
    id: num(r.id),
    section_id: num(r.section_id),
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    sort_order: num(r.sort_order),
  };
}

export async function getWikiHomeTree(): Promise<WikiHomeTree> {
  await ensureWikiStructureTables();
  const sql = getSql();
  const sections = rowsOf(await sql`
    SELECT id, title, description, sort_order
    FROM wiki_sections
    ORDER BY sort_order ASC, id ASC
  `).map(mapSection);

  const categories = rowsOf(await sql`
    SELECT id, section_id, slug, title, description, sort_order
    FROM wiki_categories
    ORDER BY sort_order ASC, id ASC
  `).map(mapCategory);

  return {
    sections: sections.map((s) => ({
      ...s,
      categories: categories.filter((c) => c.section_id === s.id),
    })),
  };
}

export async function getWikiCategoryBySlug(
  slug: string,
): Promise<WikiCategoryDetail | null> {
  await ensureWikiStructureTables();
  const normalized = normalizeWikiSlug(slug);
  if (!normalized) return null;
  const sql = getSql();
  const cats = rowsOf(await sql`
    SELECT c.id, c.section_id, c.slug, c.title, c.description, c.sort_order,
           s.title AS section_title
    FROM wiki_categories c
    JOIN wiki_sections s ON s.id = c.section_id
    WHERE lower(c.slug) = lower(${normalized})
    LIMIT 1
  `);
  const c = cats[0];
  if (!c) return null;

  const pages = rowsOf(await sql`
    SELECT
      cp.id, cp.category_id, cp.page_id, cp.short_code, cp.card_blurb, cp.sort_order,
      p.slug AS page_slug, p.title AS page_title, p.summary AS page_summary
    FROM wiki_category_pages cp
    JOIN wiki_pages p ON p.id = cp.page_id
    WHERE cp.category_id = ${num(c.id)}
    ORDER BY cp.sort_order ASC, cp.id ASC
  `).map((r) => ({
    id: num(r.id),
    category_id: num(r.category_id),
    page_id: num(r.page_id),
    short_code: String(r.short_code ?? ""),
    card_blurb: String(r.card_blurb ?? ""),
    sort_order: num(r.sort_order),
    page_slug: String(r.page_slug ?? ""),
    page_title: String(r.page_title ?? ""),
    page_summary: String(r.page_summary ?? ""),
  }));

  return {
    ...mapCategory(c),
    section_title: String(c.section_title ?? ""),
    pages,
  };
}

export async function createWikiSection(input: {
  title: string;
  description?: string;
}): Promise<WikiSectionRow> {
  await ensureWikiStructureTables();
  const sql = getSql();
  const title = input.title.trim();
  const description = (input.description ?? "").trim();
  const maxRows = rowsOf(
    await sql`SELECT coalesce(max(sort_order), -1)::int AS m FROM wiki_sections`,
  );
  const sort_order = num(maxRows[0]?.m) + 1;
  const rows = rowsOf(await sql`
    INSERT INTO wiki_sections (title, description, sort_order)
    VALUES (${title}, ${description}, ${sort_order})
    RETURNING id, title, description, sort_order
  `);
  return mapSection(rows[0]!);
}

export async function updateWikiSection(
  id: number,
  input: { title?: string; description?: string; sort_order?: number },
): Promise<WikiSectionRow | null> {
  await ensureWikiStructureTables();
  const sql = getSql();
  const existing = rowsOf(
    await sql`SELECT id, title, description, sort_order FROM wiki_sections WHERE id = ${id} LIMIT 1`,
  )[0];
  if (!existing) return null;
  const title =
    input.title !== undefined ? input.title.trim() : String(existing.title);
  const description =
    input.description !== undefined
      ? input.description.trim()
      : String(existing.description);
  const sort_order =
    input.sort_order !== undefined ? input.sort_order : num(existing.sort_order);
  const rows = rowsOf(await sql`
    UPDATE wiki_sections
    SET title = ${title}, description = ${description}, sort_order = ${sort_order}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, title, description, sort_order
  `);
  return rows[0] ? mapSection(rows[0]) : null;
}

export async function deleteWikiSection(id: number): Promise<boolean> {
  await ensureWikiStructureTables();
  const sql = getSql();
  await sql`DELETE FROM wiki_sections WHERE id = ${id}`;
  return true;
}

export async function createWikiCategory(input: {
  section_id: number;
  title: string;
  description?: string;
  slug?: string;
}): Promise<{ ok: true; category: WikiCategoryRow } | { ok: false; error: string }> {
  await ensureWikiStructureTables();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Потрібна назва блоку." };
  const slug = normalizeWikiSlug(input.slug || wikiSlugFromTitle(title));
  if (!slug) return { ok: false, error: "Некоректний slug." };
  const sql = getSql();
  const maxRows = rowsOf(await sql`
    SELECT coalesce(max(sort_order), -1)::int AS m
    FROM wiki_categories WHERE section_id = ${input.section_id}
  `);
  const sort_order = num(maxRows[0]?.m) + 1;
  try {
    const rows = rowsOf(await sql`
      INSERT INTO wiki_categories (section_id, slug, title, description, sort_order)
      VALUES (
        ${input.section_id},
        ${slug},
        ${title},
        ${(input.description ?? "").trim()},
        ${sort_order}
      )
      RETURNING id, section_id, slug, title, description, sort_order
    `);
    return { ok: true, category: mapCategory(rows[0]!) };
  } catch {
    return { ok: false, error: "Блок з таким slug уже існує." };
  }
}

export async function updateWikiCategory(
  id: number,
  input: {
    title?: string;
    description?: string;
    slug?: string;
    sort_order?: number;
    section_id?: number;
  },
): Promise<{ ok: true; category: WikiCategoryRow } | { ok: false; error: string }> {
  await ensureWikiStructureTables();
  const sql = getSql();
  const existing = rowsOf(await sql`
    SELECT id, section_id, slug, title, description, sort_order
    FROM wiki_categories WHERE id = ${id} LIMIT 1
  `)[0];
  if (!existing) return { ok: false, error: "Блок не знайдено." };

  const title =
    input.title !== undefined ? input.title.trim() : String(existing.title);
  const description =
    input.description !== undefined
      ? input.description.trim()
      : String(existing.description);
  const slug =
    input.slug !== undefined
      ? normalizeWikiSlug(input.slug)
      : String(existing.slug);
  const sort_order =
    input.sort_order !== undefined ? input.sort_order : num(existing.sort_order);
  const section_id =
    input.section_id !== undefined ? input.section_id : num(existing.section_id);

  if (!title) return { ok: false, error: "Потрібна назва." };
  if (!slug) return { ok: false, error: "Некоректний slug." };

  try {
    const rows = rowsOf(await sql`
      UPDATE wiki_categories
      SET
        section_id = ${section_id},
        slug = ${slug},
        title = ${title},
        description = ${description},
        sort_order = ${sort_order},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, section_id, slug, title, description, sort_order
    `);
    return { ok: true, category: mapCategory(rows[0]!) };
  } catch {
    return { ok: false, error: "Не вдалося оновити (можливо slug зайнятий)." };
  }
}

export async function deleteWikiCategory(id: number): Promise<boolean> {
  await ensureWikiStructureTables();
  const sql = getSql();
  await sql`DELETE FROM wiki_categories WHERE id = ${id}`;
  return true;
}

export async function addPageToCategory(input: {
  category_id: number;
  title: string;
  slug?: string;
  short_code?: string;
  card_blurb?: string;
  content_html?: string;
  userId?: number | null;
}): Promise<
  | { ok: true; page: WikiPageRecord; linkId: number }
  | { ok: false; error: string }
> {
  await ensureWikiStructureTables();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Потрібна назва сторінки." };

  const created = await upsertWikiPage({
    slug: input.slug || wikiSlugFromTitle(title),
    title,
    content_html: input.content_html ?? "<p></p>",
    userId: input.userId ?? null,
    createOnly: false,
  });
  if (!created.ok) return created;

  const sql = getSql();
  const maxRows = rowsOf(await sql`
    SELECT coalesce(max(sort_order), -1)::int AS m
    FROM wiki_category_pages WHERE category_id = ${input.category_id}
  `);
  const sort_order = num(maxRows[0]?.m) + 1;

  try {
    const rows = rowsOf(await sql`
      INSERT INTO wiki_category_pages (
        category_id, page_id, short_code, card_blurb, sort_order
      )
      VALUES (
        ${input.category_id},
        ${created.page.id},
        ${(input.short_code ?? "").trim()},
        ${(input.card_blurb ?? "").trim()},
        ${sort_order}
      )
      ON CONFLICT (category_id, page_id) DO UPDATE SET
        short_code = EXCLUDED.short_code,
        card_blurb = EXCLUDED.card_blurb
      RETURNING id
    `);
    return { ok: true, page: created.page, linkId: num(rows[0]?.id) };
  } catch {
    return { ok: false, error: "Не вдалося додати сторінку до блоку." };
  }
}

export async function linkExistingPageToCategory(input: {
  category_id: number;
  page_id: number;
  short_code?: string;
  card_blurb?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureWikiStructureTables();
  const sql = getSql();
  const maxRows = rowsOf(await sql`
    SELECT coalesce(max(sort_order), -1)::int AS m
    FROM wiki_category_pages WHERE category_id = ${input.category_id}
  `);
  const sort_order = num(maxRows[0]?.m) + 1;
  try {
    await sql`
      INSERT INTO wiki_category_pages (
        category_id, page_id, short_code, card_blurb, sort_order
      )
      VALUES (
        ${input.category_id},
        ${input.page_id},
        ${(input.short_code ?? "").trim()},
        ${(input.card_blurb ?? "").trim()},
        ${sort_order}
      )
      ON CONFLICT (category_id, page_id) DO NOTHING
    `;
    return { ok: true };
  } catch {
    return { ok: false, error: "Не вдалося привʼязати сторінку." };
  }
}

export async function updateCategoryPageLink(
  linkId: number,
  input: { short_code?: string; card_blurb?: string; sort_order?: number },
): Promise<boolean> {
  await ensureWikiStructureTables();
  const sql = getSql();
  const existing = rowsOf(await sql`
    SELECT id, short_code, card_blurb, sort_order FROM wiki_category_pages WHERE id = ${linkId} LIMIT 1
  `)[0];
  if (!existing) return false;
  await sql`
    UPDATE wiki_category_pages SET
      short_code = ${
        input.short_code !== undefined
          ? input.short_code.trim()
          : String(existing.short_code)
      },
      card_blurb = ${
        input.card_blurb !== undefined
          ? input.card_blurb.trim()
          : String(existing.card_blurb)
      },
      sort_order = ${
        input.sort_order !== undefined
          ? input.sort_order
          : num(existing.sort_order)
      }
    WHERE id = ${linkId}
  `;
  return true;
}

export async function removePageFromCategory(linkId: number): Promise<boolean> {
  await ensureWikiStructureTables();
  const sql = getSql();
  await sql`DELETE FROM wiki_category_pages WHERE id = ${linkId}`;
  return true;
}

export async function updateWikiPageMeta(
  slug: string,
  input: {
    title?: string;
    content_html?: string;
    summary?: string;
    social_links?: WikiSocialLink[];
    userId?: number | null;
  },
): Promise<{ ok: true; page: WikiPageRecord } | { ok: false; error: string }> {
  await ensureWikiStructureTables();
  const existing = await getWikiPageBySlug(slug);
  if (!existing) return { ok: false, error: "Сторінку не знайдено." };

  const title = input.title?.trim() || existing.title;
  const content_html =
    input.content_html !== undefined ? input.content_html : existing.content_html;

  const saved = await upsertWikiPage({
    slug: existing.slug,
    title,
    content_html,
    userId: input.userId ?? null,
  });
  if (!saved.ok) return saved;

  const sql = getSql();
  if (input.summary !== undefined || input.social_links !== undefined) {
    const summary =
      input.summary !== undefined ? input.summary.trim() : undefined;
    const social =
      input.social_links !== undefined
        ? serializeSocialLinks(input.social_links)
        : undefined;
    if (summary !== undefined && social !== undefined) {
      await sql`
        UPDATE wiki_pages SET summary = ${summary}, social_links = ${social}
        WHERE id = ${saved.page.id}
      `;
    } else if (summary !== undefined) {
      await sql`
        UPDATE wiki_pages SET summary = ${summary} WHERE id = ${saved.page.id}
      `;
    } else if (social !== undefined) {
      await sql`
        UPDATE wiki_pages SET social_links = ${social} WHERE id = ${saved.page.id}
      `;
    }
  }

  const refreshed = await getWikiPageBySlug(existing.slug);
  return refreshed
    ? { ok: true, page: refreshed }
    : { ok: true, page: saved.page };
}

export async function getWikiPageExtras(slug: string): Promise<{
  summary: string;
  social_links: WikiSocialLink[];
} | null> {
  await ensureWikiStructureTables();
  const normalized = normalizeWikiSlug(slug);
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT summary, social_links FROM wiki_pages
    WHERE lower(slug) = lower(${normalized})
    LIMIT 1
  `);
  const r = rows[0];
  if (!r) return null;
  return {
    summary: String(r.summary ?? ""),
    social_links: parseSocialLinks(r.social_links),
  };
}

/** Початкове дерево з колишньої Main_Page / реєстрів. */
export async function seedWikiStructureIfEmpty(): Promise<{
  seeded: boolean;
  sections: number;
  categories: number;
}> {
  await ensureWikiStructureTables();
  const sql = getSql();
  const countRows = rowsOf(
    await sql`SELECT count(*)::int AS c FROM wiki_sections`,
  );
  if (num(countRows[0]?.c) > 0) {
    return { seeded: false, sections: num(countRows[0]?.c), categories: 0 };
  }

  const blueprint: Array<{
    title: string;
    description?: string;
    categories: Array<{
      title: string;
      description: string;
      slug: string;
      pages?: Array<{ slug: string; short_code?: string; card_blurb?: string }>;
    }>;
  }> = [
    {
      title: "Почати знайомство",
      description: "Основний сюжетний та історичний контекст.",
      categories: [
        {
          title: "Лор серверу",
          description: "Основний сюжетний та історичний контекст.",
          slug: "Лор_серверу",
          pages: [{ slug: "Лор_серверу" }],
        },
        {
          title: "Історія проєкту",
          description: "Хронологія розвитку серверу та ключові події.",
          slug: "Історія_проєкту",
          pages: [{ slug: "Історія_проєкту" }],
        },
      ],
    },
    {
      title: "Основні розділи світу",
      description: "Держави, міста та інші утворення світу Lost Chronicles.",
      categories: [
        {
          title: "Держави",
          description:
            "Про офіційно зареєстровані Держави, їхній устрій та розвиток.",
          slug: "Держави",
          pages: [
            {
              slug: "Домініон_Земана",
              short_code: "ДЗ",
              card_blurb: "Домініон Земана",
            },
            { slug: "Елден", short_code: "Е", card_blurb: "Елден" },
            {
              slug: "КТН",
              short_code: "КТН",
              card_blurb: "КТН",
            },
            {
              slug: "Скальденхейм",
              short_code: "С",
              card_blurb: "Скальденхейм",
            },
            {
              slug: "Сьогунат_Тенші",
              short_code: "СТ",
              card_blurb: "Сьогунат Тенші",
            },
            {
              slug: "Титульна_Імперія_Артолії",
              short_code: "ТІА",
              card_blurb: "Титульна Імперія Артолії",
            },
          ],
        },
        {
          title: "Державні Утворення",
          description:
            "Про державні утворення, що не отримали офіційного статусу Держави на сервері.",
          slug: "Державні_Утворення",
        },
        {
          title: "Мегаполіси",
          description: "Адміністративні центри великих територій.",
          slug: "Мегаполіси",
        },
        {
          title: "Міста",
          description: "Міста, зареєстровані на сервері.",
          slug: "Міста",
        },
        {
          title: "Поселення",
          description: "Малі населені пункти.",
          slug: "Поселення",
        },
        {
          title: "RP новини",
          description: "Актуальні події світу.",
          slug: "RP_новини",
        },
        {
          title: "Гравці",
          description: "Інформація про учасників світу.",
          slug: "Гравці",
        },
      ],
    },
    {
      title: "Довідник цін",
      description: "Інформація про товари, ресурси та встановлені ціни.",
      categories: [
        {
          title: "Довідник цін",
          description:
            "Інформація про товари, ресурси та встановлені ціни на сервері.",
          slug: "Довідник_цін",
          pages: [{ slug: "Довідник_цін" }],
        },
      ],
    },
  ];

  let catCount = 0;
  for (const section of blueprint) {
    const s = await createWikiSection({
      title: section.title,
      description: section.description,
    });
    for (const cat of section.categories) {
      const created = await createWikiCategory({
        section_id: s.id,
        title: cat.title,
        description: cat.description,
        slug: cat.slug,
      });
      if (!created.ok) continue;
      catCount += 1;
      for (const p of cat.pages ?? []) {
        const page = await getWikiPageBySlug(p.slug);
        if (!page) continue;
        await linkExistingPageToCategory({
          category_id: created.category.id,
          page_id: page.id,
          short_code: p.short_code,
          card_blurb: p.card_blurb,
        });
      }
    }
  }

  return { seeded: true, sections: blueprint.length, categories: catCount };
}
