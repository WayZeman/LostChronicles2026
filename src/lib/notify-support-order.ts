/**
 * Сповіщення про замовлення підтримки в Telegram (@serveranketbot).
 * Env: TELEGRAM_ORDERS_BOT_TOKEN + TELEGRAM_ORDERS_CHAT_ID
 */

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

function orderLines(order: OrderNotifyPayload): string {
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

  const itemLines = items
    .map((it) => {
      const title = escapeTelegramHtml(it.card_title);
      const qty = Math.max(1, it.quantity);
      const line = formatUahFromKopecks(it.line_kopecks);
      const qtyPart = qty > 1 ? ` × ${qty}` : "";
      return `• ${title}${qtyPart} — ${escapeTelegramHtml(line)} ₴`;
    })
    .join("\n");

  const total = escapeTelegramHtml(formatUahFromKopecks(order.amount_kopecks));
  const note = order.note.trim()
    ? `\n📝 ${escapeTelegramHtml(order.note.trim())}`
    : "";

  return (
    `${itemLines}\n\n` +
    `💵 Разом: <b>${total} ₴</b>\n` +
    `👤 Нік: <b>${nick}</b>\n` +
    `🆔 #${order.id}` +
    note
  );
}

export async function notifySupportOrderCreatedTelegram(
  order: OrderNotifyPayload,
): Promise<boolean> {
  const html =
    `<b>Нове замовлення</b>\n` +
    `<i>Гравець перейшов до оплати</i>\n\n` +
    orderLines(order);

  return sendOrdersTelegramHtml(html);
}

export async function notifySupportOrderPaidTelegram(
  order: OrderNotifyPayload,
): Promise<boolean> {
  const html = `<b>Оплату підтверджено</b>\n\n` + orderLines(order);
  return sendOrdersTelegramHtml(html);
}

export async function notifyUnmatchedDonationTelegram(
  amountKopecks: number,
): Promise<boolean> {
  const html =
    `<b>Донат у банку</b>\n\n` +
    `💵 ${escapeTelegramHtml(formatUahFromKopecks(amountKopecks))} ₴\n` +
    `<i>Немає pending-замовлення з такою сумою</i>`;
  return sendOrdersTelegramHtml(html);
}
