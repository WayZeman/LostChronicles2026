import {
  Box,
  ExternalLink,
  MessageCircle,
  Pickaxe,
} from "lucide-react";
import { HeroBedrockPanel } from "@/components/site/HeroBedrockPanel";
import { HeroJoinPanel } from "@/components/site/HeroJoinPanel";
import { HeroOnlineMonitor } from "@/components/site/HeroOnlineMonitor";
import { HeroPromoVideo } from "@/components/site/HeroPromoVideo";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { SupportMonobankSection } from "@/components/site/SupportMonobankSection";

const defaultDescription =
  "Місце, де українські гравці об’єднуються, щоб створювати пригоди, знаходити друзів і будувати власні цивілізації у живому світі історій.";

/** Інакше NEXT_PUBLIC_* «запікається» в статичний HTML під час build і не оновиться без перезбірки. */
export const dynamic = "force-dynamic";

export default function Home() {
  const settings = {
    ip: process.env.NEXT_PUBLIC_SERVER_IP?.trim() || "play.lost-chronicles.site",
    version: process.env.NEXT_PUBLIC_SERVER_VERSION?.trim() || "1.21.7",
    description: process.env.NEXT_PUBLIC_SERVER_DESCRIPTION?.trim() || defaultDescription,
    bedrockAddress:
      process.env.NEXT_PUBLIC_BEDROCK_ADDRESS?.trim() || "play.lost-chronicles.site",
    bedrockPort: process.env.NEXT_PUBLIC_BEDROCK_PORT?.trim() || "19132",
  };

  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL;
  const voteUrl = process.env.NEXT_PUBLIC_VOTE_URL;

  return (
    <main className="relative flex-1">
      <div className="site-container mx-auto w-full max-w-4xl px-4 pb-16 md:pb-24">
        <section className="am-reveal flex flex-col items-center pt-10 text-center md:pt-16">
          <h1
            className="lc-hero-title max-w-[min(100%,36rem)] text-[clamp(2.75rem,9vw,4.25rem)] font-extrabold leading-[1.05] text-[var(--mc-text)]"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            Lost{" "}
            <span className="lc-hero-accent text-[var(--mc-net-green)]">Chronicles</span>
          </h1>
          <p className="lc-hero-lead mt-6 max-w-xl text-xl font-medium leading-relaxed text-black md:text-2xl dark:text-[var(--mc-text)]">
            {settings.description}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3 pb-2 md:pb-3">
            {discordUrl ? (
              <a
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lc-focus-ring mc-btn-secondary"
              >
                <MessageCircle className="size-4 text-[#5865F2]" aria-hidden />
                Discord
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            ) : null}
            {voteUrl ? (
              <a
                href={voteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lc-focus-ring inline-flex items-center gap-2 rounded-sm border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-5 py-2.5 text-sm font-bold text-[var(--mc-green-ink)] transition-colors hover:bg-[var(--mc-vote-bg-hover)]"
              >
                Підтримати голосом
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            ) : null}
          </div>
        </section>

        <div
          className="am-reveal am-delay-1 mt-10 flex w-full flex-col gap-8 md:mt-12 md:gap-10"
          aria-label="Онлайн та підключення до сервера"
        >
          <HeroPromoVideo />
          <HeroOnlineMonitor />
          <div className={lcGlassPanelClass}>
            <h2 className="lc-hero-title text-center text-xl font-extrabold text-[var(--mc-text)] md:text-2xl">
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
          </div>
        </div>

        <section
          className="am-reveal am-delay-2 mt-12 flex justify-center gap-2 md:mt-16"
          aria-hidden
        >
          {[Pickaxe, Box, Box, Box].map((Ic, i) => (
            <div
              key={i}
              className="mc-slot flex size-11 items-center justify-center rounded-sm text-[var(--mc-ink-subtle)] md:size-12"
            >
              <Ic className="size-5" strokeWidth={1.25} />
            </div>
          ))}
        </section>

        <SupportMonobankSection />
      </div>
    </main>
  );
}
