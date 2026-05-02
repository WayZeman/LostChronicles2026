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
        "lc-focus-ring lc-btn-accent min-h-11 w-full min-w-0 flex-col gap-1 px-5 py-2.5 text-sm md:min-h-12 md:px-6 md:py-3",
        "cursor-pointer select-none motion-reduce:transform-none",
        "[&_p]:!text-[var(--mc-green-ink)]",
        className
      )}
      aria-label={`Скопіювати в буфер обміну: ${copyText}`}
    >
      {children}
      {done ? (
        <p className="mt-1 text-center text-[11px] font-semibold text-[var(--mc-net-green)]">{copiedLabel}</p>
      ) : null}
    </div>
  );
}
