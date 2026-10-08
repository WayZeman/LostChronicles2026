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
import { authRequiredPath } from "@/lib/auth-paths";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { listSkins } from "@/lib/skins";
import { getUserRole } from "@/lib/site-content";
import { buildLcPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildLcPageMetadata({
  title: "Скіни гравців",
  description:
    "Галерея Minecraft-скінів спільноти Lost Chronicles — перегляд, лайки та 3D-редактор.",
  path: "/skins",
});

export const dynamic = "force-dynamic";

export default async function SkinsGalleryPage() {
  const userId = await getSessionUserIdFromCookies();
  let skins: SkinCardData[] = [];
  let isAdmin = false;

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
      author_id: s.author_id,
      liked_by_me: s.liked_by_me,
    }));
    if (userId) {
      const role = await getUserRole(userId);
      isAdmin = isAdminRole(role);
    }
  } catch {
    skins = [];
  }

  const createHref = userId
    ? "/skins/new"
    : authRequiredPath("/skins/new");

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        <header
          className={cn(
            lcGlassPanelClass,
            "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <h1 className="lc-section-title text-xl md:text-2xl">Скіни</h1>
          <Link
            href={createHref}
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
            Ще немає скінів.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {skins.map((skin) => (
              <SkinCard
                key={skin.id}
                skin={skin}
                isLoggedIn={Boolean(userId)}
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
