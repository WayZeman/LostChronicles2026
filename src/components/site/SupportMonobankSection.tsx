import { ExternalLink, HeartHandshake } from "lucide-react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

const DEFAULT_JAR_URL = "https://send.monobank.ua/jar/8f7nV8DopG";

/**
 * Блок підтримки через monobank (без прогрес-бару).
 * Посилання: NEXT_PUBLIC_MONO_JAR_URL або банка за замовчуванням.
 */
export function SupportMonobankSection() {
  const jarUrl = process.env.NEXT_PUBLIC_MONO_JAR_URL?.trim() || DEFAULT_JAR_URL;

  return (
    <section
      className={cn(
        lcGlassPanelClass,
        "am-reveal am-delay-3 mt-12 flex flex-col items-center text-center md:mt-16",
      )}
      aria-labelledby="support-mono-heading"
    >
      <div
        className="flex size-14 items-center justify-center rounded-full border border-[var(--mc-border-card)] bg-[var(--mc-vote-bg)] text-[var(--mc-net-green)] shadow-sm md:size-16"
        aria-hidden
      >
        <HeartHandshake className="size-7 md:size-8" strokeWidth={2} />
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--mc-net-green)]">
        Добровільна підтримка
      </p>

      <h2
        id="support-mono-heading"
        className="lc-hero-title mt-2 max-w-md text-2xl font-extrabold leading-tight text-[var(--mc-text)] md:text-3xl"
      >
        <span className="block">Допоможіть тримати</span>
        <span className="mt-1 block">
          <span className="text-[var(--mc-net-green)]">Lost Chronicles</span> онлайн
        </span>
      </h2>

      <div className="mt-4 max-w-lg space-y-3 text-sm font-medium leading-relaxed text-[var(--mc-text-muted)] md:text-base">
        <p>Сервер існує завдяки внескам гравців і команди.</p>
        <p>
          Якщо вам важливий цей проєкт, можна підтримати його будь-якою комфортною сумою — усі перекази йдуть
          через офіційну банку monobank.
        </p>
      </div>

      <a
        href={jarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="lc-focus-ring mt-8 inline-flex w-full max-w-md min-h-[3rem] items-center justify-center gap-2 rounded-sm border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-6 py-3.5 text-base font-bold text-[var(--mc-green-ink)] transition-colors hover:bg-[var(--mc-vote-bg-hover)] md:min-h-[3.25rem] md:text-lg"
      >
        <HeartHandshake className="size-5 shrink-0 opacity-90" aria-hidden />
        Підтримати в monobank
        <ExternalLink className="size-4 shrink-0 opacity-70" aria-hidden />
      </a>
    </section>
  );
}
