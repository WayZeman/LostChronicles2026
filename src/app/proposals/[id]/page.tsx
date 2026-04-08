"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import {
  formatTimeRemainingUk,
  isProposalVotingOpenClient,
} from "@/lib/proposal-ui";
import { cn } from "@/lib/utils";

type ProposalDetail = {
  id: number;
  title: string;
  description: string;
  status: string;
  ends_at: string;
  author_username: string;
  yes_votes: number;
  no_votes: number;
  user_vote: number | null;
  voting_open: boolean;
};

type Me = { id: number } | null;

function VoteBar({ yes, no }: { yes: number; no: number }) {
  const total = yes + no;
  const yesPct = total === 0 ? 50 : Math.round((yes / total) * 100);
  return (
    <div className="mt-4 space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--mc-deep)] ring-1 ring-[var(--mc-border)]">
        <div
          className="h-full bg-emerald-500/90 transition-[width] duration-500"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="h-full bg-rose-500/85 transition-[width] duration-500"
          style={{ width: `${100 - yesPct}%` }}
        />
      </div>
      <p className="text-sm font-bold text-[var(--mc-text)]">
        👍 {yes} · 👎 {no}
      </p>
    </div>
  );
}

export default function ProposalDetailPage() {
  const params = useParams();
  const rawId = params.id;
  const id =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProposal = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        credentials: "include",
      });
      if (res.status === 404) {
        setNotFound(true);
        setProposal(null);
        return;
      }
      if (!res.ok) {
        setProposal(null);
        return;
      }
      const data = (await res.json()) as { proposal: ProposalDetail };
      setProposal(data.proposal);
      setNotFound(false);
    } catch {
      setProposal(null);
    }
  }, [id]);

  const pollStats = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/proposals/${id}/stats`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const s = (await res.json()) as {
        yes_votes: number;
        no_votes: number;
        user_vote: number | null;
        voting_open: boolean;
        ends_at: string;
      };
      setProposal((prev) =>
        prev
          ? {
              ...prev,
              yes_votes: s.yes_votes,
              no_votes: s.no_votes,
              user_vote: s.user_vote,
              voting_open: s.voting_open,
              ends_at: s.ends_at,
            }
          : prev,
      );
    } catch {
      /* ignore */
    }
  }, [id]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadProposal();
    });
    return () => cancelAnimationFrame(id);
  }, [loadProposal]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void (async () => {
        try {
          const res = await fetch("/api/auth/me", { credentials: "include" });
          const data = (await res.json()) as { user: { id: number } | null };
          setMe(data.user);
        } catch {
          setMe(null);
        }
      })();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!id || notFound) return;
    const t = setInterval(() => void pollStats(), 4000);
    return () => clearInterval(t);
  }, [id, notFound, pollStats]);

  async function vote(v: 0 | 1) {
    if (!id || voteBusy || !proposal?.voting_open) return;
    if (!me) {
      setError("Увійди через Discord, щоб голосувати.");
      return;
    }
    setVoteBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${id}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: v }),
      });
      const data = (await res.json()) as {
        yes_votes?: number;
        no_votes?: number;
        user_vote?: number | null;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Не вдалося проголосувати");
        setVoteBusy(false);
        return;
      }
      setProposal((prev) =>
        prev
          ? {
              ...prev,
              yes_votes: data.yes_votes ?? prev.yes_votes,
              no_votes: data.no_votes ?? prev.no_votes,
              user_vote:
                data.user_vote !== undefined ? data.user_vote : prev.user_vote,
            }
          : prev,
      );
    } catch {
      setError("Мережа недоступна");
    }
    setVoteBusy(false);
  }

  if (!id || notFound) {
    return (
      <main className={lcPageMainClass}>
        <div className="site-container mx-auto max-w-2xl px-4 py-12 text-center">
          <p className="text-[var(--mc-text-muted)]">Пропозицію не знайдено.</p>
          <Link
            href="/proposals"
            className="mt-4 inline-block font-bold text-[var(--mc-net-green)] hover:underline"
          >
            ← До списку
          </Link>
        </div>
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className={lcPageMainClass}>
        <div className="site-container mx-auto max-w-2xl px-4 py-12">
          <div className={cn(lcGlassPanelClass, "h-56 animate-pulse")} />
        </div>
      </main>
    );
  }

  const open =
    proposal.voting_open &&
    isProposalVotingOpenClient(proposal.status, proposal.ends_at);

  return (
    <main className={lcPageMainClass}>
      <div className="site-container mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        <Link
          href="/proposals"
          className="mb-4 inline-block text-sm font-semibold text-[var(--mc-net-green)] hover:underline"
        >
          ← Усі пропозиції
        </Link>
        <article className={cn(lcGlassPanelClass, "space-y-4")}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-balance text-2xl font-extrabold text-[var(--mc-text)] sm:text-3xl">
              {proposal.title}
            </h1>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                open
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-[var(--mc-surface-elevated)] text-[var(--mc-text-subtle)]",
              )}
            >
              {open ? "активна" : "закрита"}
            </span>
          </div>
          <p className="text-sm text-[var(--mc-text-muted)]">
            Автор:{" "}
            <span className="font-semibold text-[var(--mc-text)]">
              {proposal.author_username}
            </span>
            {" · "}
            {formatTimeRemainingUk(proposal.ends_at)}
          </p>
          <div className="prose prose-invert prose-sm max-w-none text-[var(--mc-text)] prose-p:leading-relaxed">
            <p className="whitespace-pre-wrap">{proposal.description}</p>
          </div>
          <VoteBar yes={proposal.yes_votes} no={proposal.no_votes} />
          {error ? (
            <p className="text-sm text-rose-300" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              disabled={!open || voteBusy}
              onClick={() => void vote(1)}
              className={cn(
                "lc-focus-ring min-h-12 flex-1 rounded-md border-2 py-3 text-sm font-bold transition-colors",
                proposal.user_vote === 1
                  ? "border-emerald-400 bg-emerald-500/25 text-emerald-100"
                  : "border-emerald-500/50 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20",
                (!open || voteBusy) && "cursor-not-allowed opacity-50",
              )}
            >
              👍 Vote Yes
            </button>
            <button
              type="button"
              disabled={!open || voteBusy}
              onClick={() => void vote(0)}
              className={cn(
                "lc-focus-ring min-h-12 flex-1 rounded-md border-2 py-3 text-sm font-bold transition-colors",
                proposal.user_vote === 0
                  ? "border-rose-400 bg-rose-500/25 text-rose-100"
                  : "border-rose-500/50 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20",
                (!open || voteBusy) && "cursor-not-allowed opacity-50",
              )}
            >
              👎 Vote No
            </button>
          </div>
          {!me && open ? (
            <p className="text-center text-xs text-[var(--mc-text-muted)]">
              Увійди через Discord (кнопка зверху справа), щоб голосувати.
            </p>
          ) : null}
        </article>
      </div>
    </main>
  );
}
