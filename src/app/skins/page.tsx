import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SkinCard, type SkinCardData } from "@/components/skins/SkinCard";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { isAdminRole } from "@/lib/admin-role";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { listSkins } from "@/lib/skins";
import { getUserRole } from "@/lib/site-content";
import { buildLcPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildLcPageMetadata({
  title: "Скіни гравців",
  description:
    "Галерея Minecraft-скінів спільноти Lost Chronicles — лайки, завантаження та 3D-редактор.",
  path: "/skins",
  index: false,
});

export const dynamic = "force-dynamic";

export default async function SkinsGalleryPage() {
  const userId = await getSessionUserIdFromCookies();
  let skins: SkinCardData[] = [];
  let isAdmin = false;
  if (userId) {
    try {
      const [rows, role] = await Promise.all([
        listSkins({ limit: 48, viewerUserId: userId }),
        getUserRole(userId),
      ]);
      isAdmin = isAdminRole(role);
      skins = rows.map((s) => ({
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
      skins = [];
    }
  }

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        <header
          className={cn(
            lcGlassPanelClass,
            "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
          )}
        >
          <div>
            <h1 className="lc-section-title text-xl md:text-2xl">Скіни</h1>
            <p className="mt-1 text-sm text-[var(--mc-ink-subtle)]">
              PNG 64×64 з прозорістю та 3D-шаром (overlay). Автор або адмін
              може видалити скін.
            </p>
          </div>
          <Link
            href="/skins/new"
            className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm"
          >
            <Plus className="size-4" aria-hidden />
            Створити скін
          </Link>
        </header>

        {skins.length === 0 ? (
          <div
            className={cn(
              lcGlassPanelClass,
              "mt-4 text-center text-sm text-[var(--mc-ink-subtle)]",
            )}
          >
            Ще немає скінів. Створи перший у редакторі.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {skins.map((skin) => (
              <SkinCard
                key={skin.id}
                skin={skin}
                canDelete={
                  Boolean(userId) &&
                  (isAdmin || skin.author_id === userId)
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
