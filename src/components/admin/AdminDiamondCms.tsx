"use client";

import { useCallback, useEffect, useState } from "react";
import { DiamondIcon } from "@/components/site/DiamondIcon";
import { DIAMOND_EVENT_DURATION_DAYS, DIAMOND_EVENT_TOTAL } from "@/data/diamond-spots";
import { cn } from "@/lib/utils";

type EventDraft = {
  enabled: boolean;
  title: string;
  blurb: string;
  startAt: string;
  endAt: string;
};

type LeaderEntry = {
  userId: number;
  displayName: string;
  score: number;
};

type FinisherEntry = {
  userId: number;
  displayName: string;
  place: number;
};

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(local: string): string | null {
  const t = local.trim();
  if (!t) return null;
  const d = new Date(t);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

type Props = {
  onMsg: (msg: string | null) => void;
  onErr: (err: string | null) => void;
};

export function AdminDiamondCms({ onMsg, onErr }: Props) {
  const [draft, setDraft] = useState<EventDraft>({
    enabled: false,
    title: "Пошук діамантів",
    blurb: "",
    startAt: "",
    endAt: "",
  });
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [finishers, setFinishers] = useState<FinisherEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    onErr(null);
    try {
      const res = await fetch("/api/admin/diamonds", { credentials: "include" });
      const data = (await res.json()) as {
        event?: {
          enabled: boolean;
          title: string;
          blurb: string;
          startAt: string | null;
          endAt: string | null;
        };
        leaderboard?: LeaderEntry[];
        finishers?: FinisherEntry[];
        error?: string;
      };
      if (!res.ok) {
        onErr(data.error || "Не вдалося завантажити івент");
        return;
      }
      if (data.event) {
        setDraft({
          enabled: data.event.enabled,
          title: data.event.title,
          blurb: data.event.blurb,
          startAt: toDatetimeLocalValue(data.event.startAt),
          endAt: toDatetimeLocalValue(data.event.endAt),
        });
      }
      setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
      setFinishers(Array.isArray(data.finishers) ? data.finishers : []);
      setReady(true);
    } catch {
      onErr("Мережа недоступна");
    }
  }, [onErr]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  async function runAction(action: "start" | "end" | "save" | "reset") {
    setBusy(true);
    onMsg(null);
    onErr(null);
    try {
      const body =
        action === "save"
          ? {
              action: "save",
              enabled: draft.enabled,
              title: draft.title,
              blurb: draft.blurb,
              startAt: fromDatetimeLocalValue(draft.startAt),
              endAt: fromDatetimeLocalValue(draft.endAt),
            }
          : { action };

      const res = await fetch("/api/admin/diamonds", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        clearedCollections?: number;
        clearedFinishers?: number;
      };
      if (!res.ok) {
        onErr(data.error || "Не вдалося зберегти");
        setBusy(false);
        return;
      }
      if (action === "start") {
        onMsg(
          `Івент запущено на ${DIAMOND_EVENT_DURATION_DAYS} днів (${DIAMOND_EVENT_TOTAL} діамантів). Прогрес скинуто.`,
        );
      } else if (action === "end") {
        onMsg("Івент завершено.");
      } else if (action === "reset") {
        const cols = data.clearedCollections ?? 0;
        const fins = data.clearedFinishers ?? 0;
        onMsg(
          `Прогрес скинуто (зборів: ${cols}, фінішів: ${fins}). Дати івенту без змін.`,
        );
      } else {
        onMsg("Налаштування збережено");
      }
      await load();
    } catch {
      onErr("Мережа недоступна");
    }
    setBusy(false);
  }

  if (!ready) {
    return (
      <div className="h-40 animate-pulse rounded-lg bg-white/5" aria-busy />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (
              !window.confirm(
                `Почати івент на ${DIAMOND_EVENT_DURATION_DAYS} днів? Усі збори та фініші буде скинуто.`,
              )
            ) {
              return;
            }
            void runAction("start");
          }}
          className="lc-focus-ring lc-btn-accent px-4 py-2.5 text-xs disabled:opacity-50"
        >
          Почати івент
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!window.confirm("Завершити івент зараз?")) return;
            void runAction("end");
          }}
          className="lc-focus-ring rounded-lg border border-rose-400/40 bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-100 hover:bg-rose-500/25 disabled:opacity-50"
        >
          Закінчити івент
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (
              !window.confirm(
                "Скинути весь прогрес гравців (збори + фініші)? Дати івенту не зміняться.",
              )
            ) {
              return;
            }
            void runAction("reset");
          }}
          className="lc-focus-ring rounded-lg border border-amber-400/35 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
        >
          Скинути прогрес
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runAction("save");
        }}
        className="space-y-4"
      >
        <p className="text-xs text-[var(--mc-text-muted)]">
          Рівно {DIAMOND_EVENT_TOTAL} діамантів на сайті (скроляться зі
          сторінкою, частина в FAQ / картках магазину). Тривалість старту:{" "}
          {DIAMOND_EVENT_DURATION_DAYS} днів (тиждень + 3 дні). Видно лише
          залогіненим; у адмінці діаманти не показуються.
        </p>

        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--mc-text)]">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) =>
              setDraft((d) => ({ ...d, enabled: e.target.checked }))
            }
            className="size-4 accent-[var(--mc-net-green)]"
          />
          Івент увімкнено (ручне)
        </label>

        <label className="block text-[11px] font-semibold text-[var(--mc-text-muted)]">
          Назва
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm"
            maxLength={80}
          />
        </label>

        <label className="block text-[11px] font-semibold text-[var(--mc-text-muted)]">
          Опис (вікно події)
          <textarea
            value={draft.blurb}
            onChange={(e) => setDraft((d) => ({ ...d, blurb: e.target.value }))}
            rows={3}
            className="lc-focus-ring mc-input mt-1 w-full resize-y px-2.5 py-2 text-sm"
            maxLength={500}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[11px] font-semibold text-[var(--mc-text-muted)]">
            Старт
            <input
              type="datetime-local"
              value={draft.startAt}
              onChange={(e) =>
                setDraft((d) => ({ ...d, startAt: e.target.value }))
              }
              className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm"
            />
          </label>
          <label className="block text-[11px] font-semibold text-[var(--mc-text-muted)]">
            Кінець
            <input
              type="datetime-local"
              value={draft.endAt}
              onChange={(e) =>
                setDraft((d) => ({ ...d, endAt: e.target.value }))
              }
              className="lc-focus-ring mc-input mt-1 w-full px-2.5 py-2 text-sm"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="lc-focus-ring rounded-lg border border-white/12 px-4 py-2 text-xs font-bold text-[var(--mc-text)] hover:bg-white/[0.04] disabled:opacity-50"
        >
          {busy ? "…" : "Зберегти текст / дати"}
        </button>
      </form>

      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--mc-text)]">
          <DiamondIcon size={16} />
          Хто зібрав усі {DIAMOND_EVENT_TOTAL}
        </h3>
        {finishers.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--mc-text-muted)]">Поки нікого</p>
        ) : (
          <ol className="mt-3 space-y-1.5">
            {finishers.map((e) => (
              <li
                key={e.userId}
                className="flex items-center gap-2 rounded-md border border-[var(--mc-menu-yellow)]/20 px-2.5 py-1.5 text-sm"
              >
                <span className="w-8 tabular-nums text-[var(--mc-menu-yellow)]">
                  #{e.place}
                </span>
                <span className="min-w-0 flex-1 truncate">{e.displayName}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-[var(--mc-text)]">Топ за прогресом</h3>
        {leaderboard.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--mc-text-muted)]">Поки порожньо</p>
        ) : (
          <ol className="mt-3 space-y-1.5">
            {leaderboard.map((e, i) => (
              <li
                key={e.userId}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-white/8 px-2.5 py-1.5 text-sm",
                )}
              >
                <span className="w-5 tabular-nums text-[var(--mc-menu-yellow)]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{e.displayName}</span>
                <span className="tabular-nums text-cyan-200">{e.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
