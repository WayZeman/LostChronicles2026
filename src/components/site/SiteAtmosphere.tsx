"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const AtmosphereParticles = dynamic(
  () =>
    import("@/components/site/AtmosphereParticles").then(
      (m) => m.AtmosphereParticles,
    ),
  { ssr: false },
);

const AnniversaryAtmosphere = dynamic(
  () =>
    import("@/components/site/AnniversaryAtmosphere").then(
      (m) => m.AnniversaryAtmosphere,
    ),
  { ssr: false },
);

/**
 * Важкі canvas-ефекти лише на головній — на вікі/FAQ/адмінці не витрачаємо CPU.
 */
export function SiteAtmosphere() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <>
      <AnniversaryAtmosphere />
      <AtmosphereParticles />
    </>
  );
}
