"use client";

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
  const quorumPct = Math.min(
    100,
    Math.round((total / PROPOSAL_MIN_VOTES_FOR_RESULT) * 100),
  );
  const quorumMet = total >= PROPOSAL_MIN_VOTES_FOR_RESULT;

  return (
    <div className={cn("w-full space-y-2.5", !compact && "mx-auto max-w-xl space-y-3", className)}>
      <div
        className={cn(
          "grid grid-cols-2 gap-2",
          compact ? "text-xs" : "text-sm",
        )}
      >
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5",
            "border-emerald-500/30 bg-emerald-500/[0.1]",
            !compact && "sm:px-4 sm:py-3",
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300/90">
            За
          </p>
          <p
            className={cn(
              "mt-0.5 font-bold tabular-nums text-emerald-100",
              compact ? "text-lg" : "text-2xl",
            )}
          >
            {yes}
            {total > 0 ? (
              <span className="ml-1.5 text-sm font-semibold text-emerald-200/70">
                {yesPct}%
              </span>
            ) : null}
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5 text-right",
            "border-rose-500/30 bg-rose-500/[0.1]",
            !compact && "sm:px-4 sm:py-3",
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-300/90">
            Проти
          </p>
          <p
            className={cn(
              "mt-0.5 font-bold tabular-nums text-rose-100",
              compact ? "text-lg" : "text-2xl",
            )}
          >
            {total > 0 ? (
              <span className="mr-1.5 text-sm font-semibold text-rose-200/70">
                {noPct}%
              </span>
            ) : null}
            {no}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex w-full overflow-hidden rounded-full bg-black/45 ring-1 ring-white/[0.06]",
          compact ? "h-2.5" : "h-3",
        )}
        role="img"
        aria-label={`За ${yes} (${yesPct}%), проти ${no} (${noPct}%)`}
      >
        <div
          className="h-full bg-emerald-400 transition-[width] duration-500 ease-out"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="h-full bg-rose-400 transition-[width] duration-500 ease-out"
          style={{ width: `${noPct}%` }}
        />
      </div>

      <p className="text-center text-[11px] text-[var(--mc-text-subtle)] sm:text-xs">
        {total === 0
          ? "Голосів ще немає"
          : `Усього ${total} голос${ukVotesSuffix(total)}`}
        {showQuorum ? (
          <>
            <span className="mx-1.5 opacity-40">·</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                quorumMet
                  ? "text-emerald-300"
                  : "text-[var(--mc-text-muted)]",
              )}
            >
              кворум {total}/{PROPOSAL_MIN_VOTES_FOR_RESULT}
            </span>
            <span
              className="ml-2 inline-block h-1 w-14 align-middle overflow-hidden rounded-full bg-white/[0.07]"
              aria-hidden
            >
              <span
                className={cn(
                  "block h-full rounded-full transition-[width] duration-500",
                  quorumMet ? "bg-emerald-400" : "bg-white/40",
                )}
                style={{ width: `${quorumPct}%` }}
              />
            </span>
          </>
        ) : null}
      </p>
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
