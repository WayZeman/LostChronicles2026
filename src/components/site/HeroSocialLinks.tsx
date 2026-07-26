import { ExternalLink } from "lucide-react";
import type { ComponentType } from "react";
import {
  LC_DEFAULT_DISCORD_URL,
  LC_DEFAULT_INSTAGRAM_URL,
  LC_DEFAULT_TELEGRAM_URL,
  LC_DEFAULT_TIKTOK_URL,
  LC_DEFAULT_YOUTUBE_URL,
} from "@/data/lc-social-defaults";
import { cn } from "@/lib/utils";

const linkClass =
  "lc-focus-ring group inline-flex touch-manipulation items-center justify-center rounded-[var(--radius)] border-2 border-[var(--mc-border-card)] bg-[var(--mc-surface-elevated)] text-sm font-semibold text-[var(--mc-text)] shadow-[0_2px_0_#0a100a,0_1px_0_rgba(140,255,90,0.1)_inset] transition-[border-color,background-color,transform] active:translate-y-[1px] md:hover:border-[var(--mc-net-green)] md:hover:bg-[var(--mc-toggle-hover-bg)]";

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconTiktok({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function IconDiscord({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.147-.056-.207s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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

type HeroSocialLinksProps = {
  /** Усередині картки «Підключитися до серверу» — менший заголовок і h3. */
  embedded?: boolean;
};

export function HeroSocialLinks({ embedded = false }: HeroSocialLinksProps) {
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
      iconClass: "size-[1.125rem] text-[#FF0033]",
    },
    {
      key: "tiktok",
      label: "TikTok",
      href: tiktok,
      icon: IconTiktok,
      iconClass: "size-[1.125rem] text-[var(--mc-text)]",
    },
    {
      key: "discord",
      label: "Discord",
      href: discord,
      icon: IconDiscord,
      iconClass: "size-[1.125rem] text-[#5865F2]",
    },
    {
      key: "telegram",
      label: "Telegram",
      href: telegram,
      icon: IconTelegram,
      iconClass: "size-[1.125rem] text-[#26A5E4]",
    },
    {
      key: "instagram",
      label: "Instagram",
      href: instagram,
      icon: IconInstagram,
      iconClass: "size-[1.125rem] text-[#E4405F]",
    },
  ];

  const TitleTag = embedded ? "h3" : "h2";

  return (
    <section
      className="w-full"
      aria-label="Соціальні мережі Lost Chronicles"
    >
      <TitleTag
        className={cn(
          "lc-hero-title text-center font-semibold text-[var(--mc-text)]",
          embedded
            ? "mb-3 text-sm md:mb-4 md:text-base"
            : "mb-3 text-base md:mb-5 md:text-xl",
        )}
      >
        Ми в соцмережах
      </TitleTag>
      <ul className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3">
        {items.map(({ key, label, href, icon: Icon, iconClass }) => (
          <li key={key} className="min-w-0">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={cn(
                linkClass,
                "min-h-11 min-w-11 shrink-0 p-0 sm:min-w-[2.75rem]",
                "md:min-h-11 md:min-w-0 md:gap-2 md:px-4 md:py-2.5",
              )}
            >
              <Icon
                className={cn(
                  iconClass,
                  "size-5 shrink-0 md:size-[1.125rem]",
                )}
              />
              <span className="hidden md:inline">{label}</span>
              <ExternalLink
                className="hidden size-3 shrink-0 opacity-50 group-hover:opacity-70 md:block"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
