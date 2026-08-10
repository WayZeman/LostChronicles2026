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
  /** Порядковий № (1 = найстаріша) */
  ordinal?: number;
  total?: number;
  answers: ApplicationAnswers;
  questions: ApplyQuestion[];
  nickname?: string;
};

export function anketaBotConfig(): { token: string; chatId: string } | null {
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
  let head = "📩 Нова анкета!";
  if (a.ordinal && a.total) {
    head = `📩 Нова анкета!  ·  #${a.ordinal} / ${a.total}`;
  } else if (a.id) {
    head = `📩 Нова анкета!  ·  #${a.id}`;
  }
  const lines = answersToTelegramLines(a.questions, a.answers);
  return [head, ...lines].join("\n");
}

export async function sendAnketaTelegramText(
  text: string,
  opts?: { chatId?: string; threadId?: number | null },
): Promise<boolean> {
  const cfg = anketaBotConfig();
  if (!cfg) return false;

  let body = text;
  if (body.length > 4000) body = `${body.slice(0, 3990)}\n…`;

  const payload: Record<string, unknown> = {
    chat_id: opts?.chatId || cfg.chatId,
    text: body,
    disable_web_page_preview: true,
  };
  if (opts?.threadId) {
    payload.message_thread_id = opts.threadId;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
  return sendAnketaTelegramText(formatApplicationTelegramText(a));
}
