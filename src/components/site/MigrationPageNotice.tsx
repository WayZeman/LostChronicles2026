"use client";

import { useMigrationRestriction } from "@/components/site/MigrationRestriction";
import { LC_RESTRICTION_INFO } from "@/lib/lc-migration";

type Props = {
  feature: "wiki" | "proposals";
};

/** Повідомлення на сторінці, якщо користувач зайшов напряму за URL. */
export function MigrationPageNotice({ feature }: Props) {
  const { noticeActive } = useMigrationRestriction();
  if (!noticeActive) return null;

  const info = LC_RESTRICTION_INFO[feature];

  return (
    <div
      className="mb-4 border-2 border-amber-500/55 bg-amber-500/12 px-3 py-3 text-sm text-amber-50"
      role="status"
    >
      <p className="font-bold text-amber-100">{info.title}</p>
      <p className="mt-1.5 leading-relaxed text-amber-50/95">{info.reason}</p>
    </div>
  );
}
