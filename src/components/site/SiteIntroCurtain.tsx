"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getServerAgeParts,
  isServerAnniversary,
  ukYearsWord,
} from "@/lib/lc-server-age";
import { cn } from "@/lib/utils";

const MIN_VISIBLE_MS = 720;
const MAX_WAIT_MS = 9000;

/** Лише активи головної — не тягнемо їх на вікі/FAQ. */
const CRITICAL_ASSETS = [
  "/logo.png",
  "/lc-logo-hero-v2.png",
  "/bg-ivy-stone.jpg",
  "/bg-ivy-stone-portrait.jpg",
  "/social-mascot.png?v=13",
  "/server-online-zombie.png?v=3",
  "/server-status-online.png?v=8",
  "/server-status-offline.png?v=8",
  "/support-gold-pile.png",
] as const;

type Phase = "shown" | "lifting" | "gone";

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const done = () => resolve();
    img.onload = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(done).catch(done);
      } else {
        done();
      }
    };
    img.onerror = done;
    img.src = src;
  });
}

function waitForWindowLoad(): Promise<void> {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

function waitForFonts(): Promise<void> {
  if (!document.fonts?.ready) return Promise.resolve();
  return document.fonts.ready.then(() => undefined).catch(() => undefined);
}

async function waitUntilSiteReady(): Promise<void> {
  const minHold = new Promise<void>((resolve) => {
    window.setTimeout(resolve, MIN_VISIBLE_MS);
  });
  const hardCap = new Promise<void>((resolve) => {
    window.setTimeout(resolve, MAX_WAIT_MS);
  });

  const assets = Promise.all([
    waitForWindowLoad(),
    waitForFonts(),
    ...CRITICAL_ASSETS.map((src) => preloadImage(src)),
  ]).then(() => undefined);

  await Promise.all([minHold, Promise.race([assets, hardCap])]);
}

/**
 * Інтро-шторка лише на головній; у день річниці — тепліша.
 */
export function SiteIntroCurtain() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [phase, setPhase] = useState<Phase>(isHome ? "shown" : "gone");
  const anniversary = useMemo(() => {
    if (!isServerAnniversary()) return null;
    const years = getServerAgeParts().years;
    if (years < 1) return null;
    return years;
  }, []);

  useEffect(() => {
    if (!isHome) {
      document.documentElement.classList.remove("lc-intro-pending");
      document.documentElement.classList.add("lc-intro-skip");
      setPhase("gone");
      return;
    }

    let cancelled = false;

    document.documentElement.classList.add("lc-intro-pending");
    document.documentElement.classList.remove("lc-intro-skip");
    if (anniversary != null) {
      document.documentElement.classList.add("lc-anniversary");
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void (async () => {
      await waitUntilSiteReady();
      if (cancelled) return;

      if (reduce) {
        document.documentElement.classList.remove("lc-intro-pending");
        setPhase("gone");
        return;
      }

      setPhase("lifting");
    })();

    return () => {
      cancelled = true;
    };
  }, [anniversary, isHome]);

  if (!isHome || phase === "gone") return null;

  return (
    <div
      className={cn(
        "lc-intro-curtain",
        anniversary != null && "lc-intro-curtain--anniversary",
        phase === "lifting" && "lc-intro-curtain--lift",
      )}
      role="status"
      aria-live="polite"
      aria-busy={phase === "shown"}
      aria-label={
        anniversary != null
          ? `З річницею Lost Chronicles — ${anniversary} ${ukYearsWord(anniversary)}`
          : "Завантаження Lost Chronicles"
      }
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget) return;
        if (phase !== "lifting") return;
        if (e.propertyName !== "transform") return;
        document.documentElement.classList.remove("lc-intro-pending");
        setPhase("gone");
      }}
    >
      <div className="lc-intro-curtain__bg" aria-hidden />
      <div className="lc-intro-curtain__vignette" aria-hidden />

      <div className="lc-intro-curtain__content">
        <div className="lc-intro-curtain__logo-wrap">
          <Image
            src="/lc-logo-hero-v2.png"
            alt="Lost Chronicles"
            width={900}
            height={606}
            priority
            unoptimized
            className="lc-intro-curtain__logo"
            draggable={false}
          />
        </div>
        <p className="lc-intro-curtain__hint">
          {anniversary != null
            ? `З річницею · ${anniversary} ${ukYearsWord(anniversary)}`
            : "Завантаження світу…"}
        </p>
        <div className="lc-intro-curtain__bar mc-frame" aria-hidden>
          <span className="lc-intro-curtain__bar-fill" />
        </div>
      </div>

      <div className="lc-intro-curtain__hem" aria-hidden />
    </div>
  );
}
