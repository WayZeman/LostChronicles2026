/**
 * Імпорт анкет із експорту Google Form (xlsx) у Neon.
 *
 *   npx tsx --env-file=.env.local scripts/import-google-form-anketa.ts
 *
 * За замовчуванням бере:
 *   ~/Downloads/Анкета відповіді .xlsx
 * Перевизначення: GOOGLE_ANKETA_XLSX=/path/to/file.xlsx
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

import { getSql } from "../src/lib/db";
import type { ApplicationAnswers } from "../src/lib/applications";
import type { ApplicationServerStatus } from "../src/lib/applications";

const require = createRequire(import.meta.url);

type Row = (string | number | Date | null | undefined)[];

function cell(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const d = String(v.getDate()).padStart(2, "0");
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const y = v.getFullYear();
    return `${d}.${m}.${y}`;
  }
  return String(v).replace(/\s+/g, " ").trim();
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function looksLikeDate(v: unknown): boolean {
  return v instanceof Date && !Number.isNaN(v.getTime());
}

function mapStatus(raw: string): ApplicationServerStatus {
  const s = raw.trim().toLowerCase();
  if (!s) return "pending";
  if (
    /вже\s*на\s*сервер|добавлен|додано\s*в\s*спис|є\s*в\s*спис|прийнят|принят/.test(
      s,
    )
  ) {
    return "accepted";
  }
  if (
    /не\s*пройш|не\s*прохо|не\s*підійш|не\s*подой|невдалось|не\s*вдалось|відмовив|відхил|не\s*підійшов|убер/.test(
      s,
    )
  ) {
    return "rejected";
  }
  if (/опрацюв/.test(s)) return "pending";
  // випадкові значення в колонці статусу (звідки дізнались тощо)
  return "pending";
}

function loadRows(xlsxPath: string): Row[] {
  let XLSX: {
    read: (buf: Buffer, opts?: object) => { SheetNames: string[]; Sheets: Record<string, unknown> };
    utils: { sheet_to_json: (sheet: unknown, opts?: object) => unknown[][] };
  };
  try {
    XLSX = require("xlsx");
  } catch {
    throw new Error(
      "Потрібен пакет xlsx: npm i -D xlsx && повтори скрипт",
    );
  }
  const buf = readFileSync(xlsxPath);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  }) as Row[];
  return rows;
}

function rowToAnswers(r: Row): {
  answers: ApplicationAnswers;
  nickname: string;
  email: string;
  contacts: string;
  createdAt: Date | null;
  status: ApplicationServerStatus;
} {
  const ts = r[0] instanceof Date ? r[0] : null;
  const nick = cell(r[1]);
  let age = "";
  let birthday = "";
  if (looksLikeDate(r[2])) {
    birthday = cell(r[2]);
  } else {
    age = cell(r[2]);
  }
  const experience = cell(r[3]);
  const previous = cell(r[4]);
  const why = cell(r[5]);
  const contacts = cell(r[6]);
  const emailRaw = cell(r[7]);
  const email = isEmail(emailRaw) ? emailRaw : "";
  const birthdayCol = cell(r[9]);
  if (birthdayCol) birthday = birthdayCol;
  const how = cell(r[10]);
  const status = mapStatus(cell(r[12]));

  const answers: ApplicationAnswers = {};
  if (email) answers.q_email = email;
  if (nick) answers.q_nickname = nick;
  if (birthday) answers.q_birthday = birthday;
  if (age) answers.q_age = age;
  if (contacts) answers.q_contacts = contacts;
  if (experience) answers.q_experience = experience;
  if (previous) answers.q_previous = previous;
  if (why) answers.q_why = why;
  if (how) answers.q_how = how;

  return {
    answers,
    nickname: nick || "—",
    email,
    contacts,
    createdAt: ts,
    status,
  };
}

async function main() {
  const xlsxPath =
    process.env.GOOGLE_ANKETA_XLSX?.trim() ||
    join(homedir(), "Downloads", "Анкета відповіді .xlsx");
  if (!existsSync(xlsxPath)) {
    throw new Error(`Не знайдено файл: ${xlsxPath}`);
  }

  const rows = loadRows(xlsxPath);
  if (rows.length < 2) throw new Error("Порожній файл");

  const data = rows
    .slice(1)
    .map((r) => rowToAnswers(r))
    .filter((d) => d.nickname && d.nickname !== "—");

  const sql = getSql();

  await sql`
    ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS answers_json TEXT NOT NULL DEFAULT '{}'
  `;
  await sql`
    ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS server_status TEXT NOT NULL DEFAULT 'pending'
  `;
  await sql`
    ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS server_status_at TIMESTAMPTZ
  `;

  // Зберігаємо свіжі анкети з сайту, яких немає в Google (за ніком).
  const siteKeep = await sql`
    SELECT
      email,
      nickname,
      contacts,
      answers_json,
      created_at,
      COALESCE(server_status, 'pending') AS server_status,
      server_status_at
    FROM applications
    WHERE created_at >= TIMESTAMPTZ '2026-08-01'
  `;

  const googleNicks = new Set(
    data.map((d) => d.nickname.toLowerCase().split(/[,，]/)[0]!.trim()),
  );

  const extras = (siteKeep as Record<string, unknown>[]).filter((r) => {
    const nick = String(r.nickname ?? "")
      .toLowerCase()
      .split(/[,，]/)[0]!
      .trim();
    return nick && !googleNicks.has(nick);
  });

  await sql`DELETE FROM applications`;
  await sql`ALTER SEQUENCE applications_id_seq RESTART WITH 1`;

  let accepted = 0;
  let rejected = 0;
  let pending = 0;

  for (const d of data) {
    if (d.status === "accepted") accepted += 1;
    else if (d.status === "rejected") rejected += 1;
    else pending += 1;

    const answersJson = JSON.stringify(d.answers);
    const createdAtIso = (d.createdAt ?? new Date()).toISOString();
    const statusAtIso =
      d.status === "pending" ? null : createdAtIso;

    await sql`
      INSERT INTO applications (
        email,
        nickname,
        contacts,
        answers_json,
        server_status,
        server_status_at,
        created_at
      )
      VALUES (
        ${d.email},
        ${d.nickname},
        ${d.contacts},
        ${answersJson},
        ${d.status},
        ${statusAtIso},
        ${createdAtIso}
      )
    `;
  }

  for (const r of extras) {
    const createdAtIso =
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : new Date(String(r.created_at)).toISOString();
    const statusAt =
      r.server_status_at == null
        ? null
        : r.server_status_at instanceof Date
          ? r.server_status_at.toISOString()
          : new Date(String(r.server_status_at)).toISOString();

    await sql`
      INSERT INTO applications (
        email,
        nickname,
        contacts,
        answers_json,
        server_status,
        server_status_at,
        created_at
      )
      VALUES (
        ${String(r.email ?? "")},
        ${String(r.nickname ?? "—")},
        ${String(r.contacts ?? "")},
        ${String(r.answers_json ?? "{}")},
        ${String(r.server_status ?? "pending")},
        ${statusAt},
        ${createdAtIso}
      )
    `;
  }

  const countRows = await sql`SELECT COUNT(*)::int AS c FROM applications`;
  const total = Number((countRows as { c: number }[])[0]?.c ?? 0);

  console.log(
    JSON.stringify(
      {
        ok: true,
        file: xlsxPath,
        importedFromGoogle: data.length,
        keptFromSite: extras.length,
        totalInDb: total,
        status: { accepted, rejected, pending },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
