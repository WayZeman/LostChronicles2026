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

/** Єдина навігація: приклеєна до низу viewport на всіх розмірах екрана. */
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
              className={cn(
                "lc-focus-ring flex min-h-[3.15rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[9px] font-bold leading-tight transition-[background,color,box-shadow,opacity,transform] duration-200 ease-out min-[380px]:text-[10px] md:min-h-[3.4rem] md:gap-1 md:px-1.5 md:text-xs",
                active
                  ? "mc-badge"
                  : "border-2 border-transparent text-[var(--mc-nav-link)] hover:border-black hover:bg-[linear-gradient(180deg,#9a9aff_0%,#7a7aff_48%,#5a5ad4_100%)] hover:text-[var(--mc-on-gold)] hover:shadow-[inset_2px_2px_0_rgba(255,255,255,0.28),inset_-2px_-2px_0_rgba(0,0,0,0.4)]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-[1.15rem] shrink-0 sm:size-[1.25rem] md:size-[1.3rem]",
                  active ? "text-[var(--mc-on-gold)]" : "opacity-90",
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
