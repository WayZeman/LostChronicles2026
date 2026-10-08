"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eraser,
  Paintbrush,
  PaintBucket,
  Pipette,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { SkinViewer } from "skinview3d";
import { MOUSE, Raycaster, Vector2 } from "three";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import {
  SKIN_FACES,
  SKIN_SIZE,
  type SkinFaceId,
  type SkinModelType,
  cloneImageData,
  createBlankSkinImageData,
  floodFill,
  getPixel,
  hexToRgba,
  imageDataToPngDataUrl,
  rgbaToHex,
  setPixel,
} from "@/lib/minecraft-skin";
import { cn } from "@/lib/utils";

const SkinViewer3D = dynamic(
  () =>
    import("@/components/skins/SkinViewer3D").then((m) => m.SkinViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] w-[280px] items-center justify-center text-sm text-[var(--mc-ink-subtle)]">
        Завантаження 3D…
      </div>
    ),
  },
);

type Tool = "pencil" | "eraser" | "fill" | "eyedropper";

const PALETTE = [
  "#f5f5f5",
  "#1a1a1a",
  "#c43c3c",
  "#3c78c4",
  "#3ca05a",
  "#e8c040",
  "#8b5a2b",
  "#c0c0c0",
  "#7b3fa0",
  "#e07030",
  "#5ac8d4",
  "#f0a0c0",
];

const FACE_IDS = Object.keys(SKIN_FACES) as SkinFaceId[];

export function SkinEditor() {
  const router = useRouter();
  const [imageData, setImageData] = useState(() => createBlankSkinImageData());
  const [skinUrl, setSkinUrl] = useState(() =>
    imageDataToPngDataUrl(createBlankSkinImageData()),
  );
  const [model, setModel] = useState<SkinModelType>("classic");
  const [title, setTitle] = useState("");
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#3c78c4");
  const [useOverlay, setUseOverlay] = useState(false);
  const [faceId, setFaceId] = useState<SkinFaceId>("head_front");
  const [paintOn3d, setPaintOn3d] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);

  const imageRef = useRef(imageData);
  imageRef.current = imageData;
  const viewerRef = useRef<SkinViewer | null>(null);
  const paintingRef = useRef(false);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const uvCanvasRef = useRef<HTMLCanvasElement>(null);

  const face = SKIN_FACES[faceId];
  const faceOrigin = useMemo(() => {
    if (useOverlay && face.overlay) {
      return { x: face.overlay.x, y: face.overlay.y, w: face.w, h: face.h };
    }
    return { x: face.x, y: face.y, w: face.w, h: face.h };
  }, [face, useOverlay]);

  const pushHistory = useCallback((prev: ImageData) => {
    setHistory((h) => [...h.slice(-39), cloneImageData(prev)]);
    setFuture([]);
  }, []);

  const commitImage = useCallback(
    (next: ImageData, recordHistory = true) => {
      if (recordHistory) pushHistory(imageRef.current);
      setImageData(next);
      imageRef.current = next;
      setSkinUrl(imageDataToPngDataUrl(next));
    },
    [pushHistory],
  );

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1]!;
      setFuture((f) => [cloneImageData(imageRef.current), ...f].slice(0, 40));
      const restored = cloneImageData(prev);
      setImageData(restored);
      imageRef.current = restored;
      setSkinUrl(imageDataToPngDataUrl(restored));
      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0]!;
      setHistory((h) => [...h, cloneImageData(imageRef.current)].slice(-40));
      const restored = cloneImageData(next);
      setImageData(restored);
      imageRef.current = restored;
      setSkinUrl(imageDataToPngDataUrl(restored));
      return f.slice(1);
    });
  };

  // Draw face zoom canvas
  useEffect(() => {
    const canvas = faceCanvasRef.current;
    if (!canvas) return;
    const scale = 22;
    canvas.width = faceOrigin.w * scale;
    canvas.height = faceOrigin.h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const tmp = document.createElement("canvas");
    tmp.width = SKIN_SIZE;
    tmp.height = SKIN_SIZE;
    const tctx = tmp.getContext("2d");
    if (!tctx) return;
    tctx.putImageData(imageData, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      tmp,
      faceOrigin.x,
      faceOrigin.y,
      faceOrigin.w,
      faceOrigin.h,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= faceOrigin.w; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale + 0.5, 0);
      ctx.lineTo(x * scale + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= faceOrigin.h; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale + 0.5);
      ctx.lineTo(canvas.width, y * scale + 0.5);
      ctx.stroke();
    }
  }, [imageData, faceOrigin]);

  // Mini full UV map
  useEffect(() => {
    const canvas = uvCanvasRef.current;
    if (!canvas) return;
    canvas.width = SKIN_SIZE * 2;
    canvas.height = SKIN_SIZE * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(imageData, 0, 0);
    // scale up via draw
    const tmp = document.createElement("canvas");
    tmp.width = SKIN_SIZE;
    tmp.height = SKIN_SIZE;
    tmp.getContext("2d")?.putImageData(imageData, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(96, 165, 250, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      faceOrigin.x * 2,
      faceOrigin.y * 2,
      faceOrigin.w * 2,
      faceOrigin.h * 2,
    );
  }, [imageData, faceOrigin]);

  const applyToolAt = useCallback(
    (texX: number, texY: number, continuous: boolean) => {
      const rgba =
        tool === "eraser"
          ? { r: 0, g: 0, b: 0, a: 0 }
          : hexToRgba(color);

      if (tool === "eyedropper") {
        const p = getPixel(imageRef.current, texX, texY);
        if (p.a > 0) setColor(rgbaToHex(p.r, p.g, p.b));
        setTool("pencil");
        return;
      }

      const next = cloneImageData(imageRef.current);
      if (tool === "fill") {
        floodFill(next, texX, texY, rgba.r, rgba.g, rgba.b, rgba.a, faceOrigin);
        commitImage(next, true);
        return;
      }

      setPixel(next, texX, texY, rgba.r, rgba.g, rgba.b, rgba.a);
      // For continuous paint, only push history on stroke start
      commitImage(next, !continuous);
    },
    [color, commitImage, faceOrigin, tool],
  );

  const paintFaceFromEvent = (
    e: React.PointerEvent<HTMLCanvasElement>,
    continuous: boolean,
  ) => {
    const canvas = faceCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = Math.floor(((e.clientX - rect.left) * scaleX) / 22);
    const py = Math.floor(((e.clientY - rect.top) * scaleY) / 22);
    if (px < 0 || py < 0 || px >= faceOrigin.w || py >= faceOrigin.h) return;
    applyToolAt(faceOrigin.x + px, faceOrigin.y + py, continuous);
  };

  const paint3dFromEvent = useCallback(
    (e: PointerEvent, continuous: boolean) => {
      const viewer = viewerRef.current;
      if (!viewer || !paintOn3d) return;
      const canvas = viewer.canvas;
      const rect = canvas.getBoundingClientRect();
      const ndc = new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new Raycaster();
      raycaster.setFromCamera(ndc, viewer.camera);
      const hits = raycaster.intersectObject(viewer.playerObject, true);
      const hit = hits.find((h) => h.uv);
      if (!hit?.uv) return;
      const texX = Math.min(SKIN_SIZE - 1, Math.max(0, Math.floor(hit.uv.x * SKIN_SIZE)));
      const texY = Math.min(
        SKIN_SIZE - 1,
        Math.max(0, Math.floor((1 - hit.uv.y) * SKIN_SIZE)),
      );
      applyToolAt(texX, texY, continuous);
    },
    [applyToolAt, paintOn3d],
  );

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const canvas = viewer.canvas;

    const onDown = (e: PointerEvent) => {
      if (!paintOn3d || e.button !== 0) return;
      // Rotate with Alt / right button / two fingers — paint with left
      if (e.altKey) return;
      paintingRef.current = true;
      viewer.controls.enabled = false;
      canvas.setPointerCapture(e.pointerId);
      paint3dFromEvent(e, false);
    };
    const onMove = (e: PointerEvent) => {
      if (!paintingRef.current) return;
      paint3dFromEvent(e, true);
    };
    const onUp = (e: PointerEvent) => {
      if (!paintingRef.current) return;
      paintingRef.current = false;
      viewer.controls.enabled = true;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [paint3dFromEvent, paintOn3d, skinUrl]);

  const exportLocal = () => {
    const a = document.createElement("a");
    a.href = skinUrl;
    a.download = `${title.trim() || "lc-skin"}.png`;
    a.click();
  };

  const save = async () => {
    setError(null);
    const t = title.trim();
    if (!t) {
      setError("Вкажіть назву скіна");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/skins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          model_type: model,
          png_data: skinUrl,
        }),
      });
      const data = (await res.json()) as { error?: string; skin?: { id: number } };
      if (!res.ok) {
        setError(data.error || "Не вдалося зберегти");
        return;
      }
      router.push("/skins");
      router.refresh();
    } catch {
      setError("Мережева помилка");
    } finally {
      setSaving(false);
    }
  };

  const toolBtn = (id: Tool, label: string, Icon: typeof Paintbrush) => (
    <button
      key={id}
      type="button"
      title={label}
      onClick={() => setTool(id)}
      className={cn(
        "lc-focus-ring inline-flex size-10 items-center justify-center rounded-sm border",
        tool === id
          ? "border-[var(--mc-accent)] bg-[var(--mc-accent)]/20 text-[var(--mc-ink)]"
          : "border-white/10 bg-black/20 text-[var(--mc-ink-subtle)] hover:bg-black/35",
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className={cn(lcGlassPanelClass, "flex flex-col gap-3")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="lc-section-title text-lg">3D макет</h2>
          <label className="flex items-center gap-2 text-xs text-[var(--mc-ink-subtle)]">
            <input
              type="checkbox"
              checked={paintOn3d}
              onChange={(e) => setPaintOn3d(e.target.checked)}
              className="accent-[var(--mc-accent)]"
            />
            Малювати на моделі
          </label>
        </div>
        <p className="text-xs text-[var(--mc-ink-subtle)]">
          {paintOn3d
            ? "ЛКМ — малювати піксель. ПКМ — крутити модель. Колесо — зум."
            : "Увімкни «Малювати на моделі» або малюй на розгортці справа. ПКМ — обертання."}
        </p>
        <div className="flex justify-center">
          <SkinViewer3D
            skinUrl={skinUrl}
            slim={model === "slim"}
            width={280}
            height={380}
            enableRotate
            enableZoom
            onReady={(v) => {
              viewerRef.current = v;
              // ЛКМ для фарби, ПКМ для орбіти
              v.controls.mouseButtons = {
                LEFT: -1 as never,
                MIDDLE: MOUSE.DOLLY,
                RIGHT: MOUSE.ROTATE,
              };
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "lc-focus-ring mc-btn-secondary min-h-9 px-3 text-xs",
              model === "classic" && "ring-1 ring-[var(--mc-accent)]",
            )}
            onClick={() => setModel("classic")}
          >
            Steve (широкі)
          </button>
          <button
            type="button"
            className={cn(
              "lc-focus-ring mc-btn-secondary min-h-9 px-3 text-xs",
              model === "slim" && "ring-1 ring-[var(--mc-accent)]",
            )}
            onClick={() => setModel("slim")}
          >
            Alex (slim)
          </button>
          <button
            type="button"
            className={cn(
              "lc-focus-ring mc-btn-secondary min-h-9 px-3 text-xs",
              !useOverlay && "ring-1 ring-[var(--mc-accent)]",
            )}
            onClick={() => setUseOverlay(false)}
          >
            База
          </button>
          <button
            type="button"
            className={cn(
              "lc-focus-ring mc-btn-secondary min-h-9 px-3 text-xs",
              useOverlay && "ring-1 ring-[var(--mc-accent)]",
            )}
            onClick={() => setUseOverlay(true)}
          >
            Overlay
          </button>
        </div>
      </section>

      <section className={cn(lcGlassPanelClass, "flex flex-col gap-3")}>
        <h2 className="lc-section-title text-lg">Пікселі</h2>

        <div className="flex flex-wrap gap-1.5">
          {toolBtn("pencil", "Олівець", Paintbrush)}
          {toolBtn("eraser", "Гумка", Eraser)}
          {toolBtn("fill", "Заливка", PaintBucket)}
          {toolBtn("eyedropper", "Піпетка", Pipette)}
          <button
            type="button"
            title="Скасувати"
            disabled={!history.length}
            onClick={undo}
            className="lc-focus-ring inline-flex size-10 items-center justify-center rounded-sm border border-white/10 bg-black/20 disabled:opacity-40"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            title="Повторити"
            disabled={!future.length}
            onClick={redo}
            className="lc-focus-ring inline-flex size-10 items-center justify-center rounded-sm border border-white/10 bg-black/20 disabled:opacity-40"
          >
            <Redo2 className="size-4" />
          </button>
          <label className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-[var(--mc-ink-subtle)]">Колір</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="size-9 cursor-pointer rounded-sm border border-white/15 bg-transparent"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              className={cn(
                "size-7 rounded-sm border",
                color === c ? "border-white" : "border-white/20",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <label className="block text-xs text-[var(--mc-ink-subtle)]">
          Частина тіла
          <select
            value={faceId}
            onChange={(e) => setFaceId(e.target.value as SkinFaceId)}
            className="mt-1 w-full rounded-sm border border-white/15 bg-black/30 px-2 py-2 text-sm text-[var(--mc-ink)]"
          >
            {FACE_IDS.map((id) => (
              <option key={id} value={id}>
                {SKIN_FACES[id].label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-start gap-4">
          <canvas
            ref={faceCanvasRef}
            className="cursor-crosshair touch-none rounded-sm border border-white/10"
            onPointerDown={(e) => {
              (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
              paintFaceFromEvent(e, false);
            }}
            onPointerMove={(e) => {
              if (e.buttons !== 1) return;
              paintFaceFromEvent(e, true);
            }}
          />
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--mc-ink-subtle)]">
              UV 64×64
            </p>
            <canvas
              ref={uvCanvasRef}
              className="rounded-sm border border-white/10"
              width={128}
              height={128}
            />
          </div>
        </div>

        <div className="mt-2 grid gap-2 border-t border-white/10 pt-3">
          <label className="text-xs text-[var(--mc-ink-subtle)]">
            Назва скіна
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Наприклад: Лицар боліт"
              className="mt-1 w-full rounded-sm border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--mc-ink)]"
            />
          </label>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center gap-2 px-5 text-sm disabled:opacity-60"
            >
              <Save className="size-4" aria-hidden />
              {saving ? "Збереження…" : "Зберегти скін"}
            </button>
            <button
              type="button"
              onClick={exportLocal}
              className="lc-focus-ring mc-btn-secondary inline-flex min-h-11 items-center gap-2 px-4 text-sm"
            >
              <Download className="size-4" aria-hidden />
              PNG
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
