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
import { LC_OG_IMAGE_PATH } from "@/lib/seo";

type GraphEntity = Record<string, unknown>;

/** Структуровані дані для кращого розуміння сайту пошуковими системами. */
export function SiteJsonLd({ siteUrl }: { siteUrl: string }) {
  const logoUrl = `${siteUrl}/logo.png`;
  const ogImage = `${siteUrl}${LC_OG_IMAGE_PATH}`;

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
      alternateName: LC_SEO_ORGANIZATION_ALTERNATE_NAMES.slice(0, 8),
      description: LC_SEO_DESCRIPTION_STRUCTURED,
      inLanguage: "uk-UA",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/wiki?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
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
      image: ogImage,
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
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: ogImage,
      },
    },
    {
      "@type": "VideoGame",
      "@id": `${siteUrl}/#minecraft-game`,
      name: "Minecraft",
      gamePlatform: ["PC", "Java Edition", "Bedrock Edition"],
      applicationCategory: "Game",
      operatingSystem: "Windows, macOS, Linux, iOS, Android",
    },
    {
      "@type": "GameServer",
      "@id": `${siteUrl}/#minecraft-server`,
      name: "Lost Chronicles Minecraft Server",
      alternateName: ["Lost Chronicles", "Лост Хроніклс"],
      url: siteUrl,
      game: { "@id": `${siteUrl}/#minecraft-game` },
      serverStatus: "https://schema.org/Online",
      description: `Український Minecraft Java/Bedrock RP-сервер. IP: ${LC_DEFAULT_JAVA_SERVER_HOST}`,
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
