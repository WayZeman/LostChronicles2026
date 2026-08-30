"use client";

import { Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  isLcMigrationNoticeActive,
  LC_MIGRATION_BANNER_TEXT,
} from "@/lib/lc-migration";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "lc-migration-banner-dismissed";

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

/** Банер про обмеження після переїзду на новий домен (до 1 вересня включно). */
export function SiteMigrationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLcMigrationNoticeActive()) return;
    if (readDismissed()) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="lc-migration-banner"
      role="status"
      aria-live="polite"
    >
      <div className="lc-migration-banner__inner">
        <Info className="lc-migration-banner__icon size-4 shrink-0" aria-hidden />
        <p className="lc-migration-banner__text">
          <strong className="font-bold text-amber-50">Увага:</strong>{" "}
          {LC_MIGRATION_BANNER_TEXT}
        </p>
        <button
          type="button"
          onClick={() => {
            writeDismissed();
            setVisible(false);
          }}
          className={cn(
            "lc-migration-banner__close lc-focus-ring",
            "inline-flex shrink-0 items-center justify-center",
          )}
          aria-label="Закрити сповіщення до наступного відвідування"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
