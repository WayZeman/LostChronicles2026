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
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        votingOpen &&
          "lc-vote-status-live bg-[#1a5c12] text-[#e8ffe0] ring-1 ring-[#3d9a28]",
        !votingOpen &&
          status === "cancelled" &&
          "bg-[#ef4444]/25 text-[#fecaca] ring-1 ring-[#ef4444]/50",
        !votingOpen &&
          status !== "cancelled" &&
          "bg-[var(--mc-surface-elevated)] text-[var(--mc-text-muted)] ring-1 ring-[var(--mc-border-card)]",
        className,
      )}
    >
      {proposalStatusLabelUk(status, votingOpen)}
    </span>
  );
}
