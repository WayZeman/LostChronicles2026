/**
 * Публічний бот сайту (@lostchronicles_bot): оформлення + Mini App.
 * Env: TELEGRAM_SITE_BOT_TOKEN
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  LC_DEFAULT_DISCORD_URL,
  LC_DEFAULT_TELEGRAM_URL,
} from "@/data/lc-social-defaults";
import { LC_MARKETING_SITE_ORIGIN } from "@/lib/lc-domains";
import {
  LC_DEFAULT_BEDROCK_ADDRESS,
  LC_DEFAULT_JAVA_SERVER_HOST,
} from "@/lib/lc-server-defaults";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

export function siteBotToken(): string | null {
  return (
    process.env.TELEGRAM_SITE_BOT_TOKEN?.trim() ||
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    null
  );
}

export function siteBotWebAppUrl(): string {
  const fromEnv = process.env.TELEGRAM_SITE_WEBAPP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    getLcMarketingSiteUrl()
  );
}

function discordUrl(): string {
  return process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || LC_DEFAULT_DISCORD_URL;
}

function communityTelegramUrl(): string {
  return process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || LC_DEFAULT_TELEGRAM_URL;
}

function javaIp(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_IP?.trim() || LC_DEFAULT_JAVA_SERVER_HOST
  );
}

function bedrockAddress(): string {
  return (
    process.env.NEXT_PUBLIC_BEDROCK_ADDRESS?.trim() ||
    LC_DEFAULT_BEDROCK_ADDRESS
  );
}

function bedrockPort(): string {
  return process.env.NEXT_PUBLIC_BEDROCK_PORT?.trim() || "19132";
}

/** Назва в профілі (до 64 символів). */
export const SITE_BOT_DISPLAY_NAME = "Lost Chronicles";

/** About у профілі (до 120 символів). */
export const SITE_BOT_SHORT_DESCRIPTION =
  "Офіційний сайт українського Minecraft-сервера Lost Chronicles";

/** «Що вміє цей бот?» (до 512 символів). */
export function siteBotDescriptionText(webAppUrl: string): string {
  return (
    "Офіційний бот сайту Lost Chronicles — український Minecraft Java / Bedrock.\n\n" +
    "• Відкрий сайт як застосунок у Telegram\n" +
    "• Анкета, вікі, підтримка, пропозиції гравців\n" +
    `• IP: ${javaIp()}\n\n` +
    "Кнопка «Сайт» під полем вводу або команда /start.\n" +
    webAppUrl
  );
}

async function callSiteBotApi(
  method: string,
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; description?: string; result?: unknown }> {
  const token = siteBotToken();
  if (!token) {
    return { ok: false, description: "TELEGRAM_SITE_BOT_TOKEN missing" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      description?: string;
      result?: unknown;
    };
    if (!data.ok) {
      return {
        ok: false,
        description: data.description || `HTTP ${res.status}`,
      };
    }
    return { ok: true, result: data.result };
  } catch (e) {
    return {
      ok: false,
      description: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Multipart для setMyProfilePhoto / sendPhoto з файлу. */
async function callSiteBotApiForm(
  method: string,
  form: FormData,
): Promise<{ ok: boolean; description?: string; result?: unknown }> {
  const token = siteBotToken();
  if (!token) {
    return { ok: false, description: "TELEGRAM_SITE_BOT_TOKEN missing" };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as {
      ok?: boolean;
      description?: string;
      result?: unknown;
    };
    if (!data.ok) {
      return {
        ok: false,
        description: data.description || `HTTP ${res.status}`,
      };
    }
    return { ok: true, result: data.result };
  } catch (e) {
    return {
      ok: false,
      description: e instanceof Error ? e.message : String(e),
    };
  }
}

function mainKeyboard(webAppUrl: string) {
  return {
    inline_keyboard: [
      [{ text: "🌐 Відкрити сайт", web_app: { url: webAppUrl } }],
      [
        { text: "📝 Анкета", url: `${webAppUrl}/apply` },
        { text: "💛 Підтримка", url: `${webAppUrl}/support` },
      ],
      [
        { text: "📚 Вікі", url: `${webAppUrl}/wiki` },
        { text: "🗳 Пропозиції", url: `${webAppUrl}/proposals` },
      ],
      [
        { text: "Discord", url: discordUrl() },
        { text: "Telegram", url: communityTelegramUrl() },
      ],
    ],
  };
}

export async function setSiteBotName(): Promise<{
  ok: boolean;
  detail: string;
}> {
  const result = await callSiteBotApi("setMyName", {
    name: SITE_BOT_DISPLAY_NAME,
  });
  return {
    ok: result.ok,
    detail: result.description || (result.ok ? SITE_BOT_DISPLAY_NAME : "failed"),
  };
}

/** Аватар бота — публічний logo.png сайту. */
export async function setSiteBotProfilePhoto(opts?: {
  /** Абсолютний шлях до PNG (локальний setup). Інакше тягнемо з CDN сайту. */
  localPath?: string;
}): Promise<{ ok: boolean; detail: string }> {
  try {
    let bytes: Buffer;
    let filename = "logo.png";

    if (opts?.localPath) {
      bytes = await readFile(opts.localPath);
      filename = path.basename(opts.localPath);
    } else {
      const url = `${LC_MARKETING_SITE_ORIGIN}/logo.png`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        return { ok: false, detail: `logo fetch HTTP ${res.status}` };
      }
      bytes = Buffer.from(await res.arrayBuffer());
    }

    const form = new FormData();
    form.append(
      "photo",
      JSON.stringify({ type: "static", photo: "attach://file" }),
    );
    form.append(
      "file",
      new Blob([new Uint8Array(bytes)], { type: "image/png" }),
      filename,
    );

    const result = await callSiteBotApiForm("setMyProfilePhoto", form);
    return {
      ok: result.ok,
      detail: result.description || (result.ok ? "profile photo set" : "failed"),
    };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Кнопка меню біля поля вводу → сайт як Mini App. */
export async function setSiteBotMenuButton(): Promise<{
  ok: boolean;
  detail: string;
  webAppUrl: string;
}> {
  const webAppUrl = siteBotWebAppUrl();
  const result = await callSiteBotApi("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "Сайт",
      web_app: { url: webAppUrl },
    },
  });
  return {
    ok: result.ok,
    detail: result.description || (result.ok ? "menu button set" : "failed"),
    webAppUrl,
  };
}

export async function setSiteBotDescriptions(): Promise<{
  ok: boolean;
  detail: string;
}> {
  const webAppUrl = siteBotWebAppUrl();
  const [desc, short] = await Promise.all([
    callSiteBotApi("setMyDescription", {
      description: siteBotDescriptionText(webAppUrl),
    }),
    callSiteBotApi("setMyShortDescription", {
      short_description: SITE_BOT_SHORT_DESCRIPTION,
    }),
  ]);
  if (!desc.ok || !short.ok) {
    return {
      ok: false,
      detail: desc.description || short.description || "description failed",
    };
  }
  return { ok: true, detail: "descriptions set" };
}

export async function setSiteBotCommands(): Promise<{
  ok: boolean;
  detail: string;
}> {
  const result = await callSiteBotApi("setMyCommands", {
    commands: [
      { command: "start", description: "Відкрити сайт і меню" },
      { command: "site", description: "Сайт Lost Chronicles" },
      { command: "ip", description: "IP Java / Bedrock" },
      {
        command: "pinsite",
        description: "Група: закріпити кнопку «Сайт» (лише адмін)",
      },
      { command: "help", description: "Допомога" },
    ],
  });
  return {
    ok: result.ok,
    detail: result.description || (result.ok ? "commands set" : "failed"),
  };
}

export async function setupSiteBotWebhook(webhookUrl: string): Promise<{
  ok: boolean;
  detail: string;
}> {
  const secret = process.env.TELEGRAM_SITE_WEBHOOK_SECRET?.trim() || "";
  const result = await callSiteBotApi("setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message"],
    drop_pending_updates: true,
    ...(secret ? { secret_token: secret } : {}),
  });
  return {
    ok: result.ok,
    detail:
      result.description || (result.ok ? `webhook → ${webhookUrl}` : "failed"),
  };
}

/** Повний setup: імʼя, аватар, меню, опис, команди, webhook. */
export async function setupTelegramSiteBot(opts?: {
  webhookUrl?: string;
  /** Шлях до logo.png для аватара (скрипт локально). */
  logoPath?: string;
  skipPhoto?: boolean;
}): Promise<{ ok: boolean; steps: Record<string, string>; webAppUrl: string }> {
  const webAppUrl = siteBotWebAppUrl();
  const steps: Record<string, string> = {};

  if (!siteBotToken()) {
    return {
      ok: false,
      steps: { token: "TELEGRAM_SITE_BOT_TOKEN missing" },
      webAppUrl,
    };
  }

  const name = await setSiteBotName();
  steps.name = name.detail;

  let photoOk = true;
  if (!opts?.skipPhoto) {
    const photo = await setSiteBotProfilePhoto(
      opts?.logoPath ? { localPath: opts.logoPath } : undefined,
    );
    steps.photo = photo.detail;
    photoOk = photo.ok;
  }

  const menu = await setSiteBotMenuButton();
  steps.menu = menu.detail;
  const desc = await setSiteBotDescriptions();
  steps.description = desc.detail;
  const cmds = await setSiteBotCommands();
  steps.commands = cmds.detail;

  let webhookOk = true;
  if (opts?.webhookUrl) {
    const wh = await setupSiteBotWebhook(opts.webhookUrl);
    steps.webhook = wh.detail;
    webhookOk = wh.ok;
  }

  return {
    ok: name.ok && photoOk && menu.ok && desc.ok && cmds.ok && webhookOk,
    steps,
    webAppUrl,
  };
}

function parseCommand(text: string): string | null {
  const m = text
    .trim()
    .match(
      /^\/(start|site|сайт|ip|help|допомога|pinsite|закріпити)(?:@\w+)?(?:\s|$)/i,
    );
  if (!m) return null;
  const cmd = m[1].toLowerCase();
  if (cmd === "сайт") return "site";
  if (cmd === "допомога") return "help";
  if (cmd === "закріпити") return "pinsite";
  return cmd;
}

/** Посилання Mini App (після Enable Main Mini App у BotFather). */
function miniAppDeepLink(): string {
  return "https://t.me/lostchronicles_bot?startapp";
}

/** Кнопки для груп/каналів: лише url (web_app у групах недоступний). */
function groupSiteKeyboard(webAppUrl: string) {
  return {
    inline_keyboard: [
      [{ text: "🌐 Сайт", url: webAppUrl }],
      [{ text: "Відкрити в Telegram", url: miniAppDeepLink() }],
    ],
  };
}

function pinSiteMessageHtml(): string {
  return (
    `<b>Lost Chronicles — офіційний сайт</b>\n\n` +
    `Анкета, вікі, підтримка, пропозиції гравців.\n` +
    `IP: <code>${javaIp()}</code>\n\n` +
    `Натисни кнопку нижче 👇`
  );
}

async function isChatAdmin(
  chatId: number | string,
  userId: number,
): Promise<boolean> {
  const result = await callSiteBotApi("getChatMember", {
    chat_id: chatId,
    user_id: userId,
  });
  if (!result.ok || !result.result || typeof result.result !== "object") {
    return false;
  }
  const status = String(
    (result.result as { status?: string }).status ?? "",
  );
  return status === "creator" || status === "administrator";
}

/**
 * Надсилає й закріплює повідомлення з кнопкою «Сайт» у групі/супергрупі.
 * Бот має бути адміном з правом закріплювати повідомлення.
 */
export async function pinSiteMessageInChat(
  chatId: number | string,
): Promise<{ ok: boolean; detail: string }> {
  const webAppUrl = siteBotWebAppUrl();
  const sent = await callSiteBotApi("sendMessage", {
    chat_id: chatId,
    text: pinSiteMessageHtml(),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: groupSiteKeyboard(webAppUrl),
  });
  if (!sent.ok) {
    return {
      ok: false,
      detail: sent.description || "sendMessage failed",
    };
  }

  const messageId =
    sent.result && typeof sent.result === "object"
      ? Number((sent.result as { message_id?: number }).message_id)
      : NaN;
  if (!Number.isInteger(messageId) || messageId < 1) {
    return { ok: false, detail: "no message_id after send" };
  }

  const pinned = await callSiteBotApi("pinChatMessage", {
    chat_id: chatId,
    message_id: messageId,
    disable_notification: true,
  });
  if (!pinned.ok) {
    return {
      ok: false,
      detail:
        pinned.description ||
        "повідомлення надіслано, але закріпити не вдалось (дай боту право Pin messages)",
    };
  }
  return { ok: true, detail: `pinned message_id=${messageId}` };
}

function welcomeCaptionHtml(webAppUrl: string): string {
  return (
    `<b>Lost Chronicles</b>\n` +
    `<i>український Minecraft Java / Bedrock</i>\n\n` +
    `Офіційний сайт сервера — прямо в Telegram.\n` +
    `IP: <code>${javaIp()}</code>\n\n` +
    `<a href="${webAppUrl}">${webAppUrl.replace(/^https:\/\//, "")}</a>`
  );
}

function ipMessageHtml(): string {
  return (
    `<b>Як зайти на Lost Chronicles</b>\n\n` +
    `☕ <b>Java</b>\n<code>${javaIp()}</code>\n\n` +
    `📱 <b>Bedrock</b>\n` +
    `Адреса: <code>${bedrockAddress()}</code>\n` +
    `Порт: <code>${bedrockPort()}</code>\n\n` +
    `Спочатку заповни анкету на сайті — без вайтлисту на сервер не пустять.`
  );
}

function helpMessageHtml(inGroup: boolean): string {
  if (inGroup) {
    return (
      `<b>Lost Chronicles у групі</b>\n\n` +
      `/pinsite — адмін: закріпити кнопку «Сайт»\n` +
      `/site — показати кнопку сайту\n` +
      `/ip — адреси Java і Bedrock\n` +
      `/help — ця підказка\n\n` +
      `Бот має бути адміном з правом <b>Pin messages</b>.`
    );
  }
  return (
    `<b>Команди бота</b>\n\n` +
    `/start — відкрити сайт і меню\n` +
    `/site — посилання на сайт\n` +
    `/ip — адреси Java і Bedrock\n` +
    `/pinsite — у групі: закріпити кнопку «Сайт»\n` +
    `/help — ця підказка\n\n` +
    `Кнопка <b>Сайт</b> біля поля вводу відкриває Mini App.`
  );
}

async function sendWelcome(chatId: number | string): Promise<boolean> {
  const webAppUrl = siteBotWebAppUrl();
  await callSiteBotApi("setChatMenuButton", {
    chat_id: chatId,
    menu_button: {
      type: "web_app",
      text: "Сайт",
      web_app: { url: webAppUrl },
    },
  });

  const photoUrl = `${LC_MARKETING_SITE_ORIGIN}/logo.png`;
  const withPhoto = await callSiteBotApi("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption: welcomeCaptionHtml(webAppUrl),
    parse_mode: "HTML",
    reply_markup: mainKeyboard(webAppUrl),
  });
  if (withPhoto.ok) return true;

  const fallback = await callSiteBotApi("sendMessage", {
    chat_id: chatId,
    text: welcomeCaptionHtml(webAppUrl),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: mainKeyboard(webAppUrl),
  });
  return fallback.ok;
}

async function replyText(
  chatId: number | string,
  text: string,
  replyMarkup?: Record<string, unknown>,
): Promise<boolean> {
  const result = await callSiteBotApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
  return result.ok;
}

/** Обробка /start, /site, /ip, /help, /pinsite (приват + групи). */
export async function handleSiteBotUpdate(update: unknown): Promise<boolean> {
  if (!update || typeof update !== "object") return false;
  const msg = (update as { message?: unknown }).message;
  if (!msg || typeof msg !== "object") return false;

  const m = msg as {
    text?: string;
    chat?: { id?: number | string; type?: string };
    from?: { id?: number };
  };
  if (!m.text || m.chat?.id == null) return false;

  const chatType = m.chat.type || "private";
  const inGroup =
    chatType === "group" ||
    chatType === "supergroup" ||
    chatType === "channel";
  const inPrivate = chatType === "private";

  const cmd = parseCommand(m.text);
  if (!cmd) return false;

  const webAppUrl = siteBotWebAppUrl();
  const chatId = m.chat.id;

  if (cmd === "pinsite") {
    if (!inGroup) {
      await replyText(
        chatId,
        "Команду <code>/pinsite</code> пиши <b>в групі</b>, де бот адмін.\n\n" +
          "1) Додай @lostchronicles_bot у групу\n" +
          "2) Зроби його адміном з правом <b>Pin messages</b>\n" +
          "3) Напиши в групі: <code>/pinsite</code>",
      );
      return true;
    }
    const userId = m.from?.id;
    if (userId == null || !(await isChatAdmin(chatId, userId))) {
      await replyText(chatId, "Лише адміністратор групи може закріпити кнопку.");
      return true;
    }
    const pinned = await pinSiteMessageInChat(chatId);
    if (!pinned.ok) {
      await replyText(
        chatId,
        `Не вдалося закріпити.\n<code>${pinned.detail}</code>\n\n` +
          `Переконайся, що бот — адмін з правом Pin messages.`,
      );
      return true;
    }
    await replyText(chatId, "✅ Кнопку «Сайт» закріплено зверху чату.");
    return true;
  }

  if (cmd === "start" || cmd === "site") {
    if (inPrivate) return sendWelcome(chatId);
    // У групі — лише URL-кнопки
    return replyText(
      chatId,
      pinSiteMessageHtml(),
      groupSiteKeyboard(webAppUrl),
    );
  }

  if (cmd === "ip") {
    return replyText(chatId, ipMessageHtml(), {
      inline_keyboard: [
        [{ text: "📝 Анкета на сервер", url: `${webAppUrl}/apply` }],
        [{ text: "🌐 Сайт", url: webAppUrl }],
      ],
    });
  }

  if (cmd === "help") {
    return replyText(
      chatId,
      helpMessageHtml(inGroup),
      inGroup ? groupSiteKeyboard(webAppUrl) : mainKeyboard(webAppUrl),
    );
  }

  return false;
}
