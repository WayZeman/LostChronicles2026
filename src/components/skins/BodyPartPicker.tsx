"use client";

import type { BodyPartId } from "@/lib/minecraft-skin";
import { cn } from "@/lib/utils";

type Props = {
  selected: BodyPartId;
  onSelect: (id: BodyPartId) => void;
  className?: string;
  /** Горизонтальний компактний ряд для мобільних. */
  layout?: "stack" | "row";
};

const PARTS: { id: BodyPartId; label: string; short: string }[] = [
  { id: "head", label: "Голова", short: "Голова" },
  { id: "body", label: "Тіло", short: "Тіло" },
  { id: "arm_r", label: "Пр. рука", short: "П.рука" },
  { id: "arm_l", label: "Лів. рука", short: "Л.рука" },
  { id: "leg_r", label: "Пр. нога", short: "П.нога" },
  { id: "leg_l", label: "Лів. нога", short: "Л.нога" },
];

/** Міні-силует Steve; активна частина — червоним. */
export function BodyPartPicker({
  selected,
  onSelect,
  className,
  layout = "stack",
}: Props) {
  const fill = (id: BodyPartId) =>
    selected === id ? "#e11d48" : "rgba(245,245,245,0.55)";
  const stroke = (id: BodyPartId) =>
    selected === id ? "#fb7185" : "rgba(255,255,255,0.25)";

  const svg = (
    <svg
      viewBox="0 0 40 72"
      className={cn(
        "select-none touch-manipulation",
        layout === "row" ? "h-24 w-auto shrink-0 sm:h-28" : "h-[11.5rem] w-auto",
      )}
      role="img"
      aria-label="Вибір частини тіла"
    >
      <rect
        x="12"
        y="2"
        width="16"
        height="16"
        rx="1"
        fill={fill("head")}
        stroke={stroke("head")}
        strokeWidth="1"
        className="cursor-pointer"
        onClick={() => onSelect("head")}
      />
      <rect
        x="4"
        y="20"
        width="8"
        height="20"
        rx="1"
        fill={fill("arm_r")}
        stroke={stroke("arm_r")}
        strokeWidth="1"
        className="cursor-pointer"
        onClick={() => onSelect("arm_r")}
      />
      <rect
        x="12"
        y="20"
        width="16"
        height="20"
        rx="1"
        fill={fill("body")}
        stroke={stroke("body")}
        strokeWidth="1"
        className="cursor-pointer"
        onClick={() => onSelect("body")}
      />
      <rect
        x="28"
        y="20"
        width="8"
        height="20"
        rx="1"
        fill={fill("arm_l")}
        stroke={stroke("arm_l")}
        strokeWidth="1"
        className="cursor-pointer"
        onClick={() => onSelect("arm_l")}
      />
      <rect
        x="12"
        y="42"
        width="8"
        height="24"
        rx="1"
        fill={fill("leg_r")}
        stroke={stroke("leg_r")}
        strokeWidth="1"
        className="cursor-pointer"
        onClick={() => onSelect("leg_r")}
      />
      <rect
        x="20"
        y="42"
        width="8"
        height="24"
        rx="1"
        fill={fill("leg_l")}
        stroke={stroke("leg_l")}
        strokeWidth="1"
        className="cursor-pointer"
        onClick={() => onSelect("leg_l")}
      />
    </svg>
  );

  if (layout === "row") {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-3 overflow-x-auto pb-1",
          className,
        )}
      >
        {svg}
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {PARTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                "lc-focus-ring min-h-11 min-w-[4.5rem] flex-1 rounded-sm border px-2 py-2 text-xs font-medium touch-manipulation",
                selected === p.id
                  ? "border-rose-400/70 bg-rose-500/20 text-rose-100"
                  : "border-white/10 bg-black/25 text-[var(--mc-ink-subtle)]",
              )}
            >
              {p.short}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {svg}
      <div className="grid w-full grid-cols-2 gap-1.5">
        {PARTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "lc-focus-ring min-h-11 rounded-sm border px-1.5 py-2 text-xs font-medium touch-manipulation",
              selected === p.id
                ? "border-rose-400/70 bg-rose-500/20 text-rose-100"
                : "border-white/10 bg-black/25 text-[var(--mc-ink-subtle)]",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
