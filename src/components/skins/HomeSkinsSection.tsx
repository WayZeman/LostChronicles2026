import Link from "next/link";
import { Palette, Plus } from "lucide-react";
import { SkinCard, type SkinCardData } from "@/components/skins/SkinCard";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { authRequiredPath } from "@/lib/auth-paths";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { listSkins } from "@/lib/skins";
import { cn } from "@/lib/utils";

export async function HomeSkinsSection() {
  const userId = await getSessionUserIdFromCookies();

  let preview: SkinCardData[] = [];
  if (userId) {
    try {
      const rows = await listSkins({ limit: 4, viewerUserId: userId });
      preview = rows.map((s) => ({
        id: s.id,
        title: s.title,
        model_type: s.model_type,
        png_data: s.png_data,
        likes_count: s.likes_count,
        downloads_count: s.downloads_count,
        created_at: s.created_at.toISOString(),
        author_username: s.author_username,
        liked_by_me: s.liked_by_me,
      }));
    } catch {
      preview = [];
    }
  }

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
        <p className="mt-2 max-w-lg text-sm text-[var(--mc-ink-subtle)]">
          Створюй власний Minecraft-скін у 3D-редакторі, лайкай роботи інших
          гравців і завантажуй PNG для гри.
        </p>
      </div>

      {!userId ? (
        <div className="mt-5 flex flex-col items-center gap-3">
          <p className="text-sm text-[var(--mc-ink-subtle)]">
            Перегляд і створення скінів — лише для авторизованих.
          </p>
          <Link
            href={authRequiredPath("/skins")}
            className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center gap-2 px-6 text-sm"
          >
            <Palette className="size-4" aria-hidden />
            Увійти, щоб відкрити скіни
          </Link>
        </div>
      ) : (
        <>
          {preview.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {preview.map((skin) => (
                <SkinCard key={skin.id} skin={skin} compact />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-center text-sm text-[var(--mc-ink-subtle)]">
              Поки немає збережених скінів — стань першим автором.
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
              href="/skins/new"
              className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center gap-2 px-5 text-sm"
            >
              <Plus className="size-4" aria-hidden />
              Створити скін
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
