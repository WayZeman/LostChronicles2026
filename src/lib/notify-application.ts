/**
 * Нові анкети → Telegram.
 * Бот/чат як у scripts/google-form-all-answers-to-telegram.gs
 * (@serveranketbot → «Адміністрація серверу підвальна»).
 *
 * Env (пріоритет):
 *   TELEGRAM_ANKETA_BOT_TOKEN + TELEGRAM_ANKETA_CHAT_ID
 * fallback: TELEGRAM_ORDERS_BOT_TOKEN + TELEGRAM_ORDERS_CHAT_ID
 */

import {
  APPLY_TELEGRAM_LABELS,
  APPLY_TELEGRAM_ORDER,
  type ApplyFieldKey,
} from "@/lib/application-form-config";

export type ApplicationNotifyPayload = {
  id?: number;
  email: string;
  nickname: string;
  birthday: string;
  age: string;
  contacts: string;
  experience: string;
  previousProjects: string;
  whyServer: string;
  howFound: string;
};

/** Ті самі значення, що BOT_TOKEN / CHAT_ID у google-form-all-answers-to-telegram.gs */
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

function dash(s: string): string {
  const t = s.trim();
  return t || "—";
}

function valueForKey(
  a: ApplicationNotifyPayload,
  key: ApplyFieldKey,
): string {
  switch (key) {
    case "email":
      return a.email;
    case "nickname":
      return a.nickname;
    case "birthday":
      return a.birthday;
    case "age":
      return a.age;
    case "contacts":
      return a.contacts;
    case "experience":
      return a.experience;
    case "previousProjects":
      return a.previousProjects;
    case "whyServer":
      return a.whyServer;
    case "howFound":
      return a.howFound;
  }
}

/** Компактний формат як у старих сповіщеннях з Google Form. */
export function formatApplicationTelegramText(
  a: ApplicationNotifyPayload,
): string {
  const head = a.id
    ? `📩 Нова анкета!  ·  #${a.id}`
    : "📩 Нова анкета!";
  const lines = [head];
  for (const key of APPLY_TELEGRAM_ORDER) {
    const val = valueForKey(a, key).trim();
    if (!val && key === "birthday") continue;
    lines.push(`${APPLY_TELEGRAM_LABELS[key]}: ${dash(val)}`);
  }
  return lines.join("\n");
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
