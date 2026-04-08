"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  copyText: string;
  className?: string;
  children: React.ReactNode;
  copiedLabel?: string;
};

/** Вигляд як кнопка «Мапа серверу» на /map — копіювання в буфер. */
export function CopyableMcSlot({
  copyText,
  className,
  children,
  copiedLabel = "Скопійовано",
}: Props) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={copy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void copy();
        }
      }}
      className={cn(
        "lc-focus-ring inline-flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-sm border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-5 py-2.5 text-sm font-bold text-[var(--mc-green-ink)] transition-colors hover:bg-[var(--mc-vote-bg-hover)] md:px-6 md:py-3",
        "cursor-pointer select-none active:scale-[0.995] motion-reduce:transform-none",
        "[&_p]:!text-[var(--mc-green-ink)]",
        className
      )}
      aria-label={`Скопіювати в буфер обміну: ${copyText}`}
    >
      {children}
      {done ? (
        <p className="mt-1 text-center text-[11px] font-bold text-[var(--mc-net-green)]">{copiedLabel}</p>
      ) : null}
    </div>
  );
}
