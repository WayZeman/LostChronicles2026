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
      className={cn("pointer-events-none absolute z-[6] size-0", className)}
      style={style}
      aria-hidden
    />
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
