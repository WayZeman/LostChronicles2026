import { ArrowUpRight } from "lucide-react";

import { SoftAppear } from "@/components/site/SoftAppear";
import { DiamondSlot } from "@/components/site/DiamondSlot";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import {
  formatTelegramNewsDate,
  getTelegramNewsPostBodyPlain,
  getTelegramNewsPostTitle,
  type TelegramNewsPost,
} from "@/lib/telegram-news";
import { cn } from "@/lib/utils";

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.458.02.889-.18 1.897-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

type Props = {
  posts: TelegramNewsPost[];
  topicUrl: string;
};

export function TelegramNewsFeed({ posts, topicUrl }: Props) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <SoftAppear>
        <header className="relative mb-5 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <DiamondSlot
            id="news-header"
            className="!absolute !left-0 !top-0 sm:!-left-1"
          />
          <h1 className="lc-hero-title lc-hero-display text-balance text-center text-[1.75rem] leading-tight text-[var(--mc-text)] sm:text-left sm:text-4xl">
            Новини
          </h1>
          <a
            href={topicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="lc-focus-ring lc-btn-accent mx-auto inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 px-5 text-sm sm:mx-0 sm:w-auto sm:max-w-none"
          >
            <IconTelegram className="size-4 opacity-90" />
            Телеграм
            <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
          </a>
        </header>
      </SoftAppear>

      <ol className="lc-stagger grid gap-3 sm:gap-5">
        {posts.map((post, postIdx) => {
          const title = getTelegramNewsPostTitle(post);
          const bodyPlain = getTelegramNewsPostBodyPlain(post, title);
          const date = formatTelegramNewsDate(post.dateIso);
          const previewImages = post.images.slice(0, 3);
          const extraImages = Math.max(0, post.images.length - previewImages.length);

          return (
            <li key={post.id} className="relative min-w-0">
              {postIdx < 3 ? (
                <DiamondSlot
                  id={`news-post-${postIdx}`}
                  className="!absolute !right-2 !top-2 !z-[5]"
                />
              ) : null}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  lcGlassPanelClass,
                  "lc-interactive-panel group relative block min-w-0 overflow-hidden !p-0",
                  "lc-focus-ring transition-[border-color] hover:border-[var(--mc-net-green)]/40",
                )}
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-[var(--mc-net-green)]/70 opacity-70 transition-opacity group-hover:opacity-100 sm:w-1" />

                <div className="px-3.5 py-3.5 pl-4 sm:px-5 sm:py-5 sm:pl-6">
                  <time
                    dateTime={post.dateIso}
                    title={date.full}
                    className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-sm border border-black/60 bg-[var(--mc-surface-elevated)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--mc-text)] sm:text-xs"
                  >
                    <span>{date.day}</span>
                    {date.time ? (
                      <>
                        <span className="text-[var(--mc-text-subtle)]" aria-hidden>
                          ·
                        </span>
                        <span className="tabular-nums text-[var(--mc-text-muted)]">
                          {date.time}
                        </span>
                      </>
                    ) : null}
                  </time>

                  {title ? (
                    <h2 className="mt-2.5 text-base font-bold leading-snug tracking-tight text-[var(--mc-text)] transition-colors group-hover:text-[var(--mc-net-green)] [overflow-wrap:anywhere] sm:mt-3 sm:text-xl">
                      {title}
                    </h2>
                  ) : null}

                  {bodyPlain && bodyPlain !== title ? (
                    <p
                      className={cn(
                        title ? "mt-2" : "mt-2.5",
                        "line-clamp-4 text-[13px] leading-relaxed text-[var(--mc-text-muted)] [overflow-wrap:anywhere] sm:mt-2.5 sm:line-clamp-5 sm:text-[15px]",
                        !title && "text-[var(--mc-text)]",
                      )}
                    >
                      {bodyPlain}
                    </p>
                  ) : null}

                  {previewImages.length > 0 ? (
                    <ul
                      className={cn(
                        "mt-3 grid gap-1.5 sm:mt-4",
                        previewImages.length === 1
                          ? "grid-cols-1"
                          : "grid-cols-2 sm:grid-cols-2",
                        previewImages.length >= 3 && "sm:grid-cols-3",
                      )}
                    >
                      {previewImages.map((src, i) => (
                        <li
                          key={src}
                          className="relative min-w-0 overflow-hidden border border-black/50 bg-black/25"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="h-auto w-full max-w-full object-contain"
                          />
                          {extraImages > 0 && i === previewImages.length - 1 ? (
                            <span className="absolute bottom-1.5 right-1.5 rounded-sm bg-black/75 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">
                              +{extraImages}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </a>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex justify-center border-t border-white/[0.08] pt-6 sm:mt-10 sm:pt-10">
        <a
          href={topicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="lc-focus-ring lc-btn-accent inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 px-6 text-sm font-bold uppercase tracking-wide sm:w-auto sm:min-w-[16rem]"
        >
          Більше новин
          <ArrowUpRight className="size-4 opacity-80" aria-hidden />
        </a>
      </div>
    </div>
  );
}
