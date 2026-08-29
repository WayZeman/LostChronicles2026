import { LC_MARKETING_HOST } from "@/lib/lc-domains";
import { LC_DEFAULT_JAVA_SERVER_HOST } from "@/lib/lc-server-defaults";

/**
 * Синоніми бренду для Organization.alternateName (JSON-LD).
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro
 */
export const LC_SEO_ORGANIZATION_ALTERNATE_NAMES: string[] = [
  "Lost Chronicles Minecraft",
  "LC Minecraft",
  "Лост Хроніклс",
  "Лост Хронікал",
  "Лост Хрониклс",
  "Лост Кроніклс",
  "Lost Chronikles",
  "Lost Chronicals",
  "lostchronicles",
  "Lost Chronicles UA",
  "Lost Chronicles Ukraine",
  "сервер Lost Chronicles",
  "майнкрафт Lost Chronicles",
];

const LC_SEO_KEYWORD_VARIANTS_EXTRA: string[] = [
  "Лост Чроніклс",
  "Лост Хроніклс Minecraft",
  "Lost Chronikals",
  "Lost Cronicles",
  "LostChronicles",
  "lost-chronicles",
  "lost chronicles minecraft",
  "lost chronicles server",
  "Lost Chronicles 2023",
  "Lost Chronicles 2026",
  "LC сервер",
  "майнкрафт лост хроніклс",
  "сервер лост хроніклс",
  "лост хроніклс сервер",
  "лост хроніклс майнкрафт",
  "lost chronicles co ua",
  LC_MARKETING_HOST,
];

const LC_SEO_TOPIC_KEYWORDS: string[] = [
  "Minecraft сервер",
  "Minecraft сервер Україна",
  "український Minecraft",
  "Minecraft Java",
  "Minecraft Bedrock",
  "Minecraft RP",
  "Minecraft RP Україна",
  "рольовий Minecraft",
  "ванilla Minecraft Україна",
  "майнкрафт сервер Україна",
  "майнкрафт сервер україна",
  "як зайти на minecraft сервер",
  "minecraft сервер з модами україна",
  "minecraft whitelist україна",
  "minecraft спільнота україна",
  LC_DEFAULT_JAVA_SERVER_HOST,
  LC_MARKETING_HOST,
  "play.lost-chronicles.co.ua",
  "lost-chronicles.co.ua",
  "lost-chronicles.site",
];

export const LC_SEO_META_KEYWORDS: string[] = [
  ...new Set([
    "Lost Chronicles",
    ...LC_SEO_ORGANIZATION_ALTERNATE_NAMES,
    ...LC_SEO_KEYWORD_VARIANTS_EXTRA,
    ...LC_SEO_TOPIC_KEYWORDS,
  ]),
];

/** Meta / OG / Twitter: бренд + вигода + IP + дія (CTR у видачі). */
export const LC_SEO_DESCRIPTION_SHORT = `Lost Chronicles (Лост Хроніклс) — український Minecraft Java/Bedrock RP-сервер. IP ${LC_DEFAULT_JAVA_SERVER_HOST}. Анкета, вікі, карта світу, Discord і Telegram.`;

export const LC_SEO_DESCRIPTION_STRUCTURED = `Офіційний сайт українського Minecraft-проєкту Lost Chronicles (${LC_MARKETING_HOST}): сервери Java та Bedrock, рольовий світ і спільнота. Анкета для вайтлисту, вікі з лором, динамічна карта BlueMap, новини та голосування за пропозиції. IP: ${LC_DEFAULT_JAVA_SERVER_HOST}. Шукають також як «Лост Хроніклс», Lost Chronikles або lost chronicles minecraft ukraine.`;

export const LC_SEO_SITE_TITLE_DEFAULT =
  "Lost Chronicles — український Minecraft-сервер Java та Bedrock | RP";

export const LC_SEO_FAQ_TITLE = "FAQ — як зайти на Lost Chronicles | Minecraft Україна";

export const LC_SEO_WIKI_TITLE = "Вікі Lost Chronicles — лор, правила, гайди Minecraft";

export const LC_SEO_APPLY_TITLE =
  "Анкета на сервер Lost Chronicles — вайтлист Minecraft Україна";
