"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { ip: string; className?: string };

export function CopyServerIp({ ip, className }: Props) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(ip);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "lc-focus-ring mc-btn-secondary px-4 py-2 motion-reduce:transition-none",
        className
      )}
    >
      <span className="select-all font-mono text-[0.9375rem]">{ip}</span>
      {done ? (
        <Check className="size-4 text-[var(--mc-net-green)]" strokeWidth={2} aria-hidden />
      ) : (
        <Copy className="size-4 text-slate-400" strokeWidth={1.75} aria-hidden />
      )}
      <span className="sr-only">{done ? "Скопійовано" : "Копіювати IP"}</span>
    </button>
  );
}
