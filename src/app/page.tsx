import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { HeroBedrockPanel } from "@/components/site/HeroBedrockPanel";
import { HeroJoinPanel } from "@/components/site/HeroJoinPanel";
import { HeroServerOverviewPanel } from "@/components/site/HeroServerOverviewPanel";
import { HeroSocialLinks } from "@/components/site/HeroSocialLinks";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageContainerHomeClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import { cn } from "@/lib/utils";
import { SupportMonobankSection } from "@/components/site/SupportMonobankSection";
import { LC_FORM_URL } from "@/data/lost-chronicles-faq";
import { LC_DEFAULT_JAVA_SERVER_HOST } from "@/lib/lc-server-defaults";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

export const metadata: Metadata = {
  alternates: {
    canonical: `${getLcMarketingSiteUrl()}/`,
  },
};

const defaultDescription =
  "Місце де гравці будують історії, знаходять друзів і творять світ разом.";

/** Інакше NEXT_PUBLIC_* «запікається» в статичний HTML під час build і не оновиться без перезбірки. */
export const dynamic = "force-dynamic";

export default function Home() {
  const settings = {
    ip: process.env.NEXT_PUBLIC_SERVER_IP?.trim() || LC_DEFAULT_JAVA_SERVER_HOST,
    version: process.env.NEXT_PUBLIC_SERVER_VERSION?.trim() || "1.21.7",
    description: defaultDescription,
    bedrockAddress:
      process.env.NEXT_PUBLIC_BEDROCK_ADDRESS?.trim() || "play.lost-chronicles.site",
    bedrockPort: process.env.NEXT_PUBLIC_BEDROCK_PORT?.trim() || "19132",
  };

  const voteUrl = process.env.NEXT_PUBLIC_VOTE_URL;

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerHomeClass}>
        <section className="am-reveal flex flex-col items-center pt-0 text-center md:pt-0">
          <h1 className="sr-only">Lost Chronicles — Ukrainian Minecraft Server</h1>
          <Image
            src="/lc-logo-hero.png"
            alt="Lost Chronicles — Ukrainian Minecraft Server"
            width={926}
            height={153}
            priority
            unoptimized
            className="h-auto w-full max-w-[min(100%,36rem)] md:max-w-[min(100%,42rem)]"
            draggable={false}
          />
          <p className="lc-hero-lead mt-5 max-w-lg text-base md:mt-6 md:text-lg">
            {settings.description}
          </p>
          <a
            href={LC_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="lc-focus-ring lc-btn-accent mt-6 min-h-11 px-8 py-2.5 text-sm"
          >
            Подати заявку
            <ExternalLink className="size-3.5 opacity-70" aria-hidden />
          </a>

          {voteUrl ? (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a
                href={voteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lc-focus-ring mc-btn-secondary px-6 py-2.5 text-sm"
              >
                Підтримати голосом
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            </div>
          ) : null}
        </section>

        <div
          className="am-reveal am-delay-1 mt-10 flex w-full flex-col gap-6 md:mt-12 md:gap-8"
          aria-label="Онлайн та підключення до сервера"
        >
          <Suspense
            fallback={
              <div
                className={cn(
                  lcGlassPanelClass,
                  "lc-interactive-panel-static px-4 py-16 text-center text-sm text-[var(--mc-text-muted)]",
                  "lc-skeleton-breathe",
                )}
              >
                Завантаження онлайну…
              </div>
            }
          >
            <HeroServerOverviewPanel />
          </Suspense>

          <div className={cn(lcGlassPanelClass, "lc-interactive-panel-static")}>
            <h2 className="lc-section-title text-center text-lg uppercase md:text-xl">
              Підключитися до сервера
            </h2>
            <div
              className="mt-5 grid grid-cols-1 gap-3 md:mt-6 md:grid-cols-2 md:items-stretch md:gap-4"
              aria-label="Java та Bedrock"
            >
              <HeroJoinPanel embedded ip={settings.ip} version={settings.version} />
              <HeroBedrockPanel
                embedded
                address={settings.bedrockAddress}
                port={settings.bedrockPort}
              />
            </div>
            <div className="mt-5 border-t border-[var(--mc-border-card)] pt-5 md:mt-6 md:pt-6">
              <HeroSocialLinks embedded />
            </div>
          </div>
        </div>

        <SupportMonobankSection />
      </div>
    </main>
  );
}
