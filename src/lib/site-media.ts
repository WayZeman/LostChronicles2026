import { randomUUID } from "crypto";
import { getSql } from "@/lib/db";

function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

let mediaEnsured = false;

const DATA_URL_RE =
  /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i;

async function ensureMediaTable(): Promise<void> {
  if (mediaEnsured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS site_media (
      id VARCHAR(40) PRIMARY KEY,
      mime_type VARCHAR(64) NOT NULL,
      data_base64 TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  mediaEnsured = true;
}

export function isMediaId(id: string): boolean {
  return /^[a-f0-9]{32}$/i.test(id);
}

/** Зберігає data URL і повертає короткий шлях `/api/media/{id}`. */
export async function storeDataUrlAsMedia(dataUrl: string): Promise<string> {
  await ensureMediaTable();
  const m = dataUrl.trim().match(DATA_URL_RE);
  if (!m) {
    throw new Error("Непідтримуваний формат зображення.");
  }
  const mime = m[1]!.toLowerCase().replace("image/jpg", "image/jpeg");
  const b64 = m[2]!;
  if (b64.length > 1_050_000) {
    throw new Error("Фото занадто велике.");
  }
  const id = randomUUID().replace(/-/g, "");
  const sql = getSql();
  await sql`
    INSERT INTO site_media (id, mime_type, data_base64)
    VALUES (${id}, ${mime}, ${b64})
  `;
  return `/api/media/${id}`;
}

export async function getMediaById(
  id: string,
): Promise<{ mime: string; buffer: Buffer } | null> {
  if (!isMediaId(id)) return null;
  await ensureMediaTable();
  const sql = getSql();
  const rows = rowsOf(
    await sql`
      SELECT mime_type, data_base64
      FROM site_media
      WHERE id = ${id}
      LIMIT 1
    `,
  );
  const r = rows[0];
  if (!r) return null;
  return {
    mime: String(r.mime_type ?? "image/jpeg"),
    buffer: Buffer.from(String(r.data_base64 ?? ""), "base64"),
  };
}
