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
        "pointer-events-none absolute z-[6] size-9 sm:size-10",
        className,
      )}
      style={style}
      aria-hidden
    />
  );
}

/** Смужка запасних якорів — завжди в DOM, щоб діаманти не «губилися». */
export function DiamondSlotStrip({
  ids,
  className,
}: {
  ids: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none relative my-3 min-h-[3rem] w-full sm:min-h-[3.5rem]",
        className,
      )}
      aria-hidden
    >
      {ids.map((id, i) => (
        <DiamondSlot
          key={id}
          id={id}
          className="!absolute"
          style={{
            top: `${18 + (i % 2) * 40}%`,
            left: `${6 + ((i * 19) % 82)}%`,
          }}
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
