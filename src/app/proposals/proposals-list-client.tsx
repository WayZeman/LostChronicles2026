"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Clock3, PlusCircle, Swords, Users } from "lucide-react";
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
          "site-container relative z-10 mx-auto w-full max-w-4xl",
          "px-[max(0.75rem,env(safe-area-inset-left,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-6",
          "pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:px-4 sm:pb-12 sm:pt-8 md:py-12",
        )}
      >
        <SoftAppear>
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div className="text-center sm:text-left">
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mc-net-green)]">
                  <Swords className="size-3" aria-hidden />
                  Арена рішень
                </p>
                <h1 className="text-balance text-2xl font-extrabold text-[var(--mc-text)] min-[400px]:text-3xl sm:text-4xl">
                  Пропозиції та голосування
                </h1>
                <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-[var(--mc-text-muted)] sm:text-base">
                  Пропонуй ідеї для сервера, збирай голоси спільноти. Для
                  валідного рішення потрібно щонайменше{" "}
                  {PROPOSAL_MIN_VOTES_FOR_RESULT} учасників.
                </p>
              </div>
              <Link
                href="/proposals/new"
                className="lc-focus-ring lc-btn-accent mx-auto inline-flex min-h-12 w-full max-w-xs touch-manipulation items-center justify-center gap-2 self-center rounded-xl border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-5 py-3 text-sm font-bold text-[var(--mc-green-ink)] sm:mx-0 sm:w-auto sm:max-w-none sm:self-auto"
              >
                <PlusCircle className="size-4" aria-hidden />
                Нова пропозиція
              </Link>
            </div>

            {list && list.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
                <div
                  className={cn(
                    lcGlassPanelClass,
                    "lc-interactive-panel-static !rounded-xl !p-3 sm:!px-4",
                  )}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--mc-text-subtle)]">
                    Усього
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold tabular-nums text-[var(--mc-text)]">
                    {list.length}
                  </p>
                </div>
                <div
                  className={cn(
                    lcGlassPanelClass,
                    "lc-interactive-panel-static !rounded-xl !p-3 sm:!px-4",
                  )}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-300/80">
                    Активні
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold tabular-nums text-emerald-200">
                    {openCount}
                  </p>
                </div>
              </div>
            ) : null}
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
                  "lc-skeleton-breathe h-40 !rounded-2xl",
                )}
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <SoftAppear>
            <div
              className={cn(
                lcGlassPanelClass,
                "flex flex-col items-center gap-3 py-10 text-center",
              )}
            >
              <Swords
                className="size-10 text-[var(--mc-net-green)] opacity-80"
                aria-hidden
              />
              <p className="max-w-sm text-[var(--mc-text-muted)]">
                Ще немає пропозицій. Відкрий перше голосування — спільнота
                вирішить долю ідеї.
              </p>
              <Link
                href="/proposals/new"
                className="lc-focus-ring lc-btn-accent mt-1 inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-5 text-sm font-bold text-[var(--mc-green-ink)]"
              >
                <PlusCircle className="size-4" aria-hidden />
                Створити першу
              </Link>
            </div>
          </SoftAppear>
        ) : (
          <ul className="lc-stagger grid gap-3 sm:gap-4 md:gap-5">
            {list.map((p) => {
              const open = isProposalVotingOpenClient(p.status, p.ends_at);
              return (
                <li key={p.id}>
                  <article
                    className={cn(
                      lcGlassPanelClass,
                      "lc-proposal-card !p-3.5 sm:!p-5",
                      "flex flex-col gap-3 border-[var(--mc-border-card)]",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 gap-y-2">
                      <h2 className="min-w-0 flex-1 text-base font-bold leading-snug text-[var(--mc-text)] [overflow-wrap:anywhere] sm:text-lg md:text-xl">
                        {p.title}
                      </h2>
                      <ProposalStatusBadge status={p.status} votingOpen={open} />
                    </div>

                    <p className="line-clamp-2 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                      {p.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[var(--mc-text-subtle)] sm:text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5 opacity-70" aria-hidden />
                        <span className="font-semibold text-[var(--mc-text)]">
                          {p.author_username}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5 opacity-70" aria-hidden />
                        {formatTimeRemainingUk(p.ends_at)}
                      </span>
                    </div>

                    <ProposalVoteBar
                      yes={p.yes_votes}
                      no={p.no_votes}
                      compact
                      showQuorum={open}
                    />

                    <Link
                      href={`/proposals/${p.id}`}
                      className="lc-focus-ring mt-0.5 inline-flex min-h-12 w-full touch-manipulation items-center justify-center rounded-xl border border-white/12 bg-[color-mix(in_srgb,var(--mc-surface)_55%,transparent)] py-2.5 text-sm font-bold text-[var(--mc-net-green)] transition-colors hover:border-[var(--mc-net-green)]/40 hover:bg-[var(--mc-nav-link-hover-bg)] sm:mt-1 sm:min-h-10 sm:w-auto sm:self-start sm:px-6"
                    >
                      {open ? "Увійти в голосування" : "Переглянути результат"}
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
