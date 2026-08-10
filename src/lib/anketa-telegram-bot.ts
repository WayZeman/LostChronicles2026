import { getApplyFormConfig } from "@/lib/application-form-config";
import {
  countApplications,
  deleteApplicationByOrdinal,
  getApplicationByOrdinal,
  getLastApplicationOrdinal,
} from "@/lib/applications";
import {
  anketaBotConfig,
  formatApplicationTelegramText,
  sendAnketaTelegramText,
} from "@/lib/notify-application";

function helpText(): string {
  return (
    "Команди анкет (сайт /apply):\n" +
    "/anketa — остання\n" +
    "/anketa 12 — анкета №12\n" +
    "/anketa count — скільки всього\n" +
    "/anketa delete 12 — що буде видалено\n" +
    "/anketa delete 12 yes — видалити\n" +
    "/anketa delete last yes — видалити останню\n" +
    "/anketa help — ця підказка\n\n" +
    "№1 = перша (найстаріша), найбільший № = остання.\n" +
    "Після видалення номери зсуваються."
  );
}

function isAllowedChat(chatId: string): boolean {
  const cfg = anketaBotConfig();
  if (!cfg) return false;
  if (String(chatId) === String(cfg.chatId)) return true;
  const extra = process.env.TELEGRAM_ANKETA_ALLOWED_CHAT_IDS?.trim();
  if (!extra) return false;
  return extra
    .split(/[\s,]+/)
    .filter(Boolean)
    .some((id) => id === String(chatId));
}

/**
 * Обробка /anketa… з Telegram.
 * @returns true якщо команда розпізнана (навіть з помилкою користувачу)
 */
export async function handleAnketaBotUpdate(update: unknown): Promise<boolean> {
  if (!update || typeof update !== "object") return false;
  const msg =
    (update as { message?: unknown; edited_message?: unknown }).message ||
    (update as { edited_message?: unknown }).edited_message;
  if (!msg || typeof msg !== "object") return false;

  const m = msg as {
    text?: string;
    chat?: { id?: number | string };
    message_thread_id?: number;
  };
  if (!m.text || m.chat?.id == null) return false;

  const chatId = String(m.chat.id);
  if (!isAllowedChat(chatId)) return false;

  const text = String(m.text).trim();
  const match = text.match(/^\/(anketa|анкета)(?:@\w+)?(?:\s+(.+))?$/i);
  if (!match) return false;

  const arg = (match[2] || "").trim().toLowerCase();
  const threadId = m.message_thread_id || null;
  const reply = (body: string) =>
    sendAnketaTelegramText(body, { chatId, threadId });

  const del = arg.match(
    /^(?:delete|del|remove|видалити|видали)\s+(\d+|last|останн\S*)(?:\s+(yes|y|так|підтверджую))?$/i,
  );
  if (del) {
    let target: number | "last" = "last";
    if (!/^остан/i.test(del[1]) && del[1] !== "last") {
      target = parseInt(del[1], 10);
    }
    const confirmed = !!del[2];
    const questions = (await getApplyFormConfig()).questions;

    if (target === "last") {
      const last = await getLastApplicationOrdinal(questions);
      if (!last) {
        await reply("У базі ще немає анкет з сайту.");
        return true;
      }
      target = last.ordinal;
    }

    if (confirmed) {
      const deleted = await deleteApplicationByOrdinal(target);
      if (!deleted) {
        const total = await countApplications();
        await reply(
          `Немає анкети №${target}. Доступно: 1…${total || 0}`,
        );
        return true;
      }
      const left = await countApplications();
      await reply(
        `🗑 Видалено анкету #${deleted.ordinal} / ${deleted.wasTotal}\n` +
          `👤 Нік: ${deleted.nickname || "—"}\n` +
          `Залишилось: ${left}\n\n` +
          `⚠️ Номери після #${deleted.ordinal} зсунулись на −1.`,
      );
      return true;
    }

    const preview = await getApplicationByOrdinal(target, questions);
    if (!preview) {
      const total = await countApplications();
      await reply(`Немає анкети №${target}. Доступно: 1…${total || 0}`);
      return true;
    }
    await reply(
      `🗑 Видалити анкету #${preview.ordinal} / ${preview.total}?\n` +
        `👤 Нік: ${preview.row.nickname || "—"}\n\n` +
        `Щоб підтвердити:\n/anketa delete ${preview.ordinal} yes`,
    );
    return true;
  }

  if (!arg || arg === "last" || arg === "остання" || arg === "останню") {
    const questions = (await getApplyFormConfig()).questions;
    const last = await getLastApplicationOrdinal(questions);
    if (!last) {
      await reply("У базі ще немає анкет з сайту.");
      return true;
    }
    await reply(
      formatApplicationTelegramText({
        id: last.row.id,
        ordinal: last.ordinal,
        total: last.total,
        answers: last.row.answers,
        questions,
        nickname: last.row.nickname,
      }),
    );
    return true;
  }

  if (arg === "help" || arg === "допомога" || arg === "?") {
    await reply(helpText());
    return true;
  }

  if (arg === "count" || arg === "к-сть" || arg === "кількість") {
    const n = await countApplications();
    await reply(`📊 Анкет з сайту: ${n}`);
    return true;
  }

  if (
    arg === "delete" ||
    arg === "del" ||
    arg === "видалити" ||
    arg === "видали"
  ) {
    await reply(
      "Вкажи номер:\n" +
        "/anketa delete 12 — перегляд\n" +
        "/anketa delete 12 yes — видалити\n" +
        "/anketa delete last yes — видалити останню",
    );
    return true;
  }

  if (/^\d+$/.test(arg)) {
    const questions = (await getApplyFormConfig()).questions;
    const n = parseInt(arg, 10);
    const found = await getApplicationByOrdinal(n, questions);
    if (!found) {
      const total = await countApplications();
      await reply(`Немає анкети №${n}. Доступно: 1…${total || 0}`);
      return true;
    }
    await reply(
      formatApplicationTelegramText({
        id: found.row.id,
        ordinal: found.ordinal,
        total: found.total,
        answers: found.row.answers,
        questions,
        nickname: found.row.nickname,
      }),
    );
    return true;
  }

  await reply(`Не зрозумів аргумент.\n\n${helpText()}`);
  return true;
}

export async function setupAnketaTelegramWebhook(
  webhookUrl: string,
): Promise<{ ok: boolean; detail: string }> {
  const cfg = anketaBotConfig();
  if (!cfg) {
    return { ok: false, detail: "TELEGRAM_ANKETA_* / ORDERS_* missing" };
  }
  if (!webhookUrl.startsWith("https://")) {
    return { ok: false, detail: "webhook URL must be https" };
  }

  const secret =
    process.env.TELEGRAM_ANKETA_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";

  const payload: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ["message"],
    drop_pending_updates: false,
  };
  if (secret) payload.secret_token = secret;

  const res = await fetch(
    `https://api.telegram.org/bot${cfg.token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await res.text();
  if (!res.ok) return { ok: false, detail: body };

  await fetch(`https://api.telegram.org/bot${cfg.token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        {
          command: "anketa",
          description: "Остання / N / delete N yes / help",
        },
      ],
    }),
  });

  return { ok: true, detail: body };
}
