"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Eraser,
  Paintbrush,
  PaintBucket,
  Pipette,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
  Upload,
} from "lucide-react";
import type { SkinViewer } from "skinview3d";
import { MOUSE, Raycaster, Vector2 } from "three";
import { BodyPartPicker } from "@/components/skins/BodyPartPicker";
import {
  SKIN_POSE_OPTIONS,
  type SkinPoseId,
} from "@/components/skins/SkinViewer3D";
import {
  FACE_SIDE_LABELS,
  SKIN_SIZE,
  type BodyPartId,
  type FaceSide,
  type SkinModelType,
  cloneImageData,
  createBlankSkinImageData,
  floodFill,
  getBodyPart,
  getPixel,
  hexToRgba,
  imageDataToPngDataUrl,
  normalizeSkinForGame,
  resolveFaceRect,
  rgbaToHex,
  stampBrush,
  uvToSkinPixel,
} from "@/lib/minecraft-skin";
import { cn } from "@/lib/utils";

const SkinViewer3D = dynamic(
  () =>
    import("@/components/skins/SkinViewer3D").then((m) => m.SkinViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[16rem] w-full items-center justify-center text-sm text-[var(--mc-ink-subtle)]">
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

const FACE_ORDER: FaceSide[] = [
  "front",
  "back",
  "left",
  "right",
  "top",
  "bottom",
];

function collectLayerTargets(viewer: SkinViewer, useOverlay: boolean) {
  const skin = viewer.playerObject.skin;
  return [
    skin.head,
    skin.body,
    skin.rightArm,
    skin.leftArm,
    skin.rightLeg,
    skin.leftLeg,
  ].map((p) => (useOverlay ? p.outerLayer : p.innerLayer));
}

export function SkinEditor() {
  const router = useRouter();
  const [imageData, setImageData] = useState(() => createBlankSkinImageData());
  const [model, setModel] = useState<SkinModelType>("classic");
  const [title, setTitle] = useState("");
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#3c78c4");
  const [brushSize, setBrushSize] = useState(1);
  const [useOverlay, setUseOverlay] = useState(false);
  const [bodyPart, setBodyPart] = useState<BodyPartId>("head");
  const [faceSide, setFaceSide] = useState<FaceSide>("front");
  const [paintOn3d, setPaintOn3d] = useState(true);
  const [pose, setPose] = useState<SkinPoseId>("walk");
  const [animSpeed, setAnimSpeed] = useState(0.7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);
  /** Stable URL for initial viewer mount only — live updates go via texture canvas. */
  const [viewerSkinUrl] = useState(() =>
    imageDataToPngDataUrl(createBlankSkinImageData()),
  );

  const imageRef = useRef(imageData);
  imageRef.current = imageData;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const colorRef = useRef(color);
  colorRef.current = color;
  const brushRef = useRef(brushSize);
  brushRef.current = brushSize;
  const overlayRef = useRef(useOverlay);
  overlayRef.current = useOverlay;
  const modelRef = useRef(model);
  modelRef.current = model;
  const faceClipRef = useRef({ x: 0, y: 0, w: 8, h: 8 });
  const viewerRef = useRef<SkinViewer | null>(null);
  const texCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paintingRef = useRef(false);
  const strokeStartedRef = useRef(false);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const partDef = useMemo(
    () => getBodyPart(bodyPart, model),
    [bodyPart, model],
  );
  const availableSides = useMemo(
    () => FACE_ORDER.filter((s) => partDef.faces[s]),
    [partDef],
  );

  useEffect(() => {
    if (!partDef.faces[faceSide]) {
      setFaceSide(availableSides[0] ?? "front");
    }
  }, [partDef, faceSide, availableSides]);

  const faceRect = partDef.faces[faceSide];
  const faceOrigin = useMemo(() => {
    if (!faceRect) return { x: 8, y: 8, w: 8, h: 8 };
    return resolveFaceRect(faceRect, useOverlay);
  }, [faceRect, useOverlay]);
  faceClipRef.current = faceOrigin;

  const pushTextureToViewer = useCallback((data: ImageData) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    let canvas = texCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = SKIN_SIZE;
      canvas.height = SKIN_SIZE;
      texCanvasRef.current = canvas;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(data, 0, 0);
    const map = viewer.playerObject.skin.map;
    const img = map?.image as CanvasImageSource | undefined;
    if (map && img === canvas) {
      map.needsUpdate = true;
    } else {
      void viewer.loadSkin(canvas, {
        model: modelRef.current === "slim" ? "slim" : "default",
      });
    }
  }, []);

  const pushHistory = useCallback((prev: ImageData) => {
    setHistory((h) => [...h.slice(-39), cloneImageData(prev)]);
    setFuture([]);
  }, []);

  const commitImage = useCallback(
    (next: ImageData, recordHistory = true) => {
      if (recordHistory) pushHistory(imageRef.current);
      setImageData(next);
      imageRef.current = next;
      pushTextureToViewer(next);
    },
    [pushHistory, pushTextureToViewer],
  );

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1]!;
      setFuture((f) => [cloneImageData(imageRef.current), ...f].slice(0, 40));
      const restored = cloneImageData(prev);
      setImageData(restored);
      imageRef.current = restored;
      pushTextureToViewer(restored);
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
      pushTextureToViewer(restored);
      return f.slice(1);
    });
  };

  const resetBlank = () => {
    const blank = createBlankSkinImageData();
    commitImage(blank, true);
  };

  useEffect(() => {
    const canvas = faceCanvasRef.current;
    if (!canvas) return;
    const scale = Math.max(
      18,
      Math.min(36, Math.floor(320 / Math.max(faceOrigin.w, faceOrigin.h))),
    );
    canvas.width = faceOrigin.w * scale;
    canvas.height = faceOrigin.h * scale;
    canvas.dataset.scale = String(scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const tmp = document.createElement("canvas");
    tmp.width = SKIN_SIZE;
    tmp.height = SKIN_SIZE;
    tmp.getContext("2d")?.putImageData(imageData, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
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
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
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

  const paintColor = useCallback((): {
    r: number;
    g: number;
    b: number;
    a: number;
  } => {
    if (toolRef.current === "eraser") {
      // База: білий непрозорий (інакше дірки в грі). Overlay: прозорість.
      if (overlayRef.current) return { r: 0, g: 0, b: 0, a: 0 };
      return { r: 245, g: 245, b: 245, a: 255 };
    }
    return hexToRgba(colorRef.current);
  }, []);

  const applyToolAt = useCallback(
    (texX: number, texY: number, continuous: boolean) => {
      const currentTool = toolRef.current;
      const rgba = paintColor();

      if (currentTool === "eyedropper") {
        const p = getPixel(imageRef.current, texX, texY);
        if (p.a > 0) setColor(rgbaToHex(p.r, p.g, p.b));
        setTool("pencil");
        return;
      }

      const next = cloneImageData(imageRef.current);
      if (currentTool === "fill") {
        floodFill(
          next,
          texX,
          texY,
          rgba.r,
          rgba.g,
          rgba.b,
          rgba.a,
          faceClipRef.current,
        );
        commitImage(next, true);
        return;
      }

      stampBrush(
        next,
        texX,
        texY,
        brushRef.current,
        rgba.r,
        rgba.g,
        rgba.b,
        rgba.a,
      );

      const recordHistory = !continuous || !strokeStartedRef.current;
      if (continuous) strokeStartedRef.current = true;
      commitImage(next, recordHistory);
    },
    [commitImage, paintColor],
  );

  const paintFaceFromEvent = (
    e: React.PointerEvent<HTMLCanvasElement>,
    continuous: boolean,
  ) => {
    const canvas = faceCanvasRef.current;
    if (!canvas) return;
    const scale = Number(canvas.dataset.scale || 22);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = Math.floor(((e.clientX - rect.left) * scaleX) / scale);
    const py = Math.floor(((e.clientY - rect.top) * scaleY) / scale);
    if (px < 0 || py < 0 || px >= faceOrigin.w || py >= faceOrigin.h) return;
    applyToolAt(faceOrigin.x + px, faceOrigin.y + py, continuous);
  };

  const paint3dFromEvent = useCallback(
    (e: PointerEvent, continuous: boolean) => {
      const viewer = viewerRef.current;
      if (!viewer || !paintOn3d) return;
      const canvas = viewer.canvas;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      const ndc = new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      viewer.camera.updateMatrixWorld();
      const raycaster = new Raycaster();
      raycaster.setFromCamera(ndc, viewer.camera);
      const targets = collectLayerTargets(viewer, overlayRef.current);
      const hits = raycaster.intersectObjects(targets, true);
      const hit = hits.find((h) => h.uv);
      if (!hit?.uv) return;
      const { x, y } = uvToSkinPixel(hit.uv.x, hit.uv.y);
      applyToolAt(x, y, continuous);
    },
    [applyToolAt, paintOn3d],
  );

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const canvas = viewer.canvas;

    const onDown = (e: PointerEvent) => {
      if (!paintOn3d || e.button !== 0 || e.altKey) return;
      e.preventDefault();
      paintingRef.current = true;
      strokeStartedRef.current = false;
      viewer.controls.enabled = false;
      canvas.setPointerCapture(e.pointerId);
      paint3dFromEvent(e, false);
      strokeStartedRef.current = true;
    };
    const onMove = (e: PointerEvent) => {
      if (!paintingRef.current) return;
      paint3dFromEvent(e, true);
    };
    const onUp = (e: PointerEvent) => {
      if (!paintingRef.current) return;
      paintingRef.current = false;
      strokeStartedRef.current = false;
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
  }, [paint3dFromEvent, paintOn3d, useOverlay]);

  // Reload model when Steve/Alex switches
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    pushTextureToViewer(imageRef.current);
  }, [model, pushTextureToViewer]);

  const exportLocal = () => {
    const url = imageDataToPngDataUrl(imageRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.trim() || "lc-skin"}.png`;
    a.click();
  };

  const importPng = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        if (img.width !== 64 || img.height !== 64) {
          setError("Імпорт лише PNG 64×64 (стандарт Java-скіна).");
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 64, 64);
        ctx.drawImage(img, 0, 0);
        const imported = normalizeSkinForGame(ctx.getImageData(0, 0, 64, 64));
        commitImage(imported, true);
      };
      img.onerror = () => setError("Не вдалося прочитати PNG");
      img.src = src;
    };
    reader.readAsDataURL(file);
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
      const png_data = imageDataToPngDataUrl(imageRef.current);
      const res = await fetch("/api/skins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          model_type: model,
          png_data,
        }),
      });
      const data = (await res.json()) as { error?: string };
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
        "lc-focus-ring inline-flex size-9 items-center justify-center rounded-sm border sm:size-10",
        tool === id
          ? "border-[var(--mc-accent)] bg-[var(--mc-accent)]/20 text-[var(--mc-ink)]"
          : "border-white/10 bg-black/25 text-[var(--mc-ink-subtle)] hover:bg-black/40",
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0b0f14] text-[var(--mc-ink)]">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md">
        <Link
          href="/skins"
          className="lc-focus-ring inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-[var(--mc-ink-subtle)] hover:bg-white/5 hover:text-[var(--mc-ink)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Галерея
        </Link>
        <h1 className="text-sm font-semibold sm:text-base">Редактор скіна</h1>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Назва скіна"
            className="w-36 rounded-sm border border-white/15 bg-black/40 px-2 py-1.5 text-xs sm:w-48 sm:text-sm"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importPng(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="lc-focus-ring mc-btn-secondary inline-flex min-h-9 items-center gap-1.5 px-3 text-xs"
          >
            <Upload className="size-3.5" aria-hidden />
            Імпорт
          </button>
          <button
            type="button"
            onClick={exportLocal}
            className="lc-focus-ring mc-btn-secondary inline-flex min-h-9 items-center gap-1.5 px-3 text-xs"
          >
            <Download className="size-3.5" aria-hidden />
            PNG
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="lc-focus-ring lc-btn-accent inline-flex min-h-9 items-center gap-1.5 px-3 text-xs disabled:opacity-60"
          >
            <Save className="size-3.5" aria-hidden />
            {saving ? "…" : "Зберегти"}
          </button>
        </div>
        {error ? (
          <p className="w-full text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-black/25 px-3 py-2">
        <div className="flex gap-1">
          {toolBtn("pencil", "Олівець", Paintbrush)}
          {toolBtn("eraser", "Гумка", Eraser)}
          {toolBtn("fill", "Заливка", PaintBucket)}
          {toolBtn("eyedropper", "Піпетка", Pipette)}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            title="Скасувати"
            disabled={!history.length}
            onClick={undo}
            className="lc-focus-ring inline-flex size-9 items-center justify-center rounded-sm border border-white/10 bg-black/25 disabled:opacity-40"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            title="Повторити"
            disabled={!future.length}
            onClick={redo}
            className="lc-focus-ring inline-flex size-9 items-center justify-center rounded-sm border border-white/10 bg-black/25 disabled:opacity-40"
          >
            <Redo2 className="size-4" />
          </button>
          <button
            type="button"
            title="Скинути макет"
            onClick={resetBlank}
            className="lc-focus-ring inline-flex size-9 items-center justify-center rounded-sm border border-white/10 bg-black/25"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        <label className="flex items-center gap-1.5 text-[11px] text-[var(--mc-ink-subtle)]">
          Пензель
          <select
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="rounded-sm border border-white/15 bg-black/40 px-1.5 py-1 text-xs text-[var(--mc-ink)]"
          >
            <option value={1}>1×1</option>
            <option value={2}>2×2</option>
            <option value={3}>3×3</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-[11px]">
          <span className="text-[var(--mc-ink-subtle)]">Колір</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="size-8 cursor-pointer rounded-sm border border-white/15 bg-transparent"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              className={cn(
                "size-6 rounded-sm border",
                color === c ? "border-white" : "border-white/20",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className={cn(
              "lc-focus-ring rounded-sm border px-2 py-1 text-[11px]",
              model === "classic"
                ? "border-[var(--mc-accent)] bg-[var(--mc-accent)]/15"
                : "border-white/10 bg-black/25",
            )}
            onClick={() => setModel("classic")}
          >
            Steve
          </button>
          <button
            type="button"
            className={cn(
              "lc-focus-ring rounded-sm border px-2 py-1 text-[11px]",
              model === "slim"
                ? "border-[var(--mc-accent)] bg-[var(--mc-accent)]/15"
                : "border-white/10 bg-black/25",
            )}
            onClick={() => setModel("slim")}
          >
            Alex
          </button>
          <button
            type="button"
            className={cn(
              "lc-focus-ring rounded-sm border px-2 py-1 text-[11px]",
              !useOverlay
                ? "border-[var(--mc-accent)] bg-[var(--mc-accent)]/15"
                : "border-white/10 bg-black/25",
            )}
            onClick={() => setUseOverlay(false)}
          >
            База
          </button>
          <button
            type="button"
            className={cn(
              "lc-focus-ring rounded-sm border px-2 py-1 text-[11px]",
              useOverlay
                ? "border-[var(--mc-accent)] bg-[var(--mc-accent)]/15"
                : "border-white/10 bg-black/25",
            )}
            onClick={() => setUseOverlay(true)}
          >
            Overlay
          </button>
          <label className="flex items-center gap-1.5 text-[11px] text-[var(--mc-ink-subtle)]">
            <input
              type="checkbox"
              checked={paintOn3d}
              onChange={(e) => setPaintOn3d(e.target.checked)}
              className="accent-[var(--mc-accent)]"
            />
            3D-малювання
          </label>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_11rem_minmax(0,1fr)]">
        <section className="relative flex min-h-[40vh] flex-col border-b border-white/10 lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 px-3 py-2">
            <span className="text-[11px] uppercase tracking-wide text-[var(--mc-ink-subtle)]">
              Поза
            </span>
            {SKIN_POSE_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPose(p.id)}
                className={cn(
                  "lc-focus-ring rounded-sm border px-2 py-1 text-[11px]",
                  pose === p.id
                    ? "border-rose-400/60 bg-rose-500/15 text-rose-100"
                    : "border-white/10 bg-black/25 text-[var(--mc-ink-subtle)]",
                )}
              >
                {p.label}
              </button>
            ))}
            <label className="ml-2 flex items-center gap-2 text-[11px] text-[var(--mc-ink-subtle)]">
              Швидкість
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={animSpeed}
                onChange={(e) => setAnimSpeed(Number(e.target.value))}
                className="w-24 accent-[var(--mc-accent)]"
              />
              <span className="w-8 tabular-nums text-[var(--mc-ink)]">
                {animSpeed.toFixed(2)}
              </span>
            </label>
            <span className="ml-auto text-[10px] text-[var(--mc-ink-subtle)]">
              ЛКМ — фарба · ПКМ — обертати · PNG 64×64 для гри
            </span>
          </div>
          <div className="relative min-h-0 flex-1">
            <SkinViewer3D
              skinUrl={viewerSkinUrl}
              slim={model === "slim"}
              fill
              pose={pose}
              animationSpeed={animSpeed}
              enableRotate
              enableZoom
              className="absolute inset-0"
              onReady={(v) => {
                viewerRef.current = v;
                v.controls.mouseButtons = {
                  LEFT: -1 as never,
                  MIDDLE: MOUSE.DOLLY,
                  RIGHT: MOUSE.ROTATE,
                };
                pushTextureToViewer(imageRef.current);
              }}
            />
          </div>
        </section>

        <aside className="flex flex-col items-center gap-2 border-b border-white/10 px-2 py-3 lg:border-b-0 lg:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mc-ink-subtle)]">
            Частина
          </p>
          <BodyPartPicker
            selected={bodyPart}
            onSelect={(id) => {
              setBodyPart(id);
              const faces = getBodyPart(id, model).faces;
              if (!faces[faceSide]) {
                const first = FACE_ORDER.find((s) => faces[s]);
                if (first) setFaceSide(first);
              }
            }}
          />
        </aside>

        <section className="flex min-h-0 flex-col overflow-auto px-3 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--mc-ink-subtle)]">
            {partDef.label} · сторони
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {availableSides.map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setFaceSide(side)}
                className={cn(
                  "lc-focus-ring rounded-sm border px-2.5 py-1.5 text-xs",
                  faceSide === side
                    ? "border-rose-400/70 bg-rose-500/20 text-rose-50"
                    : "border-white/10 bg-black/25 text-[var(--mc-ink-subtle)]",
                )}
              >
                {FACE_SIDE_LABELS[side]}
              </button>
            ))}
          </div>

          <div className="mb-4 flex justify-center">
            <canvas
              ref={faceCanvasRef}
              className="cursor-crosshair touch-none rounded-sm border border-white/15 shadow-[0_0_0_1px_rgba(225,29,72,0.25)]"
              onPointerDown={(e) => {
                strokeStartedRef.current = false;
                (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
                paintFaceFromEvent(e, false);
                strokeStartedRef.current = true;
              }}
              onPointerMove={(e) => {
                if (e.buttons !== 1) return;
                paintFaceFromEvent(e, true);
              }}
              onPointerUp={() => {
                strokeStartedRef.current = false;
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availableSides.map((side) => {
              const rect = partDef.faces[side]!;
              const origin = resolveFaceRect(rect, useOverlay);
              return (
                <FaceThumb
                  key={side}
                  label={FACE_SIDE_LABELS[side]}
                  active={faceSide === side}
                  imageData={imageData}
                  origin={origin}
                  onClick={() => setFaceSide(side)}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function FaceThumb({
  label,
  active,
  imageData,
  origin,
  onClick,
}: {
  label: string;
  active: boolean;
  imageData: ImageData;
  origin: { x: number; y: number; w: number; h: number };
  onClick: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const scale = 10;
    canvas.width = origin.w * scale;
    canvas.height = origin.h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const tmp = document.createElement("canvas");
    tmp.width = SKIN_SIZE;
    tmp.height = SKIN_SIZE;
    tmp.getContext("2d")?.putImageData(imageData, 0, 0);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      tmp,
      origin.x,
      origin.y,
      origin.w,
      origin.h,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }, [imageData, origin]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "lc-focus-ring flex flex-col items-center gap-1 rounded-sm border p-2",
        active
          ? "border-rose-400/70 bg-rose-500/10"
          : "border-white/10 bg-black/20 hover:bg-black/35",
      )}
    >
      <canvas ref={ref} className="rounded-[1px]" />
      <span className="text-[10px] text-[var(--mc-ink-subtle)]">{label}</span>
    </button>
  );
}
