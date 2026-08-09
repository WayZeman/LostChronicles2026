import { getSql } from "@/lib/db";

export type ApplicationInput = {
  email: string;
  nickname: string;
  birthday: string;
  age: string;
  contacts: string;
  experience: string;
  previousProjects: string;
  whyServer: string;
  howFound: string;
};

export type ApplicationRow = ApplicationInput & {
  id: number;
  createdAt: string;
};

function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

let ensured = false;

async function ensureApplicationsTable(): Promise<void> {
  if (ensured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL DEFAULT '',
      nickname TEXT NOT NULL,
      birthday TEXT,
      age TEXT NOT NULL DEFAULT '',
      contacts TEXT NOT NULL,
      experience TEXT NOT NULL DEFAULT '',
      previous_projects TEXT NOT NULL DEFAULT '',
      why_server TEXT NOT NULL DEFAULT '',
      how_found TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS applications_created_at_idx
      ON applications (created_at DESC)
  `;
  ensured = true;
}

function mapRow(row: Record<string, unknown>): ApplicationRow {
  return {
    id: Number(row.id),
    email: String(row.email ?? ""),
    nickname: String(row.nickname ?? ""),
    birthday: String(row.birthday ?? ""),
    age: String(row.age ?? ""),
    contacts: String(row.contacts ?? ""),
    experience: String(row.experience ?? ""),
    previousProjects: String(row.previousProjects ?? ""),
    whyServer: String(row.whyServer ?? ""),
    howFound: String(row.howFound ?? ""),
    createdAt: String(row.createdAt ?? ""),
  };
}

export async function createApplication(
  input: ApplicationInput,
): Promise<ApplicationRow> {
  await ensureApplicationsTable();
  const sql = getSql();
  const rows = rowsOf(await sql`
    INSERT INTO applications (
      email,
      nickname,
      birthday,
      age,
      contacts,
      experience,
      previous_projects,
      why_server,
      how_found
    )
    VALUES (
      ${input.email},
      ${input.nickname},
      ${input.birthday || null},
      ${input.age},
      ${input.contacts},
      ${input.experience},
      ${input.previousProjects},
      ${input.whyServer},
      ${input.howFound}
    )
    RETURNING
      id,
      email,
      nickname,
      COALESCE(birthday, '') AS birthday,
      age,
      contacts,
      experience,
      previous_projects AS "previousProjects",
      why_server AS "whyServer",
      how_found AS "howFound",
      created_at AS "createdAt"
  `);
  const row = rows[0];
  if (!row) throw new Error("Failed to insert application");
  return mapRow(row);
}

export async function listApplications(limit = 50): Promise<ApplicationRow[]> {
  await ensureApplicationsTable();
  const sql = getSql();
  const safeLimit = Math.min(200, Math.max(1, Math.floor(limit)));
  const rows = rowsOf(await sql`
    SELECT
      id,
      email,
      nickname,
      COALESCE(birthday, '') AS birthday,
      age,
      contacts,
      experience,
      previous_projects AS "previousProjects",
      why_server AS "whyServer",
      how_found AS "howFound",
      created_at AS "createdAt"
    FROM applications
    ORDER BY id DESC
    LIMIT ${safeLimit}
  `);
  return rows.map(mapRow);
}

export async function getApplicationById(
  id: number,
): Promise<ApplicationRow | null> {
  await ensureApplicationsTable();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      id,
      email,
      nickname,
      COALESCE(birthday, '') AS birthday,
      age,
      contacts,
      experience,
      previous_projects AS "previousProjects",
      why_server AS "whyServer",
      how_found AS "howFound",
      created_at AS "createdAt"
    FROM applications
    WHERE id = ${id}
    LIMIT 1
  `);
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function deleteApplication(id: number): Promise<boolean> {
  await ensureApplicationsTable();
  const sql = getSql();
  const rows = rowsOf(await sql`
    DELETE FROM applications WHERE id = ${id} RETURNING id
  `);
  return rows.length > 0;
}

export async function countApplications(): Promise<number> {
  await ensureApplicationsTable();
  const sql = getSql();
  const rows = rowsOf(await sql`SELECT COUNT(*)::int AS c FROM applications`);
  return Number(rows[0]?.c ?? 0);
}
