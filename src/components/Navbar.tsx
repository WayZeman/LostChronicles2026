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
  { href: "/proposals", label: "Пропозиції", Icon: ClipboardList },
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

/** Єдина навігація: нижня панель на всіх розмірах екрана. */
export function Navbar() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[100] border-t-2 border-[var(--mc-nav-border)] bg-[var(--mc-nav-bg)] shadow-[var(--mc-nav-shadow)] backdrop-blur-md"
      style={{
        paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))",
        paddingTop: "0.35rem",
      }}
      aria-label="Головна навігація"
    >
      <div className="mx-auto flex w-full max-w-4xl items-stretch justify-around px-1 md:px-4">
        {bottomNavLinks.map(({ href, label, Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "lc-focus-ring flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-1 text-[9px] font-bold leading-tight transition-colors duration-200 min-[380px]:text-[10px] md:min-h-[3.5rem] md:gap-1 md:px-2 md:text-xs",
                active
                  ? "text-[var(--mc-net-green)]"
                  : "text-[var(--mc-nav-link)] hover:bg-[var(--mc-nav-link-hover-bg)] md:rounded-lg",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-[1.2rem] shrink-0 sm:size-[1.35rem] md:size-[1.4rem]",
                  active ? "text-[var(--mc-net-green)]" : "opacity-90",
                )}
                strokeWidth={active ? 2.25 : 2}
                aria-hidden
              />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
