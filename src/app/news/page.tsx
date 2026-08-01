import type { Metadata } from "next";

import { TelegramNewsFeed } from "@/components/news/TelegramNewsFeed";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import {
  fetchTelegramNewsPosts,
  getTelegramNewsFallbackUrl,
  getTelegramNewsTopic,
} from "@/lib/telegram-news";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Новини — Lost Chronicles",
  description:
    "Офіційні новини та оголошення сервера Lost Chronicles з Telegram.",
};

export default async function NewsListPage() {
  const topic = getTelegramNewsTopic();
  const posts = await fetchTelegramNewsPosts();
  const fallbackUrl = getTelegramNewsFallbackUrl();

  return (
    <main className={lcPageMainClass}>
      <div
        className={cn(
          "site-container relative z-10 mx-auto w-full max-w-3xl",
          "px-[max(0.75rem,env(safe-area-inset-left,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-6",
          "pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:px-4 sm:pb-12 sm:pt-10 md:py-14",
        )}
      >
        {!posts ? (
          <p
            className={cn(
              lcGlassPanelClass,
              "lc-interactive-panel-static py-12 text-center text-sm font-medium text-[var(--mc-text-muted)]",
            )}
          >
            Не вдалося завантажити новини з Telegram. Спробуйте оновити сторінку
            пізніше або{" "}
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--mc-net-green)] underline-offset-2 hover:underline"
            >
              відкрийте гілку новин у Telegram
            </a>
            .
          </p>
        ) : (
          <TelegramNewsFeed posts={posts} topicUrl={topic.topicUrl} />
        )}
      </div>
    </main>
  );
}
