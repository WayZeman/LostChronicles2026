import type { Metadata } from "next";

import { TelegramNewsFeed } from "@/components/news/TelegramNewsFeed";
import {
  DiamondPageRoot,
  DiamondSlotStrip,
} from "@/components/site/DiamondSlot";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import {
  fetchTelegramNewsPosts,
  getTelegramNewsFallbackUrl,
  getTelegramNewsTopic,
} from "@/lib/telegram-news";
import { cn } from "@/lib/utils";

import { buildLcPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildLcPageMetadata({
  title: "Новини Lost Chronicles — оголошення Minecraft-сервера",
  description:
    "Офіційні новини та оголошення українського Minecraft-сервера Lost Chronicles з Telegram: події, оновлення, RP.",
  path: "/news",
});

export default async function NewsListPage() {
  const topic = getTelegramNewsTopic();
  const posts = await fetchTelegramNewsPosts();
  const fallbackUrl = getTelegramNewsFallbackUrl();

  return (
    <main className={lcPageMainClass}>
      <DiamondPageRoot className={lcPageContainerClass}>
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
          <>
            <TelegramNewsFeed posts={posts} topicUrl={topic.topicUrl} />
            {posts.length < 3 ? (
              <DiamondSlotStrip
                ids={Array.from(
                  { length: 3 - posts.length },
                  (_, i) => `news-post-${posts.length + i}`,
                )}
              />
            ) : null}
          </>
        )}
      </DiamondPageRoot>
    </main>
  );
}
