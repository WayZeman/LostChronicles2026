import { getSql } from "@/lib/db";
import { isValidSkinPngDataUrl, type SkinModelType } from "@/lib/minecraft-skin";

function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

let skinsEnsured = false;

async function ensureSkinsTables(): Promise<void> {
  if (skinsEnsured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS skins (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      title VARCHAR(80) NOT NULL DEFAULT 'Без назви',
      model_type VARCHAR(10) NOT NULL DEFAULT 'classic'
        CHECK (model_type IN ('classic', 'slim')),
      png_data TEXT NOT NULL,
      likes_count INTEGER NOT NULL DEFAULT 0,
      downloads_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS skins_created_at_idx ON skins (created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS skins_user_id_idx ON skins (user_id)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS skin_likes (
      skin_id INTEGER NOT NULL REFERENCES skins (id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (skin_id, user_id)
    )
  `;
  skinsEnsured = true;
}

export type SkinListItem = {
  id: number;
  title: string;
  model_type: SkinModelType;
  png_data: string;
  likes_count: number;
  downloads_count: number;
  created_at: Date;
  author_username: string;
  author_id: number;
  liked_by_me: boolean;
};

function mapSkinRow(r: Record<string, unknown>): SkinListItem {
  const model = String(r.model_type ?? "classic");
  return {
    id: Number(r.id),
    title: String(r.title ?? "Без назви"),
    model_type: model === "slim" ? "slim" : "classic",
    png_data: String(r.png_data ?? ""),
    likes_count: Number(r.likes_count ?? 0),
    downloads_count: Number(r.downloads_count ?? 0),
    created_at: new Date(String(r.created_at)),
    author_username: String(r.author_username ?? "Гравець"),
    author_id: Number(r.author_id ?? r.user_id ?? 0),
    liked_by_me: Boolean(r.liked_by_me),
  };
}

export async function listSkins(params: {
  limit: number;
  offset?: number;
  viewerUserId: number | null;
}): Promise<SkinListItem[]> {
  await ensureSkinsTables();
  const sql = getSql();
  const limit = Math.min(Math.max(params.limit, 1), 60);
  const offset = Math.max(params.offset ?? 0, 0);
  const viewer = params.viewerUserId;

  const rows = rowsOf(
    viewer
      ? await sql`
          SELECT
            s.id,
            s.user_id,
            s.title,
            s.model_type,
            s.png_data,
            s.likes_count,
            s.downloads_count,
            s.created_at,
            COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
            s.user_id AS author_id,
            EXISTS (
              SELECT 1 FROM skin_likes sl
              WHERE sl.skin_id = s.id AND sl.user_id = ${viewer}
            ) AS liked_by_me
          FROM skins s
          JOIN users u ON u.id = s.user_id
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await sql`
          SELECT
            s.id,
            s.user_id,
            s.title,
            s.model_type,
            s.png_data,
            s.likes_count,
            s.downloads_count,
            s.created_at,
            COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
            s.user_id AS author_id,
            FALSE AS liked_by_me
          FROM skins s
          JOIN users u ON u.id = s.user_id
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
  );

  return rows.map(mapSkinRow);
}

export async function countSkins(): Promise<number> {
  await ensureSkinsTables();
  const sql = getSql();
  const rows = rowsOf(await sql`SELECT COUNT(*)::int AS c FROM skins`);
  return Number(rows[0]?.c ?? 0);
}

export async function getSkinById(
  id: number,
  viewerUserId: number | null,
): Promise<SkinListItem | null> {
  await ensureSkinsTables();
  const sql = getSql();
  const viewer = viewerUserId;
  const rows = rowsOf(
    viewer
      ? await sql`
          SELECT
            s.id,
            s.user_id,
            s.title,
            s.model_type,
            s.png_data,
            s.likes_count,
            s.downloads_count,
            s.created_at,
            COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
            s.user_id AS author_id,
            EXISTS (
              SELECT 1 FROM skin_likes sl
              WHERE sl.skin_id = s.id AND sl.user_id = ${viewer}
            ) AS liked_by_me
          FROM skins s
          JOIN users u ON u.id = s.user_id
          WHERE s.id = ${id}
          LIMIT 1
        `
      : await sql`
          SELECT
            s.id,
            s.user_id,
            s.title,
            s.model_type,
            s.png_data,
            s.likes_count,
            s.downloads_count,
            s.created_at,
            COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
            s.user_id AS author_id,
            FALSE AS liked_by_me
          FROM skins s
          JOIN users u ON u.id = s.user_id
          WHERE s.id = ${id}
          LIMIT 1
        `,
  );
  const r = rows[0];
  return r ? mapSkinRow(r) : null;
}

export async function createSkin(params: {
  userId: number;
  title: string;
  modelType: SkinModelType;
  pngData: string;
}): Promise<SkinListItem> {
  await ensureSkinsTables();
  if (!isValidSkinPngDataUrl(params.pngData)) {
    throw new Error("Невірний формат скіна (потрібен PNG 64×64).");
  }
  const title = params.title.trim().slice(0, 80) || "Без назви";
  const model: SkinModelType =
    params.modelType === "slim" ? "slim" : "classic";
  const sql = getSql();
  const rows = rowsOf(
    await sql`
      INSERT INTO skins (user_id, title, model_type, png_data)
      VALUES (${params.userId}, ${title}, ${model}, ${params.pngData})
      RETURNING id
    `,
  );
  const id = Number(rows[0]?.id);
  const created = await getSkinById(id, params.userId);
  if (!created) throw new Error("Не вдалося створити скін.");
  return created;
}

export async function toggleSkinLike(
  skinId: number,
  userId: number,
): Promise<{ liked: boolean; likes_count: number }> {
  await ensureSkinsTables();
  const sql = getSql();
  const existing = rowsOf(
    await sql`
      SELECT 1 AS ok FROM skin_likes
      WHERE skin_id = ${skinId} AND user_id = ${userId}
      LIMIT 1
    `,
  );
  if (existing[0]) {
    await sql`
      DELETE FROM skin_likes
      WHERE skin_id = ${skinId} AND user_id = ${userId}
    `;
    await sql`
      UPDATE skins
      SET likes_count = GREATEST(likes_count - 1, 0)
      WHERE id = ${skinId}
    `;
  } else {
    await sql`
      INSERT INTO skin_likes (skin_id, user_id)
      VALUES (${skinId}, ${userId})
      ON CONFLICT DO NOTHING
    `;
    await sql`
      UPDATE skins
      SET likes_count = likes_count + 1
      WHERE id = ${skinId}
    `;
  }
  const rows = rowsOf(
    await sql`
      SELECT likes_count,
        EXISTS (
          SELECT 1 FROM skin_likes
          WHERE skin_id = ${skinId} AND user_id = ${userId}
        ) AS liked
      FROM skins WHERE id = ${skinId} LIMIT 1
    `,
  );
  const r = rows[0];
  if (!r) throw new Error("Скін не знайдено.");
  return {
    liked: Boolean(r.liked),
    likes_count: Number(r.likes_count ?? 0),
  };
}

export async function recordSkinDownload(
  skinId: number,
): Promise<{ png_data: string; title: string } | null> {
  await ensureSkinsTables();
  const sql = getSql();
  const rows = rowsOf(
    await sql`
      UPDATE skins
      SET downloads_count = downloads_count + 1
      WHERE id = ${skinId}
      RETURNING png_data, title
    `,
  );
  const r = rows[0];
  if (!r) return null;
  return {
    png_data: String(r.png_data ?? ""),
    title: String(r.title ?? "skin"),
  };
}
