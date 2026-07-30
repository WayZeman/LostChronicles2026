import type { ComponentType } from "react";
import {
  LC_DEFAULT_DISCORD_URL,
  LC_DEFAULT_INSTAGRAM_URL,
  LC_DEFAULT_TELEGRAM_URL,
  LC_DEFAULT_TIKTOK_URL,
  LC_DEFAULT_YOUTUBE_URL,
} from "@/data/lc-social-defaults";
import { cn } from "@/lib/utils";

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconTiktok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function IconDiscord({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.147-.056-.207s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

type SocialItem = {
  key: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
};

/** Залізний ланцюг — чергування вертикальних / горизонтальних ланок */
function ChainSegment({ links }: { links: number }) {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      {Array.from({ length: links }, (_, i) => (
        <span
          key={i}
          className={cn(
            "border border-[#1c1c1c]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
            i % 2 === 0
              ? "my-px h-3 w-[7px] rounded-[3px] bg-[linear-gradient(180deg,#c4c4c4_0%,#7a7a7a_55%,#4a4a4a_100%)]"
              : "my-px h-[7px] w-3 rounded-[3px] bg-[linear-gradient(90deg,#c4c4c4_0%,#7a7a7a_55%,#4a4a4a_100%)]",
          )}
        />
      ))}
    </div>
  );
}

function SocialSlot({ item }: { item: SocialItem }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.label}
      title={item.label}
      className={cn(
        "lc-focus-ring mc-slot group flex size-11 items-center justify-center p-2 sm:size-12",
        "text-[var(--mc-text)] transition-[background-color,transform] duration-150",
        "hover:bg-[#242424] active:translate-y-px",
        "shadow-[0_4px_10px_rgba(0,0,0,0.45)]",
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0 transition-transform duration-150 group-hover:scale-110 sm:size-6",
          item.iconClass,
        )}
      />
    </a>
  );
}

/** Одна цепочка зверху: кілька іконок підвішені поспіль */
function HangingChain({
  items,
  topLinks = 3,
  betweenLinks = 2,
}: {
  items: SocialItem[];
  topLinks?: number;
  betweenLinks?: number;
}) {
  return (
    <div className="flex w-11 flex-col items-center sm:w-12">
      <span
        className="mb-0.5 size-1.5 rounded-full bg-[#9a9a9a] shadow-[inset_0_1px_0_#e0e0e0,0_1px_0_#2a2a2a]"
        aria-hidden
      />
      <ChainSegment links={topLinks} />
      {items.map((item, i) => (
        <div key={item.key} className="flex flex-col items-center">
          <SocialSlot item={item} />
          {i < items.length - 1 ? <ChainSegment links={betweenLinks} /> : null}
        </div>
      ))}
    </div>
  );
}

type HeroSocialLinksProps = {
  className?: string;
  hideTitle?: boolean;
  /** grid | rail | chains | row — горизонтальний ряд іконок */
  layout?: "grid" | "rail" | "chains" | "row";
};

export function HeroSocialLinks({
  className,
  hideTitle = false,
  layout = "grid",
}: HeroSocialLinksProps) {
  const youtube =
    process.env.NEXT_PUBLIC_YOUTUBE_URL?.trim() || LC_DEFAULT_YOUTUBE_URL;
  const tiktok =
    process.env.NEXT_PUBLIC_TIKTOK_URL?.trim() || LC_DEFAULT_TIKTOK_URL;
  const discord =
    process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || LC_DEFAULT_DISCORD_URL;
  const telegram =
    process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || LC_DEFAULT_TELEGRAM_URL;
  const instagram =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || LC_DEFAULT_INSTAGRAM_URL;

  const items: SocialItem[] = [
    {
      key: "youtube",
      label: "YouTube",
      href: youtube,
      icon: IconYoutube,
      iconClass: "text-[#FF0033]",
    },
    {
      key: "tiktok",
      label: "TikTok",
      href: tiktok,
      icon: IconTiktok,
      iconClass: "text-[var(--mc-text)]",
    },
    {
      key: "discord",
      label: "Discord",
      href: discord,
      icon: IconDiscord,
      iconClass: "text-[#5865F2]",
    },
    {
      key: "telegram",
      label: "Telegram",
      href: telegram,
      icon: IconTelegram,
      iconClass: "text-[#26A5E4]",
    },
    {
      key: "instagram",
      label: "Instagram",
      href: instagram,
      icon: IconInstagram,
      iconClass: "text-[#E4405F]",
    },
  ];

  if (layout === "chains") {
    const byKey = Object.fromEntries(items.map((item) => [item.key, item]));
    /** Ліва: YouTube + Discord; права: TikTok, Telegram, Instagram */
    const leftChain = [byKey.youtube, byKey.discord];
    const rightChain = [byKey.tiktok, byKey.telegram, byKey.instagram];

    return (
      <div className={cn("w-full", className)}>
        <ul className="flex items-start justify-center gap-5 sm:gap-7">
          <li>
            <HangingChain items={leftChain} topLinks={4} betweenLinks={3} />
          </li>
          <li>
            <HangingChain items={rightChain} topLinks={3} betweenLinks={2} />
          </li>
        </ul>
      </div>
    );
  }

  if (layout === "row") {
    return (
      <div className={cn("w-auto", className)}>
        <ul className="flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          {items.map(({ key, label, href, icon: Icon, iconClass }) => (
            <li key={key} className="w-11 sm:w-12">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className={cn(
                  "lc-focus-ring mc-slot group flex aspect-square w-full items-center justify-center p-2",
                  "text-[var(--mc-text)] transition-[background-color,transform] duration-150",
                  "hover:bg-[#242424] active:translate-y-px",
                  "shadow-[0_6px_16px_rgba(0,0,0,0.45)]",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0 transition-transform duration-150 group-hover:scale-110 sm:size-6",
                    iconClass,
                  )}
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const rail = layout === "rail";

  return (
    <div className={cn("w-full", rail && "w-auto", className)}>
      {!hideTitle ? (
        <h2 className="lc-section-title text-center text-lg uppercase md:text-xl">
          Ми в соцмережах
        </h2>
      ) : null}

      <ul
        className={cn(
          rail
            ? "flex flex-col-reverse items-center gap-2"
            : cn(
                "mx-auto grid max-w-sm grid-cols-3 gap-2 sm:max-w-none sm:gap-2.5 md:gap-3",
                hideTitle ? "mt-0" : "mt-5 sm:mt-6",
              ),
        )}
      >
        {items.map(({ key, label, href, icon: Icon, iconClass }) => (
          <li key={key} className={cn(rail && "w-11 sm:w-12")}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className={cn(
                "lc-focus-ring mc-slot group flex items-center justify-center",
                "text-[var(--mc-text)] transition-[background-color,box-shadow,transform] duration-150",
                "hover:bg-[#242424] active:translate-y-px",
                rail
                  ? "aspect-square w-full p-2"
                  : "aspect-square w-full flex-col gap-1.5 p-2",
              )}
            >
              <Icon
                className={cn(
                  "shrink-0 transition-transform duration-150 group-hover:scale-110",
                  rail ? "size-5 sm:size-6" : "size-6 sm:size-7",
                  iconClass,
                )}
              />
              {!rail ? (
                <span className="max-w-full truncate text-[10px] font-bold uppercase tracking-wide text-[var(--mc-ink-subtle)] group-hover:text-[var(--mc-text)] sm:text-[11px]">
                  {label}
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
