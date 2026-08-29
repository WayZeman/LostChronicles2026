"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type WikiPageOption = {
  slug: string;
  title: string;
};

type Props = {
  open: boolean;
  initialQuery?: string;
  onPick: (page: WikiPageOption) => void;
  onClose: () => void;
};

export function WikiPageLinkPicker({
  open,
  initialQuery = "",
  onPick,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [pages, setPages] = useState<WikiPageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open || pages.length > 0) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void (async () => {
      try {
        const res = await fetch("/api/wiki/pages", { credentials: "include" });
        const data = (await res.json()) as {
          pages?: WikiPageOption[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setErr(data.error || "Не вдалося завантажити сторінки");
          setPages([]);
          return;
        }
        setPages(Array.isArray(data.pages) ? data.pages : []);
      } catch {
        if (!cancelled) {
          setErr("Мережа недоступна");
          setPages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, pages.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("uk-UA");
    const list = q
      ? pages.filter((p) => {
          const title = p.title.toLocaleLowerCase("uk-UA");
          const slug = p.slug.toLocaleLowerCase("uk-UA");
          return title.includes(q) || slug.includes(q);
        })
      : pages;
    return list.slice(0, 40);
  }, [pages, query]);

  if (!open) return null;

  return (
    <div
      className="absolute left-0 top-full z-30 mt-1 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-white/15 bg-[#121212] shadow-xl"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="border-b border-white/10 p-2">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
            if (e.key === "Enter" && filtered[0]) {
              e.preventDefault();
              onPick(filtered[0]);
            }
          }}
          placeholder="Пошук сторінки вікі…"
          className="lc-focus-ring w-full rounded-md border border-white/12 bg-black/40 px-2.5 py-1.5 text-xs text-[var(--mc-text)] placeholder:text-[var(--mc-text-muted)]"
        />
      </div>
      <ul
        className="max-h-56 overflow-y-auto py-1"
        role="listbox"
        aria-label="Сторінки вікі"
      >
        {loading ? (
          <li className="px-3 py-2 text-xs text-[var(--mc-text-muted)]">
            Завантаження…
          </li>
        ) : err ? (
          <li className="px-3 py-2 text-xs text-rose-300" role="alert">
            {err}
          </li>
        ) : filtered.length === 0 ? (
          <li className="px-3 py-2 text-xs text-[var(--mc-text-muted)]">
            {query.trim() ? "Нічого не знайдено" : "Немає сторінок"}
          </li>
        ) : (
          filtered.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                role="option"
                onClick={() => onPick(p)}
                className={cn(
                  "lc-focus-ring flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left",
                  "hover:bg-white/[0.06] active:bg-white/[0.09]",
                )}
              >
                <span className="text-sm font-semibold text-[var(--mc-text)]">
                  {p.title}
                </span>
                <span className="font-mono text-[10px] text-[var(--mc-text-muted)]">
                  /wiki/{p.slug}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
