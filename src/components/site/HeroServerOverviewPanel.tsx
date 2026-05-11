import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { HeroOnlineMonitorClient } from "@/components/site/HeroOnlineMonitorClient";
import { getLcPlanPanelServerUrl } from "@/lib/lc-plan";
import { cn } from "@/lib/utils";

const panelClass = cn(
  // У `HeroOnlineMonitorClient embedded` всередині є своя рамка (`lc-interactive-panel-embed`).
  // Щоб не було "двох рамок", зовнішній контейнер робимо без border/shadow.
  // Також прибираємо напівпрозору "заливку", щоб не виглядало як другий шар поверх графіка.
  "w-full",
);

/**
 * Єдина панель: графік онлайну (Java server) + live-оновлення.
 */
export function HeroServerOverviewPanel() {
  return (
    <section
      className={panelClass}
      aria-label="Хронологія онлайну на сервері"
    >
      <div className="pt-6 md:pt-8">
        <HeroOnlineMonitorClient embedded />
      </div>

      <div className="mt-6 flex justify-center md:mt-10">
        <Link
          href={getLcPlanPanelServerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center gap-2 px-7 py-2.5 text-sm"
        >
          Повна аналітика
          <ExternalLink className="size-3 opacity-60" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
