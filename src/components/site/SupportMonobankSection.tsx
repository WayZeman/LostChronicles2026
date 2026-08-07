import Image from "next/image";
import Link from "next/link";
import { ExternalLink, HeartHandshake } from "lucide-react";
import { SupportPlainDonate } from "@/components/site/SupportPlainDonate";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";
import type { CatalogVoteLink } from "@/lib/site-content";

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
 * Підтримка сервера: магазин / донат з сумою + голосування в каталогах.
 */
export function SupportMonobankSection({
  blurb,
  catalogLinks,
}: Props = {}) {
  const resolvedBlurb = blurb?.trim() || "";
  const links =
    catalogLinks && catalogLinks.length > 0
      ? catalogLinks
      : DEFAULT_CATALOG_VOTE_LINKS;

  return (
    <section
      className={cn(
        lcGlassPanelClass,
        "lc-interactive-panel-static am-reveal am-delay-1 mt-10 md:mt-14",
      )}
      aria-labelledby="support-donate-heading"
    >
      <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] sm:gap-5 md:gap-6">
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

        <div className="order-2 flex flex-col items-center text-center sm:order-1">
          <h2
            id="support-donate-heading"
            className="w-full text-center text-sm font-extrabold uppercase tracking-wide text-[var(--mc-text)] sm:text-base"
          >
            Підтримати сервер
          </h2>
          {resolvedBlurb ? (
            <p className="mt-2 w-full text-center text-sm text-[var(--mc-ink-subtle)]">
              {resolvedBlurb}
            </p>
          ) : null}

          <div className="mt-3 flex w-full max-w-md flex-col items-stretch gap-2 sm:mt-4">
            <Link
              href="/support"
              className="lc-focus-ring lc-btn-accent inline-flex w-full min-h-11 items-center justify-center gap-2 px-6 py-2.5 text-center text-sm"
            >
              <HeartHandshake className="size-4 shrink-0" aria-hidden />
              <span>З плюшками</span>
            </Link>
            <SupportPlainDonate nextPath="/#support-donate-heading" />
          </div>

          <h3
            id="support-vote-heading"
            className="mt-5 w-full text-center text-sm font-extrabold uppercase tracking-wide text-[var(--mc-text)] sm:mt-6"
          >
            Підтримати голосуючи
          </h3>
          <ul className="mt-2 flex w-full flex-wrap justify-center gap-1.5">
            {links.map(({ href, label, shortLabel }) => (
              <li key={href} className="min-w-0">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className={cn(
                    "lc-focus-ring mc-slot inline-flex items-center justify-center gap-1",
                    "min-h-7 px-2 py-1 text-[11px] font-semibold leading-none sm:min-h-8 sm:px-2.5 sm:text-xs",
                    "text-[var(--mc-text)] transition-[background-color,color] duration-150",
                    "hover:bg-[#242424] hover:text-[var(--mc-grass-bright)]",
                  )}
                >
                  <span className="max-w-[7.5rem] truncate sm:max-w-[9rem]">
                    {shortLabel || label}
                  </span>
                  <ExternalLink
                    className="size-2.5 shrink-0 opacity-45"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
