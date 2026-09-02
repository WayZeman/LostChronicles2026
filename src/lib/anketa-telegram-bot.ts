import { getApplyFormConfig } from "@/lib/application-form-config";
import {
  applicationServerStatusEmoji,
  applicationServerStatusLabelUk,
  countApplications,
  deleteApplicationByOrdinal,
  getApplicationByOrdinal,
  getLastApplicationOrdinal,
  setApplicationServerStatusByOrdinal,
  type ApplicationServerStatus,
} from "@/lib/applications";
import {
  anketaBotConfig,
  formatApplicationTelegramText,
  sendAnketaTelegramText,
} from "@/lib/notify-application";
import {
  notifySupportOrderNotPaidTelegram,
  notifySupportOrderPaidTelegram,
  supportOrderToNotifyPayload,
} from "@/lib/notify-support-order";
import {
  getSupportOrderById,
  markSupportOrderNotPaid,
  markSupportOrderPaid,
} from "@/lib/support-orders";

/** Меню при введенні «/» у Telegram (до 32 символів на command). */
export const ANKETA_BOT_COMMANDS = [
  { command: "anketa", description: "Остання / №N — анкета зі статусом" },
  { command: "add", description: "Прийняти: /add server 3" },
  { command: "deny", description: "Відхилити: /deny server 3" },
  { command: "clear", description: "Скинути статус: /clear server 3" },
  { command: "count", description: "Скільки анкет у базі" },
  { command: "delete", description: "Видалити: /delete 12 yes" },
  { command: "pay", description: "Оплата чека: /pay 19 yes або no" },
  { command: "notpay", description: "Неоплачений чек: /notpay 10" },
  { command: "help", description: "Усі команди" },
] as const;

/** Текст /help і підказка для групи. */
export function anketaHelpText(): string {
  return (
    "📋 Команди анкет (сайт /apply)\n\n" +
    "/anketa — остання анкета\n" +
    "/anketa 12 — анкета №12 (+ статус)\n" +
    "/add server 12 — прийняти + LuckPerms promote ranks\n" +
    "/deny server 12 — відхилити + LuckPerms demote ranks\n" +
    "/clear server 12 — скинути статус\n" +
    "/count — скільки анкет у базі\n" +
    "/delete 12 — що буде видалено\n" +
    "/delete 12 yes — видалити\n" +
    "/delete last yes — видалити останню\n\n" +
    "🛒 Магазин / підтримка\n\n" +
    "/pay 19 — перегляд чека №19\n" +
    "/pay 19 yes — оплату підтверджено (у топ)\n" +
    "/pay 19 no — оплата не надійшла\n" +
    "/notpay 10 — те саме, що /pay 10 no\n\n" +
    "/help — ця підказка\n\n" +
    "Коротко також: /add 12 · /deny 12\n\n" +
    "Статуси в анкеті:\n" +
    "✅ На сервері — після підтвердження Minecraft\n" +
    "⏳ Прийнято, очікує сервер · ⚠️ Не вдалося додати\n" +
    "❌ Не прийнято · ⏳ Очікує рішення\n\n" +
    "№1 = перша (найстаріша), найбільший № = остання.\n" +
    "Після видалення номери зсуваються."
  );
}

function helpText(): string {
  return anketaHelpText();
}

function formatUahFromKopecks(kopecks: number): string {
  return (kopecks / 100).toLocaleString("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function supportOrderStatusLabelUk(status: string): string {
  switch (status) {
    case "paid":
      return "✅ оплачено";
    case "pending":
      return "⏳ очікує оплати";
    case "cancelled":
      return "❌ скасовано";
    case "expired":
      return "⌛ прострочено";
    default:
      return status;
  }
}

async function formatSupportOrderPayPreview(orderId: number): Promise<string | null> {
  const order = await getSupportOrderById(orderId);
  if (!order) return null;
  const total = formatUahFromKopecks(order.amount_kopecks);
  const title =
    order.items.length > 0
      ? order.items.map((it) => it.card_title).join(", ")
      : order.card_title;
  return (
    `🧾 Чек №${order.id}\n` +
    `👤 ${order.nickname || "—"}\n` +
    `📦 ${title}\n` +
    `💵 ${total} ₴\n` +
    `Статус: ${supportOrderStatusLabelUk(order.status)}\n\n` +
    `Підтвердити оплату:\n/pay ${order.id} yes\n` +
    `Оплата не надійшла:\n/pay ${order.id} no`
  );
}

async function handlePayCommand(
  arg: string,
  reply: (body: string) => Promise<boolean>,
): Promise<boolean> {
  if (!arg) {
    await reply(
      "Вкажи номер чека:\n" +
        "/pay 19 — перегляд\n" +
        "/pay 19 yes — оплату підтверджено\n" +
        "/pay 19 no — оплата не надійшла",
    );
    return true;
  }

  const m = arg.match(/^(\d+)(?:\s+(yes|y|no|n|так|ні|не))?$/i);
  if (!m) {
    await reply(
      "Не зрозумів.\nПриклад: /pay 19 yes\n\n" + helpText(),
    );
    return true;
  }

  const orderId = parseInt(m[1], 10);
  const decision = (m[2] || "").toLowerCase();

  if (!decision) {
    const preview = await formatSupportOrderPayPreview(orderId);
    if (!preview) {
      await reply(`Немає замовлення (чек) №${orderId}.`);
      return true;
    }
    await reply(preview);
    return true;
  }

  const approve = decision === "yes" || decision === "y" || decision === "так";
  const reject =
    decision === "no" || decision === "n" || decision === "ні" || decision === "не";

  if (!approve && !reject) {
    await reply(
      "Вкажи yes або no:\n/pay 19 yes — оплачено\n/pay 19 no — не оплачено",
    );
    return true;
  }

  if (approve) {
    const result = await markSupportOrderPaid(orderId);
    if (!result.ok) {
      if (result.reason === "not_found") {
        await reply(`Немає замовлення (чек) №${orderId}.`);
        return true;
      }
      if (result.reason === "already_paid") {
        await reply(`Чек №${orderId} уже позначено як оплачений.`);
        return true;
      }
      if (result.reason === "cancelled") {
        await reply(
          `Чек №${orderId} скасовано. Створіть нове замовлення або відновіть вручну в БД.`,
        );
        return true;
      }
      if (result.reason === "expired") {
        await reply(`Чек №${orderId} прострочений (expired).`);
        return true;
      }
      await reply(`Не вдалося підтвердити чек №${orderId}. Спробуй ще раз.`);
      return true;
    }

    const payload = supportOrderToNotifyPayload(result.order);
    const total = formatUahFromKopecks(result.order.amount_kopecks);
    await notifySupportOrderPaidTelegram(payload);
    await reply(
      `✅ Чек №${result.order.id} підтверджено\n` +
        `👤 ${result.order.nickname}\n` +
        `💵 ${total} ₴ — додано до топу підтримки`,
    );
    return true;
  }

  const result = await markSupportOrderNotPaid(orderId);
  if (!result.ok) {
    if (result.reason === "not_found") {
      await reply(`Немає замовлення (чек) №${orderId}.`);
      return true;
    }
    if (result.reason === "already_cancelled") {
      await reply(`Чек №${orderId} уже позначено як неоплачений.`);
      return true;
    }
    if (result.reason === "expired") {
      await reply(`Чек №${orderId} уже прострочений (expired) і не в топі.`);
      return true;
    }
    await reply(`Не вдалося оновити чек №${orderId}. Спробуй ще раз.`);
    return true;
  }

  await notifySupportOrderNotPaidTelegram(
    supportOrderToNotifyPayload(result.order),
  );
  await reply(
    `❌ Чек №${result.order.id} — оплата не підтверджена\n` +
      `👤 ${result.order.nickname}\n` +
      `Сума не додана до топу підтримки`,
  );
  return true;
}

function parseOrdinalArg(arg: string): number | "last" | null {
  const m = arg
    .trim()
    .match(/^(?:server\s+)?(\d+|last|останн\S*)$/i);
  if (!m) return null;
  if (/^остан/i.test(m[1]) || m[1].toLowerCase() === "last") return "last";
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Нормалізує /anketa …, /add server N, /count, /help, /delete … */
function parseAnketaCommand(
  text: string,
): { cmd: string; arg: string } | null {
  const match = text
    .trim()
    .match(
      /^\/(anketa|анкета|count|help|start|delete|del|допомога|видалити|видали|add|deny|reject|clear|reset|notpay|pay|оплата)(?:@\w+)?(?:\s+(.+))?$/i,
    );
  if (!match) return null;

  let cmd = match[1].toLowerCase();
  let arg = (match[2] || "").trim();

  if (cmd === "анкета") cmd = "anketa";
  if (cmd === "допомога" || cmd === "start") cmd = "help";
  if (cmd === "del" || cmd === "видалити" || cmd === "видали") cmd = "delete";
  if (cmd === "reject") cmd = "deny";
  if (cmd === "reset") cmd = "clear";

  if (cmd === "оплата") cmd = "pay";

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
  if (cfg && String(chatId) === String(cfg.chatId)) return true;
  const ordersChat = process.env.TELEGRAM_ORDERS_CHAT_ID?.trim();
  if (ordersChat && String(chatId) === String(ordersChat)) return true;
  const extra = process.env.TELEGRAM_ANKETA_ALLOWED_CHAT_IDS?.trim();
  if (!extra) return false;
  return extra
    .split(/[\s,]+/)
    .filter(Boolean)
    .some((id) => id === String(chatId));
}

async function resolveOrdinal(
  target: number | "last",
): Promise<number | null> {
  if (target !== "last") return target;
  const last = await getLastApplicationOrdinal(null);
  return last?.ordinal ?? null;
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

  if (cmd === "pay") {
    return handlePayCommand(arg, reply);
  }

  if (cmd === "notpay") {
    if (!arg || !/^\d+$/.test(arg)) {
      await reply(
        "Вкажи номер чека:\n/notpay 10\n\n(номер з повідомлення «Чек № …»)",
      );
      return true;
    }
    const orderId = parseInt(arg, 10);
    const result = await markSupportOrderNotPaid(orderId);
    if (!result.ok) {
      if (result.reason === "not_found") {
        await reply(`Немає замовлення (чек) №${orderId}.`);
        return true;
      }
      if (result.reason === "already_cancelled") {
        await reply(`Чек №${orderId} уже позначено як неоплачений.`);
        return true;
      }
      if (result.reason === "expired") {
        await reply(
          `Чек №${orderId} уже прострочений (expired) і не в топі.`,
        );
        return true;
      }
      await reply(`Не вдалося оновити чек №${orderId}. Спробуй ще раз.`);
      return true;
    }

    const notified = await notifySupportOrderNotPaidTelegram(
      supportOrderToNotifyPayload(result.order),
    );
    if (!notified) {
      await reply(
        `Чек №${result.order.id} скасовано, але сповіщення в чат не пішло.`,
      );
    }
    return true;
  }

  if (cmd === "count") {
    const n = await countApplications();
    await reply(`📊 Анкет з сайту: ${n}`);
    return true;
  }

  if (cmd === "add" || cmd === "deny" || cmd === "clear") {
    if (!arg) {
      await reply(
        cmd === "add"
          ? "Вкажи номер анкети:\n/add server 12"
          : cmd === "deny"
            ? "Вкажи номер анкети:\n/deny server 12"
            : "Вкажи номер анкети:\n/clear server 12",
      );
      return true;
    }

    const parsedOrd = parseOrdinalArg(arg);
    if (parsedOrd == null) {
      await reply(
        `Не зрозумів номер.\nПриклад: /${cmd} server 12\n\n${helpText()}`,
      );
      return true;
    }

    const ordinal = await resolveOrdinal(parsedOrd);
    if (ordinal == null) {
      await reply("У базі ще немає анкет з сайту.");
      return true;
    }

    const status: ApplicationServerStatus =
      cmd === "add" ? "accepted" : cmd === "deny" ? "rejected" : "pending";

    const questions = (await getApplyFormConfig()).questions;
    const updated = await setApplicationServerStatusByOrdinal(
      ordinal,
      status,
      questions,
    );
    if (!updated) {
      const total = await countApplications();
      await reply(`Немає анкети №${ordinal}. Доступно: 1…${total || 0}`);
      return true;
    }

    const nick = updated.row.nickname || "—";
    const rank = updated.row.ingameRank;
    const waitHint =
      status === "accepted"
        ? "\nСервер підтвердить LuckPerms. «На сервері» з’явиться тільки після відповіді плагіна."
        : status === "rejected"
          ? "\nЯкщо гравця вже додавали плагіном — сервер зніме ранг і напише сюди."
          : "";
    await reply(
      `${applicationServerStatusEmoji(status, rank)} Анкета #${updated.ordinal} / ${updated.total}\n` +
        `👤 Нік: ${nick}\n` +
        `Статус: ${applicationServerStatusLabelUk(status, rank)}${waitHint}\n\n` +
        `Перегляд: /anketa ${updated.ordinal}`,
    );
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
        serverStatus: last.row.serverStatus,
        ingameRank: last.row.ingameRank,
        kind: "view",
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
        serverStatus: found.row.serverStatus,
        ingameRank: found.row.ingameRank,
        kind: "view",
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
    undefined,
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
