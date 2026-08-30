"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  isLcFeatureRestricted,
  isLcMigrationNoticeActive,
  LC_RESTRICTION_INFO,
  type LcRestrictedFeature,
} from "@/lib/lc-migration";
import { cn } from "@/lib/utils";

type MigrationRestrictionContextValue = {
  noticeActive: boolean;
  isRestricted: (feature: LcRestrictedFeature) => boolean;
  showRestriction: (feature: LcRestrictedFeature) => void;
};

const MigrationRestrictionContext =
  createContext<MigrationRestrictionContextValue | null>(null);

export function useMigrationRestriction(): MigrationRestrictionContextValue {
  const ctx = useContext(MigrationRestrictionContext);
  if (!ctx) {
    throw new Error(
      "useMigrationRestriction must be used within MigrationRestrictionProvider",
    );
  }
  return ctx;
}

function RestrictionDialog({
  feature,
  onClose,
}: {
  feature: LcRestrictedFeature;
  onClose: () => void;
}) {
  const info = LC_RESTRICTION_INFO[feature];

  return (
    <div className="lc-migration-dialog" role="presentation">
      <button
        type="button"
        aria-label="Закрити"
        className="lc-migration-dialog__scrim"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="lc-migration-dialog-title"
        aria-describedby="lc-migration-dialog-desc"
        className="lc-migration-dialog__card mc-frame"
      >
        <button
          type="button"
          onClick={onClose}
          className="lc-migration-dialog__close lc-focus-ring"
          aria-label="Закрити"
        >
          <X className="size-4" aria-hidden />
        </button>
        <div className="lc-migration-dialog__icon-wrap" aria-hidden>
          <AlertTriangle className="size-6 text-amber-200" strokeWidth={2.25} />
        </div>
        <h2
          id="lc-migration-dialog-title"
          className="lc-migration-dialog__title"
        >
          {info.title}
        </h2>
        <p id="lc-migration-dialog-desc" className="lc-migration-dialog__text">
          {info.reason}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="lc-migration-dialog__ok lc-focus-ring lc-btn-accent mt-4 w-full py-2.5 text-sm font-bold"
        >
          Зрозуміло
        </button>
      </div>
    </div>
  );
}

export function MigrationRestrictionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [feature, setFeature] = useState<LcRestrictedFeature | null>(null);
  const noticeActive = isLcMigrationNoticeActive();

  const isRestricted = useCallback(
    (f: LcRestrictedFeature) => isLcFeatureRestricted(f),
    [],
  );

  const showRestriction = useCallback((f: LcRestrictedFeature) => {
    setFeature(f);
  }, []);

  const value = useMemo(
    () => ({ noticeActive, isRestricted, showRestriction }),
    [noticeActive, isRestricted, showRestriction],
  );

  return (
    <MigrationRestrictionContext.Provider value={value}>
      {children}
      {feature ? (
        <RestrictionDialog feature={feature} onClose={() => setFeature(null)} />
      ) : null}
    </MigrationRestrictionContext.Provider>
  );
}

type RestrictedFeatureTriggerProps = {
  feature: LcRestrictedFeature;
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  "aria-current"?: React.AriaAttributes["aria-current"];
  onClick?: () => void;
};

/** Посилання, яке при обмеженні показує причину замість переходу. */
export function RestrictedFeatureLink({
  feature,
  href,
  className,
  children,
  onClick,
  ...a11y
}: RestrictedFeatureTriggerProps) {
  const { isRestricted, showRestriction } = useMigrationRestriction();

  if (!isRestricted(feature)) {
    return (
      <Link href={href} className={className} onClick={onClick} {...a11y}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(className, "cursor-pointer")}
      onClick={() => showRestriction(feature)}
      {...a11y}
    >
      {children}
    </button>
  );
}
