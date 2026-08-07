import { SoftAppear } from "@/components/site/SoftAppear";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import type { SupportLeaderboardEntry } from "@/lib/support-orders";
import { cn } from "@/lib/utils";

type Props = {
  entries: SupportLeaderboardEntry[];
};

function formatUah(kopecks: number): string {
  const uah = Math.round(kopecks) / 100;
  return `${uah.toLocaleString("uk-UA", {
    maximumFractionDigits: 0,
  })} ₴`;
}

function headUrl(nick: string): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/32`;
}

function placeClass(place: number): string {
  if (place === 1) return "text-[#ECAF2D]";
  if (place === 2) return "text-[#c8c8c8]";
  if (place === 3) return "text-[#c47a3a]";
  return "text-[var(--mc-text-muted)]";
}

/**
 * Загальний рейтинг підтримки — місце, нік, сума.
 * Ширина як у картки товару (та сама сітка 1/2/3).
 */
export function SupportSupportersSection({ entries }: Props) {
  const rows = entries.filter(
    (e) => e.nickname.trim() && e.total_kopecks > 0,
  );
  const totalSum = rows.reduce((s, e) => s + e.total_kopecks, 0);
  const placeWidth = rows.length >= 10 ? "w-6" : "w-5";

  return (
    <SoftAppear
      slow
      className="mt-6 mb-[max(5.5rem,env(safe-area-inset-bottom,0px))] flex justify-center sm:mt-10 sm:mb-24"
    >
      <section
        className={cn(
          lcGlassPanelClass,
          "lc-interactive-panel-static w-full !p-3.5 sm:!p-4 md:!p-5",
          /* ширина = 1 колонка сітки товарів */
          "sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]",
        )}
        aria-labelledby="support-supporters-heading"
      >
        <header className="text-center">
          <h2
            id="support-supporters-heading"
            className="text-[13px] font-semibold tracking-wide text-[var(--mc-text)] sm:text-[15px]"
          >
            Нас підтримали
          </h2>
          <p className="mt-1 text-[11px] tabular-nums text-[var(--mc-text-muted)] sm:text-[12px]">
            Загалом:{" "}
            <span className="font-semibold text-[var(--mc-net-green)]">
              {formatUah(totalSum)}
            </span>
          </p>
        </header>

        {rows.length === 0 ? (
          <p className="mt-5 text-center text-[13px] text-[var(--mc-text-muted)] sm:mt-6">
            Поки нікого — стань першим.
          </p>
        ) : (
          <ol
            className={cn(
              "mt-4 -mx-0.5 sm:mt-5",
              /* довгий список не розтягує мобільну сторінку */
              rows.length > 6 &&
                "max-h-[min(52dvh,22rem)] overflow-y-auto overscroll-contain pr-1 sm:max-h-[min(48dvh,24rem)]",
            )}
          >
            {rows.map((entry, idx) => {
              const place = idx + 1;
              const staggerIdx = Math.min(idx, 8);

              return (
                <li
                  key={entry.nickname.toLowerCase()}
                  className={cn(
                    "lc-animate-fade-up flex min-h-10 items-center gap-2 py-2 sm:min-h-0 sm:gap-2.5 sm:py-2.5",
                    "transition-colors duration-200 active:bg-white/[0.04] sm:hover:bg-white/[0.03]",
                    idx > 0 && "border-t border-white/[0.07]",
                  )}
                  style={{ animationDelay: `${0.08 + staggerIdx * 0.045}s` }}
                >
                  <span
                    className={cn(
                      "shrink-0 text-center text-[11px] font-bold tabular-nums sm:text-[12px]",
                      placeWidth,
                      placeClass(place),
                    )}
                    aria-label={`Місце ${place}`}
                  >
                    {place}
                  </span>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={headUrl(entry.nickname)}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 shrink-0 rounded-[3px] sm:size-7"
                    loading={place <= 3 ? "eager" : "lazy"}
                    decoding="async"
                  />

                  <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--mc-text)] sm:text-[13px]">
                    {entry.nickname}
                  </p>

                  <p className="shrink-0 text-[12px] font-semibold tabular-nums text-[var(--mc-net-green)] sm:text-[13px]">
                    {formatUah(entry.total_kopecks)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </SoftAppear>
  );
}
