"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

type SearchResult = {
  title: string;
  snippet: string;
  href: string;
  originalUrl: string;
};

type SearchResponse = {
  results?: SearchResult[];
  popularQueries?: string[];
};

type Props = {
  className?: string;
  embedded?: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
};

export function WikiSearchBox({
  className,
  embedded = false,
  title = "Пошук по вікі та новинах",
  description = "Введи запит, і сайт покаже сторінки та новини, де є згадки про нього.",
  placeholder = "Наприклад: Артолія, валюта, плагіни, держава...",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [popularQueries, setPopularQueries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPopularQueries = async () => {
      try {
        const res = await fetch("/api/wiki-search");
        const data = (await res.json()) as SearchResponse;
        if (!cancelled) {
          setPopularQueries(data.popularQueries ?? []);
        }
      } catch {
        if (!cancelled) {
          setPopularQueries([]);
        }
      }
    };

    void loadPopularQueries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/wiki-search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as SearchResponse;
        setResults(data.results ?? []);
        setPopularQueries(data.popularQueries ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const showEmpty = touched && query.trim().length >= 2 && !loading && results.length === 0;

  return (
    <section
      className={cn(
        embedded
          ? "rounded-2xl border border-white/[0.08] bg-black/10 px-4 py-4 md:px-5"
          : lcGlassPanelClass,
        !embedded && "mb-6 p-4 md:mb-8 md:p-5",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--mc-net-green)]">
          <Search className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 max-w-2xl">
          <h2 className="text-base font-semibold text-[var(--mc-text)] md:text-lg">{title}</h2>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <label htmlFor="wiki-search" className="sr-only">
          Пошук по вікі
        </label>
        <input
          id="wiki-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTouched(true);
          }}
          placeholder={placeholder}
          className={cn(
            "w-full max-w-2xl rounded-2xl border border-white/[0.12] bg-black/15 px-4 py-3 text-center text-sm text-[var(--mc-text)] outline-none",
            "placeholder:text-[var(--mc-text-subtle)]",
            "focus:border-[color-mix(in_srgb,var(--mc-net-green)_48%,transparent)]",
            "focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mc-net-green)_18%,transparent)]",
          )}
        />
      </div>

      {popularQueries.length > 0 ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {popularQueries.map((popularQuery) => (
            <button
              key={popularQuery}
              type="button"
              onClick={() => {
                setQuery(popularQuery);
                setTouched(true);
              }}
              className="lc-focus-ring rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[var(--mc-text-muted)] transition-colors hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-[var(--mc-text)]"
            >
              {popularQuery}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-center text-sm text-[var(--mc-text-muted)]">
          Шукаю збіги у вікі та новинах…
        </p>
      ) : null}

      {results.length > 0 ? (
        <div className="mx-auto mt-4 grid max-w-2xl gap-3 text-left">
          {results.map((result) => (
            <Link
              key={result.href}
              href={`${result.href}?q=${encodeURIComponent(query.trim())}`}
              className="lc-focus-ring rounded-2xl border border-white/[0.08] bg-black/10 px-4 py-3 transition-colors hover:border-white/[0.14] hover:bg-white/[0.03]"
            >
              <div className="text-sm font-semibold text-[var(--mc-text)]">{result.title}</div>
              {result.snippet ? (
                <p className="mt-1 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                  {result.snippet}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}

      {showEmpty ? (
        <p className="mt-4 text-center text-sm text-[var(--mc-text-muted)]">
          Нічого не знайдено. Спробуй коротший або точніший запит.
        </p>
      ) : null}
    </section>
  );
}
