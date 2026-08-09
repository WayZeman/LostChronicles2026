/** Мінімум голосів після закінчення терміну, інакше голосування скасовується. */
export const PROPOSAL_MIN_VOTES_FOR_RESULT = 10;

/** При нічиї (і достатньому кворумі) термін автоматично продовжується. */
export const PROPOSAL_TIE_EXTENSION_DAYS = 1;

export function isProposalVotingOpenClient(
  status: string,
  endsAtIso: string,
): boolean {
  if (status !== "active") return false;
  return new Date(endsAtIso).getTime() > Date.now();
}

export function proposalStatusLabelUk(
  status: string,
  votingOpen: boolean,
): string {
  if (votingOpen) return "Триває";
  if (status === "cancelled") return "Скасовано";
  return "Завершено";
}

/** Локалізований зворотний відлік до кінця голосування. */
export function formatTimeRemainingUk(endsAtIso: string): string {
  const end = new Date(endsAtIso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.floor((end - now) / 1000));
  if (sec === 0) return "час вийшов";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}д ${h}г`;
  if (h > 0) return `${h}г ${m}хв`;
  return `${m} хв`;
}

export type ProposalCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSec: number;
};

/** Частини зворотного відліку для таймера на картці. */
export function getProposalCountdownParts(
  endsAtIso: string,
): ProposalCountdownParts {
  const end = new Date(endsAtIso).getTime();
  const totalSec = Math.max(0, Math.floor((end - Date.now()) / 1000));
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    totalSec,
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Цифровий таймер лише в годинах: `132:08:15` (дні → години). */
export function formatProposalTimer(endsAtIso: string): string {
  const { totalSec } = getProposalCountdownParts(endsAtIso);
  if (totalSec <= 0) return "00:00:00";
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

export type ProposalCardHeaderTone =
  | "live"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "quorum"
  | "tie"
  | "done";

/** Короткий статус у шапці картки замість таймера (коли голосування завершене). */
export function proposalCardHeaderStatus(params: {
  status: string;
  kind: string;
  yes: number;
  no: number;
  totalVotes: number;
  cancelReason?: string | null;
  options?: { label: string; votes: number }[];
}): { label: string; tone: ProposalCardHeaderTone } {
  const {
    status,
    kind,
    yes,
    no,
    totalVotes,
    cancelReason,
    options = [],
  } = params;

  if (status === "cancelled") {
    if (cancelReason?.trim()) {
      return { label: "Скасовано", tone: "cancelled" };
    }
    return { label: "Мало голосів", tone: "quorum" };
  }

  if (status !== "closed") {
    return { label: "Завершено", tone: "done" };
  }

  if (kind === "choice") {
    const total = options.reduce((s, o) => s + o.votes, 0);
    if (total === 0) return { label: "Без голосів", tone: "done" };
    const max = Math.max(...options.map((o) => o.votes));
    const leaders = options.filter((o) => o.votes === max);
    if (leaders.length > 1) return { label: "Нічия", tone: "tie" };
    const name = leaders[0]!.label.trim();
    const short =
      name.length > 18 ? `${name.slice(0, 17)}…` : name;
    return { label: `Обрано: ${short}`, tone: "accepted" };
  }

  if (totalVotes === 0 || (yes === 0 && no === 0)) {
    return { label: "Без голосів", tone: "done" };
  }
  if (yes > no) return { label: "Взято до роботи", tone: "accepted" };
  if (no > yes) return { label: "Відхилено", tone: "rejected" };
  return { label: "Нічия", tone: "tie" };
}
