import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type {
  WikiCategoryDetail,
  WikiCategoryPageRow,
} from "@/lib/wiki-structure";
import { SoftAppear } from "@/components/site/SoftAppear";
import {
  wikiAccentForSlug,
  wikiPagesChip,
} from "@/components/wiki/wiki-accents";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  category: WikiCategoryDetail;
  editMode?: boolean;
  onBack?: () => void;
  onOpenPage?: (page: WikiCategoryPageRow) => void;
  headerActions?: ReactNode;
  footer?: ReactNode;
  pageActions?: (page: WikiCategoryPageRow) => ReactNode;
};

function monogram(title: string, code?: string): string {
  if (code?.trim()) return code.trim().slice(0, 4).toUpperCase();
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

export function WikiCategoryView({
  category,
  editMode,
  onBack,
  onOpenPage,
  headerActions,
  footer,
  pageActions,
}: Props) {
  const accent = wikiAccentForSlug(category.slug);
  const Icon = accent.Icon;
  const chip = wikiPagesChip(category.pages.length);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {editMode && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="lc-focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Вікі світу
          </button>
        ) : (
          <Link
            href="/wiki"
            className="lc-focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Вікі світу
          </Link>
        )}
        {headerActions}
      </div>

      <SoftAppear>
        <header className="relative overflow-hidden border border-white/10 bg-black/30 px-4 py-5 text-center sm:px-6 sm:py-6 sm:text-left">
          <span
            className={cn("absolute inset-y-0 left-0 w-1.5", accent.bar)}
            aria-hidden
          />
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
            <span
              className={cn(
                "inline-flex size-12 shrink-0 items-center justify-center border bg-black/45",
                accent.chip,
              )}
            >
              <Icon className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mc-text-subtle)]">
                {category.section_title}
                {chip ? ` · ${chip}` : null}
              </p>
              <h1 className="lc-hero-title mt-1 text-2xl text-[var(--mc-text)] sm:text-3xl">
                {category.title}
              </h1>
              {category.description ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--mc-text-muted)]">
                  {category.description}
                </p>
              ) : null}
            </div>
          </div>
        </header>
      </SoftAppear>

      {category.pages.length === 0 ? (
        <p className="border border-dashed border-white/15 px-4 py-10 text-center text-sm text-[var(--mc-text-muted)]">
          У цьому розділі ще немає записів.
        </p>
      ) : (
        <SoftAppear slow>
          <div className="flex flex-wrap justify-center gap-3">
            {category.pages.map((p) => {
              const seal = monogram(p.page_title, p.short_code);
              const cardClass = cn(
                "lc-focus-ring group relative flex w-full flex-col overflow-hidden",
                "border border-white/10 bg-black/35 p-4 transition duration-200",
                "sm:w-[calc(50%-0.375rem)]",
                "hover:-translate-y-0.5 hover:bg-black/45",
                accent.glow,
              );
              const hasPhoto = Boolean(p.image_url?.trim());
              const body = (
                <>
                  {hasPhoto ? (
                    <div className="-mx-4 -mt-4 mb-3 aspect-[16/10] overflow-hidden border-b border-white/10 bg-black/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image_url}
                        alt=""
                        className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}
                  <div className="flex items-start gap-3">
                    {!hasPhoto ? (
                      <span
                        className={cn(
                          "inline-flex size-10 shrink-0 items-center justify-center border bg-black/50 font-mono text-[11px] font-black tracking-wider",
                          accent.chip,
                        )}
                      >
                        {seal}
                      </span>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-extrabold text-[var(--mc-text)] group-hover:text-[var(--mc-net-green)]">
                        {p.page_title}
                      </h2>
                      {p.short_code ? (
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--mc-text-subtle)]">
                          код {p.short_code}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {p.card_blurb || p.page_summary ? (
                    <p className="mt-2.5 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                      {p.card_blurb || p.page_summary}
                    </p>
                  ) : (
                    <span className="flex-1" />
                  )}
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#ffd54f]">
                    Читати
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                  {pageActions ? (
                    <div
                      className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {pageActions(p)}
                    </div>
                  ) : null}
                </>
              );

              if (editMode && onOpenPage) {
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenPage(p)}
                    className={cn(cardClass, "text-left")}
                  >
                    {body}
                  </button>
                );
              }

              return (
                <Link
                  key={p.id}
                  href={`/wiki/${encodeURIComponent(p.page_slug)}`}
                  className={cardClass}
                >
                  {body}
                </Link>
              );
            })}
          </div>
        </SoftAppear>
      )}

      {footer}
    </div>
  );
}
