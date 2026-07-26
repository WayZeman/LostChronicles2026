"use client";

import { PROPOSAL_MIN_VOTES_FOR_RESULT } from "@/lib/proposal-ui";
import { cn } from "@/lib/utils";

type Props = {
  yes: number;
  no: number;
  /** Компактний вигляд для карток у списку */
  compact?: boolean;
  /** Показати прогрес до кворуму (лише для відкритих) */
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
  const quorumPct = Math.min(
    100,
    Math.round((total / PROPOSAL_MIN_VOTES_FOR_RESULT) * 100),
  );
  const quorumMet = total >= PROPOSAL_MIN_VOTES_FOR_RESULT;

  return (
    <div
      className={cn(
        "w-full",
        compact ? "space-y-1.5" : "mx-auto max-w-xl space-y-3",
        className,
      )}
    >
      <div
        className={cn(
          "lc-vote-bar-track flex w-full overflow-hidden rounded-full bg-[var(--mc-deep)] ring-1 ring-[var(--mc-border)]",
          compact ? "h-2.5" : "h-3.5 sm:h-4",
        )}
        role="img"
        aria-label={`Так ${yes} (${yesPct}%), ні ${no} (${noPct}%)`}
      >
        <div
          className="lc-vote-bar-segment h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="lc-vote-bar-segment h-full bg-gradient-to-r from-rose-500 to-rose-400"
          style={{ width: `${noPct}%` }}
        />
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3 font-bold tabular-nums",
          compact
            ? "text-[11px] text-[var(--mc-text-muted)] sm:text-xs"
            : "text-sm text-[var(--mc-text)]",
        )}
      >
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <span aria-hidden>👍</span>
          <span>
            {yes}
            {!compact ? (
              <span className="ml-1 font-semibold text-emerald-200/70">
                {yesPct}%
              </span>
            ) : null}
          </span>
        </span>
        <span className="text-[var(--mc-text-subtle)]">
          {total === 0 ? "Ще немає голосів" : `${total} голос${ukVotesSuffix(total)}`}
        </span>
        <span className="inline-flex items-center gap-1.5 text-rose-300">
          <span>
            {no}
            {!compact ? (
              <span className="ml-1 font-semibold text-rose-200/70">
                {noPct}%
              </span>
            ) : null}
          </span>
          <span aria-hidden>👎</span>
        </span>
      </div>

      {showQuorum ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[var(--mc-text-muted)]">
            <span>Кворум для рішення</span>
            <span
              className={cn(
                "tabular-nums",
                quorumMet ? "text-emerald-300" : "text-amber-200/90",
              )}
            >
              {total}/{PROPOSAL_MIN_VOTES_FOR_RESULT}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/[0.06]">
            <div
              className={cn(
                "lc-vote-quorum-fill h-full rounded-full",
                quorumMet
                  ? "bg-emerald-400/90"
                  : "bg-gradient-to-r from-amber-500/80 to-amber-300/90",
              )}
              style={{ width: `${quorumPct}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ukVotesSuffix(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "и";
  return "ів";
}
