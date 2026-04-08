import { getSiteBaseUrl } from "@/lib/site-base-url";

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

/** Короткий вердикт без повторення цифр (цифри в полях embed). */
function verdictShortMarkdown(yes: number, no: number): string {
  if (yes === 0 && no === 0) return "Голосів не надійшло.";
  if (yes > no) return "Перемогло **«так»**.";
  if (no > yes) return "Перемогло **«ні»**.";
  return "**Нічия** — однакова кількість голосів.";
}

/** Один рядок для Telegram (з цифрами, без дублювання). */
function telegramResultsText(yes: number, no: number): string {
  if (yes === 0 && no === 0) return "Голосів не було.";
  if (yes > no) return `Перемогло «так»: 👍 ${yes} · 👎 ${no}`;
  if (no > yes) return `Перемогло «ні»: 👍 ${yes} · 👎 ${no}`;
  return `Нічия: 👍 ${yes} · 👎 ${no}`;
}

async function postDiscordWebhook(
  payload: Record<string, unknown>,
): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) return;
  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      allowed_mentions: { parse: [] },
    }),
  }).catch(() => {});
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
  await postDiscordWebhook({
    embeds: [
      {
        title: "Розпочато голосування",
        description: `**${title}**\n\n[Перейти проголосувати ↗](${link})`,
        color: 0x57f287,
        fields: [
          {
            name: "Автор",
            value: author || "—",
            inline: false,
          },
        ],
        footer: { text: "Lost Chronicles · пропозиції" },
      },
    ],
  });
}

export async function notifyProposalVotingOpenedTelegram(params: {
  title: string;
  proposalId: number;
  authorUsername: string;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;

  const link = proposalUrl(params.proposalId);
  const text =
    `🗳 Розпочато голосування\n\n` +
    `${params.title}\n\n` +
    `Автор: ${params.authorUsername}\n\n` +
    `${link}`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: false,
    }),
  }).catch(() => {});
}

/** Результати після закриття голосування. */
export async function notifyProposalClosedDiscord(params: {
  title: string;
  proposalId: number;
  yes: number;
  no: number;
}): Promise<void> {
  const link = proposalUrl(params.proposalId);
  const title = escapeDiscordBoldFragment(truncateTitle(params.title));
  const verdict = verdictShortMarkdown(params.yes, params.no);

  await postDiscordWebhook({
    embeds: [
      {
        title: "Голосування завершено",
        description:
          `**${title}**\n\n` + `[Відкрити пропозицію ↗](${link})`,
        color: 0xf0b132,
        fields: [
          {
            name: "👍 Так",
            value: `**${params.yes}**`,
            inline: true,
          },
          {
            name: "👎 Ні",
            value: `**${params.no}**`,
            inline: true,
          },
          {
            name: "Підсумок",
            value: verdict,
            inline: false,
          },
        ],
        footer: { text: "Lost Chronicles · результати" },
      },
    ],
  });
}

export async function notifyProposalClosedTelegram(params: {
  title: string;
  proposalId: number;
  yes: number;
  no: number;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;

  const link = proposalUrl(params.proposalId);
  const line = telegramResultsText(params.yes, params.no);
  const text =
    `📊 Голосування завершено\n\n` +
    `${params.title}\n\n` +
    `${line}\n\n` +
    link;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}

export type ProposalExpiredNotifyRow = {
  id: number;
  title: string;
  yes_votes: number;
  no_votes: number;
};

/** Після автоматичного закриття (термін вичерпано) — один вебхук на кожну пропозицію. */
export async function notifyProposalResultsBatch(
  rows: ProposalExpiredNotifyRow[],
): Promise<void> {
  if (rows.length === 0) return;
  await Promise.all(
    rows.flatMap((row) => [
      notifyProposalClosedDiscord({
        title: row.title,
        proposalId: row.id,
        yes: row.yes_votes,
        no: row.no_votes,
      }),
      notifyProposalClosedTelegram({
        title: row.title,
        proposalId: row.id,
        yes: row.yes_votes,
        no: row.no_votes,
      }),
    ]),
  );
}
