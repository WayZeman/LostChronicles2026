"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Download, Heart } from "lucide-react";
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

type Props = {
  skin: SkinCardData;
  compact?: boolean;
};

export function SkinCard({ skin, compact = false }: Props) {
  const [liked, setLiked] = useState(skin.liked_by_me);
  const [likes, setLikes] = useState(skin.likes_count);
  const [downloads, setDownloads] = useState(skin.downloads_count);
  const [busy, setBusy] = useState(false);

  const toggleLike = async () => {
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
        error?: string;
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
    try {
      const res = await fetch(`/api/skins/${skin.id}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${skin.title || "skin"}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloads((d) => d + 1);
    } catch {
      /* ignore */
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
          enableZoom={false}
        />
      </div>
      <h3 className="mt-2 truncate text-center text-sm font-semibold text-[var(--mc-ink)]">
        {skin.title}
      </h3>
      <p className="mt-0.5 text-center text-[11px] text-[var(--mc-ink-subtle)]">
        {skin.author_username} · {formatUaDate(skin.created_at)}
      </p>
      <div className="mt-2 flex items-center justify-center gap-2">
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
          className="lc-focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-white/15 bg-black/25 px-2.5 text-xs text-[var(--mc-ink-subtle)]"
        >
          <Download className="size-3.5" aria-hidden />
          {downloads}
        </button>
      </div>
    </article>
  );
}
