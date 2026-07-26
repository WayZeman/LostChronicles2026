"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge";
import { ProposalVoteBar } from "@/components/proposals/ProposalVoteBar";
import { SoftAppear } from "@/components/site/SoftAppear";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import {
  formatTimeRemainingUk,
  isProposalVotingOpenClient,
  PROPOSAL_MIN_VOTES_FOR_RESULT,
} from "@/lib/proposal-ui";
import { cn } from "@/lib/utils";
import "@/components/proposals/proposal-vote.css";

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

export function ProposalsListClient() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [list, setList] = useState<ProposalItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/proposals", { credentials: "include" });
      if (res.status === 401) {
        window.location.assign(
          `/auth-required?next=${encodeURIComponent("/proposals")}`,
        );
        return;
      }
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

  const openCount =
    list?.filter((p) => isProposalVotingOpenClient(p.status, p.ends_at))
      .length ?? 0;

  return (
    <main className={lcPageMainClass}>
      <div
        className={cn(
          "site-container relative z-10 mx-auto w-full max-w-3xl",
          "px-[max(0.75rem,env(safe-area-inset-left,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-6",
          "pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:px-4 sm:pb-12 sm:pt-10 md:py-14",
        )}
      >
        <SoftAppear>
          <header className="mb-8 border-b border-white/[0.08] pb-6 sm:mb-10 sm:pb-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div className="max-w-xl text-center sm:text-left">
                <h1 className="lc-hero-title lc-hero-display text-balance text-3xl text-[var(--mc-text)] sm:text-4xl">
                  Пропозиції
                </h1>
                <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
                  Від {PROPOSAL_MIN_VOTES_FOR_RESULT} голосів · за або проти
                </p>
                {list && list.length > 0 ? (
                  <p className="mt-2 text-sm tabular-nums text-[var(--mc-text)]">
                    {openCount} активних · {list.length} усього
                  </p>
                ) : null}
              </div>
              <Link
                href="/proposals/new"
                className="lc-focus-ring lc-btn-accent mx-auto inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 px-5 text-sm sm:mx-0 sm:w-auto sm:max-w-none"
              >
                <PlusCircle className="size-4 opacity-80" aria-hidden />
                Нова пропозиція
              </Link>
            </div>
          </header>
        </SoftAppear>

        {err === "discord_config" ? (
          <div
            className="mb-4 space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-left text-sm text-amber-100"
            role="alert"
          >
            <p className="font-bold text-amber-50">
              Discord OAuth не налаштовано на сервері
            </p>
            <p className="text-amber-100/95">
              У Vercel → Project → Settings → Environment Variables додай (для
              Production):
            </p>
            <ul className="list-inside list-disc space-y-1 text-amber-100/90">
              <li>
                <code className="rounded bg-black/30 px-1">DISCORD_CLIENT_ID</code>{" "}
                або{" "}
                <code className="rounded bg-black/30 px-1">
                  NEXT_PUBLIC_DISCORD_CLIENT_ID
                </code>
              </li>
              <li>
                <code className="rounded bg-black/30 px-1">
                  DISCORD_CLIENT_SECRET
                </code>
              </li>
              <li>
                <code className="rounded bg-black/30 px-1">
                  NEXT_PUBLIC_SITE_URL
                </code>
              </li>
            </ul>
          </div>
        ) : null}

        {err === "oauth" ? (
          <p
            className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-100"
            role="alert"
          >
            Сесія логіну не збіглась. Спробуй увійти знову з того ж домену.
          </p>
        ) : null}

        {err === "discord" ? (
          <p
            className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-100"
            role="alert"
          >
            Discord відхилив вхід. Перевір OAuth-налаштування на Vercel.
          </p>
        ) : null}

        {failed ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100">
            База даних недоступна. Перевір DATABASE_URL (Neon) та змінні
            середовища на Vercel.
          </p>
        ) : null}

        {list === null ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  lcGlassPanelClass,
                  "lc-skeleton-breathe h-36 !rounded-[var(--radius)]",
                )}
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <SoftAppear>
            <div
              className={cn(
                lcGlassPanelClass,
                "lc-interactive-panel-static py-12 text-center",
              )}
            >
              <p className="text-[var(--mc-text-muted)]">
                Пропозицій ще немає.
              </p>
              <Link
                href="/proposals/new"
                className="lc-focus-ring lc-btn-accent mt-4 inline-flex min-h-11 items-center gap-2 px-5 text-sm"
              >
                <PlusCircle className="size-4 opacity-80" aria-hidden />
                Створити першу
              </Link>
            </div>
          </SoftAppear>
        ) : (
          <ul className="lc-stagger grid gap-3 sm:gap-4">
            {list.map((p) => {
              const open = isProposalVotingOpenClient(p.status, p.ends_at);
              return (
                <li key={p.id}>
                  <article
                    className={cn(
                      lcGlassPanelClass,
                      "lc-interactive-panel-static lc-proposal-match-card group !rounded-[var(--radius)] !p-4 sm:!p-5",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 gap-y-2">
                      <h2 className="min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight text-[var(--mc-text)] [overflow-wrap:anywhere] sm:text-xl">
                        <Link
                          href={`/proposals/${p.id}`}
                          className="lc-focus-ring rounded-sm transition-colors hover:text-[var(--mc-net-green)]"
                        >
                          {p.title}
                        </Link>
                      </h2>
                      <ProposalStatusBadge status={p.status} votingOpen={open} />
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                      {p.description}
                    </p>

                    <p className="mt-2.5 text-sm text-[var(--mc-text)]">
                      {p.author_username}
                      <span className="mx-1.5 text-[var(--mc-text-muted)]">·</span>
                      <span className="tabular-nums text-[var(--mc-text-muted)]">
                        {formatTimeRemainingUk(p.ends_at)}
                      </span>
                    </p>

                    <div className="mt-3">
                      <ProposalVoteBar
                        yes={p.yes_votes}
                        no={p.no_votes}
                        compact
                        showQuorum={open}
                        votingOpen={open}
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/proposals/${p.id}`}
                        className="lc-focus-ring text-sm font-semibold text-[var(--mc-net-green)] hover:underline"
                      >
                        {open ? "Голосувати →" : "Результат →"}
                      </Link>
                    </div>
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
