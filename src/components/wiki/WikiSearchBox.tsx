"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SearchResult = {
  title: string;
  snippet: string;
  href: string;
  originalUrl: string;
};

type SearchResponse = {
  results?: SearchResult[];
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
  placeholder = "Пошук…",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

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
        const res = await fetch(
          `/api/wiki-search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as SearchResponse;
        setResults(data.results ?? []);
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

  const showEmpty =
    touched && query.trim().length >= 2 && !loading && results.length === 0;

  return (
    <section
      className={cn(
        embedded ? "pb-4 md:pb-5" : "mb-5",
        className,
      )}
      aria-label="Пошук"
    >
      <div className="relative">
        <label htmlFor="wiki-search" className="sr-only">
          Пошук
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--mc-ink-subtle)]"
          aria-hidden
        />
        <input
          id="wiki-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTouched(true);
          }}
          placeholder={placeholder}
          className="mc-input w-full py-2.5 pl-9 pr-3 text-sm"
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p className="mt-2 text-xs text-[var(--mc-text-muted)]">…</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-2 divide-y divide-[var(--mc-border-card)] border border-[var(--mc-border-card)]">
          {results.map((result) => (
            <li key={result.href}>
              <Link
                href={`${result.href}?q=${encodeURIComponent(query.trim())}`}
                className={cn(
                  "lc-focus-ring block px-3 py-2.5 transition-colors",
                  "hover:bg-[color-mix(in_srgb,#fff_4%,transparent)]",
                )}
              >
                <div className="text-sm font-semibold text-[var(--mc-text)]">
                  {result.title}
                </div>
                {result.snippet ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--mc-text-muted)]">
                    {result.snippet}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {showEmpty ? (
        <p className="mt-2 text-xs text-[var(--mc-text-muted)]">Нічого не знайдено</p>
      ) : null}
    </section>
  );
}
