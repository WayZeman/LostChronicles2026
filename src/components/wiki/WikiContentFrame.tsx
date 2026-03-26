import type { ReactNode } from "react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
};

/** Скляна картка як на /map — вікі / новини. */
export function WikiContentFrame({ children }: Props) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div
        className={cn(
          lcGlassPanelClass,
          "overflow-hidden px-4 py-7 md:px-8 md:py-9",
        )}
      >
        {children}
      </div>
    </div>
  );
}
