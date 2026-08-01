"use client";

import "./proposal-vote.css";
import { PROPOSAL_MIN_VOTES_FOR_RESULT } from "@/lib/proposal-ui";
import { cn } from "@/lib/utils";

type Props = {
  yes: number;
  no: number;
  compact?: boolean;
  showQuorum?: boolean;
  className?: string;
};

export function ProposalVoteBar({
  yes,
  no,
  compact = false,
  showQuorum = false,
  className,
}: Props) {
  const total = yes + no;
  const yesPct = total === 0 ? 50 : Math.round((yes / total) * 100);
  const noPct = total === 0 ? 50 : 100 - yesPct;
  const quorumMet = total >= PROPOSAL_MIN_VOTES_FOR_RESULT;
  const need = Math.max(0, PROPOSAL_MIN_VOTES_FOR_RESULT - total);

  if (compact) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-3 text-xs font-semibold tabular-nums">
          <span className="text-[var(--mc-grass-bright)]">
            За <span className="text-[var(--mc-text)]">{yes}</span>
          </span>
          <span className="text-[#f87171]">
            <span className="text-[var(--mc-text)]">{no}</span> Проти
          </span>
        </div>
        <div
          className="lc-vote-tug flex w-full !h-1.5"
          role="img"
          aria-label={`За ${yes}, проти ${no}`}
        >
          <div className="lc-vote-tug-yes" style={{ width: `${yesPct}%` }} />
          <div className="lc-vote-tug-no" style={{ width: `${noPct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("lc-vote-panel p-3.5 sm:p-4", className)}>
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 items-end gap-2">
          <div className="text-left">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--mc-grass-bright)]">
              За
            </p>
            <p className="mt-0.5 text-[1.75rem] font-bold tabular-nums leading-none text-[var(--mc-text)] sm:text-3xl">
              {yes}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#f87171]">
              Проти
            </p>
            <p className="mt-0.5 text-[1.75rem] font-bold tabular-nums leading-none text-[var(--mc-text)] sm:text-3xl">
              {no}
            </p>
          </div>
        </div>

        <div
          className="lc-vote-tug flex w-full"
          role="img"
          aria-label={`За ${yes}, проти ${no}`}
        >
          <div className="lc-vote-tug-yes" style={{ width: `${yesPct}%` }} />
          <div className="lc-vote-tug-no" style={{ width: `${noPct}%` }} />
        </div>

        {showQuorum ? (
          <p
            className={cn(
              "text-xs tabular-nums font-medium",
              quorumMet ? "text-emerald-300" : "text-[var(--mc-text)]",
            )}
          >
            {total}/{PROPOSAL_MIN_VOTES_FOR_RESULT}
            {!quorumMet && need > 0 ? (
              <span className="ml-1.5 font-normal text-[var(--mc-text-muted)]">
                (−{need})
              </span>
            ) : null}
          </p>
        ) : (
          <p className="text-xs tabular-nums text-[var(--mc-text-muted)]">
            {total} голосів
          </p>
        )}
      </div>
    </div>
  );
}
