"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  className?: string;
};

function runCmd(command: string, value?: string) {
  document.execCommand(command, false, value);
}

/**
 * Простий WYSIWYG для FAQ (як Word): жирний, курсив, підкреслення, посилання, списки.
 */
export function FaqRichEditor({ value, onChange, disabled, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const primed = useRef(false);

  useEffect(() => {
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
  }, [value]);

  function emit() {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    lastEmitted.current = html;
    onChange(html);
  }

  function addLink() {
    const url = window.prompt("Посилання (https://…)", "https://");
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    ref.current?.focus();
    runCmd("createLink", trimmed);
    // Make links open in new tab
    const sel = window.getSelection();
    if (sel?.anchorNode) {
      const node =
        sel.anchorNode.nodeType === Node.ELEMENT_NODE
          ? (sel.anchorNode as HTMLElement)
          : sel.anchorNode.parentElement;
      const a = node?.closest?.("a");
      if (a) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    }
    emit();
  }

  const tools: {
    label: string;
    icon: typeof Bold;
    action: () => void;
  }[] = [
    {
      label: "Жирний",
      icon: Bold,
      action: () => {
        runCmd("bold");
        emit();
      },
    },
    {
      label: "Курсив",
      icon: Italic,
      action: () => {
        runCmd("italic");
        emit();
      },
    },
    {
      label: "Підкреслення",
      icon: Underline,
      action: () => {
        runCmd("underline");
        emit();
      },
    },
    {
      label: "Посилання",
      icon: Link2,
      action: addLink,
    },
    {
      label: "Маркований список",
      icon: List,
      action: () => {
        runCmd("insertUnorderedList");
        emit();
      },
    },
    {
      label: "Нумерований список",
      icon: ListOrdered,
      action: () => {
        runCmd("insertOrderedList");
        emit();
      },
    },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-white/12 bg-black/25",
        className,
      )}
    >
      <div className="flex flex-wrap gap-1 border-b border-white/10 p-1.5">
        {tools.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              ref.current?.focus();
              action();
            }}
            className="lc-focus-ring inline-flex size-8 items-center justify-center rounded-md border border-transparent text-[var(--mc-text)] hover:border-white/15 hover:bg-white/[0.06] disabled:opacity-40"
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        className={cn(
          "min-h-[8rem] max-h-[22rem] overflow-y-auto px-3 py-2.5 text-sm leading-relaxed text-[var(--mc-text)] outline-none",
          "[&_a]:font-semibold [&_a]:text-[var(--mc-net-green)] [&_a]:underline",
          "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_p]:my-1.5",
          "[&_strong]:font-bold [&_b]:font-bold",
          "[&_em]:italic [&_i]:italic",
          "[&_u]:underline",
        )}
      />
    </div>
  );
}
