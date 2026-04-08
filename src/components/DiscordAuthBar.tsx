"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LogOut } from "lucide-react";

type MeUser = {
  id: number;
  username: string;
  avatarUrl: string;
};

export function DiscordAuthBar() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = (await res.json()) as { user: MeUser | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.refresh();
  };

  if (user === undefined || !user) {
    return null;
  }

  return (
    <div className="fixed right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[110] flex max-w-[min(100vw-1rem,18rem)] items-center gap-2 rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface)]/95 px-2 py-1.5 shadow-lg backdrop-blur-md sm:right-3 sm:gap-2.5 sm:px-2.5">
      <Image
        src={user.avatarUrl}
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-full border border-[var(--mc-border)]"
        unoptimized={user.avatarUrl.endsWith(".gif")}
      />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--mc-text)]">
        {user.username}
      </span>
      <button
        type="button"
        onClick={() => void logout()}
        className="lc-focus-ring inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--mc-border)] bg-[var(--mc-surface-elevated)] px-2 py-1 text-[10px] font-bold text-[var(--mc-text-muted)] transition-colors hover:bg-[var(--mc-toggle-hover-bg)] sm:text-xs"
        title="Вийти"
      >
        <LogOut className="size-3.5 opacity-80" aria-hidden />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
