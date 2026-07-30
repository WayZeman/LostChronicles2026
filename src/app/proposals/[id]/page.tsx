"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge";
import { ProposalVoteBar } from "@/components/proposals/ProposalVoteBar";
import { ProposalVoteButtons } from "@/components/proposals/ProposalVoteButtons";
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
  is_author?: boolean;
};

type Me = { id: number } | null;

type ProposalComment = {
  id: number;
  user_id: number;
  body: string;
  created_at: string;
  author_username: string;
  avatarUrl: string;
};

function VerdictBanner({
  status,
  yes,
  no,
}: {
  status: string;
  yes: number;
  no: number;
}) {
  if (status === "cancelled") {
    return (
      <div
        className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-center"
        role="status"
      >
        <p className="text-sm font-semibold text-rose-100">
          Скасовано · менше {PROPOSAL_MIN_VOTES_FOR_RESULT} голосів
        </p>
      </div>
    );
  }

  if (status !== "closed") return null;

  const yesWins = yes > no;
  const noWins = no > yes;
  const none = yes === 0 && no === 0;

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-center",
        yesWins && "border-emerald-500/30 bg-emerald-500/10",
        noWins && "border-rose-500/30 bg-rose-500/10",
        !yesWins && !noWins && "border-white/10 bg-white/[0.04]",
      )}
      role="status"
    >
      <p
        className={cn(
          "text-sm font-semibold",
          yesWins && "text-emerald-100",
          noWins && "text-rose-100",
          !yesWins && !noWins && "text-[var(--mc-text)]",
        )}
      >
        {none
          ? "Без голосів"
          : yesWins
            ? `Прийнято · За ${yes} : ${no}`
            : noWins
              ? `Відхилено · За ${yes} : ${no}`
              : `Нічия · ${yes} : ${no}`}
      </p>
    </div>
  );
}

export default function ProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params.id;
  const id =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  const [closeBusy, setCloseBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<ProposalComment[] | null>(null);
  const [commentsFetchFailed, setCommentsFetchFailed] = useState(false);
  const [commentsFetchError, setCommentsFetchError] = useState<string | null>(
    null,
  );
  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

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
        status?: string;
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
              status: s.status ?? prev.status,
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

  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/proposals/${id}/comments`);
      if (!res.ok) {
        let hint: string | null = null;
        try {
          const j = (await res.json()) as { error?: string };
          if (typeof j.error === "string") hint = j.error;
        } catch {
          /* ignore */
        }
        setComments([]);
        setCommentsFetchFailed(true);
        setCommentsFetchError(hint);
        return;
      }
      const data = (await res.json()) as { comments: ProposalComment[] };
      setComments(data.comments ?? []);
      setCommentsFetchFailed(false);
      setCommentsFetchError(null);
    } catch {
      setComments([]);
      setCommentsFetchFailed(true);
      setCommentsFetchError(null);
    }
  }, [id]);

  useEffect(() => {
    if (!id || notFound) return;
    const t = requestAnimationFrame(() => {
      void loadComments();
    });
    return () => cancelAnimationFrame(t);
  }, [id, notFound, loadComments]);

  async function vote(v: 0 | 1) {
    if (!id || voteBusy || !proposal?.voting_open) return;
    if (!me) {
      const next = `/proposals/${id}`;
      window.location.assign(
        `/auth-required?next=${encodeURIComponent(next)}`,
      );
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

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!id || commentBusy || !me) return;
    const text = commentBody.trim();
    if (!text) return;
    setCommentBusy(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/proposals/${id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = (await res.json()) as {
        comment?: ProposalComment;
        error?: string;
      };
      if (!res.ok) {
        setCommentError(data.error || "Не вдалося надіслати коментар");
        setCommentBusy(false);
        return;
      }
      if (data.comment) {
        setComments((prev) => [...(prev ?? []), data.comment!]);
      }
      setCommentBody("");
    } catch {
      setCommentError("Мережа недоступна");
    }
    setCommentBusy(false);
  }

  async function closeVotingEarly() {
    if (!id || closeBusy || !proposal?.voting_open) return;
    if (
      !window.confirm(
        "Закрити голосування зараз? Після цього ніхто не зможе змінити голос.",
      )
    ) {
      return;
    }
    setCloseBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${id}/close`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error || "Не вдалося закрити голосування");
        setCloseBusy(false);
        return;
      }
      setProposal((prev) =>
        prev
          ? {
              ...prev,
              status: "closed",
              voting_open: false,
            }
          : prev,
      );
    } catch {
      setError("Мережа недоступна");
    }
    setCloseBusy(false);
  }

  async function deleteProposal() {
    if (!id || deleteBusy) return;
    if (
      !window.confirm(
        "Видалити пропозицію назавжди? Усі голоси буде втрачено.",
      )
    ) {
      return;
    }
    setDeleteBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Не вдалося видалити");
        setDeleteBusy(false);
        return;
      }
      router.push("/proposals");
    } catch {
      setError("Мережа недоступна");
      setDeleteBusy(false);
    }
  }

  if (!id || notFound) {
    return (
      <main className={lcPageMainClass}>
        <div className="site-container mx-auto max-w-2xl px-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] py-12 text-center">
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
        <div className="site-container mx-auto max-w-2xl px-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] py-12">
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
      <div
        className={cn(
          "site-container mx-auto w-full max-w-2xl",
          "px-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]",
          "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-4 sm:px-4 sm:pb-0 sm:pt-8 sm:py-12",
        )}
      >
        <div className="mb-4 flex justify-center sm:mb-6 sm:justify-start">
          <Link
            href="/proposals"
            className="lc-focus-ring inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-lg px-2 text-sm font-semibold text-[var(--mc-net-green)] hover:underline sm:min-w-0 sm:justify-start"
          >
            ← Усі пропозиції
          </Link>
        </div>

        <SoftAppear>
          <article
            className={cn(
              lcGlassPanelClass,
              "flex flex-col gap-5 !p-4 sm:!p-6 sm:gap-6 md:!p-8 md:gap-7",
            )}
          >
            <header className="flex flex-col gap-3 border-b border-white/[0.08] pb-5 sm:pb-6 md:flex-row md:items-start md:justify-between md:gap-4">
              <div className="min-w-0 flex-1 text-center md:text-left">
                <h1 className="lc-hero-title text-balance text-2xl font-bold leading-snug tracking-tight text-[var(--mc-text)] min-[400px]:text-[1.75rem] md:text-3xl">
                  {proposal.title}
                </h1>
              </div>
              <ProposalStatusBadge
                status={proposal.status}
                votingOpen={open}
                className="mx-auto md:mx-0 md:mt-1.5"
              />
            </header>

            <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
              <p className="text-center text-sm text-[var(--mc-text)] sm:text-left">
                {proposal.author_username}
              </p>
              <p className="text-sm tabular-nums text-[var(--mc-text-muted)]">
                {open ? formatTimeRemainingUk(proposal.ends_at) : "завершено"}
              </p>
            </div>

            <p className="hyphens-auto whitespace-pre-wrap break-words text-left text-base leading-relaxed text-[var(--mc-text)] [overflow-wrap:anywhere]">
              {proposal.description}
            </p>

            {!open ? (
              <VerdictBanner
                status={proposal.status}
                yes={proposal.yes_votes}
                no={proposal.no_votes}
              />
            ) : null}

            <section
              aria-label="Голосування"
              className="lc-vote-match-stage space-y-3 p-3 sm:space-y-4 sm:p-4"
            >
              <ProposalVoteBar
                yes={proposal.yes_votes}
                no={proposal.no_votes}
                showQuorum={open}
                votingOpen={open}
              />

              {error ? (
                <p className="text-center text-sm text-rose-300" role="alert">
                  {error}
                </p>
              ) : null}

              {open ? (
                <ProposalVoteButtons
                  open={open}
                  busy={voteBusy}
                  userVote={proposal.user_vote}
                  onVote={(v) => void vote(v)}
                />
              ) : null}

              {!me && open ? (
                <p className="text-center text-xs text-[var(--mc-text-muted)]">
                  Щоб проголосувати,{" "}
                  <a
                    href={`/auth-required?next=${encodeURIComponent(`/proposals/${id}`)}`}
                    className="font-bold text-[var(--mc-net-green)] underline-offset-2 hover:underline"
                  >
                    увійди
                  </a>
                </p>
              ) : null}
            </section>

            {proposal.is_author ? (
              <div className="rounded-[var(--radius)] border border-amber-500/35 bg-amber-500/10 p-3 sm:p-4 md:p-5">
                <p className="mb-2.5 text-center text-xs font-semibold text-amber-100 sm:mb-3">
                  Ти автор
                </p>
                <div
                  className={cn(
                    "grid gap-2 sm:gap-3",
                    open
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "mx-auto max-w-sm grid-cols-1",
                  )}
                >
                  {open ? (
                    <button
                      type="button"
                      disabled={closeBusy || deleteBusy}
                      onClick={() => void closeVotingEarly()}
                      className="lc-focus-ring flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg border-2 border-amber-500/60 bg-amber-500/15 px-2 py-2.5 text-center text-[13px] font-bold leading-tight text-amber-100 transition-colors active:scale-[0.99] hover:bg-amber-500/25 disabled:opacity-50 sm:min-h-[3rem] sm:px-3 sm:text-sm sm:leading-snug"
                    >
                      {closeBusy
                        ? "…"
                        : "Закрити зараз"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={deleteBusy || closeBusy}
                    onClick={() => void deleteProposal()}
                    className="lc-focus-ring flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg border-2 border-rose-500/55 bg-rose-500/15 px-3 py-2.5 text-sm font-bold text-rose-100 transition-colors active:scale-[0.99] hover:bg-rose-500/25 disabled:opacity-50 sm:min-h-[3rem]"
                  >
                    {deleteBusy ? "…" : "Видалити"}
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        </SoftAppear>

        <SoftAppear className="mt-4 sm:mt-6">
        <section
          className={cn(
            lcGlassPanelClass,
            "flex flex-col gap-4 !p-4 sm:!p-6 sm:gap-5 md:!p-8",
          )}
          aria-labelledby="proposal-comments-heading"
        >
          <h2
            id="proposal-comments-heading"
            className="text-center text-base font-extrabold text-[var(--mc-text)] sm:text-left sm:text-lg"
          >
            Коментарі
          </h2>

          {me ? (
            <form
              onSubmit={(e) => void submitComment(e)}
              className="flex flex-col gap-2"
            >
              <label htmlFor="proposal-comment" className="sr-only">
                Текст коментаря
              </label>
              <textarea
                id="proposal-comment"
                name="comment"
                rows={3}
                maxLength={2000}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Напиши коментар…"
                className="lc-focus-ring mc-input min-h-[5.5rem] w-full resize-y px-3 py-3 text-base sm:min-h-0 sm:py-2.5 sm:text-sm"
              />
              {commentError ? (
                <p className="text-sm text-rose-300" role="alert">
                  {commentError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={commentBusy || !commentBody.trim()}
                className="lc-focus-ring lc-btn-accent min-h-12 w-full touch-manipulation py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:w-auto sm:self-end sm:px-8"
              >
                {commentBusy ? "Надсилання…" : "Надіслати коментар"}
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-[var(--mc-text-muted)] sm:text-left">
              Щоб залишати коментарі,{" "}
              <a
                href={`/auth-required?next=${encodeURIComponent(`/proposals/${id}`)}`}
                className="inline-flex min-h-11 items-center font-bold text-[var(--mc-net-green)] underline-offset-2 hover:underline"
              >
                увійди через Discord
              </a>
              .
            </p>
          )}

          {comments === null ? (
            <div className="space-y-3">
              {[1, 2].map((k) => (
                <div
                  key={k}
                  className="flex gap-3 rounded-lg border border-white/[0.06] bg-black/20 p-3"
                >
                  <div className="size-10 shrink-0 animate-pulse rounded-full bg-[var(--mc-surface)]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-[var(--mc-surface)]" />
                    <div className="h-10 animate-pulse rounded bg-[var(--mc-surface)]/80" />
                  </div>
                </div>
              ))}
            </div>
          ) : commentsFetchFailed ? (
            <p
              className="text-center text-sm leading-relaxed text-rose-300/90 sm:text-left"
              role="alert"
            >
              {commentsFetchError ?? (
                <>
                  Не вдалося завантажити коментарі. Спробуй оновити сторінку.
                </>
              )}
            </p>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-[var(--mc-text-subtle)] sm:text-left">
              Поки немає коментарів — будь першим.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="flex gap-2.5 rounded-lg border border-white/[0.06] bg-black/20 p-2.5 sm:gap-3 sm:p-4"
                >
                  <Image
                    src={c.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="size-9 shrink-0 rounded-full border border-[var(--mc-border)] sm:size-10"
                    unoptimized={c.avatarUrl.endsWith(".gif")}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-bold text-[var(--mc-text)]">
                        {c.author_username}
                      </span>
                      <time
                        dateTime={c.created_at}
                        className="text-xs text-[var(--mc-text-subtle)]"
                      >
                        {new Date(c.created_at).toLocaleString("uk-UA", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--mc-text-muted)]">
                      {c.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        </SoftAppear>
      </div>
    </main>
  );
}
