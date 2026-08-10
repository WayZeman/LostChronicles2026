import { getSql } from "@/lib/db";
import type { ApplyQuestion } from "@/lib/application-form-config";
import {
  formatAnswerValue,
  pickAnswerByLabelHint,
} from "@/lib/application-form-config";

export type ApplicationAnswers = Record<string, string | string[]>;

export type ApplicationRow = {
  id: number;
  createdAt: string;
  answers: ApplicationAnswers;
  /** Зручні підсумки для списку */
  nickname: string;
  contacts: string;
  email: string;
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
      nickname TEXT NOT NULL DEFAULT '',
      birthday TEXT,
      age TEXT NOT NULL DEFAULT '',
      contacts TEXT NOT NULL DEFAULT '',
      experience TEXT NOT NULL DEFAULT '',
      previous_projects TEXT NOT NULL DEFAULT '',
      why_server TEXT NOT NULL DEFAULT '',
      how_found TEXT NOT NULL DEFAULT '',
      answers_json TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS answers_json TEXT NOT NULL DEFAULT '{}'
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS applications_created_at_idx
      ON applications (created_at DESC)
  `;
  ensured = true;
}

function parseAnswersJson(raw: unknown): ApplicationAnswers {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: ApplicationAnswers = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
      else if (Array.isArray(v)) {
        out[k] = v.map((x) => String(x)).filter(Boolean);
      }
    }
    return out;
  } catch {
    return {};
  }
}

function legacyAnswersFromRow(row: Record<string, unknown>): ApplicationAnswers {
  const map: Record<string, string> = {
    q_email: String(row.email ?? ""),
    q_nickname: String(row.nickname ?? ""),
    q_birthday: String(row.birthday ?? ""),
    q_age: String(row.age ?? ""),
    q_contacts: String(row.contacts ?? ""),
    q_experience: String(row.experience ?? ""),
    q_previous: String(row.previousProjects ?? row.previous_projects ?? ""),
    q_why: String(row.whyServer ?? row.why_server ?? ""),
    q_how: String(row.howFound ?? row.how_found ?? ""),
  };
  const out: ApplicationAnswers = {};
  for (const [k, v] of Object.entries(map)) {
    if (v.trim()) out[k] = v;
  }
  return out;
}

function summarize(
  answers: ApplicationAnswers,
  questions: ApplyQuestion[] | null,
  row: Record<string, unknown>,
): Pick<ApplicationRow, "nickname" | "contacts" | "email"> {
  if (questions && questions.length > 0) {
    return {
      nickname:
        pickAnswerByLabelHint(questions, answers, [
          /нік|nickname|ігрове/i,
        ]) || String(row.nickname ?? ""),
      contacts:
        pickAnswerByLabelHint(questions, answers, [
          /телеграм|discord|діскорд|контакт/i,
        ]) || String(row.contacts ?? ""),
      email:
        pickAnswerByLabelHint(questions, answers, [/email|пошта|електронн/i]) ||
        String(row.email ?? ""),
    };
  }
  return {
    nickname: String(row.nickname ?? ""),
    contacts: String(row.contacts ?? ""),
    email: String(row.email ?? ""),
  };
}

function mapRow(
  row: Record<string, unknown>,
  questions: ApplyQuestion[] | null = null,
): ApplicationRow {
  let answers = parseAnswersJson(row.answers_json ?? row.answersJson);
  if (Object.keys(answers).length === 0) {
    answers = legacyAnswersFromRow(row);
  }
  const summary = summarize(answers, questions, row);
  return {
    id: Number(row.id),
    createdAt: String(row.createdAt ?? row.created_at ?? ""),
    answers,
    ...summary,
  };
}

export function answersToTelegramLines(
  questions: ApplyQuestion[],
  answers: ApplicationAnswers,
): string[] {
  const lines: string[] = [];
  for (const q of questions) {
    if (!q.enabled) continue;
    const raw = answers[q.id];
    const val = formatAnswerValue(raw);
    if (val === "—" && !q.required) continue;
    lines.push(`▪️ ${q.label}: ${val}`);
  }
  return lines;
}

export async function createApplication(input: {
  answers: ApplicationAnswers;
  questions: ApplyQuestion[];
}): Promise<ApplicationRow> {
  await ensureApplicationsTable();
  const sql = getSql();
  const summary = summarize(input.answers, input.questions, {});
  const answersJson = JSON.stringify(input.answers);

  const rows = rowsOf(await sql`
    INSERT INTO applications (
      email,
      nickname,
      contacts,
      answers_json
    )
    VALUES (
      ${summary.email},
      ${summary.nickname || "—"},
      ${summary.contacts},
      ${answersJson}
    )
    RETURNING
      id,
      email,
      nickname,
      contacts,
      answers_json,
      created_at AS "createdAt"
  `);
  const row = rows[0];
  if (!row) throw new Error("Failed to insert application");
  return mapRow(row, input.questions);
}

export async function listApplications(
  limit = 50,
  questions: ApplyQuestion[] | null = null,
): Promise<ApplicationRow[]> {
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
      answers_json,
      created_at AS "createdAt"
    FROM applications
    ORDER BY id DESC
    LIMIT ${safeLimit}
  `);
  return rows.map((r) => mapRow(r, questions));
}

export async function getApplicationById(
  id: number,
  questions: ApplyQuestion[] | null = null,
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
      answers_json,
      created_at AS "createdAt"
    FROM applications
    WHERE id = ${id}
    LIMIT 1
  `);
  const row = rows[0];
  return row ? mapRow(row, questions) : null;
}

/**
 * № за порядком як у Google Form: 1 = найстаріша, N = остання.
 */
export async function getApplicationByOrdinal(
  ordinal: number,
  questions: ApplyQuestion[] | null = null,
): Promise<{ row: ApplicationRow; ordinal: number; total: number } | null> {
  await ensureApplicationsTable();
  const total = await countApplications();
  if (total < 1 || ordinal < 1 || ordinal > total) return null;
  const sql = getSql();
  const offset = ordinal - 1;
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
      answers_json,
      created_at AS "createdAt"
    FROM applications
    ORDER BY id ASC
    LIMIT 1
    OFFSET ${offset}
  `);
  const row = rows[0];
  if (!row) return null;
  return { row: mapRow(row, questions), ordinal, total };
}

export async function getLastApplicationOrdinal(
  questions: ApplyQuestion[] | null = null,
): Promise<{ row: ApplicationRow; ordinal: number; total: number } | null> {
  const total = await countApplications();
  if (total < 1) return null;
  return getApplicationByOrdinal(total, questions);
}

export async function getOrdinalForApplicationId(
  id: number,
): Promise<{ ordinal: number; total: number } | null> {
  await ensureApplicationsTable();
  const total = await countApplications();
  if (total < 1) return null;
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT COUNT(*)::int AS c FROM applications WHERE id <= ${id}
  `);
  const ordinal = Number(rows[0]?.c ?? 0);
  if (ordinal < 1) return null;
  return { ordinal, total };
}

export async function deleteApplication(id: number): Promise<boolean> {
  await ensureApplicationsTable();
  const sql = getSql();
  const rows = rowsOf(await sql`
    DELETE FROM applications WHERE id = ${id} RETURNING id
  `);
  return rows.length > 0;
}

export async function deleteApplicationByOrdinal(
  ordinal: number,
): Promise<{ deletedId: number; nickname: string; ordinal: number; wasTotal: number } | null> {
  const found = await getApplicationByOrdinal(ordinal, null);
  if (!found) return null;
  const ok = await deleteApplication(found.row.id);
  if (!ok) return null;
  return {
    deletedId: found.row.id,
    nickname: found.row.nickname,
    ordinal: found.ordinal,
    wasTotal: found.total,
  };
}

export async function countApplications(): Promise<number> {
  await ensureApplicationsTable();
  const sql = getSql();
  const rows = rowsOf(await sql`SELECT COUNT(*)::int AS c FROM applications`);
  return Number(rows[0]?.c ?? 0);
}
