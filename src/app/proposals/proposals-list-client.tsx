"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import {
  formatTimeRemainingUk,
  isProposalVotingOpenClient,
} from "@/lib/proposal-ui";
import { cn } from "@/lib/utils";

type ProposalItem = {
  id: number;
  title: string;
  description: string;
  status: string;
  ends_at: string;
  author_username: string;
  yes_votes: number;
  no_votes: number;
};

function VoteBar({ yes, no }: { yes: number; no: number }) {
  const total = yes + no;
  const yesPct = total === 0 ? 50 : Math.round((yes / total) * 100);
  return (
    <div className="mt-3 space-y-1">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--mc-deep)] ring-1 ring-[var(--mc-border)]">
        <div
          className="h-full bg-emerald-500/90 transition-[width] duration-500"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="h-full bg-rose-500/85 transition-[width] duration-500"
          style={{ width: `${100 - yesPct}%` }}
        />
      </div>
      <p className="text-[11px] font-semibold text-[var(--mc-text-muted)]">
        👍 {yes} · 👎 {no}
      </p>
    </div>
  );
}

export function ProposalsListClient() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [list, setList] = useState<ProposalItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/proposals", { credentials: "include" });
      if (!res.ok) {
        setFailed(true);
        setList([]);
        return;
      }
      const data = (await res.json()) as { proposals: ProposalItem[] };
      setList(data.proposals);
      setFailed(false);
    } catch {
      setFailed(true);
      setList([]);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    const t = setInterval(() => void load(), 8000);
    return () => {
      cancelAnimationFrame(id);
      clearInterval(t);
    };
  }, [load]);

  return (
    <main className={lcPageMainClass}>
      <div
        className={cn(
          "site-container relative z-10 mx-auto w-full max-w-4xl",
          "px-[max(0.75rem,env(safe-area-inset-left,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-6",
          "pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:px-4 sm:pb-12 sm:pt-8 md:py-12",
        )}
      >
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-balance text-2xl font-extrabold text-[var(--mc-text)] sm:text-3xl md:text-4xl">
              Пропозиції та голосування
            </h1>
            <p className="mt-2 max-w-xl text-pretty text-sm text-[var(--mc-text-muted)] sm:text-base">
              Створюй ідеї для сервера та голосуй за чужі — вхід лише через
              Discord.
            </p>
          </div>
          <Link
            href="/proposals/new"
            className="lc-focus-ring mx-auto inline-flex min-h-11 items-center justify-center gap-2 self-center rounded-md border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-4 py-2.5 text-sm font-bold text-[var(--mc-green-ink)] transition-colors hover:bg-[var(--mc-vote-bg-hover)] sm:mx-0 sm:self-auto"
          >
            <PlusCircle className="size-4" aria-hidden />
            Нова пропозиція
          </Link>
        </header>

        {err === "oauth" || err === "discord" ? (
          <p
            className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-100"
            role="alert"
          >
            Не вдалося увійти через Discord. Перевір налаштування застосунку та
            спробуй ще раз.
          </p>
        ) : null}

        {failed ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100">
            База даних недоступна. Перевір DATABASE_URL (Neon) та змінні середовища на Vercel.
          </p>
        ) : null}

        {list === null ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(lcGlassPanelClass, "h-36 animate-pulse")}
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div
            className={cn(
              lcGlassPanelClass,
              "text-center text-[var(--mc-text-muted)]",
            )}
          >
            Ще немає пропозицій. Будь першим — натисни «Нова пропозиція».
          </div>
        ) : (
          <ul className="grid gap-4 md:gap-5">
            {list.map((p) => {
              const open = isProposalVotingOpenClient(p.status, p.ends_at);
              return (
                <li key={p.id}>
                  <article
                    className={cn(
                      lcGlassPanelClass,
                      "flex flex-col gap-2 border-[var(--mc-border-card)] transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="text-lg font-bold leading-snug text-[var(--mc-text)] sm:text-xl">
                        {p.title}
                      </h2>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          open
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-[var(--mc-surface-elevated)] text-[var(--mc-text-subtle)]",
                        )}
                      >
                        {open ? "активна" : "закрита"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--mc-text-muted)]">
                      Автор:{" "}
                      <span className="font-semibold text-[var(--mc-text)]">
                        {p.author_username}
                      </span>
                      {" · "}
                      {formatTimeRemainingUk(p.ends_at)}
                    </p>
                    <VoteBar yes={p.yes_votes} no={p.no_votes} />
                    <Link
                      href={`/proposals/${p.id}`}
                      className="lc-focus-ring mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[var(--mc-border)] bg-[var(--mc-surface-elevated)] py-2 text-sm font-bold text-[var(--mc-net-green)] transition-colors hover:bg-[var(--mc-nav-link-hover-bg)] sm:w-auto sm:self-start sm:px-6"
                    >
                      Переглянути
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
