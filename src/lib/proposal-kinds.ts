/** Типи голосувань на сайті. */
export const PROPOSAL_KIND_YES_NO = "yes_no" as const;
export const PROPOSAL_KIND_CHOICE = "choice" as const;

export type ProposalKind =
  | typeof PROPOSAL_KIND_YES_NO
  | typeof PROPOSAL_KIND_CHOICE;

export const CHOICE_OPTIONS_MIN = 2;
export const CHOICE_OPTIONS_MAX = 8;
export const CHOICE_OPTION_LABEL_MAX = 200;

export function isProposalKind(v: unknown): v is ProposalKind {
  return v === PROPOSAL_KIND_YES_NO || v === PROPOSAL_KIND_CHOICE;
}

export function proposalKindLabelUk(kind: ProposalKind): string {
  return kind === PROPOSAL_KIND_CHOICE ? "Вибір варіантів" : "За / проти";
}

export type ProposalOptionPublic = {
  id: number;
  label: string;
  sort_order: number;
  votes: number;
};

/** Підсумок для choice-голосування. */
export function choiceVerdictPlain(
  options: ProposalOptionPublic[],
  status: string,
  minVotes: number,
): string {
  if (status === "cancelled") {
    return `Голосування скасовано · менше ${minVotes} голосів`;
  }
  const total = options.reduce((s, o) => s + o.votes, 0);
  if (total === 0) return "Без голосів";
  const max = Math.max(...options.map((o) => o.votes));
  const leaders = options.filter((o) => o.votes === max);
  if (leaders.length > 1) {
    return `Нічия · ${leaders.map((o) => o.label).join(" / ")}`;
  }
  const w = leaders[0]!;
  return `Переміг варіант «${w.label}» · ${w.votes}`;
}
