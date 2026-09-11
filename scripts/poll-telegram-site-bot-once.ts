/**
 * Одноразово: забрати getUpdates і обробити /pinsite (коли webhook ще не на проді).
 *   npx tsx --env-file=.env.local scripts/poll-telegram-site-bot-once.ts
 */
import { handleSiteBotUpdate } from "../src/lib/telegram-site-bot";

async function main() {
  const token = process.env.TELEGRAM_SITE_BOT_TOKEN?.trim();
  if (!token) throw new Error("TELEGRAM_SITE_BOT_TOKEN missing");

  const res = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates?timeout=2&allowed_updates=${encodeURIComponent(JSON.stringify(["message"]))}`,
  );
  const data = (await res.json()) as {
    ok: boolean;
    result?: unknown[];
    description?: string;
  };
  if (!data.ok) {
    console.error(data);
    process.exit(1);
  }

  const updates = data.result ?? [];
  console.log("updates", updates.length);
  let offset = 0;
  for (const u of updates) {
    const id = (u as { update_id?: number }).update_id;
    if (typeof id === "number") offset = Math.max(offset, id + 1);
    const msg = (
      u as {
        message?: {
          text?: string;
          chat?: { id?: number; title?: string; type?: string };
        };
      }
    ).message;
    console.log("→", id, msg?.chat?.type, msg?.chat?.title, msg?.text);
    const handled = await handleSiteBotUpdate(u);
    console.log("  handled:", handled);
  }
  if (offset > 0) {
    await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=0`,
    );
  }
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
