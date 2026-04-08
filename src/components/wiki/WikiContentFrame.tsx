import type { ReactNode } from "react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
};

/** Обгортка вікі / новин — той самий скляний стиль, що картка на /map. */
export function WikiContentFrame({ children }: Props) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className={cn(lcGlassPanelClass, "overflow-hidden p-0")}>
        <div className="px-5 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  );
}
