import { getSiteBaseUrl } from "@/lib/site-base-url";
import {
  PROPOSAL_MIN_VOTES_FOR_RESULT,
  PROPOSAL_TIE_EXTENSION_DAYS,
} from "@/lib/proposal-ui";

function proposalUrl(id: number): string {
  return `${getSiteBaseUrl()}/proposals/${id}`;
}

function truncateTitle(s: string, max = 220): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function escapeDiscordBoldFragment(s: string): string {
  return s.replace(/\*/g, "＊");
}

/** Telegram HTML: екранування для parse_mode HTML */
function escapeTelegramHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isCancelledLowTurnout(status: string | undefined): boolean {
  return status === "cancelled";
}

/** Висновок після підрахунку (без цифр — лічильники окремим рядком). */
function verdictOutcomePlain(
  yes: number,
  no: number,
  status?: string,
  summary?: string,
): string {
  if (summary?.trim()) return summary.trim();
  if (isCancelledLowTurnout(status)) {
    return `Голосування скасовано у звʼязку з недостатньою кількістю учасників (менше ${PROPOSAL_MIN_VOTES_FOR_RESULT}).`;
  }
  if (yes === 0 && no === 0) return "Голосів не було.";
  if (yes > no) return "Перемогло «так».";
  if (no > yes) return "Перемогло «ні».";
  return "Нічия.";
}

/** Те саме для Discord description (легкий акцент). */
function verdictOutcomeMarkdown(
  yes: number,
  no: number,
  status?: string,
  summary?: string,
): string {
  if (summary?.trim()) return summary.trim();
  if (isCancelledLowTurnout(status)) {
    return `Голосування скасовано у звʼязку з **недостатньою кількістю учасників** (менше ${PROPOSAL_MIN_VOTES_FOR_RESULT}).`;
  }
  if (yes === 0 && no === 0) return "Голосів не було.";
  if (yes > no) return "Перемогло **«так»**.";
  if (no > yes) return "Перемогло **«ні»**.";
  return "**Нічия.**";
}

async function postDiscordWebhook(
  payload: Record<string, unknown>,
): Promise<boolean> {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) return false;
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
        "[notify-proposal] Discord webhook error:",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notify-proposal] Discord webhook failed:", e);
    return false;
  }
}

/** ID теми форуму/каналу (гілки). Без нього Telegram не шлємо — інакше все йде в «загальну». */
function parseTelegramMessageThreadId(): number | undefined {
  const raw = process.env.TELEGRAM_MESSAGE_THREAD_ID?.trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return undefined;
  return n;
}

/**
 * Усі сповіщення про пропозиції в Telegram тільки в тему з TELEGRAM_MESSAGE_THREAD_ID,
 * не в корінь чату (див. message_thread_id у sendMessage).
 */
async function postTelegramHtml(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    console.error(
      "[notify-proposal] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing",
    );
    return false;
  }

  const messageThreadId = parseTelegramMessageThreadId();
  if (messageThreadId === undefined) {
    console.error(
      "[notify-proposal] TELEGRAM_MESSAGE_THREAD_ID missing — skip Telegram",
    );
    return false;
  }

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    message_thread_id: messageThreadId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      console.error(
        "[notify-proposal] Telegram error:",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notify-proposal] Telegram request failed:", e);
    return false;
  }
}

/** Старт голосування: нова пропозиція на сайті. */
export async function notifyProposalVotingOpenedDiscord(params: {
  authorUsername: string;
  title: string;
  proposalId: number;
}): Promise<void> {
  const link = proposalUrl(params.proposalId);
  const title = escapeDiscordBoldFragment(truncateTitle(params.title));
  const author = escapeDiscordBoldFragment(params.authorUsername);
  const authorLine = author ? `Автор: ${author}` : "Автор: —";
  await postDiscordWebhook({
    embeds: [
      {
        title: "Відкрито голосування",
        description:
          `**${title}**\n` +
          `${authorLine}\n\n` +
          `[Голосувати на сайті ↗](${link})`,
        color: 0x57f287,
        footer: { text: "Lost Chronicles" },
      },
    ],
  });
}

export async function notifyProposalVotingOpenedTelegram(params: {
  title: string;
  proposalId: number;
  authorUsername: string;
}): Promise<void> {
  const link = proposalUrl(params.proposalId);
  const title = escapeTelegramHtml(truncateTitle(params.title));
  const author = escapeTelegramHtml(params.authorUsername);
  const html =
    `<b>Відкрито голосування</b>\n` +
    `<i>Нова пропозиція на сайті</i>\n\n` +
    `<b>${title}</b>\n\n` +
    `<i>Автор</i>: ${author || "—"}\n\n` +
    `<a href="${escapeTelegramHtml(link)}">Голосувати на сайті ↗</a>\n\n` +
    `<i>Lost Chronicles</i>`;

  await postTelegramHtml(html);
}

/** Результати після закриття голосування. */
export async function notifyProposalClosedDiscord(params: {
  title: string;
  proposalId: number;
  yes: number;
  no: number;
  status?: string;
  summary?: string;
  totalVotes?: number;
}): Promise<boolean> {
  const link = proposalUrl(params.proposalId);
  const title = escapeDiscordBoldFragment(truncateTitle(params.title));
  const cancelled = isCancelledLowTurnout(params.status);
  const outcome = verdictOutcomeMarkdown(
    params.yes,
    params.no,
    params.status,
    params.summary,
  );
  const counts =
    params.summary != null
      ? `Усього голосів: **${params.totalVotes ?? params.yes + params.no}**\n`
      : cancelled
        ? `Було **${params.yes}** так · **${params.no}** ні\n\n`
        : `**${params.yes}** так · **${params.no}** ні\n`;

  return postDiscordWebhook({
    embeds: [
      {
        title: cancelled ? "Голосування скасовано" : "Голосування завершено",
        description:
          `**${title}**\n\n` +
          (cancelled
            ? `${outcome}\n\n` + counts
            : `${counts}${outcome}\n\n`) +
          `[Відкрити пропозицію ↗](${link})`,
        color: cancelled ? 0xed4245 : 0xf0b132,
        footer: { text: "Lost Chronicles" },
      },
    ],
  });
}

export async function notifyProposalClosedTelegram(params: {
  title: string;
  proposalId: number;
  yes: number;
  no: number;
  status?: string;
  summary?: string;
  totalVotes?: number;
}): Promise<boolean> {
  const link = proposalUrl(params.proposalId);
  const title = escapeTelegramHtml(truncateTitle(params.title));
  const cancelled = isCancelledLowTurnout(params.status);
  const outcome = escapeTelegramHtml(
    verdictOutcomePlain(
      params.yes,
      params.no,
      params.status,
      params.summary,
    ),
  );
  const safeLink = escapeTelegramHtml(link);
  const counts =
    params.summary != null
      ? `Усього: ${params.totalVotes ?? params.yes + params.no}\n`
      : `👍 ${params.yes} · 👎 ${params.no}\n`;

  const html =
    `<b>${cancelled ? "Голосування скасовано" : "Голосування завершено"}</b>\n` +
    `<i>${cancelled ? "Недостатня кількість учасників" : "Підсумок голосування"}</i>\n\n` +
    `<b>${title}</b>\n\n` +
    (cancelled
      ? `${outcome}\n\n${counts}\n`
      : `${counts}${outcome}\n\n`) +
    `<a href="${safeLink}">Відкрити пропозицію ↗</a>\n\n` +
    `<i>Lost Chronicles</i>`;

  return postTelegramHtml(html);
}

/** Скасування пропозиції адміністрацією серверу. */
export async function notifyProposalAdminCancelledDiscord(params: {
  title: string;
  proposalId: number;
  reason: string;
}): Promise<boolean> {
  const link = proposalUrl(params.proposalId);
  const title = escapeDiscordBoldFragment(truncateTitle(params.title));
  const reason = escapeDiscordBoldFragment(params.reason.trim());
  return postDiscordWebhook({
    embeds: [
      {
        title: "Пропозицію скасовано адміністрацією серверу",
        description:
          `**${title}**\n\n` +
          `**Причина:** ${reason}\n\n` +
          `[Відкрити пропозицію ↗](${link})`,
        color: 0xed4245,
        footer: { text: "Lost Chronicles" },
      },
    ],
  });
}

export async function notifyProposalAdminCancelledTelegram(params: {
  title: string;
  proposalId: number;
  reason: string;
}): Promise<boolean> {
  const link = proposalUrl(params.proposalId);
  const title = escapeTelegramHtml(truncateTitle(params.title));
  const reason = escapeTelegramHtml(params.reason.trim());
  const safeLink = escapeTelegramHtml(link);

  const html =
    `<b>Пропозицію скасовано адміністрацією серверу</b>\n\n` +
    `<b>${title}</b>\n\n` +
    `<b>Причина:</b> ${reason}\n\n` +
    `<a href="${safeLink}">Відкрити пропозицію ↗</a>\n\n` +
    `<i>Lost Chronicles</i>`;

  return postTelegramHtml(html);
}

/** Нічия з кворумом — голосування продовжено на N діб. */
export async function notifyProposalTieExtendedDiscord(params: {
  title: string;
  proposalId: number;
  extensionDays?: number;
}): Promise<boolean> {
  const days = params.extensionDays ?? PROPOSAL_TIE_EXTENSION_DAYS;
  const link = proposalUrl(params.proposalId);
  const title = escapeDiscordBoldFragment(truncateTitle(params.title));
  const dayWord = days === 1 ? "1 добу" : `${days} діб`;

  return postDiscordWebhook({
    embeds: [
      {
        title: "Голосування продовжено",
        description:
          `**${title}**\n\n` +
          `Через **нічию** строк продовжено на **${dayWord}** для остаточного вирішення.\n\n` +
          `[Відкрити пропозицію ↗](${link})`,
        color: 0xfee75c,
        footer: { text: "Lost Chronicles" },
      },
    ],
  });
}

export async function notifyProposalTieExtendedTelegram(params: {
  title: string;
  proposalId: number;
  extensionDays?: number;
}): Promise<boolean> {
  const days = params.extensionDays ?? PROPOSAL_TIE_EXTENSION_DAYS;
  const link = proposalUrl(params.proposalId);
  const title = escapeTelegramHtml(truncateTitle(params.title));
  const dayWord = days === 1 ? "1 добу" : `${days} діб`;
  const safeLink = escapeTelegramHtml(link);

  const html =
    `<b>Голосування продовжено</b>\n` +
    `<i>Нічия — потрібне остаточне вирішення</i>\n\n` +
    `<b>${title}</b>\n\n` +
    `Через нічию голосування продовжено на <b>${escapeTelegramHtml(dayWord)}</b> для остаточного вирішення.\n\n` +
    `<a href="${safeLink}">Відкрити пропозицію ↗</a>\n\n` +
    `<i>Lost Chronicles</i>`;

  return postTelegramHtml(html);
}

export type ProposalExpiredNotifyRow = {
  id: number;
  title: string;
  yes_votes: number;
  no_votes: number;
  status: string;
  kind?: string;
  total_votes?: number;
  summary?: string;
};

export type ProposalTieExtendedNotifyRow = {
  id: number;
  title: string;
};

export type ProposalEndingSoonNotifyRow = {
  id: number;
  title: string;
  ends_at: Date;
};

function formatProposalEndsAtKyiv(endsAt: Date): string {
  return endsAt.toLocaleString("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** За ~1 год до завершення голосування. */
export async function notifyProposalEndingSoonDiscord(params: {
  title: string;
  proposalId: number;
  endsAt: Date;
}): Promise<boolean> {
  const link = proposalUrl(params.proposalId);
  const title = escapeDiscordBoldFragment(truncateTitle(params.title));
  const endsLabel = formatProposalEndsAtKyiv(params.endsAt);

  return postDiscordWebhook({
    embeds: [
      {
        description:
          `**За годину завершується голосування**\n\n` +
          `${title}\n\n` +
          `Завершення о ${endsLabel}\n\n` +
          `[Голосувати на сайті ↗️](${link})`,
        color: 0xfee75c,
      },
    ],
  });
}

export async function notifyProposalEndingSoonTelegram(params: {
  title: string;
  proposalId: number;
  endsAt: Date;
}): Promise<boolean> {
  const link = proposalUrl(params.proposalId);
  const title = escapeTelegramHtml(truncateTitle(params.title));
  const endsLabel = escapeTelegramHtml(formatProposalEndsAtKyiv(params.endsAt));
  const safeLink = escapeTelegramHtml(link);

  const html =
    `За годину завершується голосування\n\n` +
    `${title}\n\n` +
    `Завершення о ${endsLabel}\n\n` +
    `<a href="${safeLink}">Голосувати на сайті ↗️</a>`;

  return postTelegramHtml(html);
}

export async function notifyProposalEndingSoonBatch(
  rows: ProposalEndingSoonNotifyRow[],
): Promise<void> {
  if (rows.length === 0) return;
  for (const row of rows) {
    await Promise.all([
      notifyProposalEndingSoonDiscord({
        title: row.title,
        proposalId: row.id,
        endsAt: row.ends_at,
      }),
      notifyProposalEndingSoonTelegram({
        title: row.title,
        proposalId: row.id,
        endsAt: row.ends_at,
      }),
    ]);
  }
}

/** Після автоматичного закриття (термін вичерпано) — послідовно, щоб не губити вебхуки. */
export async function notifyProposalResultsBatch(
  rows: ProposalExpiredNotifyRow[],
): Promise<void> {
  if (rows.length === 0) return;
  for (const row of rows) {
    await Promise.all([
      notifyProposalClosedDiscord({
        title: row.title,
        proposalId: row.id,
        yes: row.yes_votes,
        no: row.no_votes,
        status: row.status,
        summary: row.summary,
        totalVotes: row.total_votes,
      }),
      notifyProposalClosedTelegram({
        title: row.title,
        proposalId: row.id,
        yes: row.yes_votes,
        no: row.no_votes,
        status: row.status,
        summary: row.summary,
        totalVotes: row.total_votes,
      }),
    ]);
  }
}

/** Сповіщення про продовження через нічию. */
export async function notifyProposalTieExtendedBatch(
  rows: ProposalTieExtendedNotifyRow[],
): Promise<void> {
  if (rows.length === 0) return;
  for (const row of rows) {
    await Promise.all([
      notifyProposalTieExtendedDiscord({
        title: row.title,
        proposalId: row.id,
      }),
      notifyProposalTieExtendedTelegram({
        title: row.title,
        proposalId: row.id,
      }),
    ]);
  }
}
