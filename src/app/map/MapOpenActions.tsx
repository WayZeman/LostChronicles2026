"use client";

import { useCallback, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  mapUrl: string;
  className?: string;
};

/** Кнопка «відкрити» + копіювання URL — обхід частини Squid/ACL при cross-site переході з HTTPS. */
export function MapOpenActions({ mapUrl, className }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mapUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [mapUrl]);

  return (
    <div className={cn("flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center", className)}>
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener"
        className="lc-focus-ring inline-flex items-center justify-center gap-2 rounded-sm border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-6 py-3 text-sm font-bold text-[var(--mc-green-ink)] transition-colors hover:bg-[var(--mc-vote-bg-hover)]"
      >
        Відкрити карту
        <ExternalLink className="size-4 opacity-90" aria-hidden />
      </a>
      <button
        type="button"
        onClick={() => void copy()}
        className="lc-focus-ring inline-flex items-center justify-center gap-2 rounded-sm border-2 border-[var(--mc-border-card)] bg-[var(--mc-surface-elevated)] px-6 py-3 text-sm font-bold text-[var(--mc-text)] transition-colors hover:bg-[var(--mc-nav-link-hover-bg)]"
      >
        {copied ? (
          <>
            <Check className="size-4 text-[var(--mc-net-green)]" aria-hidden />
            Скопійовано
          </>
        ) : (
          <>
            <Copy className="size-4 opacity-90" aria-hidden />
            Скопіювати посилання
          </>
        )}
      </button>
    </div>
  );
}
