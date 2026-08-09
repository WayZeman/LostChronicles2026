import { getSql } from "@/lib/db";

export const APPLY_QUESTION_TYPES = [
  "short_text",
  "long_text",
  "email",
  "number",
  "date",
  "single_choice",
  "multi_choice",
  "dropdown",
] as const;

export type ApplyQuestionType = (typeof APPLY_QUESTION_TYPES)[number];

export type ApplyQuestion = {
  id: string;
  type: ApplyQuestionType;
  label: string;
  hint: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
  /** Варіанти для single/multi/dropdown */
  options: string[];
};

export type ApplyFormConfig = {
  pageTitle: string;
  pageIntro: string;
  successTitle: string;
  successBody: string;
  successHoursNote: string;
  submitLabel: string;
  joinTitle: string;
  joinBlurb: string;
  questions: ApplyQuestion[];
};

/** @deprecated старий формат — мігруємо в questions */
export type ApplyFieldKey = string;
export type ApplyFieldKind = string;
export type ApplyFieldConfig = {
  key: string;
  enabled: boolean;
  required: boolean;
  kind: string;
  label: string;
  hint: string;
  placeholder: string;
};

const SETTINGS_KEY = "apply_form";

function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

export function newApplyQuestionId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const APPLY_QUESTION_TYPE_LABELS: Record<ApplyQuestionType, string> = {
  short_text: "Коротка відповідь",
  long_text: "Довгий текст",
  email: "Email",
  number: "Число",
  date: "Дата",
  single_choice: "Один варіант",
  multi_choice: "Кілька варіантів",
  dropdown: "Список",
};

function needsOptions(type: ApplyQuestionType): boolean {
  return (
    type === "single_choice" ||
    type === "multi_choice" ||
    type === "dropdown"
  );
}

export function createBlankQuestion(
  type: ApplyQuestionType = "short_text",
): ApplyQuestion {
  return {
    id: newApplyQuestionId(),
    type,
    label: "Нове питання",
    hint: "",
    placeholder: "",
    required: false,
    enabled: true,
    options: needsOptions(type) ? ["Варіант 1", "Варіант 2"] : [],
  };
}

function legacyKindToType(kind: string): ApplyQuestionType {
  if (kind === "textarea") return "long_text";
  if (kind === "email") return "email";
  if (kind === "number") return "number";
  if (kind === "date") return "date";
  return "short_text";
}

function isQuestionType(v: unknown): v is ApplyQuestionType {
  return (
    typeof v === "string" &&
    (APPLY_QUESTION_TYPES as readonly string[]).includes(v)
  );
}

function clampText(v: unknown, max: number, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  return v.trim().slice(0, max);
}

function normalizeOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const s = clampText(item, 200);
    if (s) out.push(s);
  }
  return out.slice(0, 30);
}

function normalizeQuestion(raw: unknown, fallbackId?: string): ApplyQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // legacy field shape
  if (typeof r.key === "string" && !r.id) {
    const type = legacyKindToType(String(r.kind || "text"));
    return {
      id: fallbackId || `legacy_${r.key}`,
      type,
      label: clampText(r.label, 200, "Питання") || "Питання",
      hint: clampText(r.hint, 400),
      placeholder: clampText(r.placeholder, 200),
      required: r.required === true,
      enabled: r.enabled !== false,
      options: [],
    };
  }

  const id =
    clampText(r.id, 64) ||
    fallbackId ||
    newApplyQuestionId();
  const type: ApplyQuestionType = isQuestionType(r.type)
    ? r.type
    : legacyKindToType(String(r.kind || "text"));
  let options = normalizeOptions(r.options);
  if (needsOptions(type) && options.length === 0) {
    options = ["Варіант 1", "Варіант 2"];
  }
  if (!needsOptions(type)) options = [];

  return {
    id,
    type,
    label: clampText(r.label, 200, "Питання") || "Питання",
    hint: clampText(r.hint, 400),
    placeholder: clampText(r.placeholder, 200),
    required: r.required === true,
    enabled: r.enabled !== false,
    options,
  };
}

export const DEFAULT_APPLY_FORM_CONFIG: ApplyFormConfig = {
  pageTitle: "Анкета",
  pageIntro:
    "Вас вітає приватний український сервер. Заповніть форму для реєстрації — це потрібно, щоб отримати доступ до гри.",
  successTitle: "Дякуємо за проходження анкети!",
  successBody:
    "Для продовження розгляду приєднайся до спільноти в Discord або Telegram і повідом, що заповнив(ла) анкету.",
  successHoursNote: "Розгляд заявок: щодня з 09:00 до 22:00.",
  submitLabel: "Надіслати анкету",
  joinTitle: "Доєднайся, щоб бути на звʼязку",
  joinBlurb:
    "Після анкети зайди в спільноту — так ми зможемо швидше розглянути заявку.",
  questions: [
    {
      id: "q_email",
      type: "email",
      label: "Email",
      hint: "",
      placeholder: "",
      required: true,
      enabled: true,
      options: [],
    },
    {
      id: "q_nickname",
      type: "short_text",
      label: "Ігровий нік (і за бажанням реальне імʼя)",
      hint: "Приклад: Neo, Назар",
      placeholder: "Neo, Назар",
      required: true,
      enabled: true,
      options: [],
    },
    {
      id: "q_birthday",
      type: "date",
      label: "День народження",
      hint: "Для привітання в грі",
      placeholder: "",
      required: false,
      enabled: true,
      options: [],
    },
    {
      id: "q_age",
      type: "number",
      label: "Скільки вам повних років?",
      hint: "",
      placeholder: "",
      required: true,
      enabled: true,
      options: [],
    },
    {
      id: "q_contacts",
      type: "short_text",
      label: "Telegram або Discord",
      hint: "Без цього ми не зможемо додати вас на сервер",
      placeholder: "тг — @nick, діск — name",
      required: true,
      enabled: true,
      options: [],
    },
    {
      id: "q_experience",
      type: "long_text",
      label: "Який досвід гри в Minecraft?",
      hint: "",
      placeholder: "",
      required: true,
      enabled: true,
      options: [],
    },
    {
      id: "q_previous",
      type: "long_text",
      label: "На яких проєктах були раніше?",
      hint: "",
      placeholder: "",
      required: true,
      enabled: true,
      options: [],
    },
    {
      id: "q_why",
      type: "long_text",
      label: "Чому ви обрали саме наш сервер?",
      hint: "Або вкажіть очікування від серверу",
      placeholder: "",
      required: true,
      enabled: true,
      options: [],
    },
    {
      id: "q_how",
      type: "short_text",
      label: "Як ви дізнались про нас?",
      hint: "",
      placeholder: "",
      required: true,
      enabled: true,
      options: [],
    },
  ],
};

export function normalizeApplyFormConfig(raw: unknown): ApplyFormConfig {
  const base = DEFAULT_APPLY_FORM_CONFIG;
  const o =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const questions: ApplyQuestion[] = [];
  const seen = new Set<string>();

  const rawQuestions = Array.isArray(o.questions)
    ? o.questions
    : Array.isArray(o.fields)
      ? o.fields
      : null;

  if (rawQuestions) {
    for (let i = 0; i < rawQuestions.length; i++) {
      const q = normalizeQuestion(rawQuestions[i], `q_auto_${i}`);
      if (!q) continue;
      if (seen.has(q.id)) q.id = newApplyQuestionId();
      seen.add(q.id);
      questions.push(q);
    }
  }

  if (questions.length === 0) {
    for (const q of base.questions) questions.push({ ...q, options: [...q.options] });
  }

  return {
    pageTitle: clampText(o.pageTitle, 120, base.pageTitle) || base.pageTitle,
    pageIntro: clampText(o.pageIntro, 800, base.pageIntro) || base.pageIntro,
    successTitle:
      clampText(o.successTitle, 200, base.successTitle) || base.successTitle,
    successBody:
      clampText(o.successBody, 800, base.successBody) || base.successBody,
    successHoursNote:
      clampText(o.successHoursNote, 200, base.successHoursNote) ||
      base.successHoursNote,
    submitLabel:
      clampText(o.submitLabel, 80, base.submitLabel) || base.submitLabel,
    joinTitle: clampText(o.joinTitle, 160, base.joinTitle) || base.joinTitle,
    joinBlurb: clampText(o.joinBlurb, 400, base.joinBlurb) || base.joinBlurb,
    questions,
  };
}

async function ensureSettingsTable(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function getApplyFormConfig(): Promise<ApplyFormConfig> {
  await ensureSettingsTable();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT value FROM site_settings WHERE key = ${SETTINGS_KEY} LIMIT 1
  `);
  const raw = rows[0]?.value;
  if (typeof raw !== "string" || !raw.trim()) {
    return normalizeApplyFormConfig(null);
  }
  try {
    return normalizeApplyFormConfig(JSON.parse(raw));
  } catch {
    return normalizeApplyFormConfig(null);
  }
}

export async function saveApplyFormConfig(
  input: unknown,
): Promise<ApplyFormConfig> {
  const config = normalizeApplyFormConfig(input);
  await ensureSettingsTable();
  const sql = getSql();
  const value = JSON.stringify(config);
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${SETTINGS_KEY}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW()
  `;
  return config;
}

/** Знайти відповідь за ключовими словами в підписі (для списку/Telegram). */
export function pickAnswerByLabelHint(
  questions: ApplyQuestion[],
  answers: Record<string, string | string[]>,
  hints: RegExp[],
): string {
  for (const q of questions) {
    if (!hints.some((h) => h.test(q.label))) continue;
    const v = answers[q.id];
    if (Array.isArray(v)) return v.filter(Boolean).join(", ");
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function formatAnswerValue(v: string | string[] | undefined): string {
  if (v == null) return "—";
  if (Array.isArray(v)) {
    const t = v.map((x) => String(x).trim()).filter(Boolean);
    return t.length ? t.join(", ") : "—";
  }
  const s = String(v).trim();
  return s || "—";
}
