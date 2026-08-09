"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Unlink,
} from "lucide-react";
import { compressImageFile } from "@/lib/compress-image";
import { cn } from "@/lib/utils";

type Mode = "visual" | "html";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  className?: string;
  /** Початковий режим (за замовчуванням візуальний, як VisualEditor на Fandom). */
  initialMode?: Mode;
};

function runCmd(command: string, value?: string) {
  document.execCommand(command, false, value);
}

/**
 * Редактор вікі як на Fandom: візуальний (за замовчуванням) + вихідний HTML.
 */
export function WikiPageEditor({
  value,
  onChange,
  disabled,
  className,
  initialMode = "visual",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef(value);
  const primed = useRef(false);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [uploading, setUploading] = useState(false);

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

  function focusVisual() {
    ref.current?.focus();
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
    const url = window.prompt("Посилання (https://… або /wiki/Назва)", "/wiki/");
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    focusVisual();
    runCmd("createLink", trimmed);
    const sel = window.getSelection();
    if (sel?.anchorNode) {
      const node =
        sel.anchorNode.nodeType === Node.ELEMENT_NODE
          ? (sel.anchorNode as HTMLElement)
          : sel.anchorNode.parentElement;
      const a = node?.closest?.("a");
      if (a && trimmed.startsWith("http")) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    }
    emitFromVisual();
  }

  function setBlock(tag: string) {
    focusVisual();
    runCmd("formatBlock", tag);
    emitFromVisual();
  }

  async function onPickImage(file: File | null) {
    if (!file || disabled) return;
    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file, {
        maxEdge: 1400,
        quality: 0.82,
      });
      const res = await fetch("/api/admin/media", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const d = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !d.url) {
        window.alert(d.error || "Не вдалося завантажити зображення");
        return;
      }
      focusVisual();
      runCmd(
        "insertHTML",
        `<p><img src="${d.url}" alt="" style="max-width:100%;height:auto" /></p>`,
      );
      emitFromVisual();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  }

  const toolBtn =
    "lc-focus-ring inline-flex size-8 items-center justify-center rounded-md border border-transparent text-[var(--mc-text)] hover:border-white/15 hover:bg-white/[0.06] disabled:opacity-40";
  const busy = disabled || uploading;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-white/12 bg-black/25",
        className,
      )}
    >
      <div className="space-y-1.5 border-b border-white/10 p-1.5 sm:p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-md border border-white/12 bg-black/30 p-0.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => switchMode("visual")}
              className={cn(
                "rounded px-3 py-1.5 text-[11px] font-bold",
                mode === "visual"
                  ? "bg-[var(--mc-net-green)]/25 text-[var(--mc-net-green)]"
                  : "text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]",
              )}
            >
              Візуальний
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => switchMode("html")}
              className={cn(
                "inline-flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-bold",
                mode === "html"
                  ? "bg-[var(--mc-net-green)]/25 text-[var(--mc-net-green)]"
                  : "text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]",
              )}
            >
              <Code2 className="size-3" aria-hidden />
              Вихідний код
            </button>
          </div>

          {mode === "visual" ? (
            <p className="text-[10px] font-medium text-[var(--mc-text-subtle)] sm:ml-1">
              Пиши як у звичайному редакторі · HTML — за потреби
            </p>
          ) : (
            <p className="text-[10px] font-medium text-[var(--mc-text-subtle)] sm:ml-1">
              Сирий HTML · можна повернутись у візуальний
            </p>
          )}
        </div>

        {mode === "visual" ? (
          <div className="flex flex-wrap items-center gap-0.5">
            <button
              type="button"
              title="Підзаголовок"
              aria-label="Підзаголовок"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                setBlock("h2");
              }}
              className={toolBtn}
            >
              <Heading2 className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Заголовок 3"
              aria-label="Заголовок 3"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                setBlock("h3");
              }}
              className={toolBtn}
            >
              <Heading3 className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Звичайний абзац"
              aria-label="Звичайний абзац"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                setBlock("p");
              }}
              className={cn(toolBtn, "px-1.5 text-[10px] font-black")}
            >
              P
            </button>
            <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />
            <button
              type="button"
              title="Жирний"
              aria-label="Жирний"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                focusVisual();
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
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                focusVisual();
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
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                focusVisual();
                runCmd("underline");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <Underline className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Закреслений"
              aria-label="Закреслений"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                focusVisual();
                runCmd("strikeThrough");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <Strikethrough className="size-3.5" aria-hidden />
            </button>
            <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />
            <button
              type="button"
              title="Посилання"
              aria-label="Посилання"
              disabled={busy}
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
              title="Прибрати посилання"
              aria-label="Прибрати посилання"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                focusVisual();
                runCmd("unlink");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <Unlink className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Зображення"
              aria-label="Зображення"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                fileRef.current?.click();
              }}
              className={toolBtn}
            >
              <ImagePlus className="size-3.5" aria-hidden />
            </button>
            <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />
            <button
              type="button"
              title="Маркований список"
              aria-label="Маркований список"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                focusVisual();
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
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                focusVisual();
                runCmd("insertOrderedList");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <ListOrdered className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Роздільник"
              aria-label="Роздільник"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                focusVisual();
                runCmd("insertHorizontalRule");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <Minus className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Очистити форматування"
              aria-label="Очистити форматування"
              disabled={busy}
              onMouseDown={(e) => {
                e.preventDefault();
                focusVisual();
                runCmd("removeFormat");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <RemoveFormatting className="size-3.5" aria-hidden />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                e.target.value = "";
                void onPickImage(file);
              }}
            />
          </div>
        ) : null}
      </div>

      {mode === "visual" ? (
        <div
          ref={ref}
          role="textbox"
          aria-label="Візуальний редактор статті"
          aria-multiline
          contentEditable={!busy}
          suppressContentEditableWarning
          onInput={emitFromVisual}
          onBlur={emitFromVisual}
          className={cn(
            "wiki-mirror min-h-[22rem] max-h-[70vh] overflow-y-auto px-3 py-3 text-sm leading-relaxed text-[var(--mc-text)] outline-none sm:px-4",
            "[&_a]:font-semibold [&_a]:text-[var(--mc-net-green)] [&_a]:underline",
            "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
            "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
            "[&_p]:my-1.5",
            "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-extrabold",
            "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-bold",
            "[&_img]:my-2 [&_img]:max-w-full [&_img]:h-auto",
            "[&_hr]:my-4 [&_hr]:border-white/20",
            "[&_table]:w-full [&_table]:border-collapse",
            busy && "pointer-events-none opacity-60",
          )}
        />
      ) : (
        <textarea
          value={value}
          disabled={busy}
          aria-label="Вихідний HTML код"
          onChange={(e) => {
            lastEmitted.current = e.target.value;
            onChange(e.target.value);
          }}
          spellCheck={false}
          className="min-h-[22rem] max-h-[70vh] w-full resize-y bg-black/40 px-3 py-3 font-mono text-xs leading-relaxed text-[var(--mc-text)] outline-none sm:px-4"
          placeholder="<p>HTML вміст статті…</p>"
        />
      )}
    </div>
  );
}
