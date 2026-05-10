import type { Metadata } from "next";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { HeroBedrockPanel } from "@/components/site/HeroBedrockPanel";
import { HeroJoinPanel } from "@/components/site/HeroJoinPanel";
import { HeroServerOverviewPanel } from "@/components/site/HeroServerOverviewPanel";
import { HeroSocialLinks } from "@/components/site/HeroSocialLinks";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageContainerHomeClass, lcPageMainClass } from "@/components/site/lc-page-shell";
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
  "місце, де українські гравці об’єднуються, щоб створювати пригоди, знаходити друзів і будувати власні цивілізації у живому світі історій.";

/** Інакше NEXT_PUBLIC_* «запікається» в статичний HTML під час build і не оновиться без перезбірки. */
export const dynamic = "force-dynamic";

export default function Home() {
  const settings = {
    ip: process.env.NEXT_PUBLIC_SERVER_IP?.trim() || LC_DEFAULT_JAVA_SERVER_HOST,
    version: process.env.NEXT_PUBLIC_SERVER_VERSION?.trim() || "1.21.7",
    description: process.env.NEXT_PUBLIC_SERVER_DESCRIPTION?.trim() || defaultDescription,
    bedrockAddress:
      process.env.NEXT_PUBLIC_BEDROCK_ADDRESS?.trim() || "play.lost-chronicles.site",
    bedrockPort: process.env.NEXT_PUBLIC_BEDROCK_PORT?.trim() || "19132",
  };

  const voteUrl = process.env.NEXT_PUBLIC_VOTE_URL;

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerHomeClass}>
        <section className="am-reveal flex flex-col items-center pt-0 text-center md:pt-0">
          <h1
            className="lc-hero-title max-w-[min(100%,36rem)] text-[clamp(2.75rem,9vw,4.25rem)] font-bold leading-[1.05] tracking-tight text-[var(--mc-text)]"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            Lost{" "}
            <span className="lc-hero-accent text-[var(--mc-net-green)]">Chronicles</span>
          </h1>
          <p className="lc-hero-lead mt-6 max-w-xl text-xl font-medium leading-relaxed text-[var(--mc-text)] md:text-2xl">
            {settings.description}
          </p>
          <a
            href={LC_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="lc-focus-ring lc-btn-accent mt-6 min-h-11 px-7 py-2.5 text-sm"
          >
            Подати заявку
            <ExternalLink className="size-3 opacity-60" aria-hidden />
          </a>

          {voteUrl ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3 pb-2 md:mt-10 md:pb-3">
              <a
                href={voteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lc-focus-ring lc-btn-accent px-6 py-2.5 text-sm"
              >
                Підтримати голосом
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            </div>
          ) : null}
        </section>

        <div
          className="am-reveal am-delay-1 mt-10 flex w-full flex-col gap-8 md:mt-12 md:gap-10"
          aria-label="Онлайн та підключення до сервера"
        >
          <Suspense
            fallback={
              <div
                className={`${lcGlassPanelClass} bg-[color-mix(in_srgb,#000_20%,transparent)] px-4 py-16 text-center text-sm text-[var(--mc-text-muted)] shadow-[0_16px_52px_rgba(0,0,0,0.28)]`}
              >
                Завантаження онлайну та статистики…
              </div>
            }
          >
            <HeroServerOverviewPanel />
          </Suspense>
          <div className={lcGlassPanelClass}>
            <h2 className="lc-hero-title text-center text-xl font-semibold text-[var(--mc-text)] md:text-2xl">
              Підключитися до серверу
            </h2>
            <div
              className="mt-6 grid grid-cols-1 gap-4 md:mt-8 md:grid-cols-2 md:items-stretch"
              aria-label="Java та Bedrock"
            >
              <HeroJoinPanel embedded ip={settings.ip} version={settings.version} />
              <HeroBedrockPanel
                embedded
                address={settings.bedrockAddress}
                port={settings.bedrockPort}
              />
            </div>
            <div className="mt-6 border-t border-white/[0.12] pt-6 md:mt-8 md:pt-8">
              <HeroSocialLinks embedded />
            </div>
          </div>
        </div>

        <SupportMonobankSection />
      </div>
    </main>
  );
}
