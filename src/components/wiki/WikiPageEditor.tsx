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
  Palette,
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

type SavedRange = {
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
};

const TEXT_COLORS: { label: string; value: string }[] = [
  { label: "Білий", value: "#f5f5f5" },
  { label: "Сірий", value: "#9ca3af" },
  { label: "Зелений", value: "#55ff55" },
  { label: "Жовтий", value: "#ffff55" },
  { label: "Блакитний", value: "#55ffff" },
  { label: "Синій", value: "#5555ff" },
  { label: "Червоний", value: "#ff5555" },
  { label: "Рожевий", value: "#ff55ff" },
  { label: "Помаранчевий", value: "#ffaa00" },
  { label: "Бірюзовий", value: "#00aaaa" },
  { label: "Золотий", value: "#ffd700" },
  { label: "Фіолетовий", value: "#aa55ff" },
];

function runCmd(command: string, value?: string) {
  document.execCommand(command, false, value);
}

function saveSelection(root: HTMLElement | null): SavedRange | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !root) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  return {
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: range.endContainer,
    endOffset: range.endOffset,
  };
}

function restoreSelection(root: HTMLElement | null, saved: SavedRange | null) {
  if (!root || !saved) return false;
  try {
    if (!root.contains(saved.startContainer) || !root.contains(saved.endContainer)) {
      return false;
    }
    const range = document.createRange();
    range.setStart(saved.startContainer, saved.startOffset);
    range.setEnd(saved.endContainer, saved.endOffset);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    return true;
  } catch {
    return false;
  }
}

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
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
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<SavedRange | null>(null);
  const lastEmitted = useRef(value);
  const primed = useRef(false);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [uploading, setUploading] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgAlt, setImgAlt] = useState("");

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
      setSelectedImg(null);
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

  function rememberSelection() {
    savedRangeRef.current = saveSelection(ref.current);
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
      setSelectedImg(null);
      setColorOpen(false);
    }
    if (next === "visual" && mode === "html") {
      primed.current = false;
    }
    setMode(next);
  }

  function addLink() {
    rememberSelection();
    const url = window.prompt("Посилання (https://… або /wiki/Назва)", "/wiki/");
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    focusVisual();
    restoreSelection(ref.current, savedRangeRef.current);
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
    restoreSelection(ref.current, savedRangeRef.current);
    runCmd("formatBlock", tag);
    emitFromVisual();
  }

  function applyColor(color: string) {
    focusVisual();
    restoreSelection(ref.current, savedRangeRef.current);
    runCmd("styleWithCSS", "true");
    runCmd("foreColor", color);
    emitFromVisual();
    setColorOpen(false);
  }

  function insertImageHtml(url: string, alt = "") {
    const el = ref.current;
    if (!el) return;

    const img = document.createElement("img");
    img.src = url;
    img.alt = alt;
    img.setAttribute("style", "max-width:100%;height:auto");

    const wrap = document.createElement("p");
    wrap.appendChild(img);

    focusVisual();
    const restored = restoreSelection(el, savedRangeRef.current);
    if (restored) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(wrap);
        range.setStartAfter(wrap);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        emitFromVisual();
        return;
      }
    }

    el.appendChild(wrap);
    placeCaretAtEnd(el);
    emitFromVisual();
  }

  async function uploadImageFile(file: File): Promise<string | null> {
    const dataUrl = await compressImageFile(file, {
      maxEdge: 1400,
      quality: 0.82,
      maxBytes: 480_000,
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
      return null;
    }
    return d.url;
  }

  async function onPickImage(file: File | null) {
    if (!file || disabled) return;
    // Не вимикаємо contentEditable під час аплоаду — інакше губиться курсор/вміст.
    rememberSelection();
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      if (!url) return;
      insertImageHtml(url);
      setSelectedImg(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  }

  async function onReplaceImage(file: File | null) {
    if (!file || disabled || !selectedImg) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      if (!url) return;
      selectedImg.src = url;
      emitFromVisual();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  }

  function selectImage(img: HTMLImageElement) {
    setSelectedImg(img);
    setImgAlt(img.alt || "");
    setColorOpen(false);
  }

  function applyImgAlt() {
    if (!selectedImg) return;
    selectedImg.alt = imgAlt.trim();
    emitFromVisual();
  }

  function removeSelectedImage() {
    if (!selectedImg) return;
    const parent = selectedImg.parentElement;
    selectedImg.remove();
    if (
      parent &&
      parent.tagName === "P" &&
      !parent.textContent?.trim() &&
      parent.childNodes.length === 0
    ) {
      parent.remove();
    }
    setSelectedImg(null);
    emitFromVisual();
  }

  const toolBtn =
    "lc-focus-ring inline-flex size-8 items-center justify-center rounded-md border border-transparent text-[var(--mc-text)] hover:border-white/15 hover:bg-white/[0.06] disabled:opacity-40";
  const locked = Boolean(disabled);

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
              disabled={locked || uploading}
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
              disabled={locked || uploading}
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
              Пиши як у звичайному редакторі · клік по фото — змінити
              {uploading ? " · завантаження…" : ""}
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                focusVisual();
                restoreSelection(ref.current, savedRangeRef.current);
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                focusVisual();
                restoreSelection(ref.current, savedRangeRef.current);
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                focusVisual();
                restoreSelection(ref.current, savedRangeRef.current);
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                focusVisual();
                restoreSelection(ref.current, savedRangeRef.current);
                runCmd("strikeThrough");
                emitFromVisual();
              }}
              className={toolBtn}
            >
              <Strikethrough className="size-3.5" aria-hidden />
            </button>

            <div className="relative">
              <button
                type="button"
                title="Колір тексту"
                aria-label="Колір тексту"
                aria-expanded={colorOpen}
                disabled={locked}
                onMouseDown={(e) => {
                  e.preventDefault();
                  rememberSelection();
                  setColorOpen((o) => !o);
                  setSelectedImg(null);
                }}
                className={cn(
                  toolBtn,
                  colorOpen && "border-white/20 bg-white/[0.08]",
                )}
              >
                <Palette className="size-3.5" aria-hidden />
              </button>
              {colorOpen ? (
                <div
                  className="absolute left-0 top-full z-20 mt-1 grid w-[11.5rem] grid-cols-6 gap-1.5 rounded-lg border border-white/15 bg-[#121212] p-2 shadow-xl"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      aria-label={c.label}
                      disabled={locked}
                      onClick={() => applyColor(c.value)}
                      className="lc-focus-ring size-6 rounded-md border border-white/25"
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  <button
                    type="button"
                    title="Скинути колір"
                    aria-label="Скинути колір"
                    disabled={locked}
                    onClick={() => {
                      focusVisual();
                      restoreSelection(ref.current, savedRangeRef.current);
                      runCmd("removeFormat");
                      emitFromVisual();
                      setColorOpen(false);
                    }}
                    className="lc-focus-ring col-span-6 mt-0.5 rounded-md border border-white/12 px-2 py-1 text-[10px] font-bold text-[var(--mc-text-muted)] hover:bg-white/[0.06]"
                  >
                    Скинути колір
                  </button>
                </div>
              ) : null}
            </div>

            <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />
            <button
              type="button"
              title="Посилання"
              aria-label="Посилання"
              disabled={locked}
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                focusVisual();
                restoreSelection(ref.current, savedRangeRef.current);
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
              disabled={locked || uploading}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                setSelectedImg(null);
                setColorOpen(false);
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                focusVisual();
                restoreSelection(ref.current, savedRangeRef.current);
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                focusVisual();
                restoreSelection(ref.current, savedRangeRef.current);
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                focusVisual();
                restoreSelection(ref.current, savedRangeRef.current);
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
              disabled={locked}
              onMouseDown={(e) => {
                e.preventDefault();
                rememberSelection();
                focusVisual();
                restoreSelection(ref.current, savedRangeRef.current);
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
            <input
              ref={replaceFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                e.target.value = "";
                void onReplaceImage(file);
              }}
            />
          </div>
        ) : null}

        {mode === "visual" && selectedImg ? (
          <div className="flex flex-wrap items-end gap-2 rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-2">
            <p className="w-full text-[10px] font-bold uppercase tracking-wide text-cyan-100/90">
              Зображення
            </p>
            <label className="min-w-[10rem] flex-1 space-y-1">
              <span className="text-[10px] text-[var(--mc-text-muted)]">
                Підпис (alt)
              </span>
              <input
                value={imgAlt}
                onChange={(e) => setImgAlt(e.target.value)}
                onBlur={applyImgAlt}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyImgAlt();
                  }
                }}
                disabled={locked || uploading}
                className="lc-focus-ring w-full rounded-md border border-white/12 bg-black/40 px-2 py-1.5 text-xs text-[var(--mc-text)]"
                placeholder="Опис зображення"
              />
            </label>
            <button
              type="button"
              disabled={locked || uploading}
              onClick={() => replaceFileRef.current?.click()}
              className="lc-focus-ring rounded-md border border-white/15 px-2.5 py-1.5 text-[11px] font-bold text-[var(--mc-text)] hover:bg-white/[0.06] disabled:opacity-50"
            >
              {uploading ? "…" : "Замінити файл"}
            </button>
            <button
              type="button"
              disabled={locked || uploading}
              onClick={removeSelectedImage}
              className="lc-focus-ring rounded-md border border-rose-400/30 px-2.5 py-1.5 text-[11px] font-bold text-rose-100 hover:bg-rose-500/15 disabled:opacity-50"
            >
              Видалити
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => setSelectedImg(null)}
              className="lc-focus-ring rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-[var(--mc-text-muted)] hover:bg-white/[0.04]"
            >
              Закрити
            </button>
          </div>
        ) : null}
      </div>

      {mode === "visual" ? (
        <div
          ref={ref}
          role="textbox"
          aria-label="Візуальний редактор статті"
          aria-multiline
          contentEditable={!locked}
          suppressContentEditableWarning
          onInput={emitFromVisual}
          onBlur={emitFromVisual}
          onMouseUp={() => rememberSelection()}
          onKeyUp={() => rememberSelection()}
          onClick={(e) => {
            const t = e.target;
            if (t instanceof HTMLImageElement && ref.current?.contains(t)) {
              e.preventDefault();
              selectImage(t);
              return;
            }
            if (!(t instanceof HTMLElement && t.closest("img"))) {
              setSelectedImg(null);
            }
          }}
          className={cn(
            "wiki-mirror min-h-[22rem] max-h-[70vh] overflow-y-auto px-3 py-3 text-sm leading-relaxed text-[var(--mc-text)] outline-none sm:px-4",
            "[&_a]:font-semibold [&_a]:text-[var(--mc-net-green)] [&_a]:underline",
            "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
            "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
            "[&_p]:my-1.5",
            "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-extrabold",
            "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-bold",
            "[&_img]:my-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:cursor-pointer [&_img]:rounded-sm [&_img]:outline-offset-2",
            "[&_img:hover]:outline [&_img:hover]:outline-1 [&_img:hover]:outline-cyan-300/50",
            "[&_hr]:my-4 [&_hr]:border-white/20",
            "[&_table]:w-full [&_table]:border-collapse",
            locked && "pointer-events-none opacity-60",
            uploading && "opacity-90",
          )}
        />
      ) : (
        <textarea
          value={value}
          disabled={locked || uploading}
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
