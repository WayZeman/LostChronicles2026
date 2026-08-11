"use client";

import { useCallback, useEffect, useState } from "react";
import { DiamondIcon } from "@/components/site/DiamondIcon";
import { cn } from "@/lib/utils";

type EventDraft = {
  enabled: boolean;
  title: string;
  blurb: string;
  startAt: string;
  endAt: string;
  diamondsPerDay: number;
};

type LeaderEntry = {
  userId: number;
  displayName: string;
  score: number;
  avatar?: string | null;
  customAvatar?: string | null;
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
    diamondsPerDay: 20,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
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
          diamondsPerDay: number;
        };
        leaderboard?: LeaderEntry[];
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
          diamondsPerDay: data.event.diamondsPerDay,
        });
      }
      setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
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

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    onMsg(null);
    onErr(null);
    try {
      const res = await fetch("/api/admin/diamonds", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: draft.enabled,
          title: draft.title,
          blurb: draft.blurb,
          startAt: fromDatetimeLocalValue(draft.startAt),
          endAt: fromDatetimeLocalValue(draft.endAt),
          diamondsPerDay: draft.diamondsPerDay,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        onErr(data.error || "Не вдалося зберегти");
        setBusy(false);
        return;
      }
      onMsg("Івент діамантів збережено");
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
      <form onSubmit={(e) => void onSave(e)} className="space-y-4">
        <p className="text-xs text-[var(--mc-text-muted)]">
          Діаманти видно лише залогіненим гравцям (не в адмінці). Щодня
          з&apos;являється новий набір місць. Адмін бачить івент завжди для
          перевірки через увімкнення.
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
          Івент увімкнено
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
          Опис
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

        <label className="block text-[11px] font-semibold text-[var(--mc-text-muted)]">
          Діамантів на день
          <input
            type="number"
            min={1}
            max={40}
            value={draft.diamondsPerDay}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                diamondsPerDay: Number(e.target.value) || 20,
              }))
            }
            className="lc-focus-ring mc-input mt-1 w-full max-w-[8rem] px-2.5 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="lc-focus-ring lc-btn-accent px-4 py-2 text-xs disabled:opacity-50"
        >
          {busy ? "…" : "Зберегти івент"}
        </button>
      </form>

      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--mc-text)]">
          <DiamondIcon size={16} />
          Поточний топ
        </h3>
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
