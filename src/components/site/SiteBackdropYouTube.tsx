"use client";

import { useLayoutEffect, useState } from "react";

const VIDEO_ID = "_5jELltfi9U";

/**
 * Повноекранний фон YouTube без звуку (mute), loop. Якщо обрано «менше руху» —
 * не завантажуємо відео, лишається fon.png з CSS.
 */
export function SiteBackdropYouTube() {
  const [active, setActive] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const on = !mq.matches;
      setActive(on);
      document.documentElement.classList.toggle("has-video-bg", on);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.classList.remove("has-video-bg");
    };
  }, []);

  if (!active) return null;

  const src = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&start=13&controls=0&loop=1&playlist=${VIDEO_ID}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`;

  return (
    <div className="mc-backdrop-youtube-wrap" aria-hidden>
      <iframe
        className="mc-backdrop-youtube-iframe"
        src={src}
        title="Фонове відео"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
