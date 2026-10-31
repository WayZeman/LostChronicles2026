import { getSql } from "@/lib/db";

/** https://t.me/c/2430381787/758 */
const DEFAULT_THREAD_ID = 758;
const DEFAULT_CHAT_ID = "-1002430381787";

function escapeTelegramHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function supportBotConfig(): { token: string; chatId: string; threadId: number } | null {
  const token =
    process.env.TELEGRAM_ORDERS_BOT_TOKEN?.trim() ||
    process.env.TELEGRAM_ANKETA_BOT_TOKEN?.trim() ||
    "";
  const chatId =
    process.env.TELEGRAM_FAQ_SUPPORT_CHAT_ID?.trim() ||
    process.env.TELEGRAM_ORDERS_CHAT_ID?.trim() ||
    process.env.TELEGRAM_ANKETA_CHAT_ID?.trim() ||
    DEFAULT_CHAT_ID;
  const raw = process.env.TELEGRAM_FAQ_SUPPORT_THREAD_ID?.trim();
  const threadId = raw ? Number(raw) : DEFAULT_THREAD_ID;
  if (!token || !chatId || !Number.isFinite(threadId) || threadId <= 0) {
    return null;
  }
  return { token, chatId, threadId: Math.floor(threadId) };
}

let tableReady = false;

async function ensureTicketsTable(): Promise<void> {
  if (tableReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS faq_support_tickets (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      topic TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  tableReady = true;
}

export function parseFaqSupportInput(
  topicRaw: unknown,
  bodyRaw: unknown,
): { ok: true; topic: string; body: string } | { ok: false; error: string } {
  const topic = typeof topicRaw === "string" ? topicRaw.trim() : "";
  const body = typeof bodyRaw === "string" ? bodyRaw.trim() : "";
  if (topic.length < 3) {
    return { ok: false, error: "Тема має бути хоча б з 3 символів." };
  }
  if (topic.length > 80) {
    return { ok: false, error: "Тема задовга. Скороти до 80 символів." };
  }
  if (body.length < 10) {
    return { ok: false, error: "Опиши проблему трохи докладніше." };
  }
  if (body.length > 2000) {
    return { ok: false, error: "Опис задовгий. Скороти до 2000 символів." };
  }
  return { ok: true, topic, body };
}

/** Не частіше ніж раз на хвилину і не більше 5 звернень на годину. */
export async function faqSupportRateLimit(
  userId: number,
): Promise<string | null> {
  try {
    return await faqSupportRateLimitQuery(userId);
  } catch (e) {
    console.error("[faq-support] rate limit skipped:", e);
    return null;
  }
}

async function faqSupportRateLimitQuery(
  userId: number,
): Promise<string | null> {
  await ensureTicketsTable();
  const sql = getSql();
  const recent = (await sql`
    SELECT created_at
    FROM faq_support_tickets
    WHERE user_id = ${userId}
    ORDER BY id DESC
    LIMIT 1
  `) as { created_at: string | Date }[];
  const last = recent[0]?.created_at;
  if (last) {
    const age = Date.now() - new Date(last).getTime();
    if (age >= 0 && age < 60_000) {
      return "Зачекай хвилину перед наступним зверненням.";
    }
  }
  const hour = (await sql`
    SELECT COUNT(*)::int AS c
    FROM faq_support_tickets
    WHERE user_id = ${userId}
      AND created_at > NOW() - INTERVAL '1 hour'
  `) as { c: number }[];
  if (Number(hour[0]?.c ?? 0) >= 5) {
    return "За цю годину вже надіслано 5 звернень. Спробуй пізніше.";
  }
  return null;
}

export async function sendFaqSupportToTelegram(input: {
  topic: string;
  body: string;
  userId: number;
  username: string;
  gameNickname: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = supportBotConfig();
  if (!cfg) {
    return { ok: false, error: "Підтримка в Telegram зараз недоступна." };
  }

  const who = input.gameNickname?.trim() || input.username || `user ${input.userId}`;
  const text = [
    "🛟 <b>Підтримка з сайту</b>",
    "",
    `<b>Тема:</b> ${escapeTelegramHtml(input.topic)}`,
    `<b>Від:</b> ${escapeTelegramHtml(who)}`,
    `<b>Акаунт:</b> ${escapeTelegramHtml(input.username)} (#${input.userId})`,
    "",
    escapeTelegramHtml(input.body),
  ].join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          message_thread_id: cfg.threadId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );
    if (!res.ok) {
      console.error(
        "[faq-support] Telegram error:",
        res.status,
        await res.text().catch(() => ""),
      );
      return { ok: false, error: "Не вдалося надіслати звернення. Спробуй ще раз." };
    }
  } catch (e) {
    console.error("[faq-support] Telegram request failed:", e);
    return { ok: false, error: "Не вдалося надіслати звернення. Спробуй ще раз." };
  }

  try {
    await ensureTicketsTable();
    const sql = getSql();
    await sql`
      INSERT INTO faq_support_tickets (user_id, topic, body)
      VALUES (${input.userId}, ${input.topic}, ${input.body})
    `;
  } catch (e) {
    console.error("[faq-support] ticket log failed:", e);
  }

  return { ok: true };
}
