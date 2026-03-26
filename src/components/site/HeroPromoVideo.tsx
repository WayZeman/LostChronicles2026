import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

/** Відео під hero: та сама ширина й «скло», що й блок моніторингу онлайну. */
const PROMO_VIDEO_ID = "OQpRfs5GKyk";

export function HeroPromoVideo() {
  return (
    <div className="w-full" aria-label="Відео про сервер Lost Chronicles на YouTube">
      <div
        className={cn(
          lcGlassPanelClass,
          "overflow-hidden !p-0 bg-white/40 dark:bg-black/38 dark:shadow-[0_8px_36px_rgba(0,0,0,0.34)]",
        )}
      >
        <div className="relative aspect-video w-full bg-black/5 dark:bg-black/20">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${PROMO_VIDEO_ID}?rel=0`}
            className="absolute inset-0 h-full w-full border-0"
            title="Lost Chronicles — відео на YouTube"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}
