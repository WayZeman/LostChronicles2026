"use client";

import "./proposal-vote.css";
import { PROPOSAL_MIN_VOTES_FOR_RESULT } from "@/lib/proposal-ui";
import { cn } from "@/lib/utils";

type Props = {
  yes: number;
  no: number;
  compact?: boolean;
  showQuorum?: boolean;
  votingOpen?: boolean;
  className?: string;
};

export function ProposalVoteBar({
  yes,
  no,
  compact = false,
  showQuorum = false,
  votingOpen = false,
  className,
}: Props) {
  const total = yes + no;
  const yesPct = total === 0 ? 50 : Math.round((yes / total) * 100);
  const noPct = total === 0 ? 50 : 100 - yesPct;
  const lead = yes === no ? "draw" : yes > no ? "yes" : ("no" as const);
  const quorumPct = Math.min(
    100,
    Math.round((total / PROPOSAL_MIN_VOTES_FOR_RESULT) * 100),
  );
  const quorumMet = total >= PROPOSAL_MIN_VOTES_FOR_RESULT;
  const need = Math.max(0, PROPOSAL_MIN_VOTES_FOR_RESULT - total);

  return (
    <div
      className={cn(
        "lc-vote-panel",
        compact ? "p-3" : "p-3.5 sm:p-4",
        className,
      )}
    >
      <div className="space-y-2.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="text-left">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--mc-grass-bright)]">
              За
            </p>
            <p
              className={cn(
                "mt-0.5 font-bold tabular-nums leading-none text-[var(--mc-text)]",
                compact ? "text-2xl" : "text-[1.75rem] sm:text-3xl",
              )}
            >
              {yes}
            </p>
          </div>

          <p className="pb-1 text-xs font-semibold text-[var(--mc-text-muted)]">
            {total === 0 ? "—" : `${yesPct}:${noPct}`}
          </p>

          <div className="text-right">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#f87171]">
              Проти
            </p>
            <p
              className={cn(
                "mt-0.5 font-bold tabular-nums leading-none text-[var(--mc-text)]",
                compact ? "text-2xl" : "text-[1.75rem] sm:text-3xl",
              )}
            >
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

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-[var(--mc-text-muted)]">
          {showQuorum ? (
            <span
              className={cn(
                "tabular-nums font-medium",
                quorumMet ? "text-emerald-300" : "text-[var(--mc-text)]",
              )}
            >
              {total}/{PROPOSAL_MIN_VOTES_FOR_RESULT}
              {!quorumMet && need > 0 ? (
                <span className="ml-1.5 font-normal text-[var(--mc-text-muted)]">
                  (−{need})
                </span>
              ) : null}
            </span>
          ) : (
            <span className="tabular-nums">{total} голосів</span>
          )}

          {votingOpen && lead === "yes" && total > 0 ? (
            <span className="font-bold text-[var(--mc-grass-bright)]">
              Лідирує за
            </span>
          ) : null}
          {votingOpen && lead === "no" && total > 0 ? (
            <span className="font-bold text-[#f87171]">Лідирує проти</span>
          ) : null}
          {votingOpen && lead === "draw" && total > 0 ? (
            <span className="font-bold text-[var(--mc-text)]">Нічия</span>
          ) : null}
          {!votingOpen ? (
            <span className="text-[var(--mc-text-muted)]">Фініш</span>
          ) : null}
        </div>

        {showQuorum ? (
          <div className="h-1.5 overflow-hidden rounded-[2px] bg-black/50">
            <div
              className={cn(
                "h-full rounded-[2px] transition-[width] duration-500",
                quorumMet
                  ? "bg-[var(--mc-grass-bright)]"
                  : "bg-[var(--mc-net-green)]",
              )}
              style={{ width: `${quorumPct}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
