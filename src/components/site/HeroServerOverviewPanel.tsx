import { Suspense } from "react";
import { HeroOnlineMonitorClient } from "@/components/site/HeroOnlineMonitorClient";
import { HeroPlanTopOnlineSection } from "@/components/site/HeroPlanServerShowcase";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { SoftAppear } from "@/components/site/SoftAppear";
import { fetchPlanTopOnlinePlayers } from "@/lib/lc-plan";
import { cn } from "@/lib/utils";

const panelClass = cn(
  lcGlassPanelClass,
  "bg-[color-mix(in_srgb,#000_20%,transparent)] shadow-[0_16px_52px_rgba(0,0,0,0.28)]",
);

function PlanTopFallback() {
  return (
    <div className="mt-10 border-t border-white/[0.06] pt-10 md:mt-12 md:pt-12">
      <div
        className={cn(
          "rounded-2xl border border-white/[0.08] bg-black/[0.12] px-4 py-12 text-center text-sm text-[var(--mc-text-muted)] md:py-14",
          "lc-skeleton-breathe",
        )}
      >
        Завантаження топу гравців…
      </div>
    </div>
  );
}

async function HeroPlanTopBlock() {
  const planData = await fetchPlanTopOnlinePlayers(10);

  return (
    <div className="mt-10 border-t border-white/[0.06] pt-10 md:mt-12 md:pt-12">
      <SoftAppear slow>
        {planData ? (
          <HeroPlanTopOnlineSection data={planData} />
        ) : (
          <div className="rounded-2xl border border-white/[0.1] bg-black/[0.2] px-4 py-8 text-center text-sm leading-relaxed text-[var(--mc-text-muted)]">
            Не вдалося завантажити статистику Plan. Перевірте з’єднання або
            змінну{" "}
            <span className="whitespace-nowrap font-mono text-[var(--mc-text-subtle)]">
              LC_PLAN_BASE_URL
            </span>
            .
          </div>
        )}
      </SoftAppear>
    </div>
  );
}

/**
 * Єдина панель: графік онлайну + топ-10 за загальним часом (активний + AFK, Plan).
 * Топ підвантажується окремим потоком — графік з’являється без очікування всіх `/v1/player`.
 */
export function HeroServerOverviewPanel() {
  return (
    <section
      className={panelClass}
      aria-label="Хронологія онлайну та рейтинг за загальним часом на сервері"
    >
      <div className="pt-6 md:pt-8">
        <HeroOnlineMonitorClient embedded />
      </div>

      <Suspense fallback={<PlanTopFallback />}>
        <HeroPlanTopBlock />
      </Suspense>
    </section>
  );
}
