"use client";

import "./proposal-vote.css";
import { PROPOSAL_MIN_VOTES_FOR_RESULT } from "@/lib/proposal-ui";
import type { ProposalOptionPublic } from "@/lib/proposal-kinds";
import { cn } from "@/lib/utils";

type Props = {
  options: ProposalOptionPublic[];
  compact?: boolean;
  showQuorum?: boolean;
  votingOpen?: boolean;
  className?: string;
};

export function ProposalChoiceBar({
  options,
  compact = false,
  showQuorum = false,
  votingOpen = false,
  className,
}: Props) {
  const total = options.reduce((s, o) => s + o.votes, 0);
  const max = options.length ? Math.max(0, ...options.map((o) => o.votes)) : 0;
  const leaders = options.filter((o) => o.votes === max && max > 0);
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
        <ul className="space-y-2">
          {options.map((o) => {
            const pct = total === 0 ? 0 : Math.round((o.votes / total) * 100);
            const isLead = leaders.some((l) => l.id === o.id) && total > 0;
            return (
              <li key={o.id} className="min-w-0">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "min-w-0 truncate text-sm font-semibold",
                      isLead
                        ? "text-[var(--mc-grass-bright)]"
                        : "text-[var(--mc-text)]",
                    )}
                  >
                    {o.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-[var(--mc-text-muted)]">
                    {o.votes}
                    {total > 0 ? ` · ${pct}%` : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-[2px] bg-black/50">
                  <div
                    className={cn(
                      "h-full rounded-[2px] transition-[width] duration-500",
                      isLead
                        ? "bg-[var(--mc-grass-bright)]"
                        : "bg-[var(--mc-net-green)]/70",
                    )}
                    style={{ width: `${total === 0 ? 0 : Math.max(pct, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

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

          {votingOpen && leaders.length === 1 && total > 0 ? (
            <span className="max-w-[55%] truncate font-bold text-[var(--mc-grass-bright)]">
              Лідирує «{leaders[0]!.label}»
            </span>
          ) : null}
          {votingOpen && leaders.length > 1 && total > 0 ? (
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
