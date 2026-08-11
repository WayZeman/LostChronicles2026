import type { Metadata } from "next";

import { ApplyForm } from "@/components/apply/ApplyForm";
import { DiamondPageRoot } from "@/components/site/DiamondSlot";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { SoftAppear } from "@/components/site/SoftAppear";
import {
  DEFAULT_APPLY_FORM_CONFIG,
  getApplyFormConfig,
} from "@/lib/application-form-config";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Анкета — Lost Chronicles",
  description:
    "Заявка на вайтлист українського Minecraft-сервера Lost Chronicles.",
  alternates: {
    canonical: `${getLcMarketingSiteUrl()}/apply`,
  },
};

export default async function ApplyPage() {
  let config = DEFAULT_APPLY_FORM_CONFIG;
  try {
    config = await getApplyFormConfig();
  } catch {
    /* defaults */
  }

  return (
    <main className={lcPageMainClass}>
      <DiamondPageRoot
        className={cn(
          "site-container relative z-10 mx-auto w-full max-w-xl",
          "px-[max(0.75rem,env(safe-area-inset-left,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-8",
          "pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:px-4 sm:pb-16 sm:pt-10 md:py-16",
        )}
      >
        <SoftAppear>
          <header className="relative mb-7 text-center sm:mb-9">
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-16 w-[min(100%,18rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,214,74,0.14),transparent_70%)]"
              aria-hidden
            />
            <h1 className="lc-hero-title lc-hero-display relative text-balance text-[clamp(2rem,6vw,2.75rem)] leading-none text-[var(--mc-text)]">
              {config.pageTitle}
            </h1>
            <div
              className="mx-auto mt-4 flex w-full max-w-[14rem] items-center gap-2"
              aria-hidden
            >
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--mc-menu-yellow)]/55" />
              <span className="size-1.5 rotate-45 border border-[var(--mc-menu-yellow)]/70 bg-[var(--mc-menu-yellow)]/30" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--mc-menu-yellow)]/55" />
            </div>
            {config.pageIntro ? (
              <p className="relative mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-[var(--mc-text-muted)] sm:text-[0.9375rem]">
                {config.pageIntro}
              </p>
            ) : null}
          </header>
        </SoftAppear>

        <SoftAppear>
          <div
            className={cn(
              lcGlassPanelClass,
              "relative overflow-hidden p-4 sm:p-6 md:p-7",
            )}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--mc-menu-yellow)]/50 to-transparent"
              aria-hidden
            />
            <ApplyForm initialConfig={config} />
          </div>
        </SoftAppear>
      </DiamondPageRoot>
    </main>
  );
}
