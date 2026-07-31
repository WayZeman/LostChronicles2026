"use client";

import { cn } from "@/lib/utils";

export type ProposalVoter = {
  id: number;
  displayName: string;
  avatarUrl: string;
};

function VoterList({
  title,
  voters,
  tone,
}: {
  title: string;
  voters: ProposalVoter[];
  tone: "yes" | "no";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 sm:p-4",
        tone === "yes"
          ? "border-emerald-500/25 bg-emerald-500/[0.06]"
          : "border-rose-500/25 bg-rose-500/[0.06]",
      )}
    >
      <h3
        className={cn(
          "mb-2.5 text-center text-xs font-extrabold uppercase tracking-wide sm:text-left",
          tone === "yes" ? "text-emerald-200/90" : "text-rose-200/90",
        )}
      >
        {title}{" "}
        <span className="tabular-nums opacity-80">({voters.length})</span>
      </h3>
      {voters.length === 0 ? (
        <p className="text-center text-xs text-[var(--mc-text-subtle)] sm:text-left">
          Поки нікого
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {voters.map((v) => (
            <li key={v.id} className="flex min-w-0 items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.avatarUrl}
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0 rounded-full border border-white/15 object-cover"
              />
              <span className="truncate text-sm font-semibold text-[var(--mc-text)]">
                {v.displayName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProposalVoters({
  yesVoters,
  noVoters,
}: {
  yesVoters: ProposalVoter[];
  noVoters: ProposalVoter[];
}) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      aria-label="Хто як проголосував"
    >
      <VoterList title="За" voters={yesVoters} tone="yes" />
      <VoterList title="Проти" voters={noVoters} tone="no" />
    </div>
  );
}
