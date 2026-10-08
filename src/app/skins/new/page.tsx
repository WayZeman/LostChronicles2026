import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SkinEditorClient } from "@/components/skins/SkinEditorClient";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { buildLcPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildLcPageMetadata({
  title: "Створити скін",
  description:
    "3D-редактор Minecraft-скінів Lost Chronicles: малюй по пікселях, крути модель і зберігай.",
  path: "/skins/new",
  index: false,
});

export default function NewSkinPage() {
  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        <header className={cn(lcGlassPanelClass, "mb-4")}>
          <Link
            href="/skins"
            className="lc-focus-ring inline-flex items-center gap-1.5 text-xs text-[var(--mc-ink-subtle)] hover:text-[var(--mc-ink)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            До галереї
          </Link>
          <h1 className="lc-section-title mt-2 text-xl md:text-2xl">
            Редактор скіна
          </h1>
          <p className="mt-1 text-sm text-[var(--mc-ink-subtle)]">
            Білий макет 64×64 — розфарбуй по пікселях на 3D-моделі або на
            розгортці частини тіла. Steve / Alex, база та overlay.
          </p>
        </header>
        <SkinEditorClient />
      </div>
    </main>
  );
}
