import { proposalStatusLabelUk } from "@/lib/proposal-ui";
import { cn } from "@/lib/utils";

type Props = {
  status: string;
  votingOpen: boolean;
  className?: string;
};

export function ProposalStatusBadge({
  status,
  votingOpen,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        votingOpen &&
          "lc-vote-status-live bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/35",
        !votingOpen &&
          status === "cancelled" &&
          "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30",
        !votingOpen &&
          status !== "cancelled" &&
          "bg-[var(--mc-surface-elevated)] text-[var(--mc-text-subtle)] ring-1 ring-[var(--mc-border)]",
        className,
      )}
    >
      {proposalStatusLabelUk(status, votingOpen)}
    </span>
  );
}
