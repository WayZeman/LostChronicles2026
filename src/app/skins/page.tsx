import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SkinCard, type SkinCardData } from "@/components/skins/SkinCard";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { listSkins } from "@/lib/skins";
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
  if (userId) {
    try {
      const rows = await listSkins({ limit: 48, viewerUserId: userId });
      skins = rows.map((s) => ({
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
              Усі скіни, створені гравцями в редакторі Lost Chronicles.
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
          <div className={cn(lcGlassPanelClass, "mt-4 text-center text-sm text-[var(--mc-ink-subtle)]")}>
            Ще немає скінів. Створи перший у редакторі.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {skins.map((skin) => (
              <SkinCard key={skin.id} skin={skin} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
