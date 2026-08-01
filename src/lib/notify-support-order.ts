/**
 * Сповіщення про оплачені замовлення підтримки в Telegram-групу (@serveranketbot).
 * Env: TELEGRAM_ORDERS_BOT_TOKEN + TELEGRAM_ORDERS_CHAT_ID
 * (окремо від бота пропозицій).
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

type OrderNotifyPayload = {
  id: number;
  card_title: string;
  price_label: string;
  amount_kopecks: number;
  nickname: string;
  note: string;
};

function orderLines(order: OrderNotifyPayload): string {
  const title = escapeTelegramHtml(order.card_title);
  const nick = escapeTelegramHtml(order.nickname);
  const price = escapeTelegramHtml(
    order.price_label || `${formatUahFromKopecks(order.amount_kopecks)} ₴`,
  );
  const note = order.note.trim()
    ? `\n📝 ${escapeTelegramHtml(order.note.trim())}`
    : "";

  return (
    `📦 ${title}\n` +
    `👤 Нік: <b>${nick}</b>\n` +
    `💵 ${price}\n` +
    `🆔 #${order.id}` +
    note
  );
}

/** Одразу коли гравець натиснув «Оплатити» (ще до надходження на банку). */
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
  const html =
    `<b>Оплату підтверджено</b>\n\n` + orderLines(order);

  return sendOrdersTelegramHtml(html);
}

/** Донат у банку без зіставленого замовлення. */
export async function notifyUnmatchedDonationTelegram(
  amountKopecks: number,
): Promise<boolean> {
  const html =
    `<b>Донат у банку</b>\n\n` +
    `💵 ${escapeTelegramHtml(formatUahFromKopecks(amountKopecks))} ₴\n` +
    `<i>Немає pending-замовлення з такою сумою</i>`;
  return sendOrdersTelegramHtml(html);
}
