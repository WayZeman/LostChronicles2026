import { getSql } from "@/lib/db";
import { canEditWiki, normalizeRole, type UserRole } from "@/lib/admin-role";
import { getUserRole } from "@/lib/site-content";

function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

let wikiEnsured = false;

const MAX_REVISIONS_PER_PAGE = 50;
const MAX_CONTENT_CHARS = 1_500_000;
const MAX_TITLE_LEN = 255;
const MAX_SLUG_LEN = 255;

export type WikiPageRecord = {
  id: number;
  slug: string;
  title: string;
  content_html: string;
  summary: string;
  social_links_raw: string;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
};

export type WikiPageSummary = {
  id: number;
  slug: string;
  title: string;
  updated_at: string;
};

export type WikiSearchHit = {
  title: string;
  slug: string;
  snippet: string;
  href: string;
};

/** Slug у URL ↔ title (пробіли як _). */
export function wikiSlugFromTitle(title: string): string {
  return title.trim().replace(/\s+/g, "_").slice(0, MAX_SLUG_LEN);
}

export function wikiTitleFromSlug(slug: string): string {
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    /* raw */
  }
  return s.replace(/_/g, " ").trim();
}

export function normalizeWikiSlug(raw: string): string {
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep */
  }
  return s.replace(/\s+/g, "_").replace(/^\/+|\/+$/g, "").slice(0, MAX_SLUG_LEN);
}

export async function ensureWikiTables(): Promise<void> {
  if (wikiEnsured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS wiki_pages (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content_html TEXT NOT NULL DEFAULT '',
      created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT wiki_pages_slug_uidx UNIQUE (slug)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS wiki_pages_title_idx ON wiki_pages (lower(title))
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS wiki_pages_updated_idx ON wiki_pages (updated_at DESC)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS wiki_revisions (
      id SERIAL PRIMARY KEY,
      page_id INTEGER NOT NULL REFERENCES wiki_pages (id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content_html TEXT NOT NULL,
      edited_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS wiki_revisions_page_idx
    ON wiki_revisions (page_id, created_at DESC)
  `;
  await sql`
    ALTER TABLE wiki_pages
    ADD COLUMN IF NOT EXISTS social_links TEXT NOT NULL DEFAULT '[]'
  `;
  await sql`
    ALTER TABLE wiki_pages
    ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT ''
  `;
  wikiEnsured = true;
}

function mapPage(r: Record<string, unknown>): WikiPageRecord {
  return {
    id: num(r.id),
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    content_html: String(r.content_html ?? ""),
    summary: String(r.summary ?? ""),
    social_links_raw: String(r.social_links ?? "[]"),
    created_by: r.created_by == null ? null : num(r.created_by),
    updated_by: r.updated_by == null ? null : num(r.updated_by),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  };
}

export async function requireWikiEditorUserId(
  userId: number | null,
): Promise<number | null> {
  if (!userId) return null;
  const role = await getUserRole(userId);
  return canEditWiki(role) ? userId : null;
}

export async function getWikiPageBySlug(
  slug: string,
): Promise<WikiPageRecord | null> {
  await ensureWikiTables();
  const normalized = normalizeWikiSlug(slug);
  if (!normalized) return null;
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT id, slug, title, content_html,
           coalesce(summary, '') AS summary,
           coalesce(social_links, '[]') AS social_links,
           created_by, updated_by, created_at, updated_at
    FROM wiki_pages
    WHERE lower(slug) = lower(${normalized})
    LIMIT 1
  `);
  const r = rows[0];
  return r ? mapPage(r) : null;
}

export async function listWikiPages(limit = 200): Promise<WikiPageSummary[]> {
  await ensureWikiTables();
  const sql = getSql();
  const lim = Math.min(Math.max(limit, 1), 500);
  const rows = rowsOf(await sql`
    SELECT id, slug, title, updated_at
    FROM wiki_pages
    ORDER BY lower(title) ASC
    LIMIT ${lim}
  `);
  return rows.map((r) => ({
    id: num(r.id),
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    updated_at: String(r.updated_at ?? ""),
  }));
}

export async function countWikiPages(): Promise<number> {
  await ensureWikiTables();
  const sql = getSql();
  const rows = rowsOf(await sql`SELECT count(*)::int AS c FROM wiki_pages`);
  return num(rows[0]?.c);
}

function stripHtmlSnippet(html: string, maxLen = 160): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

export async function searchWikiPages(
  query: string,
  limit = 8,
): Promise<WikiSearchHit[]> {
  await ensureWikiTables();
  const q = query.trim();
  if (q.length < 2) return [];
  const sql = getSql();
  const lim = Math.min(Math.max(limit, 1), 20);
  const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const rows = rowsOf(await sql`
    SELECT slug, title, content_html
    FROM wiki_pages
    WHERE title ILIKE ${like} ESCAPE '\\'
       OR content_html ILIKE ${like} ESCAPE '\\'
    ORDER BY
      CASE WHEN title ILIKE ${like} ESCAPE '\\' THEN 0 ELSE 1 END,
      lower(title) ASC
    LIMIT ${lim}
  `);
  return rows.map((r) => {
    const title = String(r.title ?? "");
    const slug = String(r.slug ?? "");
    return {
      title,
      slug,
      snippet: stripHtmlSnippet(String(r.content_html ?? "")),
      href: `/wiki/${encodeURIComponent(slug)}`,
    };
  });
}

async function trimRevisions(pageId: number): Promise<void> {
  const sql = getSql();
  await sql`
    DELETE FROM wiki_revisions
    WHERE id IN (
      SELECT id FROM wiki_revisions
      WHERE page_id = ${pageId}
      ORDER BY created_at DESC
      OFFSET ${MAX_REVISIONS_PER_PAGE}
    )
  `;
}

async function insertRevision(
  pageId: number,
  title: string,
  contentHtml: string,
  editedBy: number | null,
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO wiki_revisions (page_id, title, content_html, edited_by)
    VALUES (${pageId}, ${title}, ${contentHtml}, ${editedBy})
  `;
  await trimRevisions(pageId);
}

function validateTitleContent(
  title: string,
  contentHtml: string,
): string | null {
  const t = title.trim();
  if (!t) return "Потрібна назва сторінки.";
  if (t.length > MAX_TITLE_LEN) return "Назва занадто довга.";
  if (contentHtml.length > MAX_CONTENT_CHARS) {
    return "Вміст занадто великий.";
  }
  return null;
}

export async function upsertWikiPage(input: {
  slug: string;
  title: string;
  content_html: string;
  userId: number | null;
  createOnly?: boolean;
}): Promise<{ ok: true; page: WikiPageRecord } | { ok: false; error: string }> {
  await ensureWikiTables();
  const slug = normalizeWikiSlug(input.slug || wikiSlugFromTitle(input.title));
  if (!slug) return { ok: false, error: "Некоректний slug." };
  const title = input.title.trim().slice(0, MAX_TITLE_LEN);
  const content_html = input.content_html ?? "";
  const err = validateTitleContent(title, content_html);
  if (err) return { ok: false, error: err };

  const existing = await getWikiPageBySlug(slug);
  if (input.createOnly && existing) {
    return { ok: false, error: "Сторінка з таким slug уже існує." };
  }

  const sql = getSql();
  if (existing) {
    await insertRevision(
      existing.id,
      existing.title,
      existing.content_html,
      existing.updated_by,
    );
    const rows = rowsOf(await sql`
      UPDATE wiki_pages
      SET
        title = ${title},
        content_html = ${content_html},
        updated_by = ${input.userId},
        updated_at = NOW()
      WHERE id = ${existing.id}
      RETURNING id, slug, title, content_html,
        coalesce(summary, '') AS summary,
        coalesce(social_links, '[]') AS social_links,
        created_by, updated_by, created_at, updated_at
    `);
    const page = rows[0] ? mapPage(rows[0]) : null;
    if (!page) return { ok: false, error: "Не вдалося оновити сторінку." };
    return { ok: true, page };
  }

  const rows = rowsOf(await sql`
    INSERT INTO wiki_pages (slug, title, content_html, created_by, updated_by)
    VALUES (${slug}, ${title}, ${content_html}, ${input.userId}, ${input.userId})
    RETURNING id, slug, title, content_html,
      coalesce(summary, '') AS summary,
      coalesce(social_links, '[]') AS social_links,
      created_by, updated_by, created_at, updated_at
  `);
  const page = rows[0] ? mapPage(rows[0]) : null;
  if (!page) return { ok: false, error: "Не вдалося створити сторінку." };
  await insertRevision(page.id, page.title, page.content_html, input.userId);
  return { ok: true, page };
}

/** Імпорт без запису revision на кожну сторінку (швидший seed). */
export async function importWikiPageSeed(input: {
  slug: string;
  title: string;
  content_html: string;
}): Promise<"inserted" | "updated" | "skipped"> {
  await ensureWikiTables();
  const slug = normalizeWikiSlug(input.slug);
  if (!slug) return "skipped";
  const title = input.title.trim().slice(0, MAX_TITLE_LEN) || wikiTitleFromSlug(slug);
  const content_html = input.content_html ?? "";
  if (content_html.length > MAX_CONTENT_CHARS) return "skipped";

  const sql = getSql();
  const existing = await getWikiPageBySlug(slug);
  if (existing) {
    await sql`
      UPDATE wiki_pages
      SET
        title = ${title},
        content_html = ${content_html},
        updated_at = NOW()
      WHERE id = ${existing.id}
    `;
    return "updated";
  }
  await sql`
    INSERT INTO wiki_pages (slug, title, content_html)
    VALUES (${slug}, ${title}, ${content_html})
  `;
  return "inserted";
}

export async function deleteWikiPage(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureWikiTables();
  const page = await getWikiPageBySlug(slug);
  if (!page) return { ok: false, error: "Сторінку не знайдено." };
  const sql = getSql();
  await sql`DELETE FROM wiki_pages WHERE id = ${page.id}`;
  return { ok: true };
}

export function assertAssignableRole(raw: unknown): UserRole | null {
  const v = String(raw ?? "")
    .toLowerCase()
    .trim();
  if (v === "admin" || v === "wiki_editor" || v === "user") {
    return normalizeRole(v);
  }
  return null;
}
