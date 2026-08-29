import { LC_MARKETING_HOST } from "@/lib/lc-domains";
import { LC_DEFAULT_JAVA_SERVER_HOST } from "@/lib/lc-server-defaults";

/**
 * Синоніми бренду для Organization.alternateName (JSON-LD).
 * Google радить точні структуровані дані; довгий список «усіх помилок» краще не тягнути сюди —
 * достатньо реальних альтернативних назв і 1–2 типових написань.
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro
 */
export const LC_SEO_ORGANIZATION_ALTERNATE_NAMES: string[] = [
  "Lost Chronicles Minecraft",
  "LC Minecraft",
  "Лост Хроніклс",
  "Лост Хронікал",
  "Lost Chronikles",
  "lostchronicles",
  "Lost Chronicles UA",
  "Lost Chronicles Ukraine",
];

/**
 * Додаткові варіанти для meta keywords (Google їх не ранжує; частина каталогів/ботів — так).
 * Не дублюємо все в JSON-LD, щоб не виглядати як keyword stuffing у розмітці.
 */
const LC_SEO_KEYWORD_VARIANTS_EXTRA: string[] = [
  "Лост Хрониклс",
  "Лост Кроніклс",
  "Лост Чроніклс",
  "Лост Хроніклс Minecraft",
  "Lost Chronikals",
  "Lost Chronicals",
  "Lost Cronicles",
  "LostChronicles",
  "lost-chronicles",
  "Lost Chronicles 2023",
  "Lost Chronicles 2026",
  "LC сервер",
  "майнкрафт лост хроніклс",
  "сервер лост хроніклс",
];

const LC_SEO_TOPIC_KEYWORDS: string[] = [
  "Minecraft сервер",
  "український Minecraft",
  "Minecraft Java",
  "Minecraft Bedrock",
  "сервер Minecraft Україна",
  "Minecraft RP",
  "Minecraft RP Україна",
  "майнкрафт сервер Україна",
  LC_DEFAULT_JAVA_SERVER_HOST,
  LC_MARKETING_HOST,
  "lost-chronicles.site",
  "play.lost-chronicles.site",
];

export const LC_SEO_META_KEYWORDS: string[] = [
  ...new Set([
    "Lost Chronicles",
    ...LC_SEO_ORGANIZATION_ALTERNATE_NAMES,
    ...LC_SEO_KEYWORD_VARIANTS_EXTRA,
    ...LC_SEO_TOPIC_KEYWORDS,
  ]),
];

/**
 * Meta / OG / Twitter: одна думка + вигода + дія (CTR у видачі та у стрічці).
 * Довжина ~ до 155–160 символів для мобільної видачі Google.
 */
export const LC_SEO_DESCRIPTION_SHORT = `Lost Chronicles (Лост Хроніклс) — Minecraft Java/Bedrock, RP в Україні. IP ${LC_DEFAULT_JAVA_SERVER_HOST}. Заявка, вікі, карта; Discord і Telegram.`;

export const LC_SEO_DESCRIPTION_STRUCTURED = `Офіційний український Minecraft-проєкт Lost Chronicles: сервери Java та Bedrock, спільнота та рольовий світ. На сайті — анкета для входу, вікі, динамічна карта та новини. IP: ${LC_DEFAULT_JAVA_SERVER_HOST}. Бренд також шукають як «Лост Хроніклс» або Lost Chronikles.`;

/** Заголовок за замовчуванням: бренд на початку (SMM/вкладки/закладки). */
export const LC_SEO_SITE_TITLE_DEFAULT =
  "Lost Chronicles — український Minecraft-сервер Java та Bedrock";
