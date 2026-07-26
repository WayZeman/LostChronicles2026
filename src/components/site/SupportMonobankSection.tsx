import { ExternalLink, HeartHandshake } from "lucide-react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

const DEFAULT_JAR_URL = "https://send.monobank.ua/jar/8f7nV8DopG";

/** Каталоги та моніторинги, де сервер рекламується — голосування піднімає позиції в рейтингах. */
const CATALOG_VOTE_LINKS = [
  {
    href: "https://minecraft.org.ua/minecraft-servers/Lost-Chronicles/3210",
    label: "Minecraft.org.ua (ОУМ)",
  },
  {
    href: "https://monicore.com.ua/server/281/lostchronicles",
    label: "MoniCore",
  },
  {
    href: "https://allmc.in.ua/play-lost-chronicles-site",
    label: "AllMC.in.ua",
  },
] as const;

/**
 * Блок підтримки через monobank (без прогрес-бару).
 * Посилання: NEXT_PUBLIC_MONO_JAR_URL або банка за замовчуванням.
 */
export function SupportMonobankSection() {
  const jarUrl = process.env.NEXT_PUBLIC_MONO_JAR_URL?.trim() || DEFAULT_JAR_URL;

  return (
    <section
      className={cn(
        lcGlassPanelClass,
        "lc-interactive-panel-static am-reveal am-delay-3 mt-10 flex flex-col items-center text-center md:mt-14",
      )}
      aria-labelledby="support-mono-heading"
    >
      <div
        className="mc-badge flex size-12 cursor-default items-center justify-center md:size-14"
        aria-hidden
      >
        <HeartHandshake className="size-6 md:size-7" strokeWidth={2.25} />
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--mc-grass-bright)]">
        Підтримка
      </p>

      <h2
        id="support-mono-heading"
        className="lc-section-title mt-2 max-w-md text-xl leading-snug md:text-2xl"
      >
        Тримаємо онлайн разом
      </h2>

      <div
        className="mt-6 w-full max-w-md text-left"
        aria-labelledby="support-catalog-vote-heading"
      >
        <p
          id="support-catalog-vote-heading"
          className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-subtle)]"
        >
          Голосування
        </p>
        <ul className="mt-2 divide-y divide-[var(--mc-border-card)] border-y border-[var(--mc-border-card)]">
          {CATALOG_VOTE_LINKS.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "lc-focus-ring flex items-center justify-between gap-2 py-2.5",
                  "text-sm text-[var(--mc-text)] transition-colors hover:text-[var(--mc-grass-bright)]",
                )}
              >
                <span className="min-w-0">{label}</span>
                <ExternalLink className="size-3.5 shrink-0 opacity-40" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <a
        href={jarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="lc-focus-ring lc-btn-accent mt-7 w-full max-w-md min-h-[3rem] px-8 py-3 text-base"
      >
        <HeartHandshake className="size-5 shrink-0" aria-hidden />
        Підтримати в monobank
        <ExternalLink className="size-4 shrink-0 opacity-70" aria-hidden />
      </a>
    </section>
  );
}
