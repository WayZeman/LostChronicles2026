import type { Metadata } from "next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FaqJsonLd } from "@/components/site/FaqJsonLd";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import {
  LC_SEO_DESCRIPTION_SHORT,
  LC_SEO_FAQ_TITLE,
} from "@/data/lc-seo-terms";
import { LOST_CHRONICLES_FAQ } from "@/data/lost-chronicles-faq";
import { getCachedFaqItems } from "@/lib/public-content-cache";
import { buildLcPageMetadata } from "@/lib/seo";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";
import { cn } from "@/lib/utils";

export const revalidate = 120;

export const metadata: Metadata = buildLcPageMetadata({
  title: LC_SEO_FAQ_TITLE,
  description: `Відповіді про вхід на сервер Lost Chronicles: IP, версія Minecraft, анкета, Discord, правила. ${LC_SEO_DESCRIPTION_SHORT}`,
  path: "/faq",
});

export default async function FAQPage() {
  let faqs = LOST_CHRONICLES_FAQ.map((item) => ({
    id: `lc-faq-${item.order}`,
    question: item.question,
    answer: item.answer,
    order: item.order,
  }));

  try {
    const dbItems = await getCachedFaqItems();
    if (dbItems.length > 0) {
      faqs = dbItems.map((item) => ({
        id: `lc-faq-${item.id}`,
        question: item.question,
        answer: item.answer_html,
        order: item.sort_order,
      }));
    }
  } catch {
    /* fallback to static FAQ */
  }

  const siteUrl = getLcMarketingSiteUrl();

  return (
    <div className={lcPageMainClass} role="main">
      <FaqJsonLd
        siteUrl={siteUrl}
        items={faqs.map((f) => ({
          question: f.question,
          answerHtml: f.answer,
        }))}
      />
      <div className={lcPageContainerClass}>
        <header className="mb-6 text-center sm:mb-8 md:mb-12">
          <h1 className="lc-hero-title lc-hero-display text-balance text-[clamp(1.5rem,4.2vw,1.625rem)] leading-tight text-[var(--mc-text)] sm:text-3xl md:text-4xl">
            Часті запитання
          </h1>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-[var(--mc-text-muted)] sm:mt-3 sm:text-[0.9375rem]">
            Короткі відповіді про сервер, правила та спільноту.
          </p>
        </header>

        <Accordion
          multiple={false}
          defaultValue={[]}
          className={cn(
            lcGlassPanelClass,
            "overflow-hidden p-1.5 sm:p-4 md:p-5",
          )}
        >
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border-[var(--mc-border-card)]"
            >
              <AccordionTrigger className="text-[0.9375rem] font-bold text-[var(--mc-ink)] hover:text-[var(--mc-net-green)] hover:no-underline sm:text-lg md:py-3 md:text-xl">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent
                className={cn(
                  "border-t border-[var(--mc-border-card)]/80 text-left text-[0.9375rem] font-normal leading-[1.6] text-[var(--mc-text)] sm:text-base sm:leading-relaxed",
                  "pl-2.5 pr-2.5 sm:pl-5 sm:pr-5 md:pl-10 md:pr-10",
                  "pt-2.5 sm:pt-4",
                )}
              >
                <div
                  className={cn(
                    "prose prose-neutral max-w-none break-words text-left",
                    "prose-p:my-2 prose-p:text-[var(--mc-text)] prose-p:leading-relaxed sm:prose-p:my-2.5",
                    "prose-ul:my-2.5 prose-ul:list-inside prose-ul:pl-0 sm:prose-ul:my-3 sm:prose-ul:list-outside sm:prose-ul:pl-5",
                    "prose-ol:my-2.5 prose-ol:list-inside prose-ol:pl-0 sm:prose-ol:my-3 sm:prose-ol:list-outside sm:prose-ol:pl-5",
                    "prose-li:my-0.5 prose-li:text-[var(--mc-text)] prose-li:leading-relaxed prose-li:marker:text-[var(--mc-net-green)] sm:prose-li:my-1",
                    "prose-headings:text-[var(--mc-text)] prose-strong:text-[var(--mc-text)] prose-strong:font-semibold",
                    "prose-em:text-[var(--mc-text-muted)] prose-em:not-italic",
                    "prose-code:break-all prose-code:rounded-md prose-code:bg-[var(--mc-surface-elevated)] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.8em] prose-code:font-normal prose-code:text-[var(--mc-text)] prose-code:before:content-none prose-code:after:content-none sm:prose-code:break-words sm:prose-code:text-[0.85em]",
                    "prose-a:break-words prose-a:font-semibold prose-a:text-[var(--mc-net-green)] prose-a:no-underline prose-a:underline-offset-2 hover:prose-a:underline",
                  )}
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
