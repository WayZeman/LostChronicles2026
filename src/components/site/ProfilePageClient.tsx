"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SoftAppear } from "@/components/site/SoftAppear";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { notifyAuthMeChanged } from "@/lib/auth-me-events";
import { gameNicknameError } from "@/lib/game-nickname";
import { cn } from "@/lib/utils";

type ProfileUser = {
  id: number;
  displayName: string;
  gameNickname: string | null;
  avatarUrl: string;
  age: string;
  birthday: string;
  bio: string;
};

export function ProfilePageClient() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    gameNickname: "",
    age: "",
    birthday: "",
    bio: "",
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void (async () => {
        try {
          const res = await fetch("/api/profile", { credentials: "include" });
          if (res.status === 401) {
            router.replace(
              `/auth-required?next=${encodeURIComponent("/profile")}`,
            );
            return;
          }
          const data = (await res.json()) as {
            user?: ProfileUser;
            error?: string;
          };
          if (!data.user) {
            router.replace("/auth-required?next=%2Fprofile");
            return;
          }
          setUser(data.user);
          setDraft({
            gameNickname: data.user.gameNickname || "",
            age: data.user.age || "",
            birthday: data.user.birthday || "",
            bio: data.user.bio || "",
          });
        } catch {
          router.replace("/auth-required?next=%2Fprofile");
        }
      })();
    });
    return () => cancelAnimationFrame(id);
  }, [router]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const nickErr = gameNicknameError(draft.gameNickname);
    if (nickErr) {
      setError(nickErr);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameNickname: draft.gameNickname.trim(),
          age: draft.age.trim(),
          birthday: draft.birthday.trim(),
          bio: draft.bio.trim(),
        }),
      });
      const data = (await res.json()) as {
        user?: ProfileUser;
        error?: string;
      };
      if (!res.ok || !data.user) {
        setError(data.error || "Не вдалося зберегти");
        setBusy(false);
        return;
      }
      setUser(data.user);
      setDraft({
        gameNickname: data.user.gameNickname || "",
        age: data.user.age || "",
        birthday: data.user.birthday || "",
        bio: data.user.bio || "",
      });
      notifyAuthMeChanged();
      setEditing(false);
    } catch {
      setError("Мережа недоступна");
    }
    setBusy(false);
  }

  if (!user) {
    return (
      <main className={lcPageMainClass}>
        <div className="mx-auto w-full max-w-lg px-4 py-10">
          <div
            className={cn(lcGlassPanelClass, "h-56 animate-pulse")}
            aria-busy
          />
        </div>
      </main>
    );
  }

  const name = user.gameNickname?.trim() || user.displayName;

  return (
    <main className={lcPageMainClass}>
      <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-10">
        <SoftAppear>
          <div className={cn(lcGlassPanelClass, "!p-5 sm:!p-7")}>
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl}
                alt=""
                width={72}
                height={72}
                className="size-[4.5rem] rounded-xl object-cover ring-1 ring-white/15"
              />
              <div className="min-w-0 flex-1">
                <h1 className="lc-hero-title text-xl font-extrabold text-[var(--mc-text)] sm:text-2xl">
                  {name}
                </h1>
                <p className="mt-1 text-sm text-[var(--mc-text-muted)]">
                  Твій профіль на сайті Lost Chronicles
                </p>
                {!editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="lc-focus-ring lc-btn-accent mt-3 px-4 py-2 text-xs"
                  >
                    Редагувати
                  </button>
                ) : null}
              </div>
            </div>

            {!editing ? (
              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                    Вік
                  </dt>
                  <dd className="mt-1 text-[var(--mc-text)]">
                    {user.age.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                    День народження
                  </dt>
                  <dd className="mt-1 text-[var(--mc-text)]">
                    {user.birthday.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                    Про себе
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-[var(--mc-text)]">
                    {user.bio.trim() || "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <form onSubmit={(e) => void onSave(e)} className="mt-6 space-y-3">
                <label className="block text-[11px] font-semibold text-[var(--mc-text-muted)]">
                  Нікнейм у грі
                  <input
                    value={draft.gameNickname}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, gameNickname: e.target.value }))
                    }
                    maxLength={16}
                    className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-[var(--mc-text-muted)]">
                  Вік
                  <input
                    value={draft.age}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, age: e.target.value }))
                    }
                    maxLength={8}
                    inputMode="numeric"
                    placeholder="18"
                    className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-[var(--mc-text-muted)]">
                  День народження
                  <input
                    value={draft.birthday}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, birthday: e.target.value }))
                    }
                    maxLength={32}
                    placeholder="01.01.2000"
                    className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-[var(--mc-text-muted)]">
                  Про себе
                  <textarea
                    value={draft.bio}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, bio: e.target.value }))
                    }
                    maxLength={2000}
                    rows={4}
                    className="lc-focus-ring mc-input mt-1 w-full resize-y px-2.5 py-2 text-sm"
                  />
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="lc-focus-ring lc-btn-accent px-4 py-2 text-xs disabled:opacity-50"
                  >
                    {busy ? "…" : "Зберегти"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setEditing(false);
                      setError(null);
                      setDraft({
                        gameNickname: user.gameNickname || "",
                        age: user.age || "",
                        birthday: user.birthday || "",
                        bio: user.bio || "",
                      });
                    }}
                    className="lc-focus-ring rounded-lg border border-white/12 px-4 py-2 text-xs font-bold text-[var(--mc-text-muted)] hover:bg-white/[0.04]"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            )}

            {error ? (
              <p className="mt-3 text-sm text-rose-300" role="alert">
                {error}
              </p>
            ) : null}

            <Link
              href="/"
              className="mt-6 inline-block text-sm font-semibold text-[var(--mc-net-green)] hover:underline"
            >
              ← На головну
            </Link>
          </div>
        </SoftAppear>
      </div>
    </main>
  );
}
