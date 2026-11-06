"use client";

import "./proposal-vote.css";
import { PROPOSAL_MIN_VOTES_FOR_RESULT } from "@/lib/proposal-ui";
import type { ProposalOptionPublic } from "@/lib/proposal-kinds";
import type { ProposalVoter } from "@/components/proposals/ProposalVoters";
import { cn } from "@/lib/utils";

type Props = {
  options: ProposalOptionPublic[];
  open: boolean;
  busy: boolean;
  userOptionId: number | null;
  onVote: (optionId: number) => void;
  optionVoters?: Record<string, ProposalVoter[]>;
  showQuorum?: boolean;
};

function votesWord(n: number): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return "голос";
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return "голоси";
  return "голосів";
}

function ChoiceOption({
  index,
  option,
  total,
  lead,
  mine,
  open,
  busy,
  voters,
  onVote,
}: {
  index: number;
  option: ProposalOptionPublic;
  total: number;
  lead: boolean;
  mine: boolean;
  open: boolean;
  busy: boolean;
  voters: ProposalVoter[];
  onVote: (optionId: number) => void;
}) {
  const pct = total === 0 ? 0 : Math.round((option.votes / total) * 100);
  const body = (
    <>
      <div className="lc-choice-option__grid">
        <span className="lc-choice-option__num" aria-hidden>
          {index + 1}
        </span>
        <p className="lc-choice-option__label">{option.label}</p>
        <p className="lc-choice-option__stats">
          <span className="tabular-nums">
            {option.votes} {votesWord(option.votes)}
          </span>
          <span className="lc-choice-option__pct tabular-nums">{pct}%</span>
          {mine ? <span className="lc-choice-option__mine">твій голос</span> : null}
        </p>
      </div>
      <div
        className="lc-choice-option__bar"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${option.label}: ${pct}%`}
      >
        <span
          className="lc-choice-option__fill"
          style={{ width: `${option.votes === 0 ? 0 : pct}%` }}
        />
      </div>
      {voters.length > 0 ? (
        <ul className="lc-choice-voters">
          {voters.map((v) => (
            <li key={v.id} className="lc-choice-voter">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.avatarUrl}
                alt=""
                width={22}
                height={22}
                className="lc-choice-voter__avatar"
              />
              <span className="truncate">{v.displayName}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );

  const className = cn(
    "lc-choice-option",
    lead && "lc-choice-option--lead",
    mine && "lc-choice-option--mine",
  );

  if (!open) {
    return <li className={className}>{body}</li>;
  }

  return (
    <li>
      <button
        type="button"
        className={cn(className, "lc-focus-ring lc-vote-action w-full")}
        disabled={busy}
        aria-pressed={mine}
        aria-label={`Голосувати за «${option.label}»`}
        onClick={() => onVote(option.id)}
      >
        {body}
      </button>
    </li>
  );
}

export function ProposalChoicePoll({
  options,
  open,
  busy,
  userOptionId,
  onVote,
  optionVoters,
  showQuorum = false,
}: Props) {
  const total = options.reduce((sum, option) => sum + option.votes, 0);
  const max = options.reduce((best, option) => Math.max(best, option.votes), 0);
  const need = Math.max(0, PROPOSAL_MIN_VOTES_FOR_RESULT - total);

  return (
    <div className="lc-choice-poll">
      <p className="lc-choice-poll__meta">
        <span className="tabular-nums">
          {total} {votesWord(total)}
        </span>
        {showQuorum ? (
          <span className={cn("tabular-nums", need === 0 && "text-emerald-300")}>
            {need === 0
              ? "кворум є"
              : `ще ${need} ${votesWord(need)} до результату`}
          </span>
        ) : null}
      </p>
      <ol className="lc-choice-poll__list">
        {options.map((option, index) => (
          <ChoiceOption
            key={option.id}
            index={index}
            option={option}
            total={total}
            lead={max > 0 && option.votes === max}
            mine={userOptionId === option.id}
            open={open}
            busy={busy}
            voters={optionVoters?.[String(option.id)] ?? []}
            onVote={onVote}
          />
        ))}
      </ol>
    </div>
  );
}
