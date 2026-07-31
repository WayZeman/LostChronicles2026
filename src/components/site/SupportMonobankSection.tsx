import Image from "next/image";
import { ExternalLink, HeartHandshake } from "lucide-react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";
import type { CatalogVoteLink } from "@/lib/site-content";

const DEFAULT_JAR_URL = "https://send.monobank.ua/jar/8f7nV8DopG";

const DEFAULT_CATALOG_VOTE_LINKS: CatalogVoteLink[] = [
  {
    href: "https://minecraft.org.ua/minecraft-servers/Lost-Chronicles/3210",
    label: "Minecraft.org.ua",
    shortLabel: "ОУМ",
  },
  {
    href: "https://monicore.com.ua/server/281/lostchronicles",
    label: "MoniCore",
    shortLabel: "MoniCore",
  },
  {
    href: "https://allmc.in.ua/play-lost-chronicles-site",
    label: "AllMC.in.ua",
    shortLabel: "AllMC",
  },
];

type Props = {
  jarUrl?: string;
  blurb?: string;
  catalogLinks?: CatalogVoteLink[];
};

/**
 * Підтримка сервера: ілюстрація + голоси + monobank.
 */
export function SupportMonobankSection({
  jarUrl,
  blurb,
  catalogLinks,
}: Props = {}) {
  const resolvedJar =
    jarUrl?.trim() ||
    process.env.NEXT_PUBLIC_MONO_JAR_URL?.trim() ||
    DEFAULT_JAR_URL;
  const resolvedBlurb =
    blurb?.trim() ||
    "Голос у каталогах або донат — обидва варіанти допомагають.";
  const links =
    catalogLinks && catalogLinks.length > 0
      ? catalogLinks
      : DEFAULT_CATALOG_VOTE_LINKS;

  return (
    <section
      className={cn(
        lcGlassPanelClass,
        "lc-interactive-panel-static am-reveal am-delay-3 mt-10 md:mt-14",
      )}
      aria-labelledby="support-mono-heading"
    >
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] sm:gap-5 md:gap-6">
        <div className="relative mx-auto flex w-full max-w-[16rem] items-center justify-center order-1 sm:order-2 sm:mx-0 sm:max-w-none sm:self-center">
          <Image
            src="/support-gold-pile.png?v=1"
            alt=""
            width={989}
            height={598}
            className="h-auto w-full select-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
            priority={false}
            unoptimized
          />
        </div>

        <div className="order-2 flex flex-col sm:order-1">
          <h2
            id="support-mono-heading"
            className="lc-section-title text-center text-lg uppercase sm:text-left md:text-xl"
          >
            Підтримка сервера
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--mc-ink-subtle)] sm:text-left">
            {resolvedBlurb}
          </p>

          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wide text-[var(--mc-ink-subtle)] sm:mt-5 sm:text-left">
            Голосування
          </p>
          <ul className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-2.5 sm:grid-cols-1 sm:gap-2">
            {links.map(({ href, label, shortLabel }) => (
              <li key={href} className="min-w-0">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className={cn(
                    "lc-focus-ring mc-slot flex items-center justify-center gap-1",
                    "min-h-9 px-1.5 py-1.5 text-[11px] leading-tight sm:min-h-11 sm:justify-between sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm",
                    "text-[var(--mc-text)] transition-[background-color,color] duration-150",
                    "hover:bg-[#242424] hover:text-[var(--mc-grass-bright)]",
                  )}
                >
                  <span className="truncate sm:hidden">{shortLabel}</span>
                  <span className="hidden truncate sm:inline">{label}</span>
                  <ExternalLink
                    className="hidden size-3 shrink-0 opacity-40 sm:block"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>

          <a
            href={resolvedJar}
            target="_blank"
            rel="noopener noreferrer"
            className="lc-focus-ring lc-btn-accent mt-4 w-full min-h-11 px-6 py-2.5 text-sm sm:mt-5"
          >
            <HeartHandshake className="size-4 shrink-0" aria-hidden />
            Підтримати в monobank
            <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
