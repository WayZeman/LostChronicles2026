"use client";

import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  busy: boolean;
  userVote: number | null;
  onVote: (vote: 0 | 1) => void;
};

export function ProposalVoteButtons({
  open,
  busy,
  userVote,
  onVote,
}: Props) {
  const disabled = !open || busy;

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2.5 sm:gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(1)}
        aria-label="Голосувати «за»"
        aria-pressed={userVote === 1}
        className={cn(
          "lc-focus-ring flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-[background-color,border-color,transform] duration-200 active:scale-[0.98] sm:min-h-[3.25rem]",
          userVote === 1
            ? "border-[var(--mc-net-green)]/60 bg-[var(--mc-vote-bg)] text-[var(--mc-green-ink)]"
            : "border-white/12 bg-white/[0.03] text-[var(--mc-text)] hover:border-[var(--mc-net-green)]/35 hover:bg-[var(--mc-vote-bg)]/50",
          disabled && "cursor-not-allowed opacity-45 active:scale-100",
        )}
      >
        <span aria-hidden className="text-base opacity-90">
          👍
        </span>
        За
        {userVote === 1 ? (
          <span className="sr-only"> (обрано)</span>
        ) : null}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(0)}
        aria-label="Голосувати «проти»"
        aria-pressed={userVote === 0}
        className={cn(
          "lc-focus-ring flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-[background-color,border-color,transform] duration-200 active:scale-[0.98] sm:min-h-[3.25rem]",
          userVote === 0
            ? "border-white/25 bg-white/[0.1] text-[var(--mc-text)]"
            : "border-white/12 bg-white/[0.03] text-[var(--mc-text)] hover:border-white/22 hover:bg-white/[0.06]",
          disabled && "cursor-not-allowed opacity-45 active:scale-100",
        )}
      >
        <span aria-hidden className="text-base opacity-90">
          👎
        </span>
        Проти
        {userVote === 0 ? (
          <span className="sr-only"> (обрано)</span>
        ) : null}
      </button>
    </div>
  );
}
