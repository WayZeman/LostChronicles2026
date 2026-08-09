import Link from "next/link";
import { ArrowLeft, ArrowRight, Pencil, Plus } from "lucide-react";
import type { WikiCategoryDetail } from "@/lib/wiki-structure";
import { cn } from "@/lib/utils";

type Props = {
  category: WikiCategoryDetail;
  canEdit?: boolean;
};

export function WikiCategoryView({ category, canEdit }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/wiki"
          className="lc-focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Головна вікі
        </Link>
        {canEdit ? (
          <Link
            href="/admin?tab=wiki"
            className="lc-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-[var(--mc-text)]"
          >
            <Plus className="size-3.5" aria-hidden />
            Керувати блоком
          </Link>
        ) : null}
      </div>

      <header className="text-center sm:text-left">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--mc-text-muted)]">
          {category.section_title}
        </p>
        <h1 className="mt-1 text-2xl font-black text-[var(--mc-text)] sm:text-3xl">
          {category.title}
        </h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-sm text-[var(--mc-text-muted)]">
            {category.description}
          </p>
        ) : null}
      </header>

      {category.pages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-[var(--mc-text-muted)]">
          У цьому блоці ще немає сторінок.
          {canEdit ? " Додайте їх через «Керувати блоком» або адмін-панель." : null}
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {category.pages.map((p) => (
            <Link
              key={p.id}
              href={`/wiki/${encodeURIComponent(p.page_slug)}`}
              className={cn(
                "lc-focus-ring group flex w-full flex-col rounded-xl border border-white/12 bg-black/30 p-4 transition",
                "sm:w-[calc(50%-0.375rem)]",
                "hover:border-[var(--mc-net-green)]/35 hover:bg-black/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--mc-text)] group-hover:text-[var(--mc-net-green)]">
                  {p.page_title}
                </h2>
                {p.short_code ? (
                  <span className="shrink-0 rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-[var(--mc-text-muted)]">
                    {p.short_code}
                  </span>
                ) : null}
              </div>
              {(p.card_blurb || p.page_summary) ? (
                <p className="mt-1.5 flex-1 text-sm text-[var(--mc-text-muted)]">
                  {p.card_blurb || p.page_summary}
                </p>
              ) : (
                <span className="flex-1" />
              )}
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#ffd54f]">
                Перейти
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {canEdit ? (
        <div className="flex justify-end">
          <Link
            href={`/admin?tab=wiki`}
            className="lc-focus-ring inline-flex items-center gap-1.5 text-xs font-bold text-[var(--mc-text-muted)] hover:text-[var(--mc-net-green)]"
          >
            <Pencil className="size-3.5" />
            Редагувати в адмінці
          </Link>
        </div>
      ) : null}
    </div>
  );
}
