import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { HeroBedrockPanel } from "@/components/site/HeroBedrockPanel";
import { HeroJoinPanel } from "@/components/site/HeroJoinPanel";
import { PlayDiscoverJsonLd } from "@/components/site/PlayDiscoverJsonLd";
import { SoftAppear } from "@/components/site/SoftAppear";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import {
  lcPageContainerClass,
  lcPageMainClass,
} from "@/components/site/lc-page-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LC_APPLY_PATH } from "@/data/lost-chronicles-faq";
import {
  LC_PUBLIC_CATALOG_LINKS,
  lcListingDescriptionLong,
} from "@/data/lc-server-listings";
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
    title: "Пройдіть анкету",
    body: "Вхід через вайтлист. Заявка на сайті займає кілька хвилин — без черги в Discord.",
  },
  {
    title: "Дочекайтеся схвалення",
    body: "Коли анкету приймуть, нік додадуть на сервер. Після цього можна підключатися.",
  },
  {
    title: "Додайте IP у Minecraft",
    body: "Java — Multiplayer → Add Server. Bedrock — Servers → Add Server, той самий хост і порт нижче.",
  },
  {
    title: "Заходьте в світ",
    body: "Грайте українською, будуйте поселення і пишіть історію Lost Chronicles разом зі спільнотою.",
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

  const siteUrl = getLcMarketingSiteUrl();
  const listingCopy = lcListingDescriptionLong(settings.ip);
  const faqs = [
    {
      question: "Який IP українського Minecraft-сервера Lost Chronicles?",
      answer: `Java: ${settings.ip}. Це офіційна адреса Lost Chronicles (Лост Хроніклс).`,
    },
    {
      question: "Яка версія Minecraft потрібна?",
      answer: `Актуальна версія Java — ${settings.version}. Підтримуються сусідні 1.21.x; точне значення дивіться на цій сторінці.`,
    },
    {
      question: "Чи можна зайти з телефона або консолі (Bedrock)?",
      answer: `Так. Bedrock: ${settings.bedrockAddress}, порт ${settings.bedrockPort}. Java і Bedrock грають разом.`,
    },
    {
      question: "Як потрапити на сервер, якщо стоїть вайтлист?",
      answer: `Заповніть анкету на сайті (${LC_APPLY_PATH}). Після схвалення нік з’явиться в білому списку.`,
    },
    {
      question: "Де знайти Lost Chronicles у пошуку каталогів?",
      answer:
        "Шукайте «Lost Chronicles» або «Лост Хроніклс» на Minecraft.org.ua, MCUA.TOP, MoniCore та AllMC, або відкрийте посилання нижче на цій сторінці.",
    },
  ];

  return (
    <main className={lcPageMainClass}>
      <PlayDiscoverJsonLd
        siteUrl={siteUrl}
        ip={settings.ip}
        version={settings.version}
        bedrockAddress={settings.bedrockAddress}
        bedrockPort={settings.bedrockPort}
        faqs={faqs}
      />
      <div className={lcPageContainerClass}>
        <SoftAppear>
          <header className="mb-6 text-center sm:mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mc-text-muted)]">
              Minecraft Україна · Java + Bedrock · 1.21
            </p>
            <h1 className="lc-hero-title lc-hero-display mt-2 text-balance text-[clamp(1.45rem,4.4vw,2.35rem)] leading-tight text-[var(--mc-text)]">
              Як зайти на Lost Chronicles
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-[var(--mc-text-muted)] sm:text-[0.9375rem]">
              Lost Chronicles (Лост Хроніклс) — український ванільний RP-сервер.
              Скопіюйте IP, пройдіть анкету і грайте з ПК, телефона чи консолі.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={LC_APPLY_PATH}
                className="lc-focus-ring lc-btn-accent min-h-11 px-7 py-2.5 text-sm"
              >
                Подати анкету
              </Link>
              <Link
                href="/faq"
                className="lc-focus-ring mc-btn-secondary min-h-11 px-5 py-2.5 text-sm"
              >
                FAQ
              </Link>
            </div>
          </header>
        </SoftAppear>

        <SoftAppear>
          <section
            className={cn(lcGlassPanelClass, "relative")}
            aria-labelledby="lc-play-connect"
          >
            <h2
              id="lc-play-connect"
              className="lc-section-title text-center text-xl md:text-2xl"
            >
              IP сервера Lost Chronicles
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-[var(--mc-text-muted)]">
              Натисніть блок, щоб скопіювати. Шукайте нас як Lost Chronicles,
              Лост Хроніклс або {settings.ip}.
            </p>
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
          </section>
        </SoftAppear>

        <SoftAppear>
          <section
            className={cn(lcGlassPanelClass, "mt-6")}
            aria-labelledby="lc-play-steps"
          >
            <h2
              id="lc-play-steps"
              className="lc-section-title text-center text-xl md:text-2xl"
            >
              Чотири кроки, щоб зайти
            </h2>
            <ol className="mt-5 grid list-none gap-3 p-0 sm:grid-cols-2">
              {JOIN_STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-lg border border-[var(--mc-border-card)]/80 bg-[var(--mc-surface-elevated)]/40 px-4 py-3 text-left"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mc-text-muted)]">
                    Крок {i + 1}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-[var(--mc-text)]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </SoftAppear>

        <SoftAppear>
          <section className="mt-6" aria-labelledby="lc-play-faq">
            <h2
              id="lc-play-faq"
              className="lc-section-title mb-3 text-center text-xl md:text-2xl"
            >
              Короткі відповіді для пошуку
            </h2>
            <Accordion
              multiple={false}
              defaultValue={["play-faq-0"]}
              className={cn(lcGlassPanelClass, "overflow-hidden p-1.5 sm:p-4")}
            >
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={faq.question}
                  value={`play-faq-${i}`}
                  className="border-[var(--mc-border-card)]"
                >
                  <AccordionTrigger className="text-[0.9375rem] font-bold text-[var(--mc-ink)] hover:text-[var(--mc-net-green)] hover:no-underline sm:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-[var(--mc-border-card)]/80 px-2.5 pb-3 pt-2.5 text-left text-sm leading-relaxed text-[var(--mc-text)] sm:px-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </SoftAppear>

        <SoftAppear>
          <section
            className={cn(lcGlassPanelClass, "mt-6")}
            aria-labelledby="lc-play-catalogs"
          >
            <h2
              id="lc-play-catalogs"
              className="lc-section-title text-center text-xl md:text-2xl"
            >
              Де нас шукають у каталогах
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-[var(--mc-text-muted)]">
              Якщо Google ще не встиг — відкрийте українські моніторинги. Голос
              піднімає сервер у їхньому пошуку.
            </p>
            <ul className="mt-5 grid list-none gap-2 p-0 sm:grid-cols-2">
              {LC_PUBLIC_CATALOG_LINKS.map((cat) => (
                <li key={cat.href}>
                  <a
                    href={cat.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lc-focus-ring mc-btn-secondary flex min-h-11 w-full items-center justify-between gap-2 px-4 py-2.5 text-sm"
                  >
                    <span>
                      <span className="font-semibold">{cat.label}</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-[var(--mc-text-muted)]">
                        {cat.hint}
                      </span>
                    </span>
                    <ExternalLink className="size-3.5 shrink-0 opacity-60" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </SoftAppear>

        <SoftAppear>
          <section
            className={cn(lcGlassPanelClass, "mt-6")}
            aria-labelledby="lc-play-about"
          >
            <h2
              id="lc-play-about"
              className="lc-section-title text-center text-xl md:text-2xl"
            >
              Про сервер для каталогів
            </h2>
            <p className="mx-auto mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-[var(--mc-text)]">
              {listingCopy}
            </p>
          </section>
        </SoftAppear>
      </div>
    </main>
  );
}
