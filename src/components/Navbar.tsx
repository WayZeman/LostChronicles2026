"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CircleHelp,
  ClipboardList,
  Home,
  Map as MapIcon,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/news", label: "Новини", Icon: Newspaper },
  { href: "/map", label: "Мапа", Icon: MapIcon },
  { href: "/proposals", label: "Голосування", Icon: ClipboardList },
  { href: "/wiki", label: "Вікі", Icon: BookOpen },
  { href: "/faq", label: "FAQ", Icon: CircleHelp },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname === "";
  }
  if (href === "/wiki") {
    return pathname === "/wiki" || pathname.startsWith("/wiki/");
  }
  if (href === "/proposals") {
    return pathname === "/proposals" || pathname.startsWith("/proposals/");
  }
  return pathname === href;
}

const bottomNavLinks = [
  { href: "/", label: "Головна", Icon: Home },
  ...links,
] as const;

/** Нижня навігація на всіх екранах — той самий набір, стиль Laby/LC. */
export function Navbar() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="lc-bottom-nav mc-frame" aria-label="Головна навігація">
      <div className="mx-auto flex w-full items-stretch justify-around gap-0.5 px-1 md:px-2">
        {bottomNavLinks.map(({ href, label, Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "lc-focus-ring lc-bottom-link flex min-h-[3.15rem] min-w-0 flex-1 flex-col items-center justify-center gap-0 px-0.5 py-1 text-[9px] font-semibold leading-tight min-[380px]:text-[10px] sm:gap-0.5 md:min-h-[3.4rem] md:gap-1 md:px-1.5 md:text-xs",
                active ? "is-active" : null,
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-[1.25rem] shrink-0 md:size-[1.3rem]",
                  active ? "text-[var(--mc-on-gold)]" : "opacity-90",
                )}
                strokeWidth={active ? 2.5 : 2}
                aria-hidden
              />
              <span className="hidden max-w-full truncate sm:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
