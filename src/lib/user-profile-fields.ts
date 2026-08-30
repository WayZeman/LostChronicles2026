import { getSql } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

function rowsOf(r: unknown): Record<string, unknown>[] {
  if (Array.isArray(r)) return r as Record<string, unknown>[];
  if (r && typeof r === "object" && "rows" in r) {
    const rows = (r as { rows?: unknown }).rows;
    if (Array.isArray(rows)) return rows as Record<string, unknown>[];
  }
  return [];
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

async function ensureUserProfileSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS profile_age TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS profile_birthday TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS profile_bio TEXT NOT NULL DEFAULT ''
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export type UserProfileFields = {
  age: string;
  birthday: string;
  bio: string;
};

export async function getUserProfileFields(
  userId: number,
): Promise<UserProfileFields> {
  await ensureUserProfileSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT profile_age, profile_birthday, profile_bio
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `);
  const r = rows[0];
  if (!r) return { age: "", birthday: "", bio: "" };
  return {
    age: str(r.profile_age),
    birthday: str(r.profile_birthday),
    bio: str(r.profile_bio),
  };
}

export async function updateUserProfileFields(params: {
  userId: number;
  age?: string;
  birthday?: string;
  bio?: string;
}): Promise<void> {
  await ensureUserProfileSchema();
  const sql = getSql();
  const current = await getUserProfileFields(params.userId);
  const age = (params.age ?? current.age).trim().slice(0, 8);
  const birthday = (params.birthday ?? current.birthday).trim().slice(0, 32);
  const bio = (params.bio ?? current.bio).trim().slice(0, 2000);
  await sql`
    UPDATE users
    SET
      profile_age = ${age},
      profile_birthday = ${birthday},
      profile_bio = ${bio}
    WHERE id = ${params.userId}
  `;
}
