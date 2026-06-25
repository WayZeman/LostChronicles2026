"use client";

import { usePathname } from "next/navigation";
import {
  BookOpen,
  CircleHelp,
  ClipboardList,
  Home,
  Map as MapIcon,
  Newspaper,
} from "lucide-react";
import Dock, { type DockItemData } from "@/components/Dock";

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
  const items: DockItemData[] = bottomNavLinks.map(({ href, label, Icon }) => {
    const active = isActivePath(pathname, href);

    return {
      href,
      label,
      active,
      icon: (
        <Icon
          className="size-[1.15rem] shrink-0 min-[380px]:size-[1.2rem] md:size-[1.3rem]"
          strokeWidth={active ? 2.25 : 2}
        />
      ),
    };
  });

  return (
    <nav
      className="fixed inset-x-3 bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] z-[100] overflow-hidden rounded-[1.75rem] border border-[var(--mc-nav-border)] bg-[var(--mc-nav-bg)] shadow-[var(--mc-nav-shadow)] backdrop-blur-2xl backdrop-saturate-200"
      style={{
        paddingBottom: "max(0.4rem, calc(env(safe-area-inset-bottom, 0px) * 0.35))",
        paddingTop: "0.4rem",
      }}
      aria-label="Головна навігація"
    >
      <div className="mx-auto w-full max-w-4xl px-1 md:px-4">
        <Dock
          items={items}
          panelHeight={60}
          baseItemSize={42}
          magnification={56}
          distance={110}
          dockHeight={88}
        />
      </div>
    </nav>
  );
}
