import { cn } from "@/lib/utils";

/** Спільне «скляне» вікно (рамка, blur, тіні). */
export const lcGlassPanelClass =
  "w-full rounded-xl border border-[var(--mc-border-card)] bg-white/45 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.08] dark:bg-black/25 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] md:p-5";

/** Те саме + вирівнювання як на /map (заголовок і кнопки по центру). */
export const lcGlassPanelCenteredClass = cn(
  lcGlassPanelClass,
  "flex flex-col items-center text-center",
);
