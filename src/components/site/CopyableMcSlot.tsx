"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  copyText: string;
  className?: string;
  children: React.ReactNode;
  copiedLabel?: string;
};

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
        "mc-slot w-full rounded-sm px-4 py-3.5",
        "cursor-pointer select-none transition-[filter,transform] hover:brightness-[1.04] active:scale-[0.995] motion-reduce:transform-none",
        "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--mc-net-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mc-surface)]",
        className
      )}
      aria-label={`Скопіювати в буфер обміну: ${copyText}`}
    >
      {children}
      {done ? (
        <p className="mt-1.5 text-center text-[11px] font-bold text-[var(--mc-net-green)]">{copiedLabel}</p>
      ) : null}
    </div>
  );
}
