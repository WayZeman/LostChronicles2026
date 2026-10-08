"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Heart, Pencil, Trash2 } from "lucide-react";
import { authRequiredPath } from "@/lib/auth-paths";
import { cn } from "@/lib/utils";

const SkinViewer3D = dynamic(
  () =>
    import("@/components/skins/SkinViewer3D").then((m) => m.SkinViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[190px] w-[140px] items-center justify-center text-[10px] text-[var(--mc-ink-subtle)] md:h-[240px] md:w-[180px]">
        3D…
      </div>
    ),
  },
);

export type SkinCardData = {
  id: number;
  title: string;
  model_type: "classic" | "slim";
  png_data: string;
  likes_count: number;
  downloads_count: number;
  created_at: string;
  author_username: string;
  author_id: number;
  liked_by_me: boolean;
};

function formatUaDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function blobFromDataUrl(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

type Props = {
  skin: SkinCardData;
  compact?: boolean;
  canDelete?: boolean;
  isLoggedIn?: boolean;
  onDeleted?: (id: number) => void;
};

export function SkinCard({
  skin,
  compact = false,
  canDelete = false,
  isLoggedIn = true,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(skin.liked_by_me);
  const [likes, setLikes] = useState(skin.likes_count);
  const [downloads, setDownloads] = useState(skin.downloads_count);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  if (gone) return null;

  const goAuth = (next = "/skins") => {
    router.push(authRequiredPath(next));
  };

  const toggleLike = async () => {
    if (!isLoggedIn) {
      goAuth();
      return;
    }
    if (busy) return;
    setBusy(true);
    const prevLiked = liked;
    const prevLikes = likes;
    setLiked(!prevLiked);
    setLikes(prevLikes + (prevLiked ? -1 : 1));
    try {
      const res = await fetch(`/api/skins/${skin.id}/like`, { method: "POST" });
      const data = (await res.json()) as {
        liked?: boolean;
        likes_count?: number;
      };
      if (!res.ok) {
        setLiked(prevLiked);
        setLikes(prevLikes);
        return;
      }
      setLiked(Boolean(data.liked));
      setLikes(Number(data.likes_count ?? prevLikes));
    } catch {
      setLiked(prevLiked);
      setLikes(prevLikes);
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!isLoggedIn) {
      goAuth();
      return;
    }
    if (busy) return;
    setBusy(true);
    const filename = `${skin.title || "skin"}.png`.replace(
      /[\\/:*?"<>|]+/g,
      "-",
    );
    try {
      const res = await fetch(`/api/skins/${skin.id}/download`);
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.includes("image/png")) {
        triggerBlobDownload(await res.blob(), filename);
        setDownloads((d) => d + 1);
        return;
      }
      // Fallback: локальний png_data з картки (лічильник може не оновитись)
      triggerBlobDownload(await blobFromDataUrl(skin.png_data), filename);
      if (res.ok) setDownloads((d) => d + 1);
    } catch {
      try {
        triggerBlobDownload(await blobFromDataUrl(skin.png_data), filename);
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false);
    }
  };

  const edit = () => {
    if (!isLoggedIn) {
      goAuth(`/skins/new?from=${skin.id}`);
      return;
    }
    router.push(`/skins/new?from=${skin.id}`);
  };

  const remove = async () => {
    if (busy) return;
    if (!window.confirm(`Видалити скін «${skin.title}»?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/skins/${skin.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        window.alert(data.error || "Не вдалося видалити");
        return;
      }
      setGone(true);
      onDeleted?.(skin.id);
    } catch {
      window.alert("Мережева помилка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={cn(
        "mc-frame flex flex-col overflow-hidden bg-black/20",
        compact ? "p-3" : "p-3 md:p-4",
      )}
    >
      <div className="flex justify-center">
        <SkinViewer3D
          skinUrl={skin.png_data}
          slim={skin.model_type === "slim"}
          width={compact ? 140 : 180}
          height={compact ? 190 : 240}
          animate={!compact}
          animationSpeed={0.65}
          enableZoom={false}
        />
      </div>
      <h3 className="mt-2 truncate text-center text-sm font-semibold text-[var(--mc-ink)]">
        {skin.title}
      </h3>
      <p className="mt-0.5 text-center text-[11px] text-[var(--mc-ink-subtle)]">
        {skin.author_username} · {formatUaDate(skin.created_at)}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => void toggleLike()}
          disabled={busy}
          className={cn(
            "lc-focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-sm border px-2.5 text-xs",
            liked
              ? "border-rose-400/50 bg-rose-500/15 text-rose-200"
              : "border-white/15 bg-black/25 text-[var(--mc-ink-subtle)]",
          )}
          aria-pressed={liked}
        >
          <Heart
            className={cn("size-3.5", liked && "fill-current")}
            aria-hidden
          />
          {likes}
        </button>
        <button
          type="button"
          onClick={() => void download()}
          disabled={busy}
          title="Завантажити PNG"
          className="lc-focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-white/15 bg-black/25 px-2.5 text-xs text-[var(--mc-ink-subtle)] disabled:opacity-50"
        >
          <Download className="size-3.5" aria-hidden />
          {downloads}
        </button>
        <button
          type="button"
          onClick={edit}
          disabled={busy}
          title="Редагувати"
          aria-label="Редагувати скін"
          className="lc-focus-ring inline-flex size-9 items-center justify-center rounded-sm border border-[var(--mc-accent)]/40 bg-[var(--mc-accent)]/10 text-[var(--mc-ink)] disabled:opacity-50"
        >
          <Pencil className="size-3.5" aria-hidden />
        </button>
        {canDelete ? (
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            title="Видалити"
            aria-label="Видалити скін"
            className="lc-focus-ring inline-flex size-9 items-center justify-center rounded-sm border border-red-400/40 bg-red-500/10 text-red-200 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </article>
  );
}
