import { NextResponse } from "next/server";

import {
  getApplyFormConfig,
  type ApplyFormConfig,
  type ApplyQuestion,
} from "@/lib/application-form-config";
import {
  createApplication,
  type ApplicationAnswers,
} from "@/lib/applications";
import { notifyApplicationTelegram } from "@/lib/notify-application";

export const dynamic = "force-dynamic";

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

function normalizeAnswerForQuestion(
  q: ApplyQuestion,
  raw: unknown,
): string | string[] {
  if (q.type === "multi_choice") {
    const arr = Array.isArray(raw)
      ? raw
      : typeof raw === "string" && raw
        ? [raw]
        : [];
    return arr
      .map((x) => trimStr(x, 200))
      .filter(Boolean)
      .filter((x) => q.options.includes(x))
      .slice(0, 30);
  }

  let s = trimStr(raw, q.type === "long_text" ? 2000 : 500);
  if (q.type === "date" && s) s = formatBirthdayUk(s);
  if (
    (q.type === "single_choice" || q.type === "dropdown") &&
    s &&
    !q.options.includes(s)
  ) {
    return "";
  }
  return s;
}

function validateAnswers(
  config: ApplyFormConfig,
  answers: ApplicationAnswers,
): string | null {
  for (const q of config.questions) {
    if (!q.enabled) continue;
    const v = answers[q.id];
    const empty =
      v == null ||
      (typeof v === "string" && !v.trim()) ||
      (Array.isArray(v) && v.length === 0);
    if (q.required && empty) {
      return `Заповни поле: ${q.label}`;
    }
    if (empty) continue;
    if (q.type === "email" && typeof v === "string" && !isEmail(v)) {
      return `Некоректний email: ${q.label}`;
    }
    if (
      q.type === "number" &&
      typeof v === "string" &&
      !/^\d{1,6}$/.test(v)
    ) {
      return `Вкажи число для: ${q.label}`;
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

  const rawAnswers =
    b.answers && typeof b.answers === "object" && !Array.isArray(b.answers)
      ? (b.answers as Record<string, unknown>)
      : b;

  const answers: ApplicationAnswers = {};
  for (const q of config.questions) {
    if (!q.enabled) continue;
    const normalized = normalizeAnswerForQuestion(q, rawAnswers[q.id]);
    if (
      (typeof normalized === "string" && normalized) ||
      (Array.isArray(normalized) && normalized.length > 0)
    ) {
      answers[q.id] = normalized;
    }
  }

  const err = validateAnswers(config, answers);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  let id: number | undefined;
  try {
    const row = await createApplication({
      answers,
      questions: config.questions,
    });
    id = row.id;
  } catch (e) {
    console.error("[apply] DB insert failed:", e);
    return NextResponse.json(
      { error: "Не вдалося зберегти заявку. Спробуй ще раз." },
      { status: 500 },
    );
  }

  const notified = await notifyApplicationTelegram({
    id,
    answers,
    questions: config.questions,
  });
  if (!notified) {
    console.error("[apply] saved id=%s but Telegram notify failed", id);
  }

  return NextResponse.json({
    ok: true,
    id,
    telegram: notified,
  });
}
