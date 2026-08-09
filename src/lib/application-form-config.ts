import { getSql } from "@/lib/db";

export const APPLY_FIELD_KEYS = [
  "email",
  "nickname",
  "birthday",
  "age",
  "contacts",
  "experience",
  "previousProjects",
  "whyServer",
  "howFound",
] as const;

export type ApplyFieldKey = (typeof APPLY_FIELD_KEYS)[number];

export type ApplyFieldKind = "text" | "email" | "date" | "number" | "textarea";

export type ApplyFieldConfig = {
  key: ApplyFieldKey;
  enabled: boolean;
  required: boolean;
  kind: ApplyFieldKind;
  label: string;
  hint: string;
  placeholder: string;
};

export type ApplyFormConfig = {
  pageTitle: string;
  pageIntro: string;
  successTitle: string;
  successBody: string;
  successHoursNote: string;
  submitLabel: string;
  fields: ApplyFieldConfig[];
};

const SETTINGS_KEY = "apply_form";

const DEFAULT_KIND: Record<ApplyFieldKey, ApplyFieldKind> = {
  email: "email",
  nickname: "text",
  birthday: "date",
  age: "number",
  contacts: "text",
  experience: "textarea",
  previousProjects: "textarea",
  whyServer: "textarea",
  howFound: "text",
};

export const DEFAULT_APPLY_FORM_CONFIG: ApplyFormConfig = {
  pageTitle: "Анкета",
  pageIntro:
    "Вас вітає приватний український сервер. Заповніть форму для реєстрації — це потрібно, щоб отримати доступ до гри.",
  successTitle: "Дякуємо за проходження анкети!",
  successBody:
    "Для продовження розгляду приєднайся до спільноти в Discord або Telegram і повідом, що заповнив(ла) анкету.",
  successHoursNote: "Розгляд заявок: щодня з 09:00 до 22:00.",
  submitLabel: "Надіслати анкету",
  fields: [
    {
      key: "email",
      enabled: true,
      required: true,
      kind: "email",
      label: "Email",
      hint: "",
      placeholder: "",
    },
    {
      key: "nickname",
      enabled: true,
      required: true,
      kind: "text",
      label: "Ігровий нік (і за бажанням реальне імʼя)",
      hint: "Приклад: Neo, Назар",
      placeholder: "Neo, Назар",
    },
    {
      key: "birthday",
      enabled: true,
      required: false,
      kind: "date",
      label: "День народження",
      hint: "Для привітання в грі",
      placeholder: "",
    },
    {
      key: "age",
      enabled: true,
      required: true,
      kind: "number",
      label: "Скільки вам повних років?",
      hint: "",
      placeholder: "",
    },
    {
      key: "contacts",
      enabled: true,
      required: true,
      kind: "text",
      label: "Telegram або Discord",
      hint: "Без цього ми не зможемо додати вас на сервер",
      placeholder: "тг — @nick, діск — name",
    },
    {
      key: "experience",
      enabled: true,
      required: true,
      kind: "textarea",
      label: "Який досвід гри в Minecraft?",
      hint: "",
      placeholder: "",
    },
    {
      key: "previousProjects",
      enabled: true,
      required: true,
      kind: "textarea",
      label: "На яких проєктах були раніше?",
      hint: "",
      placeholder: "",
    },
    {
      key: "whyServer",
      enabled: true,
      required: true,
      kind: "textarea",
      label: "Чому ви обрали саме наш сервер?",
      hint: "Або вкажіть очікування від серверу",
      placeholder: "",
    },
    {
      key: "howFound",
      enabled: true,
      required: true,
      kind: "text",
      label: "Як ви дізнались про нас?",
      hint: "",
      placeholder: "",
    },
  ],
};

function isFieldKey(v: unknown): v is ApplyFieldKey {
  return (
    typeof v === "string" &&
    (APPLY_FIELD_KEYS as readonly string[]).includes(v)
  );
}

function clampText(v: unknown, max: number, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  return v.trim().slice(0, max);
}

/** Зливає збережене з дефолтами: усі ключі на місці, порядок збереженого. */
export function normalizeApplyFormConfig(raw: unknown): ApplyFormConfig {
  const base = DEFAULT_APPLY_FORM_CONFIG;
  const o =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const byKey = new Map<ApplyFieldKey, ApplyFieldConfig>();
  for (const f of base.fields) byKey.set(f.key, { ...f });

  const ordered: ApplyFieldConfig[] = [];
  const seen = new Set<ApplyFieldKey>();
  const rawFields = Array.isArray(o.fields) ? o.fields : [];

  for (const item of rawFields) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (!isFieldKey(r.key)) continue;
    if (seen.has(r.key)) continue;
    seen.add(r.key);
    const def = byKey.get(r.key)!;
    ordered.push({
      key: r.key,
      enabled: r.enabled !== false,
      required: r.required === true || (r.required !== false && def.required),
      kind: DEFAULT_KIND[r.key],
      label: clampText(r.label, 200, def.label) || def.label,
      hint: clampText(r.hint, 400, def.hint),
      placeholder: clampText(r.placeholder, 200, def.placeholder),
    });
  }

  for (const f of base.fields) {
    if (!seen.has(f.key)) ordered.push({ ...f });
  }

  // Нік і контакти завжди увімкнені — інакше неможливо додати гравця
  for (const f of ordered) {
    if (f.key === "nickname" || f.key === "contacts") {
      f.enabled = true;
      f.required = true;
    }
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
    fields: ordered,
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
  const rows = await sql`
    SELECT value FROM site_settings WHERE key = ${SETTINGS_KEY} LIMIT 1
  `;
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

/** Підписи для Telegram за ключем поля */
export const APPLY_TELEGRAM_LABELS: Record<ApplyFieldKey, string> = {
  email: "📧 Email",
  nickname: "👤 Нік",
  birthday: "🎉 День народження",
  age: "🎂 Вік",
  contacts: "📞 Telegram / Discord",
  experience: "🎮 Досвід гри",
  previousProjects: "🌍 Попередні проєкти",
  whyServer: "💬 Чому обрали сервер",
  howFound: "📢 Як дізнались",
};

export const APPLY_TELEGRAM_ORDER: ApplyFieldKey[] = [
  "nickname",
  "age",
  "experience",
  "previousProjects",
  "whyServer",
  "contacts",
  "email",
  "birthday",
  "howFound",
];
