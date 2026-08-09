import { NextResponse } from "next/server";

import {
  getApplyFormConfig,
  type ApplyFieldKey,
  type ApplyFormConfig,
} from "@/lib/application-form-config";
import { createApplication } from "@/lib/applications";
import { notifyApplicationTelegram } from "@/lib/notify-application";

export const dynamic = "force-dynamic";

const MAX: Record<ApplyFieldKey, number> = {
  email: 120,
  nickname: 80,
  birthday: 32,
  age: 8,
  contacts: 200,
  experience: 2000,
  previousProjects: 2000,
  whyServer: 2000,
  howFound: 500,
};

type RateBucket = { count: number; resetAt: number };
const rateByIp = new Map<string, RateBucket>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function allowRate(ip: string): boolean {
  const now = Date.now();
  const cur = rateByIp.get(ip);
  if (!cur || now >= cur.resetAt) {
    rateByIp.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (cur.count >= RATE_LIMIT) return false;
  cur.count += 1;
  return true;
}

function trimStr(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.replace(/\s+/g, " ").trim().slice(0, max);
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function formatBirthdayUk(raw: string): string {
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return raw;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function validateAgainstConfig(
  config: ApplyFormConfig,
  values: Record<ApplyFieldKey, string>,
): string | null {
  for (const field of config.fields) {
    if (!field.enabled) continue;
    const v = values[field.key];
    if (field.required && !v) {
      return `Заповни поле: ${field.label}`;
    }
    if (!v) continue;

    if (field.key === "email" && !isEmail(v)) {
      return "Вкажи коректну електронну адресу.";
    }
    if (
      field.key === "age" &&
      (!/^\d{1,3}$/.test(v) || Number(v) < 8 || Number(v) > 99)
    ) {
      return "Вкажи вік числом (повних років).";
    }
  }
  return null;
}

export async function POST(req: Request) {
  if (!allowRate(clientIp(req))) {
    return NextResponse.json(
      { error: "Забагато заявок з цієї адреси. Спробуй пізніше." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = (body || {}) as Record<string, unknown>;
  if (trimStr(b.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  let config: ApplyFormConfig;
  try {
    config = await getApplyFormConfig();
  } catch {
    return NextResponse.json(
      { error: "Сервіс тимчасово недоступний." },
      { status: 503 },
    );
  }

  const raw: Record<ApplyFieldKey, string> = {
    email: trimStr(b.email, MAX.email).toLowerCase(),
    nickname: trimStr(b.nickname, MAX.nickname),
    birthday: trimStr(b.birthday, MAX.birthday),
    age: trimStr(b.age, MAX.age),
    contacts: trimStr(b.contacts, MAX.contacts),
    experience: trimStr(b.experience, MAX.experience),
    previousProjects: trimStr(b.previousProjects, MAX.previousProjects),
    whyServer: trimStr(b.whyServer, MAX.whyServer),
    howFound: trimStr(b.howFound, MAX.howFound),
  };

  // Вимкнені поля не зберігаємо
  for (const field of config.fields) {
    if (!field.enabled) raw[field.key] = "";
  }

  const err = validateAgainstConfig(config, raw);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const birthday = raw.birthday ? formatBirthdayUk(raw.birthday) : "";

  const payload = {
    email: raw.email,
    nickname: raw.nickname,
    birthday,
    age: raw.age,
    contacts: raw.contacts,
    experience: raw.experience,
    previousProjects: raw.previousProjects,
    whyServer: raw.whyServer,
    howFound: raw.howFound,
  };

  let id: number | undefined;
  try {
    const row = await createApplication(payload);
    id = row.id;
  } catch (e) {
    console.error("[apply] DB insert failed:", e);
    return NextResponse.json(
      { error: "Не вдалося зберегти заявку. Спробуй ще раз." },
      { status: 500 },
    );
  }

  const notified = await notifyApplicationTelegram({ ...payload, id });
  if (!notified) {
    console.error("[apply] saved id=%s but Telegram notify failed", id);
  }

  return NextResponse.json({
    ok: true,
    id,
    telegram: notified,
  });
}
