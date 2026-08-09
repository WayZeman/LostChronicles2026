import type { ReactNode } from "react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  topSlot?: ReactNode;
};

/** Обгортка вікі — кам’яна панель сайту. */
export function WikiContentFrame({ children, topSlot }: Props) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className={cn(lcGlassPanelClass, "overflow-hidden p-0")}>
        <div className="px-3 py-5 sm:px-6 sm:py-8 md:px-10 md:py-10">
          {topSlot ? <div className="mb-6 md:mb-8">{topSlot}</div> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
