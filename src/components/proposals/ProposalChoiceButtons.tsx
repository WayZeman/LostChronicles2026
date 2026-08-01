"use client";

import "./proposal-vote.css";
import type { ProposalOptionPublic } from "@/lib/proposal-kinds";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  busy: boolean;
  options: ProposalOptionPublic[];
  userOptionId: number | null;
  onVote: (optionId: number) => void;
};

export function ProposalChoiceButtons({
  open,
  busy,
  options,
  userOptionId,
  onVote,
}: Props) {
  const disabled = !open || busy;

  return (
    <div className="mx-auto grid w-full max-w-lg gap-2">
      {options.map((o, i) => {
        const selected = userOptionId === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            onClick={() => onVote(o.id)}
            aria-pressed={selected}
            aria-label={`Голосувати за «${o.label}»`}
            className={cn(
              "lc-focus-ring lc-vote-action flex min-h-12 w-full touch-manipulation items-center gap-3 border-2 px-3 py-2.5 text-left text-sm font-bold transition-[transform,filter,background-color,border-color]",
              selected
                ? "lc-vote-action-selected border-[var(--mc-net-green)] bg-gradient-to-b from-[#6dde42] to-[#54c530] text-[var(--mc-green-ink)]"
                : "border-white/15 bg-black/30 text-[var(--mc-text)] hover:border-[var(--mc-net-green)]/50 hover:bg-black/45",
              disabled && "cursor-not-allowed opacity-45 hover:translate-y-0",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-extrabold tabular-nums",
                selected
                  ? "border-black/25 bg-black/15"
                  : "border-white/20 bg-white/5 text-[var(--mc-text-muted)]",
              )}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              {selected ? `✓ ${o.label}` : o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
