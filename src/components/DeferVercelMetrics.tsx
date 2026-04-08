"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Підвантажує Vercel Analytics / Speed Insights після простою,
 * щоб не конкурувати з першим малюванням сторінки на слабкому інтернеті.
 */
export function DeferVercelMetrics() {
  const [node, setNode] = useState<ReactNode>(null);

  useEffect(() => {
    const load = async () => {
      const [{ Analytics }, { SpeedInsights }] = await Promise.all([
        import("@vercel/analytics/react"),
        import("@vercel/speed-insights/next"),
      ]);
      setNode(
        <>
          <Analytics />
          <SpeedInsights />
        </>,
      );
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => void load(), {
        timeout: 5000,
      });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(() => void load(), 2200);
    return () => window.clearTimeout(t);
  }, []);

  return node;
}
