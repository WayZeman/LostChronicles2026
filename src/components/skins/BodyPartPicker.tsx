"use client";

import type { BodyPartId } from "@/lib/minecraft-skin";
import { cn } from "@/lib/utils";

type Props = {
  selected: BodyPartId;
  onSelect: (id: BodyPartId) => void;
  className?: string;
};

const PARTS: { id: BodyPartId; label: string }[] = [
  { id: "head", label: "Голова" },
  { id: "body", label: "Тіло" },
  { id: "arm_r", label: "Пр. рука" },
  { id: "arm_l", label: "Лів. рука" },
  { id: "leg_r", label: "Пр. нога" },
  { id: "leg_l", label: "Лів. нога" },
];

/** Міні-силует Steve; активна частина — червоним. */
export function BodyPartPicker({ selected, onSelect, className }: Props) {
  const fill = (id: BodyPartId) =>
    selected === id ? "#e11d48" : "rgba(245,245,245,0.55)";
  const stroke = (id: BodyPartId) =>
    selected === id ? "#fb7185" : "rgba(255,255,255,0.25)";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <svg
        viewBox="0 0 40 72"
        className="h-[11.5rem] w-auto select-none"
        role="img"
        aria-label="Вибір частини тіла"
      >
        {/* Head */}
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
        {/* Arm R (viewer's left = character right) */}
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
        {/* Body */}
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
        {/* Arm L */}
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
        {/* Leg R */}
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
        {/* Leg L */}
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
      <div className="grid w-full grid-cols-2 gap-1">
        {PARTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "lc-focus-ring rounded-sm border px-1.5 py-1 text-[10px] font-medium",
              selected === p.id
                ? "border-rose-400/70 bg-rose-500/20 text-rose-100"
                : "border-white/10 bg-black/25 text-[var(--mc-ink-subtle)] hover:bg-black/40",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
