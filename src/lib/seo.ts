import type { Metadata } from "next";

import { LC_MARKETING_HOST } from "@/lib/lc-domains";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

/** Шлях до автогенерованого OG (app/opengraph-image.tsx). */
export const LC_OG_IMAGE_PATH = "/opengraph-image";

export function lcCanonical(path = ""): string {
  const base = getLcMarketingSiteUrl().replace(/\/$/, "");
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function lcOgImageUrl(): string {
  return `${getLcMarketingSiteUrl().replace(/\/$/, "")}${LC_OG_IMAGE_PATH}`;
}

/** Plain text з HTML для meta description / FAQ schema. */
export function stripHtmlForSeo(html: string, maxLen = 160): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}…`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** index за замовчуванням; noindex для приватних сторінок. */
  index?: boolean;
  ogType?: "website" | "article";
};

/** Єдиний builder для canonical, OG і Twitter на публічних сторінках. */
export function buildLcPageMetadata(input: PageMetaInput): Metadata {
  const canonical = lcCanonical(input.path);
  const index = input.index !== false;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : { index: false, follow: false },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      type: input.ogType ?? "website",
      locale: "uk_UA",
      siteName: "Lost Chronicles",
      images: [
        {
          url: LC_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: "Lost Chronicles — український Minecraft-сервер",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [LC_OG_IMAGE_PATH],
    },
  };
}

/** Короткий опис бренду з доменом для llms.txt / зовнішніх каталогів. */
export function lcPublicSiteBlurb(): string {
  return `Lost Chronicles (${LC_MARKETING_HOST}) — офіційний український Minecraft-сервер Java та Bedrock з RP-світом, вікі, картою та анкетою для входу.`;
}
