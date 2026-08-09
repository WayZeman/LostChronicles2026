/**
 * Нові анкети → Telegram.
 * Бот/чат як у scripts/google-form-all-answers-to-telegram.gs
 */

import type { ApplyQuestion } from "@/lib/application-form-config";
import {
  answersToTelegramLines,
  type ApplicationAnswers,
} from "@/lib/applications";

export type ApplicationNotifyPayload = {
  id?: number;
  answers: ApplicationAnswers;
  questions: ApplyQuestion[];
  nickname?: string;
};

function anketaBotConfig(): { token: string; chatId: string } | null {
  const token =
    process.env.TELEGRAM_ANKETA_BOT_TOKEN?.trim() ||
    process.env.TELEGRAM_ORDERS_BOT_TOKEN?.trim();
  const chatId =
    process.env.TELEGRAM_ANKETA_CHAT_ID?.trim() ||
    process.env.TELEGRAM_ORDERS_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  return { token, chatId };
}

export function formatApplicationTelegramText(
  a: ApplicationNotifyPayload,
): string {
  const head = a.id
    ? `📩 Нова анкета!  ·  #${a.id}`
    : "📩 Нова анкета!";
  const lines = answersToTelegramLines(a.questions, a.answers);
  return [head, ...lines].join("\n");
}

export async function notifyApplicationTelegram(
  a: ApplicationNotifyPayload,
): Promise<boolean> {
  const cfg = anketaBotConfig();
  if (!cfg) {
    console.error(
      "[apply] TELEGRAM_ANKETA_* / TELEGRAM_ORDERS_* missing (див. google-form-all-answers-to-telegram.gs)",
    );
    return false;
  }

  let text = formatApplicationTelegramText(a);
  if (text.length > 4000) {
    text = `${text.slice(0, 3990)}\n…`;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          text,
          disable_web_page_preview: true,
        }),
      },
    );
    if (!res.ok) {
      console.error(
        "[apply] Telegram error:",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error("[apply] Telegram request failed:", e);
    return false;
  }
}
