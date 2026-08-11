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

/** Псевдовипадкове місце в смужці (новий seed — інший розкид). */
function scatterStyle(index: number, seed: number): CSSProperties {
  const golden = 2.618033988749895;
  const t = (index + 3) * golden + seed * 0.61;
  const left =
    2 +
    (((Math.sin(t * 4.11) * 0.5 + 0.5) * 88 + (index * 31 + seed * 3) % 17) %
      93);
  const top =
    5 +
    (((Math.cos(t * 3.37) * 0.5 + 0.5) * 80 + (index * 19 + seed * 5) % 23) %
      84);
  const wiggleX = ((index * 53 + seed * 11) % 13) - 6;
  const wiggleY = ((index * 37 + seed * 9) % 15) - 7;
  return {
    top: `${Math.max(3, Math.min(92, top + wiggleY))}%`,
    left: `${Math.max(2, Math.min(95, left + wiggleX))}%`,
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
  const seed =
    ids.reduce((acc, id, i) => acc + id.charCodeAt(0) * (i + 3), 17) % 131;
  return (
    <div
      className={cn(
        "pointer-events-none relative my-4 min-h-[6rem] w-full sm:min-h-[7rem]",
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
