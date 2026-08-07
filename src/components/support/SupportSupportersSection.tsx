import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { PlayerNamesStrip } from "@/components/site/PlayerNamesStrip";
import { cn } from "@/lib/utils";

type Props = {
  nicknames: string[];
};

/**
 * Стрічка тих, хто підтримав сервер цього місяця — під каталогом /support.
 */
export function SupportSupportersSection({ nicknames }: Props) {
  const nicks = nicknames.map((n) => n.trim()).filter(Boolean);

  return (
    <section
      className={cn(
        lcGlassPanelClass,
        "lc-interactive-panel-static mt-8 mb-20 sm:mt-10 sm:mb-24",
      )}
      aria-labelledby="support-supporters-heading"
    >
      <div className="flex flex-col items-center text-center">
        <p
          id="support-supporters-heading"
          className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-ink-subtle)] sm:text-sm"
        >
          Цього місяця нас підтримали
        </p>
        {nicks.length > 0 ? (
          <PlayerNamesStrip
            names={nicks}
            className="mt-3 w-full"
            ariaLabel="Хто підтримав сервер цього місяця. Перетягніть смужку або натисніть на нік, щоб скопіювати."
          />
        ) : (
          <p className="mt-2 max-w-sm text-sm text-[var(--mc-text-muted)]">
            Поки нікого — стань першим.
          </p>
        )}
      </div>
    </section>
  );
}
