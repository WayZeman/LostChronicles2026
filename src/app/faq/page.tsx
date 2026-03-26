import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { LOST_CHRONICLES_FAQ } from "@/data/lost-chronicles-faq";
import { cn } from "@/lib/utils";

export default function FAQPage() {
  const faqs = LOST_CHRONICLES_FAQ.map((item) => ({
    id: `lc-faq-${item.order}`,
    question: item.question,
    answer: item.answer,
    order: item.order,
  }));

  return (
    <main className="relative flex-1">
      <div className="lc-mesh pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <div className="site-container relative z-10 mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
        <header className="mb-10 text-center md:mb-12">
          <h1 className="text-3xl font-extrabold text-[var(--mc-text)] md:text-4xl">
            Часті запитання
          </h1>
        </header>

        <Accordion
          multiple={false}
          defaultValue={[]}
          className={cn(lcGlassPanelClass, "overflow-hidden p-3 md:p-4")}
        >
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border-[var(--mc-border-card)] px-1"
            >
              <AccordionTrigger className="text-left text-[15px] font-bold text-[var(--mc-ink)] hover:text-[var(--mc-net-green)] hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm font-medium leading-relaxed text-[var(--mc-ink-muted)]">
                <div
                  className="prose max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:text-[var(--mc-ink)] prose-p:text-[var(--mc-ink-muted)] prose-strong:text-[var(--mc-ink)] prose-a:font-bold prose-a:text-[var(--mc-net-green)]"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </main>
  );
}
