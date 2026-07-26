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
  description = "Введи запит, і сайт покаже сторінки та новини, де є згадки про нього.",
  placeholder = "Наприклад: Артолія, валюта, плагіни, держава...",
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
  const suggestionLabel = recentQueries.length > 0 ? "Останні запити" : "Популярні запити";

  return (
    <section
      className={cn(
        embedded
          ? "mc-slot px-4 py-4 md:px-5"
          : lcGlassPanelClass,
        !embedded && "mb-6 p-4 md:mb-8 md:p-5",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="mc-slot flex size-10 shrink-0 items-center justify-center text-[var(--mc-net-green)]">
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
          className="mc-input w-full max-w-2xl px-4 py-3 text-center text-sm"
        />
      </div>

      {suggestionQueries.length > 0 ? (
        <>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--mc-text-subtle)]">
            {recentQueries.length > 0 ? (
              <Clock3 className="size-3.5" aria-hidden />
            ) : (
              <TrendingUp className="size-3.5" aria-hidden />
            )}
            <span>{suggestionLabel}</span>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {suggestionQueries.map((suggestionQuery) => (
              <button
                key={suggestionQuery}
                type="button"
                onClick={() => {
                  setQuery(suggestionQuery);
                  setTouched(true);
                  void trackConfirmedQuery(suggestionQuery);
                }}
                className="lc-focus-ring mc-btn-secondary px-3 py-1.5 text-xs"
              >
                {suggestionQuery}
              </button>
            ))}
          </div>
        </>
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
              onClick={() => {
                void trackConfirmedQuery(query);
              }}
              className="lc-focus-ring mc-slot block px-4 py-3 transition-[filter] hover:brightness-110"
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
