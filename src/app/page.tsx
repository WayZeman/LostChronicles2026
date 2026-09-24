import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { HeroAuthGreeting } from "@/components/site/HeroAuthGreeting";
import { HeroBedrockPanel } from "@/components/site/HeroBedrockPanel";
import { HeroJoinPanel } from "@/components/site/HeroJoinPanel";
import { HeroServerOverviewPanel } from "@/components/site/HeroServerOverviewPanel";
import { HeroSocialPanel } from "@/components/site/HeroSocialPanel";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { lcPageContainerHomeClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import { cn } from "@/lib/utils";
import { SupportMonobankSection } from "@/components/site/SupportMonobankSection";
import { LC_APPLY_PATH } from "@/data/lost-chronicles-faq";
import { LC_SEO_DESCRIPTION_SHORT, LC_SEO_SITE_TITLE_DEFAULT } from "@/data/lc-seo-terms";
import { LC_DEFAULT_JAVA_SERVER_HOST, LC_DEFAULT_BEDROCK_ADDRESS } from "@/lib/lc-server-defaults";
import {
  getConnectSettings,
  getSupportSettings,
} from "@/lib/site-content";
import { buildLcPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildLcPageMetadata({
  title: LC_SEO_SITE_TITLE_DEFAULT,
  description: LC_SEO_DESCRIPTION_SHORT,
  path: "/",
});

/** Інакше NEXT_PUBLIC_* «запікається» в статичний HTML під час build і не оновиться без перезбірки. */
export const dynamic = "force-dynamic";

export default async function Home() {
  let settings = {
    ip: process.env.NEXT_PUBLIC_SERVER_IP?.trim() || LC_DEFAULT_JAVA_SERVER_HOST,
    version: process.env.NEXT_PUBLIC_SERVER_VERSION?.trim() || "1.21.11",
    bedrockAddress:
      process.env.NEXT_PUBLIC_BEDROCK_ADDRESS?.trim() || LC_DEFAULT_BEDROCK_ADDRESS,
    bedrockPort: process.env.NEXT_PUBLIC_BEDROCK_PORT?.trim() || "19132",
  };
  let support: {
    jarUrl?: string;
    blurb?: string;
    catalogLinks?: {
      href: string;
      label: string;
      shortLabel: string;
    }[];
  } = {};

  try {
    const [connect, supportDb] = await Promise.all([
      getConnectSettings(),
      getSupportSettings(),
    ]);
    settings = {
      ip: connect.javaIp,
      version: connect.javaVersion,
      bedrockAddress: connect.bedrockAddress,
      bedrockPort: connect.bedrockPort,
    };
    support = {
      jarUrl: supportDb.monoJarUrl,
      blurb: supportDb.blurb,
      catalogLinks: supportDb.catalogLinks,
    };
  } catch {
    /* env / hardcoded fallbacks */
  }

  const voteUrl = process.env.NEXT_PUBLIC_VOTE_URL;

  return (
    <main className={lcPageMainClass}>
      <div className={lcPageContainerHomeClass}>
        <section className="am-reveal relative z-10 flex flex-col items-center pt-2 text-center md:pt-4">
          <h1 className="sr-only">Lost Chronicles — Ukrainian Minecraft Server</h1>

          <div className="relative w-full max-w-[min(100%,22rem)] sm:max-w-[min(100%,26rem)]">
            <Image
              src="/lc-logo-hero-v2.png"
              alt="Lost Chronicles — Ukrainian Minecraft Server"
              width={900}
              height={606}
              priority
              unoptimized
              className="relative z-0 h-auto w-full drop-shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
              draggable={false}
            />
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={LC_APPLY_PATH}
              className="lc-focus-ring lc-btn-accent min-h-11 px-7 py-2.5 text-sm"
            >
              Подати заявку
            </Link>
            {voteUrl ? (
              <a
                href={voteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lc-focus-ring mc-btn-secondary min-h-11 px-5 py-2.5 text-sm"
              >
                Голос
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            ) : null}
          </div>

          <HeroAuthGreeting />
        </section>

        <div
          className="am-reveal am-delay-1 relative mt-12 flex w-full flex-col gap-6 sm:mt-10 md:mt-12 md:gap-8"
          aria-label="Онлайн та підключення до сервера"
        >
          <Suspense
            fallback={
              <div
                className={cn(
                  lcGlassPanelClass,
                  "lc-interactive-panel-static mt-20 px-4 py-16 text-center text-sm text-[var(--mc-text-muted)] sm:mt-16",
                  "lc-skeleton-breathe min-h-[16rem]",
                )}
              >
                Завантаження онлайну…
              </div>
            }
          >
            <HeroServerOverviewPanel />
          </Suspense>

          <div
            className={cn(
              lcGlassPanelClass,
              "lc-interactive-panel-static relative",
            )}
          >
            <h2 className="lc-section-title text-center text-xl md:text-2xl">
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
          </div>

          <Suspense
            fallback={
              <div
                className={cn(
                  lcGlassPanelClass,
                  "lc-interactive-panel-static relative overflow-hidden !p-0",
                  "lc-skeleton-breathe min-h-[18.5rem] sm:min-h-[30rem] md:min-h-[32rem]",
                )}
                aria-busy
                aria-label="Завантаження соцмереж"
              >
                <span className="sr-only">Завантаження соцмереж…</span>
              </div>
            }
          >
            <HeroSocialPanel />
          </Suspense>
        </div>

        <SupportMonobankSection
          jarUrl={support.jarUrl}
          blurb={support.blurb}
          catalogLinks={support.catalogLinks}
        />
      </div>
    </main>
  );
}
