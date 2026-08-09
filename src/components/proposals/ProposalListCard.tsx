"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { ProposalChoiceBar } from "@/components/proposals/ProposalChoiceBar";
import {
  PROPOSAL_KIND_CHOICE,
  type ProposalKind,
  type ProposalOptionPublic,
} from "@/lib/proposal-kinds";
import {
  formatProposalTimer,
  isProposalVotingOpenClient,
  proposalCardHeaderStatus,
  type ProposalCardHeaderTone,
} from "@/lib/proposal-ui";
import { cn } from "@/lib/utils";
import "./proposal-vote.css";

export type ProposalListCardData = {
  id: number;
  title: string;
  kind: ProposalKind;
  status: string;
  cancel_reason?: string | null;
  ends_at: string;
  author_username: string;
  yes_votes: number;
  no_votes: number;
  total_votes: number;
  options: ProposalOptionPublic[];
};

type Props = {
  proposal: ProposalListCardData;
};

/** Частка для flex-комірок: мін. ширина, щоб сторона з 0 не зникала. */
function voteFlexShare(votes: number, total: number): number {
  if (total <= 0) return 50;
  const pct = (votes / total) * 100;
  return Math.max(14, pct);
}

function toneClass(tone: ProposalCardHeaderTone): string {
  switch (tone) {
    case "live":
      return "lc-mc-timer--live";
    case "accepted":
      return "lc-mc-timer--accepted";
    case "rejected":
      return "lc-mc-timer--rejected";
    case "cancelled":
      return "lc-mc-timer--cancelled";
    case "quorum":
      return "lc-mc-timer--quorum";
    case "tie":
      return "lc-mc-timer--tie";
    default:
      return "lc-mc-timer--done";
  }
}

function barToneClass(tone: ProposalCardHeaderTone): string {
  switch (tone) {
    case "live":
      return "lc-mc-timer-bar--live";
    case "accepted":
      return "lc-mc-timer-bar--accepted";
    case "rejected":
      return "lc-mc-timer-bar--rejected";
    case "cancelled":
      return "lc-mc-timer-bar--cancelled";
    case "quorum":
      return "lc-mc-timer-bar--quorum";
    case "tie":
      return "lc-mc-timer-bar--tie";
    default:
      return "";
  }
}

function ProposalCardHeader({ proposal: p }: { proposal: ProposalListCardData }) {
  const open = isProposalVotingOpenClient(p.status, p.ends_at);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  void now;

  if (open) {
    const label = formatProposalTimer(p.ends_at);
    return (
      <div
        className={cn(
          "lc-mc-timer-bar lc-mc-timer-bar--live flex items-center justify-center border-b-2 border-black px-2.5 py-2 sm:px-3 sm:py-2.5",
        )}
      >
        <span
          className="lc-mc-timer lc-mc-timer--live"
          aria-label={`Залишилось ${label}`}
        >
          {label}
        </span>
      </div>
    );
  }

  const { label, tone } = proposalCardHeaderStatus({
    status: p.status,
    kind: p.kind,
    yes: p.yes_votes,
    no: p.no_votes,
    totalVotes: p.total_votes,
    cancelReason: p.cancel_reason,
    options: p.options,
  });

  return (
    <div
      className={cn(
        "lc-mc-timer-bar flex min-h-9 items-center justify-center border-b-2 border-black px-2.5 py-2 sm:min-h-10 sm:px-3 sm:py-2.5",
        barToneClass(tone),
      )}
    >
      <span
        className={cn(
          "lc-mc-timer max-w-full truncate text-center",
          toneClass(tone),
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function ProposalListCard({ proposal: p }: Props) {
  const open = isProposalVotingOpenClient(p.status, p.ends_at);
  const isChoice = p.kind === PROPOSAL_KIND_CHOICE;
  const cancelled = !open && p.status === "cancelled";
  const yes = p.yes_votes;
  const no = p.no_votes;
  const total = yes + no;
  const yesFlex = voteFlexShare(yes, total);
  const noFlex = voteFlexShare(no, total);

  return (
    <Link
      href={`/proposals/${p.id}`}
      className={cn(
        "lc-focus-ring lc-proposal-board group block overflow-hidden",
        open && "lc-proposal-board--live",
        cancelled && "lc-proposal-board--cancelled",
        !open && !cancelled && "lc-proposal-board--done",
      )}
    >
      <ProposalCardHeader proposal={p} />

      <div className="bg-[color-mix(in_srgb,var(--mc-surface)_92%,#000)] p-3 sm:p-4">
        <h2 className="text-center text-base font-black leading-snug tracking-tight text-[var(--mc-text)] transition-colors [overflow-wrap:anywhere] group-hover:text-[var(--mc-grass-bright)] sm:text-lg">
          {p.title}
        </h2>

        <p className="mt-1.5 flex min-w-0 items-center justify-center gap-1 text-[11px] font-semibold text-[var(--mc-text-muted)] sm:mt-2 sm:text-xs">
          <UserRound className="size-3 shrink-0 opacity-70 sm:size-3.5" aria-hidden />
          <span className="truncate text-[var(--mc-text)]/85">
            {p.author_username}
          </span>
        </p>

        <div className="mt-3 border-2 border-black bg-black/45 p-1.5 shadow-[inset_2px_2px_0_rgba(255,255,255,0.04)] sm:mt-3.5 sm:p-2.5">
          {isChoice ? (
            <ProposalChoiceBar options={p.options ?? []} compact />
          ) : (
            <div
              className="flex min-h-[2.75rem] gap-1 sm:min-h-[3.5rem] sm:gap-1.5"
              role="img"
              aria-label={`За ${yes}, проти ${no}`}
            >
              <div
                className="flex min-w-0 items-center justify-center border-2 border-[#1e6410] bg-[#143d10]/90 px-1.5 transition-[flex-grow] duration-500 ease-out sm:px-2"
                style={{ flex: `${yesFlex} 1 0%` }}
              >
                <span className="text-xl font-black tabular-nums leading-none text-[var(--mc-grass-bright)] sm:text-3xl">
                  {yes}
                </span>
              </div>
              <div
                className="flex min-w-0 items-center justify-center border-2 border-[#7f1d1d] bg-[#4a1515]/90 px-1.5 transition-[flex-grow] duration-500 ease-out sm:px-2"
                style={{ flex: `${noFlex} 1 0%` }}
              >
                <span className="text-xl font-black tabular-nums leading-none text-[#f87171] sm:text-3xl">
                  {no}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
