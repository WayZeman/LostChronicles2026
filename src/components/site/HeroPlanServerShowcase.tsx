import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  formatPlaytimeHours,
  sortPlanTopByTotalTimeDesc,
  type PlanTopOnlineEntry,
  type PlanTopOnlinePayload,
} from "@/lib/lc-plan";
import { cn } from "@/lib/utils";

type PodiumRank = 1 | 2 | 3;

const PODIUM = {
  1: {
    shell: cn(
      "border-[color-mix(in_srgb,#f5d565_58%,transparent)]",
      "bg-[linear-gradient(168deg,rgba(245,200,80,0.26)_0%,rgba(55,38,8,0.62)_38%,rgba(6,4,2,0.82)_100%)]",
      "shadow-[0_0_0_1px_rgba(253,224,71,0.14),0_20px_52px_rgba(212,160,18,0.2),inset_0_1px_0_rgba(255,240,200,0.14)]",
      "ring-1 ring-inset ring-white/[0.07]",
    ),
    ambient:
      "bg-[radial-gradient(ellipse_95%_85%_at_50%_-20%,rgba(253,224,71,0.22),transparent_58%)]",
    badge: cn(
      "bg-[linear-gradient(148deg,#fff7d6_0%,#eab308_42%,#b45309_100%)]",
      "text-[#140c02] shadow-[0_3px_12px_rgba(217,119,6,0.5)] ring-2 ring-amber-950/25",
    ),
    name: "text-[var(--mc-text)] drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)]",
    accentBar:
      "h-[3px] rounded-full bg-[linear-gradient(90deg,transparent_0%,rgba(253,224,71,0.55)_45%,rgba(251,191,36,0.35)_100%)] opacity-95",
    timeShell: cn(
      "border-amber-400/22 bg-[color-mix(in_srgb,#000_32%,transparent)]",
      "shadow-[inset_0_1px_0_rgba(255,230,160,0.08)]",
    ),
    timeValue: "text-[#fef3c7]",
  },
  2: {
    shell: cn(
      "border-[color-mix(in_srgb,#e2e8f0_48%,transparent)]",
      "bg-[linear-gradient(168deg,rgba(203,213,225,0.16)_0%,rgba(30,35,45,0.68)_40%,rgba(5,7,10,0.85)_100%)]",
      "shadow-[0_0_0_1px_rgba(226,232,240,0.1),0_14px_40px_rgba(100,116,139,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]",
      "ring-1 ring-inset ring-white/[0.06]",
    ),
    ambient:
      "bg-[radial-gradient(ellipse_95%_85%_at_50%_-20%,rgba(226,232,240,0.14),transparent_55%)]",
    badge: cn(
      "bg-[linear-gradient(148deg,#ffffff_0%,#94a3b8_48%,#475569_100%)]",
      "text-[#0f172a] shadow-[0_3px_12px_rgba(148,163,184,0.4)] ring-2 ring-slate-950/20",
    ),
    name: "text-[var(--mc-text)] drop-shadow-[0_1px_10px_rgba(0,0,0,0.32)]",
    accentBar:
      "h-[3px] rounded-full bg-[linear-gradient(90deg,transparent_0%,rgba(226,232,240,0.45)_50%,rgba(148,163,184,0.2)_100%)] opacity-90",
    timeShell: cn(
      "border-slate-300/20 bg-[color-mix(in_srgb,#000_28%,transparent)]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    ),
    timeValue: "text-[#f1f5f9]",
  },
  3: {
    shell: cn(
      "border-[color-mix(in_srgb,#d4a574_52%,transparent)]",
      "bg-[linear-gradient(168deg,rgba(200,110,60,0.22)_0%,rgba(52,24,12,0.6)_38%,rgba(8,4,2,0.84)_100%)]",
      "shadow-[0_0_0_1px_rgba(212,140,90,0.14),0_14px_40px_rgba(154,70,35,0.14),inset_0_1px_0_rgba(255,200,170,0.08)]",
      "ring-1 ring-inset ring-orange-950/30",
    ),
    ambient:
      "bg-[radial-gradient(ellipse_95%_85%_at_50%_-20%,rgba(251,146,60,0.16),transparent_55%)]",
    badge: cn(
      "bg-[linear-gradient(148deg,#fed7aa_0%,#ea580c_45%,#7c2d12_100%)]",
      "text-[#160804] shadow-[0_3px_12px_rgba(234,88,12,0.42)] ring-2 ring-orange-950/30",
    ),
    name: "text-[var(--mc-text)] drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)]",
    accentBar:
      "h-[3px] rounded-full bg-[linear-gradient(90deg,transparent_0%,rgba(251,146,60,0.5)_48%,rgba(180,83,9,0.25)_100%)] opacity-90",
    timeShell: cn(
      "border-orange-400/24 bg-[color-mix(in_srgb,#000_30%,transparent)]",
      "shadow-[inset_0_1px_0_rgba(255,200,160,0.06)]",
    ),
    timeValue: "text-[#ffedd5]",
  },
} as const;

function PlaytimeCell({
  totalMs,
  podiumRank,
}: {
  totalMs: number;
  podiumRank?: PodiumRank;
}) {
  const tierBorder =
    podiumRank === 1
      ? "border-amber-400/22"
      : podiumRank === 2
        ? "border-slate-300/18"
        : podiumRank === 3
          ? "border-orange-400/22"
          : "border-white/[0.1]";

  return (
    <span
      className={cn(
        "inline-flex max-w-[min(100%,10rem)] shrink-0 justify-end rounded-xl text-right",
        "bg-[color-mix(in_srgb,var(--mc-surface)_35%,transparent)]",
        "px-2.5 py-2 sm:max-w-[11rem] sm:px-3 sm:py-2",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        "text-[0.8125rem] font-semibold leading-relaxed tracking-tight text-[var(--mc-text)] sm:text-sm",
        "border",
        tierBorder,
        podiumRank === 1 && "ring-1 ring-amber-400/15",
      )}
    >
      {formatPlaytimeHours(totalMs)}
    </span>
  );
}

function PodiumCard({
  rank,
  player,
  className,
}: {
  rank: PodiumRank;
  player: PlanTopOnlineEntry;
  className?: string;
}) {
  const p = PODIUM[rank];
  const isFirst = rank === 1;

  return (
    <article
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] border text-center",
        "md:h-full",
        p.shell,
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-[0.85]",
          p.ambient,
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent",
        )}
        aria-hidden
      />

      <div className="relative z-[1] flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-[1.125rem]">
        <div className={cn("mb-3.5 w-full", p.accentBar)} aria-hidden />

        <div className="flex flex-col items-center gap-2.5 sm:gap-3">
          <span
            className={cn(
              "flex size-[2.375rem] shrink-0 items-center justify-center rounded-full text-sm font-extrabold tabular-nums sm:size-11 sm:text-base",
              p.badge,
            )}
            aria-label={`${rank} місце`}
          >
            {rank}
          </span>
          <p
            className={cn(
              "line-clamp-2 max-w-full text-[0.9375rem] font-semibold leading-snug tracking-tight sm:text-base",
              isFirst && "sm:text-[1.0625rem] md:text-[1.125rem] md:font-bold",
              p.name,
            )}
          >
            {player.name}
          </p>
        </div>

        <div className="mt-auto pt-5 sm:pt-6">
          <div
            className={cn(
              "flex w-full justify-center rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3",
              p.timeShell,
            )}
          >
            <span
              className={cn(
                "text-[0.9375rem] font-bold tabular-nums tracking-tight sm:text-base",
                isFirst && "sm:text-[1.0625rem]",
                p.timeValue,
              )}
            >
              {formatPlaytimeHours(player.playtimeTotalMs)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function TopThreePodium({ top }: { top: [PlanTopOnlineEntry, PlanTopOnlineEntry, PlanTopOnlineEntry] }) {
  const [first, second, third] = top;
  return (
    <>
      {/* Мобільний: 1 — повна ширина; 2 і 3 — поруч */}
      <div className="mt-6 space-y-3 md:hidden">
        <PodiumCard rank={1} player={first} className="w-full" />
        <div className="grid grid-cols-2 gap-3">
          <PodiumCard rank={2} player={second} className="min-w-0" />
          <PodiumCard rank={3} player={third} className="min-w-0" />
        </div>
      </div>

      {/* Десктоп: подіум 2 — 1 — 3 */}
      <div
        className={cn(
          "mt-6 hidden gap-3 md:grid md:grid-cols-3 md:items-end md:gap-4 lg:gap-5",
          "max-w-3xl md:mx-auto",
        )}
      >
        <PodiumCard
          rank={2}
          player={second}
          className="md:order-1 md:min-h-[11.5rem] md:translate-y-1"
        />
        <PodiumCard
          rank={1}
          player={first}
          className={cn(
            "md:order-2 md:z-[1] md:min-h-[13.5rem]",
            "md:-translate-y-2 md:shadow-[0_20px_56px_rgba(212,160,18,0.18)]",
          )}
        />
        <PodiumCard
          rank={3}
          player={third}
          className="md:order-3 md:min-h-[10.5rem] md:translate-y-2"
        />
      </div>
    </>
  );
}

function rankRestClass(rank: number): string {
  if (rank <= 3) return "";
  return "font-medium text-[var(--mc-text-muted)]";
}

const restListClass =
  "mx-auto mt-6 max-w-xl divide-y divide-white/[0.06] border-t border-white/[0.06] text-left";

function LeaderboardRestList({
  entries,
  startRank,
}: {
  entries: PlanTopOnlineEntry[];
  startRank: number;
}) {
  return (
    <ul className={restListClass}>
      {entries.map((p, i) => {
        const rank = startRank + i;
        return (
          <li
            key={p.uuid}
            className="flex items-center gap-3 py-3.5 first:pt-4 sm:gap-4"
          >
            <span
              className={cn(
                "w-7 shrink-0 text-center text-[0.8125rem] tabular-nums sm:text-[0.875rem]",
                rankRestClass(rank),
              )}
            >
              {rank}
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium tracking-tight text-[var(--mc-text)] sm:text-base">
              {p.name}
            </span>
            <PlaytimeCell totalMs={p.playtimeTotalMs} />
          </li>
        );
      })}
    </ul>
  );
}

/** Топ-10 за загальним часом (активний + AFK), Plan. */
export function HeroPlanTopOnlineSection({ data }: { data: PlanTopOnlinePayload }) {
  const players = sortPlanTopByTotalTimeDesc(data.players);
  const top3 = players.slice(0, 3);
  const hasPodium = top3.length === 3;
  const rest = hasPodium ? players.slice(3) : players;

  return (
    <div className="text-center">
      <h3 className="text-[1.0625rem] font-semibold tracking-tight text-[var(--mc-text)]">
        Топ-10 за загальним часом на сервері
      </h3>

      {players.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--mc-text-muted)]">
          Поки немає записаних гравців.
        </p>
      ) : (
        <>
          {hasPodium ? (
            <TopThreePodium
              top={top3 as [PlanTopOnlineEntry, PlanTopOnlineEntry, PlanTopOnlineEntry]}
            />
          ) : (
            <LeaderboardRestList entries={players} startRank={1} />
          )}

          {hasPodium && rest.length > 0 ? (
            <LeaderboardRestList entries={rest} startRank={4} />
          ) : null}
        </>
      )}

      <div className="mt-8 flex justify-center md:mt-10">
        <Link
          href={data.panelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center gap-2 px-7 py-2.5 text-sm"
        >
          Повна аналітика
          <ExternalLink className="size-3 opacity-60" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
