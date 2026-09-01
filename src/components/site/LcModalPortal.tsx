"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type LcModalPortalProps = {
  open: boolean;
  onClose: () => void;
  ariaLabelledBy?: string;
  children: ReactNode;
};

/**
 * Модалка в document.body — щоб fixed не «їхав» разом із прокруткою сторінки.
 */
export function LcModalPortal({
  open,
  onClose,
  ariaLabelledBy,
  children,
}: LcModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center overscroll-contain bg-black/75 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body,
  );
}
