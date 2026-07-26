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
      className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] z-[100] overflow-hidden rounded-[var(--radius)] border-2 border-[var(--mc-nav-border)] bg-[var(--mc-nav-bg)] shadow-[var(--mc-nav-shadow)] sm:inset-x-3"
      style={{
        paddingBottom:
          "max(0.35rem, calc(env(safe-area-inset-bottom, 0px) * 0.35))",
        paddingTop: "0.35rem",
      }}
      aria-label="Головна навігація"
    >
      <div className="mx-auto flex w-full max-w-4xl items-stretch justify-around gap-0.5 px-1 md:px-2">
        {bottomNavLinks.map(({ href, label, Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "lc-focus-ring flex min-h-[3.15rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius)] px-0.5 py-1 text-[9px] font-bold leading-tight transition-colors duration-150 min-[380px]:text-[10px] md:min-h-[3.4rem] md:gap-1 md:px-1.5 md:text-xs",
                active
                  ? "bg-[var(--mc-net-green)] text-[var(--mc-green-ink)] shadow-[0_2px_0_#1e6410]"
                  : "text-[var(--mc-nav-link)] hover:bg-[var(--mc-nav-link-hover-bg)] hover:text-[var(--mc-text)]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-[1.15rem] shrink-0 sm:size-[1.25rem] md:size-[1.3rem]",
                  active ? "text-[var(--mc-green-ink)]" : "opacity-90",
                )}
                strokeWidth={active ? 2.5 : 2}
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
