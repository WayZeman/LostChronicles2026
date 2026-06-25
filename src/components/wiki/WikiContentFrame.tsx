import type { ReactNode } from "react";
import {
  lcGlassPanelClass,
  lcGlassPanelStaticClass,
} from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  interactive?: boolean;
};

/** Обгортка вікі / новин — той самий скляний стиль, що картка на /map. */
export function WikiContentFrame({ children, interactive = true }: Props) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div
        className={cn(
          interactive ? lcGlassPanelClass : lcGlassPanelStaticClass,
          "overflow-hidden p-0",
        )}
      >
        <div className="px-5 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  );
}
