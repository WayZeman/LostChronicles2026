import Image from "next/image";
import Link from "next/link";
import { ExternalLink, HeartHandshake } from "lucide-react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";
import type { CatalogVoteLink } from "@/lib/site-content";

const DEFAULT_JAR_URL = "https://send.monobank.ua/jar/8f7nV8DopG";

type Props = {
  jarUrl?: string;
  blurb?: string;
  /** @deprecated голосування прибрано з блоку; лишається в пропсах для сумісності з page.tsx */
  catalogLinks?: CatalogVoteLink[];
};

/**
 * Підтримка сервера: магазин бонусів + банка Monobank.
 */
export function SupportMonobankSection({ jarUrl, blurb }: Props = {}) {
  const resolvedJar =
    jarUrl?.trim() ||
    process.env.NEXT_PUBLIC_MONO_JAR_URL?.trim() ||
    DEFAULT_JAR_URL;
  const resolvedBlurb = blurb?.trim() || "";

  return (
    <section
      className={cn(
        lcGlassPanelClass,
        "lc-interactive-panel-static am-reveal am-delay-1 mt-10 md:mt-14",
      )}
      aria-labelledby="support-donate-heading"
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
            id="support-donate-heading"
            className="text-center text-sm font-extrabold uppercase tracking-wide text-[var(--mc-text)] sm:text-left sm:text-base"
          >
            Підтримати сервер
          </h2>
          {resolvedBlurb ? (
            <p className="mt-2 text-center text-sm text-[var(--mc-ink-subtle)] sm:text-left">
              {resolvedBlurb}
            </p>
          ) : null}

          <div className="mt-3 flex flex-col gap-2 sm:mt-4">
            <Link
              href="/support"
              className="lc-focus-ring lc-btn-accent inline-flex w-full min-h-11 items-center justify-center gap-2 px-6 py-2.5 text-center text-sm"
            >
              <HeartHandshake className="size-4 shrink-0" aria-hidden />
              <span>З плюшками</span>
            </Link>
            <a
              href={resolvedJar}
              target="_blank"
              rel="noopener noreferrer"
              className="lc-focus-ring mc-slot inline-flex min-h-10 w-full items-center justify-center gap-2 px-4 text-center text-sm font-semibold text-[var(--mc-text)] hover:bg-[#242424] hover:text-[var(--mc-grass-bright)]"
            >
              <span>Просто підтримати</span>
              <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
