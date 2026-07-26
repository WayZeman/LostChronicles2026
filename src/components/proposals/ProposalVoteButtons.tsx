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
    <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-3 sm:gap-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(1)}
        aria-label="Голосувати «за»"
        aria-pressed={userVote === 1}
        className={cn(
          "lc-focus-ring lc-vote-choice lc-vote-yes flex min-h-[4.5rem] w-full touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3 sm:min-h-[5rem]",
          userVote === 1
            ? "lc-vote-choice-selected border-emerald-400 bg-emerald-500/30"
            : "border-emerald-500/45 bg-emerald-500/[0.12] hover:border-emerald-400/80 hover:bg-emerald-500/20",
          disabled && "cursor-not-allowed opacity-45 hover:translate-y-0 hover:scale-100",
        )}
      >
        <span className="text-3xl leading-none sm:text-4xl" aria-hidden>
          👍
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-100 sm:text-sm">
          За
        </span>
        {userVote === 1 ? (
          <span className="text-[10px] font-semibold text-emerald-200/80">
            Твій голос
          </span>
        ) : null}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(0)}
        aria-label="Голосувати «проти»"
        aria-pressed={userVote === 0}
        className={cn(
          "lc-focus-ring lc-vote-choice lc-vote-no flex min-h-[4.5rem] w-full touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3 sm:min-h-[5rem]",
          userVote === 0
            ? "lc-vote-choice-selected border-rose-400 bg-rose-500/30"
            : "border-rose-500/45 bg-rose-500/[0.12] hover:border-rose-400/80 hover:bg-rose-500/20",
          disabled && "cursor-not-allowed opacity-45 hover:translate-y-0 hover:scale-100",
        )}
      >
        <span className="text-3xl leading-none sm:text-4xl" aria-hidden>
          👎
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wide text-rose-100 sm:text-sm">
          Проти
        </span>
        {userVote === 0 ? (
          <span className="text-[10px] font-semibold text-rose-200/80">
            Твій голос
          </span>
        ) : null}
      </button>
    </div>
  );
}
