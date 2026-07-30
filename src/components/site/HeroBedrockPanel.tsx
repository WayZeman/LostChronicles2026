"use client";

import { Gamepad2, Smartphone } from "lucide-react";
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
    <div
      className={cn(shell, "lc-edition-slot lc-edition-slot--bedrock", className)}
      aria-label="Bedrock Edition"
    >
      <span className="mc-badge lc-edition-badge lc-edition-badge--bedrock px-3 py-1 text-[11px]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--mc-green-ink)] opacity-40 motion-reduce:animate-none" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--mc-green-ink)]" />
        </span>
        Bedrock
      </span>
      <p
        className="mt-2 flex items-center justify-center gap-2 text-[var(--mc-ink-subtle)]"
        title="Mobile · Console"
      >
        <Smartphone className="size-4" aria-hidden />
        <Gamepad2 className="size-4" aria-hidden />
        <span className="sr-only">Mobile · Console</span>
      </p>

      <p className="mt-6 w-full text-xs font-semibold text-[var(--mc-ink-subtle)]">
        Адреса сервера
      </p>
      <CopyableMcSlot
        copyText={address}
        className="mt-2"
        copiedLabel="Адресу скопійовано"
      >
        <p className="break-all text-center font-mono text-base font-semibold leading-snug md:text-lg">
          {address}
        </p>
      </CopyableMcSlot>

      <p className="mt-5 w-full text-xs font-semibold text-[var(--mc-ink-subtle)]">
        Порт
      </p>
      <CopyableMcSlot
        copyText={port}
        className="mt-2"
        copiedLabel="Порт скопійовано"
      >
        <p className="text-center font-mono text-base font-bold leading-snug md:text-lg">
          {port}
        </p>
      </CopyableMcSlot>
    </div>
  );
}
