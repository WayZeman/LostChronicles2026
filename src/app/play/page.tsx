import type { Metadata } from "next";
import Link from "next/link";

import { HeroBedrockPanel } from "@/components/site/HeroBedrockPanel";
import { HeroJoinPanel } from "@/components/site/HeroJoinPanel";
import { PlayDiscoverJsonLd } from "@/components/site/PlayDiscoverJsonLd";
import { SoftAppear } from "@/components/site/SoftAppear";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import { LC_APPLY_PATH } from "@/data/lost-chronicles-faq";
import { LC_SEO_PLAY_DESCRIPTION, LC_SEO_PLAY_TITLE } from "@/data/lc-seo-terms";
import {
  LC_DEFAULT_BEDROCK_ADDRESS,
  LC_DEFAULT_JAVA_SERVER_HOST,
} from "@/lib/lc-server-defaults";
import { buildLcPageMetadata } from "@/lib/seo";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";
import { getConnectSettings } from "@/lib/site-content";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildLcPageMetadata({
  title: LC_SEO_PLAY_TITLE,
  description: LC_SEO_PLAY_DESCRIPTION,
  path: "/play",
});

const JOIN_STEPS = [
  {
    title: "Зайдіть на сервер",
    body: "Скопіюйте IP і додайте сервер у Minecraft. Java і Bedrock підключаються одразу.",
  },
  {
    title: "Заповніть анкету",
    body: "Щоб потрапити в основний світ, пройдіть анкету на сайті.",
  },
  {
    title: "Дочекайтеся відповіді",
    body: "Адміністратори перевіряють анкету і повідомляють, коли доступ до основного світу відкритий.",
  },
] as const;

export default async function PlayPage() {
  let settings = {
    ip: process.env.NEXT_PUBLIC_SERVER_IP?.trim() || LC_DEFAULT_JAVA_SERVER_HOST,
    version: process.env.NEXT_PUBLIC_SERVER_VERSION?.trim() || "1.21.11",
    bedrockAddress:
      process.env.NEXT_PUBLIC_BEDROCK_ADDRESS?.trim() || LC_DEFAULT_BEDROCK_ADDRESS,
    bedrockPort: process.env.NEXT_PUBLIC_BEDROCK_PORT?.trim() || "19132",
  };

  try {
    const connect = await getConnectSettings();
    settings = {
      ip: connect.javaIp,
      version: connect.javaVersion,
      bedrockAddress: connect.bedrockAddress,
      bedrockPort: connect.bedrockPort,
    };
  } catch {
    /* env fallback */
  }

  return (
    <main className={lcPageMainClass}>
      <PlayDiscoverJsonLd
        siteUrl={getLcMarketingSiteUrl()}
        ip={settings.ip}
        version={settings.version}
        bedrockAddress={settings.bedrockAddress}
        bedrockPort={settings.bedrockPort}
      />
      <div className={lcPageContainerClass}>
        <SoftAppear>
          <header className="mb-8 text-center">
            <h1 className="lc-hero-title lc-hero-display text-balance text-[clamp(1.45rem,4.4vw,2.35rem)] leading-tight text-[var(--mc-text)]">
              Як зайти на Lost Chronicles
            </h1>
            <Link
              href={LC_APPLY_PATH}
              className="lc-focus-ring lc-btn-accent mt-5 inline-flex min-h-11 items-center px-7 py-2.5 text-sm"
            >
              Подати анкету
            </Link>
          </header>
        </SoftAppear>

        <SoftAppear>
          <section aria-label="Java та Bedrock">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch md:gap-4">
              <HeroJoinPanel embedded ip={settings.ip} version={settings.version} />
              <HeroBedrockPanel
                embedded
                address={settings.bedrockAddress}
                port={settings.bedrockPort}
              />
            </div>
          </section>
        </SoftAppear>

        <SoftAppear>
          <section className={cn(lcGlassPanelClass, "mt-6")} aria-label="Як це працює">
            <ol className="mx-auto max-w-xl list-none divide-y divide-[var(--mc-border-card)]/80 p-0">
              {JOIN_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4 py-4 text-left first:pt-0 last:pb-0">
                  <span
                    className="mt-0.5 w-5 shrink-0 font-mono text-sm tabular-nums text-[var(--mc-text-muted)]"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[var(--mc-text)]">
                      {step.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </SoftAppear>
      </div>
    </main>
  );
}
