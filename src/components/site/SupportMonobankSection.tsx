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
  {
    href: "https://uamon.online/server/lost-chronicles",
    label: "UAMon",
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
        "am-reveal am-delay-3 mt-12 flex flex-col items-center text-center md:mt-16",
      )}
      aria-labelledby="support-mono-heading"
    >
      <div
        className="flex size-14 items-center justify-center rounded-full border border-[var(--mc-border-card)] bg-[var(--mc-vote-bg)] text-[var(--mc-net-green)] shadow-sm md:size-16"
        aria-hidden
      >
        <HeartHandshake className="size-7 md:size-8" strokeWidth={2} />
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--mc-net-green)]">
        Добровільна підтримка
      </p>

      <h2
        id="support-mono-heading"
        className="lc-hero-title mt-2 max-w-md text-2xl font-semibold leading-tight text-[var(--mc-text)] md:text-3xl"
      >
        <span className="block">Допоможіть тримати</span>
        <span className="mt-1 block">
          <span className="text-[var(--mc-net-green)]">Lost Chronicles</span> онлайн
        </span>
      </h2>

      <div className="mt-4 max-w-lg space-y-3 text-sm font-medium leading-relaxed text-[var(--mc-text-muted)] md:text-base">
        <p>Сервер існує завдяки внескам гравців і команди.</p>
        <p>
          Фінансово — через банку monobank. Без коштів — голосуйте за сервер у каталогах нижче: це
          піднімає нас у рейтингах.
        </p>
      </div>

      <div
        className="mt-8 w-full max-w-md text-left"
        aria-labelledby="support-catalog-vote-heading"
      >
        <p
          id="support-catalog-vote-heading"
          className="text-center text-xs text-[var(--mc-text-subtle)]"
        >
          Голосування в каталогах
        </p>
        <ul className="mt-3 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {CATALOG_VOTE_LINKS.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "lc-focus-ring flex items-center justify-between gap-2 py-2.5",
                  "text-sm text-[var(--mc-text)] transition-colors hover:text-[var(--mc-net-green)]",
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
        className="lc-focus-ring lc-btn-accent mt-8 w-full max-w-md min-h-[3rem] px-8 py-3.5 text-base md:min-h-[3.25rem] md:text-lg"
      >
        <HeartHandshake className="size-5 shrink-0 opacity-90" aria-hidden />
        Підтримати в monobank
        <ExternalLink className="size-4 shrink-0 opacity-70" aria-hidden />
      </a>
    </section>
  );
}
