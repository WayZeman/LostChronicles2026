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
    <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(1)}
        aria-label="Голосувати за"
        aria-pressed={userVote === 1}
        className={cn(
          "lc-focus-ring flex min-h-[4.25rem] w-full touch-manipulation flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-3 py-3 transition-[background-color,border-color,transform,box-shadow] duration-200 active:scale-[0.98] sm:min-h-[4.75rem]",
          userVote === 1
            ? "border-emerald-400 bg-emerald-500/25 text-emerald-50 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]"
            : "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-100 hover:border-emerald-400/70 hover:bg-emerald-500/18",
          disabled && "cursor-not-allowed opacity-45 active:scale-100",
        )}
      >
        <span className="text-xl leading-none sm:text-2xl" aria-hidden>
          👍
        </span>
        <span className="text-sm font-extrabold uppercase tracking-[0.14em]">
          За
        </span>
        {userVote === 1 ? (
          <span className="text-[10px] font-semibold text-emerald-200/85">
            Твій голос
          </span>
        ) : (
          <span className="text-[10px] font-medium text-emerald-200/55">
            Підтримати
          </span>
        )}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(0)}
        aria-label="Голосувати проти"
        aria-pressed={userVote === 0}
        className={cn(
          "lc-focus-ring flex min-h-[4.25rem] w-full touch-manipulation flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-3 py-3 transition-[background-color,border-color,transform,box-shadow] duration-200 active:scale-[0.98] sm:min-h-[4.75rem]",
          userVote === 0
            ? "border-rose-400 bg-rose-500/25 text-rose-50 shadow-[0_0_0_1px_rgba(251,113,133,0.25)]"
            : "border-rose-500/40 bg-rose-500/[0.08] text-rose-100 hover:border-rose-400/70 hover:bg-rose-500/18",
          disabled && "cursor-not-allowed opacity-45 active:scale-100",
        )}
      >
        <span className="text-xl leading-none sm:text-2xl" aria-hidden>
          👎
        </span>
        <span className="text-sm font-extrabold uppercase tracking-[0.14em]">
          Проти
        </span>
        {userVote === 0 ? (
          <span className="text-[10px] font-semibold text-rose-200/85">
            Твій голос
          </span>
        ) : (
          <span className="text-[10px] font-medium text-rose-200/55">
            Відхилити
          </span>
        )}
      </button>
    </div>
  );
}
