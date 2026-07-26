"use client";

import "./proposal-vote.css";
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
    <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(1)}
        aria-label="Голосувати за"
        aria-pressed={userVote === 1}
        className={cn(
          "lc-focus-ring lc-vote-action lc-vote-action-yes flex min-h-12 w-full touch-manipulation items-center justify-center border-2 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide",
          userVote === 1
            ? "lc-vote-action-selected border-[#2f8a18] bg-gradient-to-b from-[#6dde42] to-[#54c530] text-[var(--mc-green-ink)]"
            : "border-[#2f8a18] bg-[#1e6410]/80 text-[#b8f090] hover:bg-[#2f8a18]",
          disabled && "cursor-not-allowed opacity-45 hover:translate-y-0",
        )}
      >
        {userVote === 1 ? "✓ За" : "За"}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(0)}
        aria-label="Голосувати проти"
        aria-pressed={userVote === 0}
        className={cn(
          "lc-focus-ring lc-vote-action lc-vote-action-no flex min-h-12 w-full touch-manipulation items-center justify-center border-2 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide",
          userVote === 0
            ? "lc-vote-action-selected border-[#991b1b] bg-gradient-to-b from-[#f87171] to-[#ef4444] text-white"
            : "border-[#991b1b] bg-[#7f1d1d]/85 text-[#fecaca] hover:bg-[#991b1b]",
          disabled && "cursor-not-allowed opacity-45 hover:translate-y-0",
        )}
      >
        {userVote === 0 ? "✓ Проти" : "Проти"}
      </button>
    </div>
  );
}
