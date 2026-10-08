import { isAdminRole } from "@/lib/admin-role";
import { getSql } from "@/lib/db";
import type { SkinModelType } from "@/lib/minecraft-skin";
import { validateMinecraftSkinDataUrl } from "@/lib/minecraft-skin-png";
import { buildDemoSkinPresets } from "@/lib/skin-demo-presets";

function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

let skinsEnsured = false;
let demoSeedAttempted = false;

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

/**
 * Seed v4: якщо ще немає офіційних демо — очищає галерею і вставляє
 * поточний набір тестових скінів (з alpha / 3D overlay).
 */
export async function ensureDemoSkins(): Promise<void> {
  if (demoSeedAttempted) return;
  demoSeedAttempted = true;
  await ensureSkinsTables();
  const sql = getSql();
  const marker = rowsOf(
    await sql`
      SELECT 1 AS ok FROM skins
      WHERE title = ${"Жовтий смокінг"}
      LIMIT 1
    `,
  );
  if (marker[0]) return;

  const ownerRows = rowsOf(
    await sql`
      SELECT id FROM users
      WHERE role = 'admin'
      ORDER BY id ASC
      LIMIT 1
    `,
  );
  let ownerId = Number(ownerRows[0]?.id ?? 0);
  if (!ownerId) {
    const any = rowsOf(await sql`SELECT id FROM users ORDER BY id ASC LIMIT 1`);
    ownerId = Number(any[0]?.id ?? 0);
  }
  if (!ownerId) return;

  // Заміна старих тестових скінів на новий набір
  await sql`DELETE FROM skins`;

  const presets = buildDemoSkinPresets();
  for (const p of presets) {
    try {
      const png = validateMinecraftSkinDataUrl(p.png_data);
      await sql`
        INSERT INTO skins (user_id, title, model_type, png_data)
        VALUES (${ownerId}, ${p.title}, ${p.model_type}, ${png})
      `;
    } catch {
      /* skip broken preset */
    }
  }
}

export async function listSkins(params: {
  limit: number;
  offset?: number;
  viewerUserId: number | null;
}): Promise<SkinListItem[]> {
  await ensureSkinsTables();
  await ensureDemoSkins();
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
  await ensureDemoSkins();
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
  let png: string;
  try {
    png = validateMinecraftSkinDataUrl(params.pngData);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "Невірний PNG скіна (потрібен 64×64).",
    );
  }
  const title = params.title.trim().slice(0, 80) || "Без назви";
  const model: SkinModelType =
    params.modelType === "slim" ? "slim" : "classic";
  const sql = getSql();
  const rows = rowsOf(
    await sql`
      INSERT INTO skins (user_id, title, model_type, png_data)
      VALUES (${params.userId}, ${title}, ${model}, ${png})
      RETURNING id
    `,
  );
  const id = Number(rows[0]?.id);
  const created = await getSkinById(id, params.userId);
  if (!created) throw new Error("Не вдалося створити скін.");
  return created;
}

export async function deleteSkin(params: {
  skinId: number;
  actorUserId: number;
  actorIsAdmin: boolean;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  await ensureSkinsTables();
  const sql = getSql();
  const rows = rowsOf(
    await sql`
      SELECT user_id FROM skins WHERE id = ${params.skinId} LIMIT 1
    `,
  );
  const ownerId = Number(rows[0]?.user_id ?? 0);
  if (!ownerId) {
    return { ok: false, error: "Скін не знайдено", status: 404 };
  }
  if (!params.actorIsAdmin && ownerId !== params.actorUserId) {
    return { ok: false, error: "Немає прав на видалення", status: 403 };
  }
  await sql`DELETE FROM skins WHERE id = ${params.skinId}`;
  return { ok: true };
}

export async function canUserDeleteSkin(
  skinAuthorId: number,
  viewerUserId: number | null,
  viewerRole: string | null | undefined,
): Promise<boolean> {
  if (!viewerUserId) return false;
  if (viewerUserId === skinAuthorId) return true;
  return isAdminRole(viewerRole);
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
  const raw = String(r.png_data ?? "");
  try {
    return {
      png_data: validateMinecraftSkinDataUrl(raw),
      title: String(r.title ?? "skin"),
    };
  } catch {
    return {
      png_data: raw,
      title: String(r.title ?? "skin"),
    };
  }
}
