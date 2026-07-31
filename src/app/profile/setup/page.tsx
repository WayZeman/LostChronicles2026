"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SoftAppear } from "@/components/site/SoftAppear";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { notifyAuthMeChanged } from "@/components/site/UserProfileMenu";
import { gameNicknameError } from "@/lib/game-nickname";
import { sanitizeOAuthNextPath } from "@/lib/auth-paths";
import { cn } from "@/lib/utils";

function ProfileSetupForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = sanitizeOAuthNextPath(search.get("next")) ?? "/";

  const [nick, setNick] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void (async () => {
        try {
          const res = await fetch("/api/auth/me", { credentials: "include" });
          const data = (await res.json()) as {
            user: { gameNickname?: string | null } | null;
          };
          if (!data.user) {
            router.replace(
              `/auth-required?next=${encodeURIComponent(`/profile/setup?next=${encodeURIComponent(next)}`)}`,
            );
            return;
          }
          if (data.user.gameNickname?.trim()) {
            setNick(data.user.gameNickname);
          }
          setReady(true);
        } catch {
          router.replace("/auth-required");
        }
      })();
    });
    return () => cancelAnimationFrame(id);
  }, [next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = gameNicknameError(nick);
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameNickname: nick.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Не вдалося зберегти");
        setBusy(false);
        return;
      }
      notifyAuthMeChanged();
      router.replace(next);
    } catch {
      setError("Мережа недоступна");
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className={cn(lcGlassPanelClass, "mx-auto h-48 max-w-md animate-pulse")} />
    );
  }

  return (
    <SoftAppear>
      <div className={cn(lcGlassPanelClass, "mx-auto max-w-md !p-5 sm:!p-7")}>
        <h1 className="lc-hero-title text-center text-xl font-extrabold text-[var(--mc-text)] sm:text-2xl">
          Твій нік у грі
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[var(--mc-text-muted)]">
          Щоб голоси були прозорими, вкажи Minecraft-нік. Його бачитимуть у
          списках «За» / «Проти».
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-3">
          <label htmlFor="setup-nick" className="sr-only">
            Ігровий нікнейм
          </label>
          <input
            id="setup-nick"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={16}
            placeholder="Наприклад Steve_UA"
            className="lc-focus-ring mc-input w-full px-3 py-3 text-base"
            autoComplete="username"
            autoFocus
          />
          <p className="text-center text-[11px] text-[var(--mc-text-subtle)]">
            3–16 символів · латиниця, цифри, _
          </p>
          {error ? (
            <p className="text-center text-sm text-rose-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="lc-focus-ring lc-btn-accent w-full py-3 text-sm disabled:opacity-50"
          >
            {busy ? "Збереження…" : "Продовжити"}
          </button>
        </form>
      </div>
    </SoftAppear>
  );
}

export default function ProfileSetupPage() {
  return (
    <main className={lcPageMainClass}>
      <div className="site-container mx-auto w-full px-3 py-10 sm:px-4 sm:py-14">
        <Suspense
          fallback={
            <div className={cn(lcGlassPanelClass, "mx-auto h-48 max-w-md animate-pulse")} />
          }
        >
          <ProfileSetupForm />
        </Suspense>
      </div>
    </main>
  );
}
