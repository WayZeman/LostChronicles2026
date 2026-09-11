/**
 * Оформлює @lostchronicles_bot під бренд сайту:
 * імʼя, аватар (logo.png), описи, меню Mini App, команди, webhook.
 *
 * Запуск:
 *   npx tsx --env-file=.env.local scripts/setup-telegram-site-bot.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { setupTelegramSiteBot } from "../src/lib/telegram-site-bot";
import { getLcMarketingSiteUrl } from "../src/lib/site-base-url";

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const logoPath = path.join(root, "public", "logo.png");
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || getLcMarketingSiteUrl();
  const webhookUrl = `${base.replace(/\/$/, "")}/api/telegram/site`;

  console.log("logo", logoPath);
  console.log("webApp / webhook", webhookUrl);

  const result = await setupTelegramSiteBot({
    webhookUrl,
    logoPath,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
