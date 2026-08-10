import type { Metadata } from "next";

import { ApplyForm } from "@/components/apply/ApplyForm";
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
      <div
        className={cn(
          "site-container relative z-10 mx-auto w-full max-w-xl",
          "px-[max(0.75rem,env(safe-area-inset-left,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-8",
          "pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:px-4 sm:pb-16 sm:pt-10 md:py-16",
        )}
      >
        <SoftAppear>
          <header className="mb-6 text-center sm:mb-8">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--mc-menu-yellow)]">
              Lost Chronicles
            </p>
            <h1 className="lc-hero-title lc-hero-display text-balance text-3xl text-[var(--mc-text)] sm:text-4xl">
              {config.pageTitle}
            </h1>
            {config.pageIntro ? (
              <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-[var(--mc-text-muted)] sm:text-[0.9375rem]">
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
      </div>
    </main>
  );
}
