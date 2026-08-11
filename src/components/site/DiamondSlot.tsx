import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Якір для діаманта, що скролиться разом зі сторінкою. */
export function DiamondSlot({
  id,
  className,
  style,
}: {
  id: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      data-diamond-slot={id}
      className={cn(
        "pointer-events-none absolute z-[6] size-12 sm:size-14",
        className,
      )}
      style={style}
      aria-hidden
    />
  );
}

/** Псевдовипадкове місце в смужці (без рівних рядів / діагоналей). */
function scatterStyle(index: number, seed: number): CSSProperties {
  const golden = 2.399963229728653;
  const t = (index + 1) * golden + seed * 0.37;
  const left = 3 + ((Math.sin(t * 3.17) * 0.5 + 0.5) * 90 + (index * 17) % 11) % 94;
  const top =
    6 + ((Math.cos(t * 2.71) * 0.5 + 0.5) * 78 + (index * 23 + seed) % 19) % 86;
  const wiggleX = ((index * 41 + seed * 7) % 9) - 4;
  const wiggleY = ((index * 29 + seed * 3) % 11) - 5;
  return {
    top: `${Math.max(4, Math.min(90, top + wiggleY))}%`,
    left: `${Math.max(2, Math.min(94, left + wiggleX))}%`,
  };
}

/** Смужка запасних якорів — хаотичний розкид, не в лінію. */
export function DiamondSlotStrip({
  ids,
  className,
}: {
  ids: string[];
  className?: string;
}) {
  const seed = ids.reduce((acc, id) => acc + id.charCodeAt(0), 0) % 97;
  return (
    <div
      className={cn(
        "pointer-events-none relative my-4 min-h-[5.5rem] w-full sm:min-h-[6.5rem]",
        className,
      )}
      aria-hidden
    >
      {ids.map((id, i) => (
        <DiamondSlot
          key={id}
          id={id}
          className="!absolute"
          style={scatterStyle(i, seed)}
        />
      ))}
    </div>
  );
}

/** Корінь сторінки: діаманти з kind=page кріпляться сюди і їдуть зі скролом. */
export function DiamondPageRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-diamond-page className={cn("relative", className)}>
      {children}
    </div>
  );
}
