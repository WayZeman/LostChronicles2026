/**
 * Підключає Telegram webhook бота анкет на сайт (команди /anketa для /apply).
 *
 * Перед цим у Google Apps Script ОБОВʼЯЗКОВО:
 *   ▶ uninstallCommandPolling
 * (інакше Apps Script і сайт будуть битись за getUpdates)
 *
 * Запуск:
 *   npx tsx --env-file=.env.local scripts/setup-anketa-bot-webhook.ts
 */
import { setupAnketaTelegramWebhook } from "../src/lib/anketa-telegram-bot";

async function main() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://www.lost-chronicles.site";
  const webhookUrl = `${base.replace(/\/$/, "")}/api/telegram/anketa`;
  console.log("webhookUrl", webhookUrl);
  const result = await setupAnketaTelegramWebhook(webhookUrl);
  console.log(result);
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
