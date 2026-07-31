"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Коротка м’яка поява контенту при зміні вкладки / маршруту.
 * Перший захід на сайт лишає лише `.lc-page-enter` з layout — без подвійної анімації.
 */
export function RouteEnter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isInitial = useRef(true);

  useEffect(() => {
    isInitial.current = false;
  }, []);

  return (
    <div
      key={pathname}
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col",
        !isInitial.current && "lc-route-enter",
      )}
    >
      {children}
    </div>
  );
}
