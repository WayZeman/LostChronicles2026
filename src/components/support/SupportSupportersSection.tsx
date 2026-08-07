import { SoftAppear } from "@/components/site/SoftAppear";
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
  return `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/40`;
}

function placeTone(place: number): {
  num: string;
  chip: string;
} {
  if (place === 1) {
    return {
      num: "text-[#ECAF2D]",
      chip: "border-[#ECAF2D]/50 bg-[color-mix(in_srgb,#ECAF2D_14%,transparent)]",
    };
  }
  if (place === 2) {
    return {
      num: "text-[#d0d0d0]",
      chip: "border-white/20 bg-white/[0.06]",
    };
  }
  if (place === 3) {
    return {
      num: "text-[#c47a3a]",
      chip: "border-[#c47a3a]/40 bg-[color-mix(in_srgb,#c47a3a_12%,transparent)]",
    };
  }
  return {
    num: "text-[var(--mc-text-muted)]",
    chip: "border-transparent bg-transparent",
  };
}

/**
 * Загальний рейтинг підтримки — у стилі карток магазину.
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
      className="mt-2 mb-[max(5.5rem,env(safe-area-inset-bottom,0px))] flex justify-center sm:mt-4 sm:mb-24"
    >
      <section
        className={cn(
          "w-full overflow-hidden border-2 border-black bg-black/30",
          "shadow-[4px_4px_0_rgba(0,0,0,0.45)]",
          /* на телефоні/планшеті — на всю ширину сітки; на lg — як дві картки */
          "lg:w-[calc((100%-2.5rem)*2/3+1.25rem)]",
        )}
        aria-labelledby="support-supporters-heading"
      >
        <header className="border-b-2 border-black bg-black/45 px-3.5 py-3 text-center sm:px-4 sm:py-3.5">
          <h2
            id="support-supporters-heading"
            className="text-[13px] font-extrabold tracking-wide text-[var(--mc-text)] sm:text-sm"
          >
            Нас підтримали
          </h2>
          <p className="mt-1 text-[11px] tabular-nums text-[var(--mc-text-muted)] sm:text-xs">
            Загалом:{" "}
            <span className="font-bold text-[var(--mc-net-green)]">
              {formatUah(totalSum)}
            </span>
          </p>
        </header>

        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--mc-text-muted)]">
            Поки нікого — стань першим.
          </p>
        ) : (
          <ol
            className={cn(
              "px-2 py-1.5 sm:px-2.5 sm:py-2",
              rows.length > 8 &&
                "max-h-[min(52dvh,24rem)] overflow-y-auto overscroll-contain sm:max-h-[min(46dvh,26rem)]",
            )}
          >
            {rows.map((entry, idx) => {
              const place = idx + 1;
              const tone = placeTone(place);
              const staggerIdx = Math.min(idx, 8);

              return (
                <li
                  key={entry.nickname.toLowerCase()}
                  className={cn(
                    "lc-animate-fade-up",
                    "flex min-h-11 items-center gap-2 rounded-sm px-2 py-2 sm:min-h-12 sm:gap-2.5 sm:px-2.5 sm:py-2.5",
                    "border transition-colors duration-150",
                    "active:bg-white/[0.04] sm:hover:bg-white/[0.04]",
                    tone.chip,
                    place > 3 && "border-transparent",
                  )}
                  style={{ animationDelay: `${0.08 + staggerIdx * 0.045}s` }}
                >
                  <span
                    className={cn(
                      "shrink-0 text-center text-[11px] font-black tabular-nums sm:text-xs",
                      placeWidth,
                      tone.num,
                    )}
                    aria-label={`Місце ${place}`}
                  >
                    {place}
                  </span>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={headUrl(entry.nickname)}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 shrink-0 border border-black/60 sm:size-8"
                    loading={place <= 3 ? "eager" : "lazy"}
                    decoding="async"
                  />

                  <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--mc-text)] sm:text-sm">
                    {entry.nickname}
                  </p>

                  <p className="shrink-0 text-[13px] font-extrabold tabular-nums text-[var(--mc-net-green)] sm:text-sm">
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
