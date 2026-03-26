import { cn } from "@/lib/utils";
import {
  lcGlassPanelCenteredClass,
  lcGlassPanelClass,
} from "@/components/site/lc-glass-panel";

export const heroPanelShellClass = cn(
  lcGlassPanelClass,
  "flex h-full w-full min-h-[280px] flex-col items-center text-center md:min-h-[300px] md:p-8",
);

/** Окрема картка як /map: один шар backdrop-blur — без зовнішнього «скла» поверх. */
export const heroPanelEmbeddedClass = cn(
  lcGlassPanelCenteredClass,
  "h-full min-h-[220px] md:min-h-[250px] md:p-7",
);
