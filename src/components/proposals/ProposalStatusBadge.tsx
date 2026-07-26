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
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide",
        votingOpen &&
          "bg-[var(--mc-vote-bg)] text-[var(--mc-green-ink)] ring-1 ring-[var(--mc-net-green)]/35",
        !votingOpen &&
          status === "cancelled" &&
          "bg-rose-500/10 text-rose-200/90 ring-1 ring-rose-500/25",
        !votingOpen &&
          status !== "cancelled" &&
          "bg-white/[0.04] text-[var(--mc-text-subtle)] ring-1 ring-white/[0.08]",
        className,
      )}
    >
      {proposalStatusLabelUk(status, votingOpen)}
    </span>
  );
}
