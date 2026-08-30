import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { WikiCategoryRow, WikiHomeTree } from "@/lib/wiki-structure";
import { SoftAppear } from "@/components/site/SoftAppear";
import {
  wikiAccentForSlug,
  wikiPagesChip,
} from "@/components/wiki/wiki-accents";
import { wikiDefaultCoverForSlug } from "@/components/wiki/wiki-covers";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  tree: WikiHomeTree;
  editMode?: boolean;
  /** Приховати «Вікі світу», якщо зверху вже є HTML головної. */
  hideBrandHeader?: boolean;
  onOpenCategory?: (category: WikiCategoryRow) => void;
  sectionActions?: (sectionId: number) => ReactNode;
  categoryActions?: (category: WikiCategoryRow) => ReactNode;
  /** HTML / інтро над реєстрами. */
  intro?: ReactNode;
  footer?: ReactNode;
};

export function WikiHomeStructured({
  tree,
  editMode,
  hideBrandHeader,
  onOpenCategory,
  sectionActions,
  categoryActions,
  intro,
  footer,
}: Props) {
  if (!tree.sections.length && !intro) {
    return (
      <div className="space-y-4">
        <p className="py-10 text-center text-sm text-[var(--mc-text-muted)]">
          Структура вікі ще порожня.
        </p>
        {footer}
      </div>
    );
  }

  const catIndexById = new Map<number, number>();
  {
    let i = 0;
    for (const s of tree.sections) {
      for (const c of s.categories) {
        catIndexById.set(c.id, i);
        i += 1;
      }
    }
  }

  return (
    <div className="space-y-12 sm:space-y-14">
      {intro}

      {!hideBrandHeader ? (
        <SoftAppear>
          <header className="relative text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--mc-text-subtle)]">
              Lost Chronicles
            </p>
            <h1 className="lc-hero-title mt-2 text-3xl text-[var(--mc-text)] sm:text-4xl">
              Вікі світу
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--mc-text-muted)]">
              Лор, держави, міста, гравці та довідник цін — хроніка сервера в
              одному місці.
            </p>
            <div className="mx-auto mt-4 h-px w-[min(70%,18rem)] bg-gradient-to-r from-transparent via-[#ecaf2d]/50 to-transparent" />
          </header>
        </SoftAppear>
      ) : null}

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
                  "group relative flex w-full flex-col overflow-hidden",
                  "border border-white/10 bg-black/35 p-4 transition duration-200",
                  "sm:w-[calc(50%-0.45rem)]",
                  "hover:-translate-y-0.5 hover:bg-black/45",
                  accent.glow,
                );
                const mainClass = cn(
                  "lc-focus-ring flex flex-1 flex-col text-left outline-none",
                  "-m-1 rounded-sm p-1",
                );
                const mainBody = (
                  <>
                    <div className="relative -mx-4 -mt-4 mb-3 aspect-[16/10] overflow-hidden border-b border-white/10 bg-black/50">
                      <Image
                        src={wikiDefaultCoverForSlug(cat.slug)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                      <span
                        className={cn(
                          "pointer-events-none absolute left-3 top-3 inline-flex size-8 items-center justify-center border bg-black/60 backdrop-blur-[2px]",
                          accent.chip,
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span
                        className={cn("absolute inset-y-0 left-0 w-1", accent.bar)}
                        aria-hidden
                      />
                    </div>
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
                    {cat.description ? (
                      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                        {cat.description}
                      </p>
                    ) : (
                      <span className="flex-1" />
                    )}
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#ffd54f]">
                      Відкрити
                      <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </>
                );

                return (
                  <article key={cat.id} className={cardClass}>
                    {editMode && onOpenCategory ? (
                      <button
                        type="button"
                        onClick={() => onOpenCategory(cat)}
                        className={mainClass}
                      >
                        {mainBody}
                      </button>
                    ) : (
                      <Link
                        href={`/wiki/${encodeURIComponent(cat.slug)}`}
                        className={mainClass}
                      >
                        {mainBody}
                      </Link>
                    )}
                    {categoryActions ? (
                      <div className="relative z-10 mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
                        {categoryActions(cat)}
                      </div>
                    ) : null}
                  </article>
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
