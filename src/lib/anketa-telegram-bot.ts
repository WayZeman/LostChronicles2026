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

/** Меню при введенні «/» у Telegram (до 32 символів на command). */
export const ANKETA_BOT_COMMANDS = [
  { command: "anketa", description: "Остання анкета з сайту" },
  { command: "count", description: "Скільки анкет у базі" },
  { command: "delete", description: "Видалити: /delete 12 або /delete 12 yes" },
  { command: "help", description: "Усі команди анкет" },
] as const;

function helpText(): string {
  return (
    "Команди анкет (сайт /apply):\n" +
    "/anketa — остання\n" +
    "/anketa 12 — анкета №12\n" +
    "/count — скільки всього\n" +
    "/delete 12 — що буде видалено\n" +
    "/delete 12 yes — видалити\n" +
    "/delete last yes — видалити останню\n" +
    "/help — ця підказка\n\n" +
    "Також працює: /anketa count | /anketa delete 12 yes\n" +
    "№1 = перша (найстаріша), найбільший № = остання.\n" +
    "Після видалення номери зсуваються."
  );
}

/** Нормалізує /anketa … та окремі /count /help /delete … */
function parseAnketaCommand(
  text: string,
): { cmd: string; arg: string } | null {
  const match = text
    .trim()
    .match(
      /^\/(anketa|анкета|count|help|start|delete|del|допомога|видалити|видали)(?:@\w+)?(?:\s+(.+))?$/i,
    );
  if (!match) return null;

  let cmd = match[1].toLowerCase();
  let arg = (match[2] || "").trim();

  if (cmd === "анкета") cmd = "anketa";
  if (cmd === "допомога" || cmd === "start") cmd = "help";
  if (cmd === "del" || cmd === "видалити" || cmd === "видали") cmd = "delete";

  // /anketa count → cmd count; /anketa delete 12 yes → cmd delete
  if (cmd === "anketa" && arg) {
    const sub = arg.match(
      /^(count|к-сть|кількість|help|допомога|\?|delete|del|remove|видалити|видали)(?:\s+(.+))?$/i,
    );
    if (sub) {
      const s = sub[1].toLowerCase();
      if (s === "count" || s === "к-сть" || s === "кількість") {
        cmd = "count";
        arg = "";
      } else if (s === "help" || s === "допомога" || s === "?") {
        cmd = "help";
        arg = "";
      } else {
        cmd = "delete";
        arg = (sub[2] || "").trim();
      }
    }
  }

  return { cmd, arg: arg.toLowerCase() };
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

  const parsed = parseAnketaCommand(String(m.text));
  if (!parsed) return false;

  const { cmd } = parsed;
  const arg = parsed.arg;
  const threadId = m.message_thread_id || null;
  const reply = (body: string) =>
    sendAnketaTelegramText(body, { chatId, threadId });

  if (cmd === "help") {
    await reply(helpText());
    return true;
  }

  if (cmd === "count") {
    const n = await countApplications();
    await reply(`📊 Анкет з сайту: ${n}`);
    return true;
  }

  if (cmd === "delete") {
    if (!arg) {
      await reply(
        "Вкажи номер:\n" +
          "/delete 12 — перегляд\n" +
          "/delete 12 yes — видалити\n" +
          "/delete last yes — видалити останню",
      );
      return true;
    }

    const del = arg.match(
      /^(\d+|last|останн\S*)(?:\s+(yes|y|так|підтверджую))?$/i,
    );
    if (!del) {
      await reply(`Не зрозумів.\n\n${helpText()}`);
      return true;
    }

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
        `Щоб підтвердити:\n/delete ${preview.ordinal} yes`,
    );
    return true;
  }

  // /anketa [номер | last]
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

  await registerAnketaBotCommands(cfg.token);

  return { ok: true, detail: body };
}

/** Реєструє меню «/» для особистих чатів і для груп (адмінка). */
export async function registerAnketaBotCommands(
  token?: string,
): Promise<{ ok: boolean; detail: string }> {
  const cfg = anketaBotConfig();
  const botToken = token || cfg?.token;
  if (!botToken) {
    return { ok: false, detail: "TELEGRAM_ANKETA_* / ORDERS_* missing" };
  }

  const commands = ANKETA_BOT_COMMANDS.map((c) => ({
    command: c.command,
    description: c.description,
  }));

  const scopes: Array<Record<string, unknown> | undefined> = [
    undefined, // default (приватні чати)
    { type: "all_private_chats" },
    { type: "all_group_chats" },
    { type: "all_chat_administrators" },
  ];

  if (cfg?.chatId) {
    const chatId = Number(cfg.chatId);
    scopes.push({
      type: "chat",
      chat_id: Number.isFinite(chatId) ? chatId : cfg.chatId,
    });
    scopes.push({
      type: "chat_administrators",
      chat_id: Number.isFinite(chatId) ? chatId : cfg.chatId,
    });
  }

  const results: string[] = [];
  for (const scope of scopes) {
    const payload: Record<string, unknown> = { commands };
    if (scope) payload.scope = scope;
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/setMyCommands`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const text = await res.text();
    results.push(`${scope ? JSON.stringify(scope) : "default"}:${text}`);
    if (!res.ok) return { ok: false, detail: results.join(" | ") };
  }

  return { ok: true, detail: results.join(" | ") };
}
