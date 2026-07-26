import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { HeroOnlineMonitorClient } from "@/components/site/HeroOnlineMonitorClient";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { getLcPlanPanelServerUrl } from "@/lib/lc-plan";
import { cn } from "@/lib/utils";

/**
 * Єдина панель: графік онлайну (Java server) + live-оновлення.
 */
export function HeroServerOverviewPanel() {
  return (
    <section
      className={cn(lcGlassPanelClass, "lc-interactive-panel-static")}
      aria-label="Хронологія онлайну на сервері"
    >
      <h2 className="lc-section-title text-center text-lg uppercase md:text-xl">
        Онлайн сервера
      </h2>
      <div className="mt-4 md:mt-5">
        <HeroOnlineMonitorClient embedded />
      </div>

      <div className="mt-5 flex justify-center md:mt-6">
        <Link
          href={getLcPlanPanelServerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="lc-focus-ring mc-btn-secondary inline-flex min-h-11 items-center gap-2 px-6 py-2.5 text-sm"
        >
          Повна аналітика
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
