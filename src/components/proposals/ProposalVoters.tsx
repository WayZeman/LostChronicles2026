"use client";

import { cn } from "@/lib/utils";
import type { ProposalOptionPublic } from "@/lib/proposal-kinds";

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
  tone: "yes" | "no" | "option";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 sm:p-4",
        tone === "yes" && "border-emerald-500/25 bg-emerald-500/[0.06]",
        tone === "no" && "border-rose-500/25 bg-rose-500/[0.06]",
        tone === "option" && "border-white/10 bg-white/[0.03]",
      )}
    >
      <h3
        className={cn(
          "mb-2.5 text-center text-xs font-extrabold uppercase tracking-wide sm:text-left",
          tone === "yes" && "text-emerald-200/90",
          tone === "no" && "text-rose-200/90",
          tone === "option" && "normal-case tracking-normal text-[var(--mc-text)]",
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
  options,
  optionVoters,
}: {
  yesVoters: ProposalVoter[];
  noVoters: ProposalVoter[];
  options?: ProposalOptionPublic[];
  optionVoters?: Record<string, ProposalVoter[]>;
}) {
  if (options && options.length > 0) {
    return (
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        aria-label="Хто як проголосував"
      >
        {options.map((o) => (
          <VoterList
            key={o.id}
            title={o.label}
            voters={optionVoters?.[String(o.id)] ?? []}
            tone="option"
          />
        ))}
      </div>
    );
  }

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
