import Link from "next/link";
import { Plus } from "lucide-react";
import { HomeSkinsCarousel } from "@/components/skins/HomeSkinsCarousel";
import type { SkinCardData } from "@/components/skins/SkinCard";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { authRequiredPath } from "@/lib/auth-paths";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { listSkins } from "@/lib/skins";
import { cn } from "@/lib/utils";

export async function HomeSkinsSection() {
  const userId = await getSessionUserIdFromCookies();

  let preview: SkinCardData[] = [];
  try {
    const rows = await listSkins({ limit: 16, viewerUserId: userId });
    preview = rows.map((s) => ({
      id: s.id,
      title: s.title,
      model_type: s.model_type,
      png_data: s.png_data,
      likes_count: s.likes_count,
      downloads_count: s.downloads_count,
      created_at: s.created_at.toISOString(),
      author_username: s.author_username,
      author_id: s.author_id,
      liked_by_me: s.liked_by_me,
    }));
  } catch {
    preview = [];
  }

  const createHref = userId
    ? "/skins/new"
    : authRequiredPath("/skins/new");

  return (
    <section
      className={cn(
        lcGlassPanelClass,
        "lc-interactive-panel-static am-reveal am-delay-1 mt-10 md:mt-14",
      )}
      aria-labelledby="skins-heading"
    >
      <div className="flex flex-col items-center text-center">
        <h2 id="skins-heading" className="lc-section-title text-lg md:text-xl">
          Скіни
        </h2>
      </div>

      {preview.length > 0 ? (
        <HomeSkinsCarousel
          skins={preview}
          isLoggedIn={Boolean(userId)}
          carouselMinCount={5}
        />
      ) : (
        <p className="mt-5 text-center text-sm text-[var(--mc-ink-subtle)]">
          Поки немає збережених скінів.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/skins"
          className="lc-focus-ring mc-btn-secondary inline-flex min-h-11 items-center gap-2 px-5 text-sm"
        >
          Переглянути більше
        </Link>
        <Link
          href={createHref}
          className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center gap-2 px-5 text-sm"
        >
          <Plus className="size-4" aria-hidden />
          Створити скін
        </Link>
      </div>
    </section>
  );
}
