import {
  LC_DEFAULT_DISCORD_URL,
  LC_DEFAULT_INSTAGRAM_URL,
  LC_DEFAULT_TELEGRAM_URL,
  LC_DEFAULT_TIKTOK_URL,
  LC_DEFAULT_YOUTUBE_URL,
} from "@/data/lc-social-defaults";
import {
  LC_SEO_DESCRIPTION_STRUCTURED,
  LC_SEO_ORGANIZATION_ALTERNATE_NAMES,
} from "@/data/lc-seo-terms";
import { LC_DEFAULT_JAVA_SERVER_HOST } from "@/lib/lc-server-defaults";

type GraphEntity = Record<string, unknown>;

/** Структуровані дані для кращого розуміння сайту пошуковими системами (не гарантує позиції в топі). */
export function SiteJsonLd({ siteUrl }: { siteUrl: string }) {
  const logoUrl = `${siteUrl}/logo.png`;

  const sameAs = [
    LC_DEFAULT_YOUTUBE_URL,
    LC_DEFAULT_DISCORD_URL,
    LC_DEFAULT_TELEGRAM_URL,
    LC_DEFAULT_INSTAGRAM_URL,
    LC_DEFAULT_TIKTOK_URL,
  ];

  const graph: GraphEntity[] = [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Lost Chronicles",
      description: LC_SEO_DESCRIPTION_STRUCTURED,
      inLanguage: "uk-UA",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Lost Chronicles",
      alternateName: LC_SEO_ORGANIZATION_ALTERNATE_NAMES,
      url: siteUrl,
      description: LC_SEO_DESCRIPTION_STRUCTURED,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
      sameAs,
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      url: siteUrl,
      name: "Lost Chronicles — український Minecraft-сервер Java та Bedrock",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
      description: LC_SEO_DESCRIPTION_STRUCTURED,
      inLanguage: "uk-UA",
    },
    {
      "@type": "GameServer",
      "@id": `${siteUrl}/#minecraft-server`,
      name: "Lost Chronicles",
      game: {
        "@type": "VideoGame",
        name: "Minecraft",
        gamePlatform: ["PC", "Java Edition"],
      },
      serverStatus: "https://schema.org/Online",
      description: `Java Minecraft сервер для української спільноти. Адреса: ${LC_DEFAULT_JAVA_SERVER_HOST}`,
    },
  ];

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
