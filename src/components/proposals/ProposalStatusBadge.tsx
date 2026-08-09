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
        "inline-flex shrink-0 items-center border-2 border-black px-2 py-0.5 text-[11px] font-black uppercase tracking-wide",
        votingOpen &&
          "lc-vote-status-live bg-[#1a5c12] text-[#e8ffe0]",
        !votingOpen &&
          status === "cancelled" &&
          "bg-[#7f1d1d] text-[#fecaca]",
        !votingOpen &&
          status !== "cancelled" &&
          "bg-[#2a2a2a] text-[var(--mc-text-muted)]",
        className,
      )}
    >
      {proposalStatusLabelUk(status, votingOpen)}
    </span>
  );
}
