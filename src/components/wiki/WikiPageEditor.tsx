"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "visual" | "html";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  className?: string;
  /** Початковий режим редактора (візуальний або сирий HTML). */
  initialMode?: Mode;
};

function runCmd(command: string, value?: string) {
  document.execCommand(command, false, value);
}

/**
 * Редактор вікі: візуальний режим + сирий HTML (як на Fandom — текст і код).
 */
export function WikiPageEditor({
  value,
  onChange,
  disabled,
  className,
  initialMode = "visual",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const primed = useRef(false);
  const [mode, setMode] = useState<Mode>(initialMode);

  useEffect(() => {
    if (mode !== "visual") return;
    const el = ref.current;
    if (!el) return;
    if (!primed.current) {
      el.innerHTML = value?.trim() ? value : "<p><br></p>";
      lastEmitted.current = el.innerHTML;
      primed.current = true;
      return;
    }
    if (value !== lastEmitted.current && el.innerHTML !== value) {
      el.innerHTML = value?.trim() ? value : "<p><br></p>";
      lastEmitted.current = el.innerHTML;
    }
  }, [value, mode]);

  function emitFromVisual() {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    lastEmitted.current = html;
    onChange(html);
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    if (next === "html" && mode === "visual") {
      const el = ref.current;
      if (el) {
        lastEmitted.current = el.innerHTML;
        onChange(el.innerHTML);
      }
      primed.current = false;
    }
    if (next === "visual" && mode === "html") {
      primed.current = false;
    }
    setMode(next);
  }

  function addLink() {
    const url = window.prompt("Посилання (https://… або /wiki/…)", "/wiki/");
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    ref.current?.focus();
    runCmd("createLink", trimmed);
    emitFromVisual();
  }

  const toolBtn =
    "lc-focus-ring inline-flex size-8 items-center justify-center rounded-md border border-transparent text-[var(--mc-text)] hover:border-white/15 hover:bg-white/[0.06] disabled:opacity-40";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-white/12 bg-black/25",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 p-1.5">
        <div className="mr-2 flex rounded-md border border-white/10 p-0.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => switchMode("visual")}
            className={cn(
              "rounded px-2.5 py-1 text-[11px] font-bold",
              mode === "visual"
                ? "bg-[var(--mc-net-green)]/20 text-[var(--mc-net-green)]"
                : "text-[var(--mc-text-muted)]",
            )}
          >
            Текст
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => switchMode("html")}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold",
              mode === "html"
                ? "bg-[var(--mc-net-green)]/20 text-[var(--mc-net-green)]"
                : "text-[var(--mc-text-muted)]",
            )}
          >
            <Code2 className="size-3" aria-hidden />
            HTML
          </button>
        </div>
        {mode === "visual" ? (
          <>
            <button
              type="button"
              title="Жирний"
              aria-label="Жирний"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                ref.current?.focus();
                runCmd("bold");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <Bold className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Курсив"
              aria-label="Курсив"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                ref.current?.focus();
                runCmd("italic");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <Italic className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Підкреслення"
              aria-label="Підкреслення"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                ref.current?.focus();
                runCmd("underline");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <Underline className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Посилання"
              aria-label="Посилання"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                addLink();
              }}
              className={toolBtn}
            >
              <Link2 className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Маркований список"
              aria-label="Маркований список"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                ref.current?.focus();
                runCmd("insertUnorderedList");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <List className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Нумерований список"
              aria-label="Нумерований список"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                ref.current?.focus();
                runCmd("insertOrderedList");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <ListOrdered className="size-3.5" aria-hidden />
            </button>
          </>
        ) : null}
      </div>

      {mode === "visual" ? (
        <div
          ref={ref}
          role="textbox"
          aria-multiline
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emitFromVisual}
          onBlur={emitFromVisual}
          className={cn(
            "wiki-mirror min-h-[18rem] max-h-[70vh] overflow-y-auto px-3 py-2.5 text-sm leading-relaxed text-[var(--mc-text)] outline-none",
            "[&_a]:font-semibold [&_a]:text-[var(--mc-net-green)] [&_a]:underline",
            "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
            "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
            "[&_p]:my-1.5",
            "[&_table]:w-full [&_table]:border-collapse",
          )}
        />
      ) : (
        <textarea
          value={value}
          disabled={disabled}
          onChange={(e) => {
            lastEmitted.current = e.target.value;
            onChange(e.target.value);
          }}
          spellCheck={false}
          className="min-h-[18rem] max-h-[70vh] w-full resize-y bg-black/40 px-3 py-2.5 font-mono text-xs leading-relaxed text-[var(--mc-text)] outline-none"
          placeholder="<p>HTML вміст статті…</p>"
        />
      )}
    </div>
  );
}
