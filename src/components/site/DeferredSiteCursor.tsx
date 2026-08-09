"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SiteCursorInner = dynamic(
  () => import("@/components/site/SiteCursor").then((m) => m.SiteCursor),
  { ssr: false },
);

/**
 * Кастомний курсор: не на адмінці/вікі-редакторі, і лише після idle
 * (не конкурує з першим малюванням).
 */
export function DeferredSiteCursor() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const skip =
    pathname.startsWith("/admin") ||
    pathname.includes("/edit") ||
    pathname.startsWith("/wiki/new");

  useEffect(() => {
    if (skip) {
      setReady(false);
      return;
    }
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(enable, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(enable, 900);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [skip]);

  if (skip || !ready) return null;
  return <SiteCursorInner />;
}
