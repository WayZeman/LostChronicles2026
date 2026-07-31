"use client";

import { useMemo } from "react";
import {
  getAnniversaryGreeting,
  getServerAgeParts,
  isServerAnniversary,
  ukDaysWord,
  ukMonthsWord,
  ukYearsWord,
  type ServerAgeParts,
} from "@/lib/lc-server-age";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

type AgeTileProps = {
  value: number;
  label: string;
  hideIfZero?: boolean;
};

function AgeTile({ value, label, hideIfZero }: AgeTileProps) {
  if (hideIfZero && value <= 0) return null;

  return (
    <div className="flex min-w-[4.5rem] flex-col items-center gap-1.5 sm:min-w-[5rem]">
      <div className="mc-slot flex w-full items-center justify-center px-2.5 py-2 lc-stream-in">
        <span
          className="font-mono text-xl font-extrabold tabular-nums leading-none text-[var(--mc-net-green)] sm:text-2xl"
          style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.65)" }}
        >
          {value}
        </span>
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--mc-text-subtle)] sm:text-xs">
        {label}
      </span>
    </div>
  );
}

/**
 * Вік сервера; у день річниці — короткий рядок + легке привітання.
 */
export function ServerAgeCounter({ className }: Props) {
  const parts = useMemo<ServerAgeParts>(() => getServerAgeParts(), []);
  const anniversary = useMemo(() => isServerAnniversary(), []);
  const showAnniversary = anniversary && parts.years >= 1;
  const greeting = useMemo(
    () => getAnniversaryGreeting(parts.years),
    [parts.years],
  );

  if (showAnniversary) {
    return (
      <div
        className={cn(
          "lc-stream-in lc-anniversary-note flex flex-col items-center justify-center gap-1.5 text-center",
          className,
        )}
        role="status"
        aria-label={`Річниця: ${parts.years} ${ukYearsWord(parts.years)}. ${greeting}`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mc-menu-yellow)] md:text-[11px]">
          ✦ З річницею ✦
        </p>
        <p className="text-sm font-semibold text-[var(--mc-text-muted)] md:text-base">
          Сервер існує вже{" "}
          <span className="lc-anniversary-note__years font-extrabold tabular-nums text-[var(--mc-menu-yellow)]">
            {parts.years}
          </span>{" "}
          <span className="font-extrabold text-[var(--mc-net-green)]">
            {ukYearsWord(parts.years)}
          </span>
        </p>
        <p className="max-w-xs text-pretty text-xs font-medium text-[var(--mc-text-subtle)] md:text-sm">
          {greeting}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        className,
      )}
    >
      <p className="text-sm font-semibold text-[var(--mc-text-muted)] md:text-base">
        Сервер існує вже
      </p>
      <div
        className="flex flex-wrap items-start justify-center gap-2.5 sm:gap-3"
        aria-label={`${parts.years} ${ukYearsWord(parts.years)}, ${parts.months} ${ukMonthsWord(parts.months)}, ${parts.days} ${ukDaysWord(parts.days)}`}
      >
        <AgeTile
          value={parts.years}
          label={ukYearsWord(parts.years)}
          hideIfZero
        />
        <AgeTile
          value={parts.months}
          label={ukMonthsWord(parts.months)}
          hideIfZero
        />
        <AgeTile value={parts.days} label={ukDaysWord(parts.days)} />
      </div>
    </div>
  );
}
