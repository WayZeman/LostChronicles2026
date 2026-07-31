import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import { cn } from "@/lib/utils";

type Props = {
  /** Коротка підказка для screen reader / статус. */
  label?: string;
};

/**
 * Спільний скелетон під час підвантаження вкладки (loading.tsx).
 * Тримає той самий ритм сторінки, щоб не було «стрибка» контенту.
 */
export function PageLoadingShell({ label = "Завантаження…" }: Props) {
  return (
    <div className={lcPageMainClass} role="status" aria-live="polite" aria-busy="true">
      <div className={lcPageContainerClass}>
        <span className="sr-only">{label}</span>
        <div className="mx-auto mb-8 flex max-w-md flex-col items-center gap-3 sm:mb-10">
          <div className="lc-skeleton-breathe h-8 w-[min(16rem,70%)] rounded-md bg-white/10 sm:h-9" />
          <div className="lc-skeleton-breathe h-3.5 w-[min(20rem,85%)] rounded bg-white/[0.07]" />
        </div>
        <div
          className={cn(
            lcGlassPanelClass,
            "lc-interactive-panel-static space-y-3 p-4 sm:space-y-4 sm:p-5",
          )}
        >
          <div className="lc-skeleton-breathe h-11 rounded-lg bg-white/[0.08]" />
          <div className="lc-skeleton-breathe h-11 rounded-lg bg-white/[0.06]" />
          <div className="lc-skeleton-breathe h-11 rounded-lg bg-white/[0.05]" />
          <div className="lc-skeleton-breathe mt-2 h-28 rounded-lg bg-white/[0.04] sm:h-36" />
        </div>
      </div>
    </div>
  );
}
