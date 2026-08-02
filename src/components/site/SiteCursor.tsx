"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const INTERACTIVE =
  'a,button,[role="button"],[role="link"],[role="tab"],[role="menuitem"],summary,label[for],select,.lc-focus-ring,.lc-btn-accent,.mc-btn-primary,.mc-btn-secondary,input[type="button"],input[type="submit"],input[type="checkbox"],input[type="radio"],input[type="file"],input[type="range"]';

/**
 * Маленький кастомний курсор — завжди поверх усіх шарів (модалок, форм, навбару).
 * Лише для миші (fine pointer + hover).
 */
export function SiteCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [down, setDown] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setEnabled(fine.matches);
    apply();
    fine.addEventListener("change", apply);
    return () => fine.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("lc-cursor-on");

    const onMove = (e: MouseEvent) => {
      const el = dotRef.current;
      if (el) {
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target || !(target instanceof Element)) {
        setHover(false);
        return;
      }
      setHover(Boolean(target.closest(INTERACTIVE)));
    };

    const onDown = () => setDown(true);
    const onUp = () => setDown(false);
    const onLeave = () => setHidden(true);
    const onEnter = () => setHidden(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      document.documentElement.classList.remove("lc-cursor-on");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [enabled]);

  if (!enabled || !mounted) return null;

  return createPortal(
    <div
      ref={dotRef}
      className={[
        "lc-site-cursor",
        hover ? "lc-site-cursor--hover" : "",
        down ? "lc-site-cursor--down" : "",
        hidden ? "lc-site-cursor--hidden" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    />,
    document.body,
  );
}
