import { HeroLatestShort } from "@/components/site/HeroLatestShort";
import { HeroSocialLinks } from "@/components/site/HeroSocialLinks";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { getLatestYoutubeShort } from "@/lib/youtube-channel-latest-video";
import { cn } from "@/lib/utils";

/**
 * Одна комірка: зліва фото (соцмережі внизу по центру фото), справа Shorts впритул.
 */
export async function HeroSocialPanel() {
  const latestShort = await getLatestYoutubeShort();

  return (
    <section
      className={cn(
        lcGlassPanelClass,
        "lc-interactive-panel-static relative overflow-hidden !p-0",
      )}
      aria-label="Соціальні мережі Lost Chronicles"
    >
      <h2 className="sr-only">Ми в соцмережах</h2>

      <div
        className={cn(
          "grid min-h-[18.5rem] sm:min-h-[22.5rem] md:min-h-[26.5rem]",
          latestShort
            ? "grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-[minmax(0,1fr)]"
            : "grid-cols-1",
        )}
      >
        {/* Ліва частина комірки — фото */}
        <div className="relative min-h-0 min-w-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/social-mascot.png?v=13"
            alt=""
            width={1024}
            height={1024}
            decoding="async"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-3 z-0 h-[calc(100%+1.25rem)] w-full sm:top-4 sm:h-[calc(100%+1.5rem)]",
              "object-cover object-[20%_top] select-none sm:object-left-top",
            )}
            aria-hidden
          />

          {/* Соцмережі — тільки на фото, знизу по центру */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-2 pb-3 sm:px-3 sm:pb-4">
            <HeroSocialLinks hideTitle layout="row" />
          </div>
        </div>

        {/* Shorts — лише з sm+; на мобільному приховано */}
        {latestShort ? (
          <div className="hidden h-full min-h-0 sm:block sm:w-[12.65625rem] md:w-[14.90625rem]">
            <HeroLatestShort
              videoId={latestShort.id}
              className="mc-frame !h-full !w-full !rounded-none"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
