import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { WikiHomeTree } from "@/lib/wiki-structure";
import { cn } from "@/lib/utils";

type Props = {
  tree: WikiHomeTree;
  canEdit?: boolean;
};

export function WikiHomeStructured({ tree, canEdit }: Props) {
  if (!tree.sections.length) {
    return (
      <p className="py-10 text-center text-sm text-[var(--mc-text-muted)]">
        Структура вікі ще порожня.
        {canEdit ? " Додайте розділи в адмін-панелі → Вікі." : null}
      </p>
    );
  }

  return (
    <div className="space-y-10 sm:space-y-12">
      {tree.sections.map((section) => (
        <section key={section.id} className="space-y-4">
          <header className="text-center">
            <h2 className="text-xl font-black tracking-tight text-[var(--mc-text)] sm:text-2xl">
              {section.title}
            </h2>
            {section.description ? (
              <p className="mx-auto mt-1.5 max-w-xl text-sm text-[var(--mc-text-muted)]">
                {section.description}
              </p>
            ) : null}
            <div className="mx-auto mt-3 h-px w-[min(60%,16rem)] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </header>

          <div className="flex flex-wrap justify-center gap-3">
            {section.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/wiki/${encodeURIComponent(cat.slug)}`}
                className={cn(
                  "lc-focus-ring group flex w-full flex-col rounded-xl border border-white/12 bg-black/30 p-4 transition",
                  "sm:w-[calc(50%-0.375rem)]",
                  "hover:border-[var(--mc-net-green)]/35 hover:bg-black/40",
                )}
              >
                <h3 className="text-base font-bold text-[var(--mc-text)] group-hover:text-[var(--mc-net-green)]">
                  {cat.title}
                </h3>
                {cat.description ? (
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                    {cat.description}
                  </p>
                ) : (
                  <span className="flex-1" />
                )}
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#ffd54f]">
                  Перейти
                  <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
