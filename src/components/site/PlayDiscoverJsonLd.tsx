import { LC_APPLY_PATH } from "@/data/lost-chronicles-faq";
import { LC_CATALOG_SAME_AS } from "@/data/lc-server-listings";
import { stripHtmlForSeo } from "@/lib/seo";

type FaqItem = { question: string; answer: string };

type Props = {
  siteUrl: string;
  ip: string;
  version: string;
  bedrockAddress: string;
  bedrockPort: string;
  faqs: FaqItem[];
};

/** HowTo + FAQ + Breadcrumb для сторінки «як зайти» — rich results у Google. */
export function PlayDiscoverJsonLd({
  siteUrl,
  ip,
  version,
  bedrockAddress,
  bedrockPort,
  faqs,
}: Props) {
  const playUrl = `${siteUrl}/play`;
  const applyUrl = `${siteUrl}${LC_APPLY_PATH}`;

  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${playUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Lost Chronicles",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Як зайти на сервер",
            item: playUrl,
          },
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${playUrl}#howto`,
        name: "Як зайти на український Minecraft-сервер Lost Chronicles",
        description: `Покрокова інструкція входу на Lost Chronicles (Лост Хроніклс). IP ${ip}, версія ${version}, Java та Bedrock.`,
        inLanguage: "uk-UA",
        url: playUrl,
        totalTime: "PT15M",
        supply: [
          { "@type": "HowToSupply", name: "Minecraft Java або Bedrock" },
        ],
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Пройти анкету",
            url: applyUrl,
            text: "Відкрийте анкету на сайті Lost Chronicles і заповніть заявку на вайтлист.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Дочекатися схвалення",
            text: "Після розгляду анкети ви отримаєте доступ на сервер.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Додати IP у Minecraft",
            text: `Java: додайте сервер з адресою ${ip}, версія ${version}. Bedrock: ${bedrockAddress}, порт ${bedrockPort}.`,
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Зайти в світ",
            text: "Підключіться до Lost Chronicles і приєднуйтесь до спільноти українською.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${playUrl}#faq`,
        url: playUrl,
        inLanguage: "uk-UA",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: stripHtmlForSeo(item.answer, 500),
          },
        })),
      },
      {
        "@type": "GameServer",
        "@id": `${siteUrl}/#minecraft-server`,
        name: "Lost Chronicles",
        alternateName: ["Лост Хроніклс", "Lost Chronicles UA"],
        url: playUrl,
        identifier: ip,
        sameAs: LC_CATALOG_SAME_AS,
        game: { "@id": `${siteUrl}/#minecraft-game` },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Java IP", value: ip },
          { "@type": "PropertyValue", name: "Java version", value: version },
          {
            "@type": "PropertyValue",
            name: "Bedrock address",
            value: `${bedrockAddress}:${bedrockPort}`,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
