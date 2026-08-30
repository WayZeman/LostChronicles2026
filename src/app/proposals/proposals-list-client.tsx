"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import {
  ProposalListCard,
  type ProposalListCardData,
} from "@/components/proposals/ProposalListCard";
import { SoftAppear } from "@/components/site/SoftAppear";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import {
  isProposalVotingOpenClient,
  PROPOSAL_MIN_VOTES_FOR_RESULT,
} from "@/lib/proposal-ui";
import { cn } from "@/lib/utils";
import "@/components/proposals/proposal-vote.css";

type TabId = "active" | "done";

export function ProposalsListClient() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [list, setList] = useState<ProposalListCardData[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<TabId>("active");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/proposals", { credentials: "include" });
      if (!res.ok) {
        setFailed(true);
        setList([]);
        return;
      }
      const data = (await res.json()) as { proposals: ProposalListCardData[] };
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

  const { active, done } = useMemo(() => {
    const all = list ?? [];
    const activeList: ProposalListCardData[] = [];
    const doneList: ProposalListCardData[] = [];
    for (const p of all) {
      if (isProposalVotingOpenClient(p.status, p.ends_at)) activeList.push(p);
      else doneList.push(p);
    }
    return { active: activeList, done: doneList };
  }, [list]);

  const visible = tab === "active" ? active : done;

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerClass}>
        <SoftAppear>
          <header className="relative mb-4 sm:mb-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div className="min-w-0 text-center sm:text-left">
                <h1 className="lc-hero-title text-balance text-[1.75rem] font-black leading-tight tracking-tight text-[var(--mc-text)] sm:text-4xl">
                  Пропозиції
                </h1>
                <p className="mt-1 text-xs text-[var(--mc-text-muted)] sm:mt-1.5 sm:text-sm">
                  Від {PROPOSAL_MIN_VOTES_FOR_RESULT} голосів для результату
                </p>
              </div>
              <Link
                href="/proposals/new"
                className="lc-focus-ring lc-btn-accent inline-flex min-h-11 w-full items-center justify-center gap-2 px-5 text-sm font-bold touch-manipulation sm:mx-0 sm:w-auto"
              >
                <PlusCircle className="size-4 opacity-90" aria-hidden />
                Створити
              </Link>
            </div>

            <div
              className="mt-3 grid grid-cols-2 border-2 border-black bg-black/35 sm:mt-4"
              role="tablist"
              aria-label="Фільтр голосувань"
            >
              {(
                [
                  {
                    id: "active" as const,
                    label: "Активні",
                    count: active.length,
                  },
                  {
                    id: "done" as const,
                    label: "Завершені",
                    count: done.length,
                  },
                ] as const
              ).map((t) => {
                const selected = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "lc-focus-ring min-h-11 touch-manipulation px-2 text-sm font-bold transition-colors sm:min-h-10 sm:px-3",
                      t.id === "done" && "border-l-2 border-black",
                      selected
                        ? "bg-[var(--mc-net-green)] text-black"
                        : "text-[var(--mc-text-muted)] hover:bg-white/[0.04] hover:text-[var(--mc-text)]",
                    )}
                  >
                    {t.label}
                    {list ? (
                      <span
                        className={cn(
                          "ml-1 tabular-nums sm:ml-1.5",
                          selected ? "text-black/70" : "opacity-70",
                        )}
                      >
                        {t.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </header>
        </SoftAppear>

        {err === "discord_config" ? (
          <div
            className="mb-4 space-y-2 border-2 border-amber-500/50 bg-amber-500/10 px-3 py-3 text-left text-sm text-amber-100"
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
                <code className="bg-black/30 px-1">DISCORD_CLIENT_ID</code> або{" "}
                <code className="bg-black/30 px-1">
                  NEXT_PUBLIC_DISCORD_CLIENT_ID
                </code>
              </li>
              <li>
                <code className="bg-black/30 px-1">DISCORD_CLIENT_SECRET</code>
              </li>
              <li>
                <code className="bg-black/30 px-1">NEXT_PUBLIC_SITE_URL</code>
              </li>
            </ul>
          </div>
        ) : null}

        {err === "oauth" ? (
          <p
            className="mb-4 border-2 border-amber-500/50 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-100"
            role="alert"
          >
            Сесія логіну не збіглась. Спробуй увійти знову з того ж домену.
          </p>
        ) : null}

        {err === "discord" ? (
          <p
            className="mb-4 border-2 border-amber-500/50 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-100"
            role="alert"
          >
            Discord відхилив вхід. Перевір OAuth-налаштування на Vercel.
          </p>
        ) : null}

        {failed ? (
          <p className="border-2 border-rose-500/40 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100">
            База даних недоступна. Перевір DATABASE_URL (Neon) та змінні
            середовища на Vercel.
          </p>
        ) : null}

        {list === null ? (
          <div className="grid gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="lc-skeleton-breathe h-36 border-2 border-black bg-black/30 shadow-[3px_3px_0_rgba(0,0,0,0.4)] sm:h-44 sm:shadow-[4px_4px_0_rgba(0,0,0,0.4)]"
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <SoftAppear>
            <div className="border-2 border-black bg-black/30 px-3 py-12 text-center shadow-[3px_3px_0_rgba(0,0,0,0.4)] sm:py-14 sm:shadow-[4px_4px_0_rgba(0,0,0,0.4)]">
              <p className="text-sm text-[var(--mc-text-muted)]">
                Голосувань ще немає.
              </p>
              <Link
                href="/proposals/new"
                className="lc-focus-ring lc-btn-accent mt-4 inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 px-5 text-sm font-bold touch-manipulation"
              >
                <PlusCircle className="size-4 opacity-90" aria-hidden />
                Створити перше
              </Link>
            </div>
          </SoftAppear>
        ) : visible.length === 0 ? (
          <SoftAppear>
            <div className="border-2 border-black bg-black/30 px-3 py-10 text-center shadow-[3px_3px_0_rgba(0,0,0,0.4)] sm:py-12 sm:shadow-[4px_4px_0_rgba(0,0,0,0.4)]">
              <p className="text-sm text-[var(--mc-text-muted)]">
                {tab === "active"
                  ? "Немає активних голосувань."
                  : "Ще немає завершених голосувань."}
              </p>
            </div>
          </SoftAppear>
        ) : (
          <ul className="lc-stagger grid gap-3 sm:gap-4">
            {visible.map((p) => (
              <li key={p.id} className="relative min-w-0">
                <ProposalListCard proposal={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
