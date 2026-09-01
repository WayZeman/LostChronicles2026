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
          "grid min-h-[18.5rem] grid-cols-1",
          latestShort
            ? "sm:min-h-[30rem] md:min-h-[32rem] sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-[minmax(0,1fr)]"
            : "sm:min-h-[30rem] md:min-h-[32rem]",
        )}
      >
        <div className="relative min-h-[18.5rem] min-w-0 overflow-hidden bg-[#1a2418]/80 sm:min-h-[30rem] md:min-h-[32rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/social-mascot.png?v=14"
            alt=""
            width={1024}
            height={1024}
            decoding="async"
            className={cn(
              "pointer-events-none absolute inset-0 z-0 h-full w-full select-none",
              "object-cover object-[54%_44%] sm:object-[55%_37%] md:object-[54%_35%]",
            )}
            aria-hidden
          />

          {/* Іконки на траві внизу фото — не перекривають табличку */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-2 pb-1.5 sm:px-3 sm:pb-2.5 md:pb-3">
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
