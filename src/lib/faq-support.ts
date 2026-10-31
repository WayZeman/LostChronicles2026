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

  const nick = input.gameNickname?.trim() || "";
  const account = input.username?.trim() || "";
  const who = nick || account || `id ${input.userId}`;
  const showAccount = Boolean(nick && account && account !== nick);
  const text = [
    `🛟 <b>Звернення від ${escapeTelegramHtml(who)}</b>`,
    ...(showAccount ? [`<i>${escapeTelegramHtml(account)}</i>`] : []),
    "",
    "<b>Тема</b>",
    escapeTelegramHtml(input.topic),
    "",
    "<b>Опис</b>",
    `<blockquote>${escapeTelegramHtml(input.body)}</blockquote>`,
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

  return { ok: true };
}
