import { getSiteBaseUrl } from "@/lib/site-base-url";

function proposalUrl(id: number): string {
  return `${getSiteBaseUrl()}/proposals/${id}`;
}

export async function notifyProposalCreatedDiscord(params: {
  authorUsername: string;
  title: string;
  proposalId: number;
}): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) return;

  const link = proposalUrl(params.proposalId);
  const content =
    `📢 **New Proposal Created**\n\n` +
    `**Author:** ${params.authorUsername}\n\n` +
    `**Title:**\n${params.title}\n\n` +
    `**View:**\n${link}`;

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      allowed_mentions: { parse: [] },
    }),
  }).catch(() => {});
}

export async function notifyProposalCreatedTelegram(params: {
  title: string;
  proposalId: number;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;

  const link = proposalUrl(params.proposalId);
  const text = `🗳 New Proposal\n\n${params.title}\n\nVote here:\n${link}`;

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

/** Optional: results when a proposal expires (call from cron or lazy-close path). */
export async function notifyProposalClosedDiscord(params: {
  title: string;
  proposalId: number;
  yes: number;
  no: number;
}): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) return;

  const link = proposalUrl(params.proposalId);
  const content =
    `⏳ **Proposal closed**\n\n` +
    `**${params.title}**\n\n` +
    `👍 ${params.yes} · 👎 ${params.no}\n\n` +
    `**View:** ${link}`;

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  }).catch(() => {});
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
  const text =
    `⏳ Proposal closed\n\n` +
    `${params.title}\n\n` +
    `👍 ${params.yes} · 👎 ${params.no}\n\n` +
    link;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}
