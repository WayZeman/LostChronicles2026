"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Трохи довша анімація для великих секцій */
  slow?: boolean;
};

/**
 * Плавна поява після монтування (dynamic import, підвантажений RSC).
 * До гідрації контент прихований, щоб уникнути спалаху.
 */
export function SoftAppear({ children, className, slow }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(true);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setShow(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "will-change-[opacity,transform]",
        !show && "opacity-0",
        show && cn("lc-stream-in", slow && "lc-stream-in-slow"),
        className,
      )}
    >
      {children}
    </div>
  );
}
