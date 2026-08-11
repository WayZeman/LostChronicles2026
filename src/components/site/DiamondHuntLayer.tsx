"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { notifyDiamondHuntChanged } from "@/lib/diamond-hunt-events";
import { AUTH_ME_CHANGED_EVENT } from "@/lib/auth-me-events";
import { DiamondIcon } from "@/components/site/DiamondIcon";
import { cn } from "@/lib/utils";

type Spot = {
  id: string;
  kind: "page" | "slot";
  slot?: string;
  top: number;
  left: number;
  size: "sm" | "md";
  opacity: number;
};

type StatePayload = {
  active?: boolean;
  spotsOnPage?: Spot[];
  balance?: number;
  total?: number;
  finishPlace?: number | null;
  justFinished?: boolean;
  endAt?: string | null;
  title?: string;
  blurb?: string;
};

function DiamondButton({
  spot,
  busy,
  onCollect,
}: {
  spot: Spot;
  busy: boolean;
  onCollect: (id: string) => void;
}) {
  const sz = spot.size === "sm" ? "size-7 sm:size-8" : "size-9 sm:size-10";
  return (
    <button
      type="button"
      aria-label="Зібрати діамант"
      disabled={busy}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onCollect(spot.id);
      }}
      className={cn(
        "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2",
        "lc-focus-ring rounded-full",
        sz,
        "lc-diamond-float",
        "transition-[filter,transform] hover:brightness-125 active:scale-90",
        "drop-shadow-[0_0_8px_rgba(80,200,255,0.5)]",
      )}
      style={{
        top: `${spot.top}%`,
        left: `${spot.left}%`,
        opacity: spot.opacity,
      }}
    >
      <DiamondIcon
        size={spot.size === "sm" ? 28 : 40}
        className="size-full"
      />
    </button>
  );
}

export function DiamondHuntLayer() {
  const pathname = usePathname() || "/";
  const [spots, setSpots] = useState<Spot[]>([]);
  const [active, setActive] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pageRoot, setPageRoot] = useState<HTMLElement | null>(null);
  const [slotHosts, setSlotHosts] = useState<Record<string, HTMLElement>>({});

  const refreshHosts = useCallback(() => {
    const root = document.querySelector(
      "[data-diamond-page]",
    ) as HTMLElement | null;
    setPageRoot(root);

    const hosts: Record<string, HTMLElement> = {};
    document.querySelectorAll<HTMLElement>("[data-diamond-slot]").forEach((el) => {
      const id = el.getAttribute("data-diamond-slot");
      if (id) hosts[id] = el;
    });
    setSlotHosts(hosts);
  }, []);

  const load = useCallback(async () => {
    if (pathname.startsWith("/admin")) {
      setSpots([]);
      setActive(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/diamonds/state?path=${encodeURIComponent(pathname)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as StatePayload & {
        user?: number | null;
      };
      const isUser = Boolean(data.user);
      setLoggedIn(isUser);
      setActive(Boolean(data.active));
      setSpots(
        isUser && data.active && Array.isArray(data.spotsOnPage)
          ? data.spotsOnPage
          : [],
      );
      if (data.active) {
        notifyDiamondHuntChanged({
          balance: data.balance,
          total: data.total,
          finishPlace: data.finishPlace ?? null,
          endAt: data.endAt,
          title: data.title,
          blurb: data.blurb,
          active: true,
        });
      } else {
        notifyDiamondHuntChanged({ active: false });
      }
      requestAnimationFrame(() => refreshHosts());
    } catch {
      setSpots([]);
      setActive(false);
    }
  }, [pathname, refreshHosts]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  useEffect(() => {
    const onAuth = () => void load();
    window.addEventListener(AUTH_ME_CHANGED_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_ME_CHANGED_EVENT, onAuth);
  }, [load]);

  useEffect(() => {
    refreshHosts();
    const mo = new MutationObserver(() => refreshHosts());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [pathname, refreshHosts]);

  async function onCollect(spotId: string) {
    if (busyId) return;
    setBusyId(spotId);
    setSpots((prev) => prev.filter((s) => s.id !== spotId));
    try {
      const res = await fetch("/api/diamonds/collect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        balance?: number;
        total?: number;
        finishPlace?: number | null;
        justFinished?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        void load();
        setBusyId(null);
        return;
      }
      notifyDiamondHuntChanged({
        balance: data.balance,
        total: data.total,
        finishPlace: data.finishPlace ?? null,
        justFinished: Boolean(data.justFinished),
      });
    } catch {
      void load();
    }
    setBusyId(null);
  }

  if (!active || !loggedIn || spots.length === 0) return null;

  const pageSpots = spots.filter((s) => s.kind === "page");
  const slotSpots = spots.filter((s) => s.kind === "slot");

  return (
    <>
      {pageRoot
        ? createPortal(
            <div
              className="pointer-events-none absolute inset-0 z-[40] overflow-visible"
              aria-label="Діаманти на сторінці"
            >
              {pageSpots.map((s) => (
                <DiamondButton
                  key={s.id}
                  spot={s}
                  busy={busyId === s.id}
                  onCollect={onCollect}
                />
              ))}
            </div>,
            pageRoot,
          )
        : null}

      {slotSpots.map((s) => {
        const host = s.slot ? slotHosts[s.slot] : null;
        if (!host) return null;
        const spotForSlot: Spot = {
          ...s,
          top: s.top || 50,
          left: s.left || 50,
        };
        // Make host relative for absolute button
        if (getComputedStyle(host).position === "static") {
          host.style.position = "relative";
        }
        return createPortal(
          <DiamondButton
            key={s.id}
            spot={{ ...spotForSlot, top: 50, left: 50 }}
            busy={busyId === s.id}
            onCollect={onCollect}
          />,
          host,
        );
      })}
    </>
  );
}
