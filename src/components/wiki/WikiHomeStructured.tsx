import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { WikiCategoryRow, WikiHomeTree } from "@/lib/wiki-structure";
import { SoftAppear } from "@/components/site/SoftAppear";
import {
  wikiAccentForSlug,
  wikiPagesChip,
} from "@/components/wiki/wiki-accents";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  tree: WikiHomeTree;
  editMode?: boolean;
  onOpenCategory?: (category: WikiCategoryRow) => void;
  sectionActions?: (sectionId: number) => ReactNode;
  categoryActions?: (category: WikiCategoryRow) => ReactNode;
  footer?: ReactNode;
};

export function WikiHomeStructured({
  tree,
  editMode,
  onOpenCategory,
  sectionActions,
  categoryActions,
  footer,
}: Props) {
  if (!tree.sections.length) {
    return (
      <div className="space-y-4">
        <p className="py-10 text-center text-sm text-[var(--mc-text-muted)]">
          Структура вікі ще порожня.
        </p>
        {footer}
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-14">
      <SoftAppear>
        <header className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--mc-text-subtle)]">
            Lost Chronicles
          </p>
          <h1 className="lc-hero-title mt-2 text-3xl text-[var(--mc-text)] sm:text-4xl">
            Вікі світу
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--mc-text-muted)]">
            Лор, держави, міста, гравці та довідник цін — хроніка сервера в одному
            місці.
          </p>
          <div className="mx-auto mt-4 h-px w-[min(70%,18rem)] bg-gradient-to-r from-transparent via-[#ecaf2d]/50 to-transparent" />
        </header>
      </SoftAppear>

      {tree.sections.map((section, sectionIdx) => (
        <SoftAppear key={section.id} slow={sectionIdx > 0}>
          <section className="space-y-5">
            <header className="relative text-center">
              <h2 className="lc-section-title text-lg text-[var(--mc-text)] sm:text-xl">
                {section.title}
              </h2>
              {section.description ? (
                <p className="mx-auto mt-1.5 max-w-xl text-sm text-[var(--mc-text-muted)]">
                  {section.description}
                </p>
              ) : null}
              <div className="mx-auto mt-3 h-px w-[min(50%,12rem)] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {sectionActions ? (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {sectionActions(section.id)}
                </div>
              ) : null}
            </header>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-3.5">
              {section.categories.map((cat) => {
                const accent = wikiAccentForSlug(cat.slug);
                const Icon = accent.Icon;
                const chip =
                  cat.slug === "RP_новини"
                    ? "стрічка"
                    : wikiPagesChip(cat.page_count);
                const cardClass = cn(
                  "lc-focus-ring group relative flex w-full flex-col overflow-hidden",
                  "border border-white/10 bg-black/35 p-4 transition duration-200",
                  "sm:w-[calc(50%-0.45rem)]",
                  "hover:-translate-y-0.5 hover:bg-black/45",
                  accent.glow,
                );
                const body = (
                  <>
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 w-1",
                        accent.bar,
                      )}
                      aria-hidden
                    />
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center border bg-black/40",
                            accent.chip,
                          )}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-base font-extrabold tracking-wide text-[var(--mc-text)] group-hover:text-[var(--mc-net-green)]">
                            {cat.title}
                          </h3>
                          {chip ? (
                            <p
                              className={cn(
                                "mt-0.5 text-[10px] font-bold uppercase tracking-wider",
                                accent.chip.split(" ").pop(),
                              )}
                            >
                              {chip}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {cat.description ? (
                      <p className="mt-2.5 flex-1 pl-2 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                        {cat.description}
                      </p>
                    ) : (
                      <span className="flex-1" />
                    )}
                    <span className="mt-3 inline-flex items-center gap-1.5 pl-2 text-xs font-bold text-[#ffd54f]">
                      Відкрити
                      <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                    {categoryActions ? (
                      <div
                        className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-3 pl-2"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {categoryActions(cat)}
                      </div>
                    ) : null}
                  </>
                );

                if (editMode && onOpenCategory) {
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onOpenCategory(cat)}
                      className={cn(cardClass, "text-left")}
                    >
                      {body}
                    </button>
                  );
                }

                return (
                  <Link
                    key={cat.id}
                    href={`/wiki/${encodeURIComponent(cat.slug)}`}
                    className={cardClass}
                  >
                    {body}
                  </Link>
                );
              })}
            </div>
          </section>
        </SoftAppear>
      ))}
      {footer}
    </div>
  );
}
