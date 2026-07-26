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
    <div
      className={cn(
        "w-full",
        compact ? "space-y-2" : "mx-auto max-w-xl space-y-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-full bg-black/40 ring-1 ring-white/[0.06]",
          compact ? "h-2" : "h-2.5",
        )}
        role="img"
        aria-label={`За ${yes} (${yesPct}%), проти ${no} (${noPct}%)`}
      >
        <div
          className="h-full bg-[var(--mc-net-green)]/85 transition-[width] duration-500 ease-out"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="h-full bg-white/25 transition-[width] duration-500 ease-out"
          style={{ width: `${noPct}%` }}
        />
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3 tabular-nums",
          compact ? "text-xs" : "text-sm",
        )}
      >
        <span className="font-medium text-[var(--mc-net-green)]">
          За {yes}
          {!compact && total > 0 ? (
            <span className="ml-1 font-normal text-[var(--mc-text-subtle)]">
              ({yesPct}%)
            </span>
          ) : null}
        </span>
        <span className="text-[var(--mc-text-subtle)]">
          {total === 0
            ? "Голосів ще немає"
            : `${total} голос${ukVotesSuffix(total)}`}
        </span>
        <span className="font-medium text-[var(--mc-text-muted)]">
          Проти {no}
          {!compact && total > 0 ? (
            <span className="ml-1 font-normal text-[var(--mc-text-subtle)]">
              ({noPct}%)
            </span>
          ) : null}
        </span>
      </div>

      {showQuorum ? (
        <p className="text-[11px] leading-relaxed text-[var(--mc-text-subtle)]">
          Мінімум для рішення:{" "}
          <span
            className={cn(
              "font-semibold tabular-nums",
              quorumMet
                ? "text-[var(--mc-net-green)]"
                : "text-[var(--mc-text-muted)]",
            )}
          >
            {total}/{PROPOSAL_MIN_VOTES_FOR_RESULT}
          </span>
          <span
            className="ml-2 inline-block h-1 w-16 align-middle overflow-hidden rounded-full bg-white/[0.06]"
            aria-hidden
          >
            <span
              className={cn(
                "block h-full rounded-full transition-[width] duration-500",
                quorumMet ? "bg-[var(--mc-net-green)]" : "bg-white/35",
              )}
              style={{ width: `${quorumPct}%` }}
            />
          </span>
        </p>
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
