"use client";

import { cn } from "@/lib/utils";
import { CopyableMcSlot } from "@/components/site/CopyableMcSlot";
import {
  heroPanelEmbeddedClass,
  heroPanelShellClass,
} from "@/components/site/hero-panel-shell";

type Props = {
  address: string;
  port: string;
  className?: string;
  embedded?: boolean;
};

export function HeroBedrockPanel({ address, port, className, embedded }: Props) {
  const shell = embedded ? heroPanelEmbeddedClass : heroPanelShellClass;
  return (
    <div className={cn(shell, className)}>
      <span className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border-2 border-[#2f8a18] bg-[var(--mc-net-green)] px-3 py-1 text-[11px] font-extrabold text-[var(--mc-green-ink)] shadow-[0_2px_0_#1e6410]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--mc-green-ink)] opacity-40 motion-reduce:animate-none" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--mc-green-ink)]" />
        </span>
        Bedrock
      </span>

      <p className="mt-6 w-full text-xs font-semibold text-[var(--mc-ink-subtle)]">Адреса сервера</p>
      <CopyableMcSlot copyText={address} className="mt-2" copiedLabel="Адресу скопійовано">
        <p className="break-all text-center font-mono text-base font-semibold leading-snug md:text-lg">
          {address}
        </p>
      </CopyableMcSlot>

      <p className="mt-5 w-full text-xs font-semibold text-[var(--mc-ink-subtle)]">Порт</p>
      <CopyableMcSlot copyText={port} className="mt-2" copiedLabel="Порт скопійовано">
        <p className="text-center font-mono text-base font-bold leading-snug md:text-lg">
          {port}
        </p>
      </CopyableMcSlot>
    </div>
  );
}
