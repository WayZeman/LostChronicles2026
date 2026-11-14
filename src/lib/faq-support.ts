/** https://t.me/c/2430381787/758 */
const DEFAULT_THREAD_ID = 758;
const DEFAULT_CHAT_ID = "-1002430381787";

/** Кнопка під завданням підтримки. Після натискання стає зеленою «✓ Виконано». */
const FAQ_DONE_CALLBACK = "faq:done";
const FAQ_DONE_LOCKED_CALLBACK = "faq:done:ok";
const PERFORMER_MARK = "\n\n✅ Виконав: ";

function faqTaskKeyboard(done: boolean, styled = true) {
  return {
    inline_keyboard: [
      [
        done
          ? {
              text: "✓ Виконано",
              callback_data: FAQ_DONE_LOCKED_CALLBACK,
              ...(styled ? { style: "success" as const } : {}),
            }
          : { text: "Виконати", callback_data: FAQ_DONE_CALLBACK },
      ],
    ],
  };
}

type TgUser = {
  id?: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

function performerLabel(from: TgUser | undefined): string {
  const name = [from?.first_name, from?.last_name].filter(Boolean).join(" ").trim();
  const username = from?.username ? `@${from.username}` : "";
  if (name && username) return `${name} (${username})`;
  return name || username || (from?.id != null ? `id ${from.id}` : "невідомо");
}

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
          reply_markup: faqTaskKeyboard(false),
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

type TgMessageEntity = {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: TgUser;
  language?: string;
  custom_emoji_id?: string;
};

type FaqCallbackQuery = {
  id?: string;
  data?: string;
  from?: TgUser;
  message?: {
    message_id?: number;
    text?: string;
    entities?: TgMessageEntity[];
    chat?: { id?: number | string };
  };
};

async function callSupportBot(
  method: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; description?: string }> {
  const cfg = supportBotConfig();
  if (!cfg) return { ok: false, description: "no config" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      description?: string;
    } | null;
    if (!res.ok || data?.ok === false) {
      console.error(
        "[faq-support] Telegram",
        method,
        res.status,
        data?.description || "",
      );
      return { ok: false, description: data?.description };
    }
    return { ok: true };
  } catch (e) {
    console.error("[faq-support] Telegram", method, "failed:", e);
    return { ok: false, description: "request failed" };
  }
}

function messageWithPerformer(
  text: string,
  from: TgUser | undefined,
): { text: string; entitiesExtra?: TgMessageEntity } {
  if (text.includes("✅ Виконав:")) return { text };
  const label = performerLabel(from);
  const next = `${text}${PERFORMER_MARK}${label}`;
  if (from?.id == null) return { text: next };
  return {
    text: next,
    entitiesExtra: {
      type: "text_mention",
      offset: text.length + PERFORMER_MARK.length,
      length: label.length,
      user: {
        id: from.id,
        is_bot: Boolean(from.is_bot),
        first_name: from.first_name || label,
        ...(from.last_name ? { last_name: from.last_name } : {}),
        ...(from.username ? { username: from.username } : {}),
      },
    },
  };
}

/** Натискання «Виконати» під зверненням у темі підтримки. */
export async function handleFaqSupportCallback(update: unknown): Promise<boolean> {
  if (!update || typeof update !== "object") return false;
  const cb = (update as { callback_query?: FaqCallbackQuery }).callback_query;
  if (!cb?.id) return false;
  if (cb.data !== FAQ_DONE_CALLBACK && cb.data !== FAQ_DONE_LOCKED_CALLBACK) {
    return false;
  }

  const cfg = supportBotConfig();
  const chatId = cb.message?.chat?.id;
  if (!cfg || chatId == null || String(chatId) !== String(cfg.chatId)) {
    await callSupportBot("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: "Цю кнопку можна натиснути лише в темі підтримки.",
    });
    return true;
  }

  const messageId = cb.message?.message_id;
  if (cb.data === FAQ_DONE_LOCKED_CALLBACK) {
    if (messageId != null) {
      await callSupportBot("editMessageReplyMarkup", {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: faqTaskKeyboard(true),
      });
    }
    await callSupportBot("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: "Вже виконано",
    });
    return true;
  }

  if (messageId == null) {
    await callSupportBot("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: "Не вдалося оновити кнопку.",
    });
    return true;
  }

  const edited = await markFaqTaskDone(chatId, messageId, cb.message, cb.from);
  const who = performerLabel(cb.from);
  await callSupportBot("answerCallbackQuery", {
    callback_query_id: cb.id,
    text: (edited ? `Виконано: ${who}` : "Не вдалося оновити кнопку.").slice(0, 200),
  });
  return true;
}

async function markFaqTaskDone(
  chatId: number | string,
  messageId: number,
  message: FaqCallbackQuery["message"],
  from: TgUser | undefined,
): Promise<boolean> {
  const original = message?.text;
  if (original) {
    const next = messageWithPerformer(original, from);
    const entities = [
      ...(message?.entities ?? []),
      ...(next.entitiesExtra ? [next.entitiesExtra] : []),
    ];
    const styledMarkup = faqTaskKeyboard(true);
    const edited = await callSupportBot("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: next.text,
      ...(entities.length ? { entities } : {}),
      disable_web_page_preview: true,
      reply_markup: styledMarkup,
    });
    if (edited.ok) return true;
    const styleRejected = /style/i.test(edited.description || "");
    const markup = styleRejected ? faqTaskKeyboard(true, false) : styledMarkup;
    if (entities.length || styleRejected) {
      const plain = await callSupportBot("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: next.text,
        disable_web_page_preview: true,
        reply_markup: markup,
      });
      if (plain.ok) return true;
    }
  }

  const markup = await callSupportBot("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: faqTaskKeyboard(true),
  });
  if (markup.ok) return true;
  if (/style/i.test(markup.description || "")) {
    const plain = await callSupportBot("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: faqTaskKeyboard(true, false),
    });
    return plain.ok;
  }
  return false;
}
