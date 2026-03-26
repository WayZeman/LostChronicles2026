"use client";

import { cn } from "@/lib/utils";
import { CopyableMcSlot } from "@/components/site/CopyableMcSlot";
import {
  heroPanelEmbeddedClass,
  heroPanelShellClass,
} from "@/components/site/hero-panel-shell";

type Props = {
  ip: string;
  version: string;
  className?: string;
  /** Усередині спільного скляного блоку на головній */
  embedded?: boolean;
};

export function HeroJoinPanel({ ip, version, className, embedded }: Props) {
  const shell = embedded ? heroPanelEmbeddedClass : heroPanelShellClass;
  return (
    <div className={cn(shell, className)}>
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--mc-border)] bg-[var(--mc-vote-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--mc-green-ink)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--mc-net-green)] opacity-40 motion-reduce:animate-none" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--mc-net-green)]" />
        </span>
        Java
      </span>

      <p className="mt-6 w-full text-xs font-semibold text-[var(--mc-ink-subtle)]">Адреса сервера</p>
      <CopyableMcSlot copyText={ip} className="mt-2" copiedLabel="IP скопійовано">
        <p className="break-all text-center font-mono text-base font-semibold leading-snug text-[var(--mc-ink)] md:text-lg">
          {ip}
        </p>
      </CopyableMcSlot>

      <p className="mt-5 w-full text-xs font-semibold text-[var(--mc-ink-subtle)]">Версія</p>
      <CopyableMcSlot copyText={version} className="mt-2" copiedLabel="Версію скопійовано">
        <p className="text-center font-mono text-base font-bold leading-snug text-[var(--mc-ink)] md:text-lg">
          {version}
        </p>
      </CopyableMcSlot>
    </div>
  );
}
