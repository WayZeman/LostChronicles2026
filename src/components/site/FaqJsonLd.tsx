import { stripHtmlForSeo } from "@/lib/seo";

export type FaqJsonLdItem = {
  question: string;
  answerHtml: string;
};

/** FAQPage schema — rich snippets у Google для /faq. */
export function FaqJsonLd({
  siteUrl,
  items,
}: {
  siteUrl: string;
  items: FaqJsonLdItem[];
}) {
  if (items.length === 0) return null;

  const payload = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtmlForSeo(item.answerHtml, 500),
      },
    })),
    url: `${siteUrl}/faq`,
    inLanguage: "uk-UA",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
