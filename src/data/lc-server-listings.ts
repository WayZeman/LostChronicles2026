import { LC_APPLY_PATH } from "@/data/lost-chronicles-faq";
import { LC_MARKETING_HOST, LC_MARKETING_SITE_ORIGIN } from "@/lib/lc-domains";
import { LC_DEFAULT_JAVA_SERVER_HOST } from "@/lib/lc-server-defaults";

export type LcCatalogLink = {
  href: string;
  label: string;
  shortLabel: string;
  hint: string;
};

/** Каталоги, де Lost Chronicles уже є — голоси піднімають у пошуку ОУМ / MCUA. */
export const LC_PUBLIC_CATALOG_LINKS: LcCatalogLink[] = [
  {
    href: "https://minecraft.org.ua/minecraft-servers/Lost-Chronicles/3210",
    label: "Minecraft.org.ua",
    shortLabel: "ОУМ",
    hint: "Головний український каталог",
  },
  {
    href: "https://mcua.top/server-lost-chronicles.79",
    label: "MCUA.TOP",
    shortLabel: "MCUA",
    hint: "Пошук українських серверів",
  },
  {
    href: "https://monicore.com.ua/server/281/lostchronicles",
    label: "MoniCore",
    shortLabel: "MoniCore",
    hint: "Моніторинг онлайну",
  },
  {
    href: "https://allmc.in.ua/play-lost-chronicles-co-ua-25550",
    label: "AllMC.in.ua",
    shortLabel: "AllMC",
    hint: "Каталог IP",
  },
];

export const LC_CATALOG_SAME_AS: string[] = [
  ...LC_PUBLIC_CATALOG_LINKS.map((c) => c.href),
  "https://mcua.top/server-lost-chronicles.81",
  "https://monicore.com.ua/server/312/lost-chronicles-ukrayinskii-maikraft-server/",
];

export const LC_LISTING_TAGS: string[] = [
  "Україна",
  "Java",
  "Bedrock",
  "Vanilla",
  "Survival",
  "Roleplay",
  "RP",
  "Вайтлист",
  "1.21",
  "Кросплатформа",
  "Економіка",
  "Цивілізації",
  "Ламповий",
];

export function lcListingDescriptionShort(ip = LC_DEFAULT_JAVA_SERVER_HOST): string {
  return `Lost Chronicles (Лост Хроніклс) — український ванільний Minecraft RP-сервер Java та Bedrock 1.21. IP: ${ip}. На сервер можна зайти одразу, в основний світ — після анкети на ${LC_MARKETING_HOST}.`;
}

export function lcListingDescriptionLong(ip = LC_DEFAULT_JAVA_SERVER_HOST): string {
  return [
    `Lost Chronicles (Лост Хроніклс) — український ванільний Minecraft-сервер Java і Bedrock.`,
    `Версія 1.21, рольовий світ і спільнота українською.`,
    ``,
    `IP Java: ${ip}`,
    `Bedrock: ${ip} · порт 19132`,
    `Сайт: ${LC_MARKETING_SITE_ORIGIN}`,
    `Як зайти: ${LC_MARKETING_SITE_ORIGIN}/play`,
    `Анкета: ${LC_MARKETING_SITE_ORIGIN}${LC_APPLY_PATH}`,
    ``,
    `Великий світ для поселень і цивілізацій, економіка на монетах, івенти та дружня атмосфера 14+.`,
    `Java і Bedrock грають разом. На сервер можна зайти за IP. В основний світ — після анкети на сайті.`,
  ].join("\n");
}

export const LC_RECOMMENDED_MOTD =
  "⫷ Lost Chronicles ⫸ • 1.21 • lost-chronicles.co.ua/play";
