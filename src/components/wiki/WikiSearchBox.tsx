"use client";

import Link from "next/link";
import { Clock3, Search, TrendingUp } from "lucide-react";
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

const RECENT_QUERIES_STORAGE_KEY = "lc-wiki-recent-queries";
const MAX_RECENT_QUERIES = 5;

export function WikiSearchBox({
  className,
  embedded = false,
  title = "Пошук по вікі та новинах",
  description = "Знайди сторінки та новини за назвою чи згадкою.",
  placeholder = "Артолія, валюта, плагіни…",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [popularQueries, setPopularQueries] = useState<string[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const saveRecentQuery = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (trimmed.length < 2) return;

    setRecentQueries((current) => {
      const normalized = trimmed.toLocaleLowerCase("uk-UA");
      const next = [
        trimmed,
        ...current.filter((item) => item.toLocaleLowerCase("uk-UA") !== normalized),
      ].slice(0, MAX_RECENT_QUERIES);

      try {
        window.localStorage.setItem(RECENT_QUERIES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore storage errors */
      }

      return next;
    });
  };

  const trackConfirmedQuery = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (trimmed.length < 2) return;
    saveRecentQuery(trimmed);
    try {
      await fetch("/api/wiki-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
    } catch {
      /* ignore analytics failures */
    }
  };

  useEffect(() => {
    let cancelled = false;

    try {
      const raw = window.localStorage.getItem(RECENT_QUERIES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setRecentQueries(
            parsed
              .map((item) => String(item ?? "").trim())
              .filter(Boolean)
              .slice(0, MAX_RECENT_QUERIES),
          );
        }
      }
    } catch {
      setRecentQueries([]);
    }

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
  const suggestionQueries = recentQueries.length > 0 ? recentQueries : popularQueries;
  const suggestionLabel = recentQueries.length > 0 ? "Останні" : "Популярні";

  return (
    <section
      className={cn(
        "hidden sm:block",
        embedded
          ? "border-b border-[var(--mc-border-card)] pb-6 md:pb-7"
          : cn(lcGlassPanelClass, "mb-6 p-4 md:mb-8 md:p-5"),
        className,
      )}
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        <div
          className="mc-slot mt-0.5 flex size-9 shrink-0 items-center justify-center text-[var(--mc-grass-bright)]"
          aria-hidden
        >
          <Search className="size-4" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="lc-section-title text-left text-base uppercase md:text-lg">
            {title}
          </h2>
          <p className="mt-1 text-left text-sm text-[var(--mc-ink-subtle)]">
            {description}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <label htmlFor="wiki-search" className="sr-only">
          Пошук по вікі
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--mc-ink-subtle)]"
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
          className="mc-input w-full py-3 pl-10 pr-4 text-left text-sm"
          autoComplete="off"
        />
      </div>

      {suggestionQueries.length > 0 ? (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--mc-ink-subtle)]">
            {recentQueries.length > 0 ? (
              <Clock3 className="size-3" aria-hidden />
            ) : (
              <TrendingUp className="size-3" aria-hidden />
            )}
            {suggestionLabel}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestionQueries.map((suggestionQuery) => (
              <button
                key={suggestionQuery}
                type="button"
                onClick={() => {
                  setQuery(suggestionQuery);
                  setTouched(true);
                  void trackConfirmedQuery(suggestionQuery);
                }}
                className={cn(
                  "lc-focus-ring mc-slot px-2.5 py-1 text-xs text-[var(--mc-text)]",
                  "transition-[background-color,color] duration-150",
                  "hover:bg-[#242424] hover:text-[var(--mc-grass-bright)]",
                )}
              >
                {suggestionQuery}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-[var(--mc-text-muted)]">Шукаю…</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-4 divide-y divide-[var(--mc-border-card)] border border-[var(--mc-border-card)]">
          {results.map((result) => (
            <li key={result.href}>
              <Link
                href={`${result.href}?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  void trackConfirmedQuery(query);
                }}
                className={cn(
                  "lc-focus-ring block px-3 py-3 transition-colors",
                  "hover:bg-[color-mix(in_srgb,#fff_4%,transparent)]",
                )}
              >
                <div className="text-sm font-semibold text-[var(--mc-text)]">
                  {result.title}
                </div>
                {result.snippet ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--mc-text-muted)]">
                    {result.snippet}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {showEmpty ? (
        <p className="mt-4 text-sm text-[var(--mc-text-muted)]">
          Нічого не знайдено. Спробуй коротший або точніший запит.
        </p>
      ) : null}
    </section>
  );
}
