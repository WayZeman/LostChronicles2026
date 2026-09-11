/**
 * Сповіщення про замовлення підтримки в Telegram (@serveranketbot) і Discord.
 * Telegram: TELEGRAM_ORDERS_BOT_TOKEN + TELEGRAM_ORDERS_CHAT_ID
 * Discord: DISCORD_SUPPORT_WEBHOOK_URL (розділ «Підтримка»)
 */

function escapeDiscordBoldFragment(s: string): string {
  return s.replace(/\*/g, "＊");
}

function escapeTelegramHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatUahFromKopecks(kopecks: number): string {
  return (kopecks / 100).toLocaleString("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function ordersBotConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_ORDERS_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ORDERS_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  return { token, chatId };
}

function supportDiscordWebhookUrl(): string | null {
  return (
    process.env.DISCORD_SUPPORT_WEBHOOK_URL?.trim() ||
    process.env.DISCORD_WEBHOOK?.trim() ||
    null
  );
}

async function postSupportDiscordWebhook(
  payload: Record<string, unknown>,
): Promise<boolean> {
  const webhook = supportDiscordWebhookUrl();
  if (!webhook) {
    console.error("[support-orders] DISCORD_SUPPORT_WEBHOOK_URL missing");
    return false;
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        allowed_mentions: { parse: [] },
      }),
    });
    if (!res.ok) {
      console.error(
        "[support-orders] Discord webhook error:",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error("[support-orders] Discord webhook failed:", e);
    return false;
  }
}

async function sendOrdersTelegramHtml(html: string): Promise<boolean> {
  const cfg = ordersBotConfig();
  if (!cfg) {
    console.error(
      "[support-orders] TELEGRAM_ORDERS_BOT_TOKEN / TELEGRAM_ORDERS_CHAT_ID missing",
    );
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          text: html,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );
    if (!res.ok) {
      console.error(
        "[support-orders] Telegram error:",
        res.status,
        await res.text(),
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error("[support-orders] Telegram request failed:", e);
    return false;
  }
}

type OrderNotifyItem = {
  card_title: string;
  price_label: string;
  quantity: number;
  line_kopecks: number;
  unit_kopecks?: number;
};

type OrderNotifyPayload = {
  id: number;
  card_title: string;
  price_label: string;
  amount_kopecks: number;
  quantity?: number;
  nickname: string;
  note: string;
  items?: OrderNotifyItem[];
};

function divider(): string {
  return "———————————————";
}

function buildReceipt(order: OrderNotifyPayload): string {
  const nick = escapeTelegramHtml(order.nickname);
  const items =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            card_title: order.card_title,
            price_label: order.price_label,
            quantity: Math.max(1, order.quantity ?? 1),
            line_kopecks: order.amount_kopecks,
          },
        ];

  const lines = items.map((it, i) => {
    const title = escapeTelegramHtml(it.card_title);
    const qty = Math.max(1, it.quantity);
    const lineTotal = formatUahFromKopecks(it.line_kopecks);
    const unit =
      it.unit_kopecks != null && it.unit_kopecks > 0
        ? formatUahFromKopecks(it.unit_kopecks)
        : qty > 0
          ? formatUahFromKopecks(Math.round(it.line_kopecks / qty))
          : lineTotal;
    return (
      `<b>${i + 1}.</b> ${title}\n` +
      `   ${qty} × ${escapeTelegramHtml(unit)} ₴  =  <b>${escapeTelegramHtml(lineTotal)} ₴</b>`
    );
  });

  const total = escapeTelegramHtml(formatUahFromKopecks(order.amount_kopecks));
  const note = order.note.trim()
    ? `\n${divider()}\n💬 <b>Коментар</b>\n${escapeTelegramHtml(order.note.trim())}`
    : "";

  return (
    `${divider()}\n` +
    lines.join("\n\n") +
    `\n${divider()}\n` +
    `💵 <b>Разом: ${total} ₴</b>\n` +
    `👤 Нік: <b>${nick}</b>\n` +
    `🧾 Чек № <b>${order.id}</b>` +
    note
  );
}

function buildReceiptDiscord(order: OrderNotifyPayload): string {
  const nick = escapeDiscordBoldFragment(order.nickname);
  const items =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            card_title: order.card_title,
            price_label: order.price_label,
            quantity: Math.max(1, order.quantity ?? 1),
            line_kopecks: order.amount_kopecks,
          },
        ];

  const lines = items.map((it, i) => {
    const title = escapeDiscordBoldFragment(it.card_title);
    const qty = Math.max(1, it.quantity);
    const lineTotal = formatUahFromKopecks(it.line_kopecks);
    const unit =
      it.unit_kopecks != null && it.unit_kopecks > 0
        ? formatUahFromKopecks(it.unit_kopecks)
        : qty > 0
          ? formatUahFromKopecks(Math.round(it.line_kopecks / qty))
          : lineTotal;
    return (
      `**${i + 1}.** ${title}\n` +
      `   ${qty} × ${unit} ₴  =  **${lineTotal} ₴**`
    );
  });

  const total = escapeDiscordBoldFragment(
    formatUahFromKopecks(order.amount_kopecks),
  );
  const note = order.note.trim()
    ? `\n${divider()}\n💬 **Коментар**\n${escapeDiscordBoldFragment(order.note.trim())}`
    : "";

  return (
    `${divider()}\n` +
    lines.join("\n\n") +
    `\n${divider()}\n` +
    `💵 **Разом: ${total} ₴**\n` +
    `👤 Нік: **${nick}**\n` +
    `🧾 Чек № **${order.id}**` +
    note
  );
}

export async function notifySupportOrderCreatedTelegram(
  order: OrderNotifyPayload,
): Promise<boolean> {
  const html =
    `🛒 <b>НОВЕ ЗАМОВЛЕННЯ</b>\n` +
    `<i>Lost Chronicles · магазин</i>\n\n` +
    buildReceipt(order) +
    `\n\n⏳ <i>Гравець перейшов до оплати</i>\n` +
    `Підтвердити: <code>/pay ${order.id} yes</code>\n` +
    `Відхилити: <code>/pay ${order.id} no</code>`;

  return sendOrdersTelegramHtml(html);
}

export async function notifySupportOrderCreatedDiscord(
  order: OrderNotifyPayload,
): Promise<boolean> {
  return postSupportDiscordWebhook({
    embeds: [
      {
        title: "🛒 Нове замовлення",
        description:
          buildReceiptDiscord(order) +
          `\n\n⏳ *Гравець перейшов до оплати*`,
        color: 0xfee75c,
        footer: { text: "Lost Chronicles · магазин" },
      },
    ],
  });
}

export async function notifySupportOrderCreated(
  order: OrderNotifyPayload,
): Promise<boolean> {
  const [telegram, discord] = await Promise.all([
    notifySupportOrderCreatedTelegram(order),
    notifySupportOrderCreatedDiscord(order),
  ]);
  return telegram || discord;
}

export async function notifySupportOrderPaidTelegram(
  order: OrderNotifyPayload,
): Promise<boolean> {
  const html =
    `✅ <b>ОПЛАТУ ПІДТВЕРДЖЕНО</b>\n` +
    `<i>Lost Chronicles · магазин</i>\n\n` +
    buildReceipt(order);

  return sendOrdersTelegramHtml(html);
}

export async function notifySupportOrderPaidDiscord(
  order: OrderNotifyPayload,
): Promise<boolean> {
  return postSupportDiscordWebhook({
    embeds: [
      {
        title: "✅ Оплату підтверджено",
        description: buildReceiptDiscord(order),
        color: 0x57f287,
        footer: { text: "Lost Chronicles · магазин" },
      },
    ],
  });
}

export async function notifySupportOrderPaid(
  order: OrderNotifyPayload,
): Promise<boolean> {
  const [telegram, discord] = await Promise.all([
    notifySupportOrderPaidTelegram(order),
    notifySupportOrderPaidDiscord(order),
  ]);
  return telegram || discord;
}

/** Адмін позначив чек як неоплачений → випадає з топу. */
export async function notifySupportOrderNotPaidTelegram(
  order: OrderNotifyPayload,
): Promise<boolean> {
  const html =
    `❌ <b>ПІДТРИМКА НЕ ОПЛАЧЕНА</b>\n` +
    `<i>Lost Chronicles · магазин</i>\n\n` +
    buildReceipt(order) +
    `\n\n⚠️ <i>Замовлення скасовано: оплата не надійшла, тому підтримка недійсна.\n` +
    `Цей чек знято з топу (інші внески гравця лишаються).</i>`;

  return sendOrdersTelegramHtml(html);
}

export async function notifySupportOrderNotPaidDiscord(
  order: OrderNotifyPayload,
): Promise<boolean> {
  return postSupportDiscordWebhook({
    embeds: [
      {
        title: "❌ Підтримка не оплачена",
        description:
          buildReceiptDiscord(order) +
          `\n\n⚠️ *Замовлення скасовано: оплата не надійшла, тому підтримка недійсна.\n` +
          `Цей чек знято з топу (інші внески гравця лишаються).*`,
        color: 0xed4245,
        footer: { text: "Lost Chronicles · магазин" },
      },
    ],
  });
}

export async function notifySupportOrderNotPaid(
  order: OrderNotifyPayload,
): Promise<boolean> {
  const [telegram, discord] = await Promise.all([
    notifySupportOrderNotPaidTelegram(order),
    notifySupportOrderNotPaidDiscord(order),
  ]);
  return telegram || discord;
}

export async function notifyUnmatchedDonationTelegram(
  amountKopecks: number,
): Promise<boolean> {
  const html =
    `💛 <b>ДОНАТ У БАНКУ</b>\n` +
    `<i>Lost Chronicles</i>\n\n` +
    `${divider()}\n` +
    `💵 Сума: <b>${escapeTelegramHtml(formatUahFromKopecks(amountKopecks))} ₴</b>\n` +
    `${divider()}\n` +
    `<i>Немає pending-замовлення з такою сумою</i>`;
  return sendOrdersTelegramHtml(html);
}

export async function notifyUnmatchedDonationDiscord(
  amountKopecks: number,
): Promise<boolean> {
  const amount = escapeDiscordBoldFragment(
    formatUahFromKopecks(amountKopecks),
  );
  return postSupportDiscordWebhook({
    embeds: [
      {
        title: "💛 Донат у банку",
        description:
          `${divider()}\n` +
          `💵 Сума: **${amount} ₴**\n` +
          `${divider()}\n` +
          `*Немає pending-замовлення з такою сумою*`,
        color: 0xf1c40f,
        footer: { text: "Lost Chronicles" },
      },
    ],
  });
}

export async function notifyUnmatchedDonation(
  amountKopecks: number,
): Promise<boolean> {
  const [telegram, discord] = await Promise.all([
    notifyUnmatchedDonationTelegram(amountKopecks),
    notifyUnmatchedDonationDiscord(amountKopecks),
  ]);
  return telegram || discord;
}

/** Payload для сповіщень з повного запису замовлення. */
export function supportOrderToNotifyPayload(
  order: {
    id: number;
    card_title: string;
    price_label: string;
    amount_kopecks: number;
    quantity?: number;
    nickname: string;
    note: string;
    items?: Array<{
      card_title: string;
      price_label: string;
      quantity: number;
      line_kopecks: number;
      unit_kopecks?: number;
    }>;
  },
): OrderNotifyPayload {
  return {
    id: order.id,
    card_title: order.card_title,
    price_label: order.price_label,
    amount_kopecks: order.amount_kopecks,
    quantity: order.quantity,
    nickname: order.nickname,
    note: order.note,
    items: order.items?.map((it) => ({
      card_title: it.card_title,
      price_label: it.price_label,
      quantity: it.quantity,
      line_kopecks: it.line_kopecks,
      unit_kopecks: it.unit_kopecks,
    })),
  };
}
