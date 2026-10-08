"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

const RECENT_COLORS_KEY = "lc-skin-recent-colors";
const MAX_RECENT_COLORS = 10;
const SEED_COLORS = [
  "#f5f5f5",
  "#1a1a1a",
  "#c43c3c",
  "#3c78c4",
  "#3ca05a",
  "#e8c040",
  "#8b5a2b",
  "#c0c0c0",
];

function normalizeHex(hex: string): string | null {
  const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/);
  return m ? `#${m[1]!.toLowerCase()}` : null;
}

function loadRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(
      localStorage.getItem(RECENT_COLORS_KEY) || "[]",
    ) as unknown;
    if (!Array.isArray(raw)) return [];
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item !== "string") continue;
      const hex = normalizeHex(item);
      if (hex && !out.includes(hex)) out.push(hex);
      if (out.length >= MAX_RECENT_COLORS) break;
    }
    return out;
  } catch {
    return [];
  }
}

function persistRecentColors(colors: string[]) {
  try {
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors));
  } catch {
    /* ignore quota */
  }
}

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
  const [recentColors, setRecentColors] = useState<string[]>(() =>
    loadRecentColors(),
  );
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
  /** Мобільні вкладки: перегляд 3D / малювання / частини. */
  const [mobileTab, setMobileTab] = useState<"view" | "paint" | "parts">(
    "paint",
  );
  /** Один layout у DOM — щоб не дублювати canvas/viewer (ref + WebGL). */
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );
  const [showOuterLayer, setShowOuterLayer] = useState(true);
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
  const facePaintingRef = useRef(false);
  const strokeStartedRef = useRef(false);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const activePointersRef = useRef(new Set<number>());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const rememberColor = useCallback((hex: string) => {
    const n = normalizeHex(hex);
    if (!n) return;
    setRecentColors((prev) => {
      const next = [n, ...prev.filter((c) => c !== n)].slice(
        0,
        MAX_RECENT_COLORS,
      );
      persistRecentColors(next);
      return next;
    });
  }, []);

  const selectColor = useCallback(
    (hex: string) => {
      const n = normalizeHex(hex) ?? hex;
      setColor(n);
      rememberColor(n);
    },
    [rememberColor],
  );

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

  const loadPngDataUrl = useCallback(
    (
      src: string,
      opts?: { title?: string; modelType?: SkinModelType; asCopy?: boolean },
    ) => {
      setError(null);
      const img = new Image();
      img.onload = () => {
        if (img.width !== 64 || img.height !== 64) {
          setError("Потрібен PNG 64×64 (стандарт Java-скіна).");
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
        commitImage(ctx.getImageData(0, 0, 64, 64), true);
        if (opts?.modelType === "classic" || opts?.modelType === "slim") {
          setModel(opts.modelType);
        }
        if (opts?.title) {
          const base = opts.title.trim().slice(0, 70);
          setTitle(opts.asCopy && base ? `${base} (копія)` : base);
        }
      };
      img.onerror = () => setError("Не вдалося прочитати PNG");
      img.src = src;
    },
    [commitImage],
  );

  useEffect(() => {
    const from = Number(
      new URLSearchParams(window.location.search).get("from"),
    );
    if (!Number.isInteger(from) || from < 1) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/skins/${from}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          title?: string;
          model_type?: SkinModelType;
          png_data?: string;
        };
        if (!data.png_data || cancelled) return;
        loadPngDataUrl(data.png_data, {
          title: data.title,
          modelType: data.model_type,
          asCopy: true,
        });
      } catch {
        if (!cancelled) setError("Не вдалося завантажити скін для редагування");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPngDataUrl]);

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
    // Шахівниця під прозорими пікселями
    const tile = 8;
    for (let y = 0; y < canvas.height; y += tile) {
      for (let x = 0; x < canvas.width; x += tile) {
        ctx.fillStyle =
          (x / tile + y / tile) % 2 === 0 ? "#3a3a3a" : "#2a2a2a";
        ctx.fillRect(x, y, tile, tile);
      }
    }
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
    // Гумка / прозорість — alpha 0 (невидима область у грі, зокрема на 3D-шарі)
    if (toolRef.current === "eraser") {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    return hexToRgba(colorRef.current);
  }, []);

  const applyToolAt = useCallback(
    (texX: number, texY: number, continuous: boolean) => {
      const currentTool = toolRef.current;
      const rgba = paintColor();

      if (currentTool === "eyedropper") {
        const p = getPixel(imageRef.current, texX, texY);
        if (p.a > 0) selectColor(rgbaToHex(p.r, p.g, p.b));
        setTool("pencil");
        return;
      }

      if (
        currentTool !== "eraser" &&
        (!continuous || !strokeStartedRef.current)
      ) {
        rememberColor(colorRef.current);
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
    [commitImage, paintColor, rememberColor, selectColor],
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
      // Мультитач (зум/обертання) — не малюємо
      if (activePointersRef.current.size > 1) return;
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
      activePointersRef.current.add(e.pointerId);
      if (!paintOn3d || e.button !== 0 || e.altKey) return;
      if (activePointersRef.current.size > 1) return;
      e.preventDefault();
      paintingRef.current = true;
      strokeStartedRef.current = false;
      viewer.controls.enabled = false;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      paint3dFromEvent(e, false);
      strokeStartedRef.current = true;
    };
    const onMove = (e: PointerEvent) => {
      if (!paintingRef.current) return;
      if (activePointersRef.current.size > 1) return;
      e.preventDefault();
      paint3dFromEvent(e, true);
    };
    const onUp = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);
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

    canvas.addEventListener("pointerdown", onDown, { passive: false });
    canvas.addEventListener("pointermove", onMove, { passive: false });
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
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const importPng = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      loadPngDataUrl(String(reader.result || ""));
    };
    reader.onerror = () => setError("Не вдалося прочитати файл");
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
      aria-label={label}
      onClick={() => setTool(id)}
      className={cn(
        "lc-focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-sm border touch-manipulation sm:size-10",
        tool === id
          ? "border-[var(--mc-accent)] bg-[var(--mc-accent)]/20 text-[var(--mc-ink)]"
          : "border-white/10 bg-black/25 text-[var(--mc-ink-subtle)]",
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );

  const selectBodyPart = (id: BodyPartId) => {
    setBodyPart(id);
    const faces = getBodyPart(id, model).faces;
    if (!faces[faceSide]) {
      const first = FACE_ORDER.find((s) => faces[s]);
      if (first) setFaceSide(first);
    }
  };

  const onViewerReady = (v: SkinViewer) => {
    viewerRef.current = v;
    v.controls.mouseButtons = {
      LEFT: -1 as never,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE,
    };
    v.zoom = 0.92;
    v.playerObject.skin.setOuterLayerVisible(showOuterLayer);
    pushTextureToViewer(imageRef.current);
  };

  const facePaintHandlers = {
    onPointerDown: (e: ReactPointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      facePaintingRef.current = true;
      strokeStartedRef.current = false;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      paintFaceFromEvent(e, false);
      strokeStartedRef.current = true;
    },
    onPointerMove: (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!facePaintingRef.current) return;
      e.preventDefault();
      paintFaceFromEvent(e, true);
    },
    onPointerUp: () => {
      facePaintingRef.current = false;
      strokeStartedRef.current = false;
    },
    onPointerCancel: () => {
      facePaintingRef.current = false;
      strokeStartedRef.current = false;
    },
  };

  const modelControls = (compact: boolean) => (
    <>
      <button
        type="button"
        className={cn(
          "lc-focus-ring rounded-sm border text-xs touch-manipulation",
          compact ? "min-h-11 px-3" : "px-2 py-1 text-[11px]",
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
          "lc-focus-ring rounded-sm border text-xs touch-manipulation",
          compact ? "min-h-11 px-3" : "px-2 py-1 text-[11px]",
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
          "lc-focus-ring rounded-sm border text-xs touch-manipulation",
          compact ? "min-h-11 px-3" : "px-2 py-1 text-[11px]",
          !useOverlay
            ? "border-[var(--mc-accent)] bg-[var(--mc-accent)]/15"
            : "border-white/10 bg-black/25",
        )}
        onClick={() => setUseOverlay(false)}
        title="Внутрішній шар тіла"
      >
        База
      </button>
      <button
        type="button"
        className={cn(
          "lc-focus-ring rounded-sm border text-xs touch-manipulation",
          compact ? "min-h-11 px-3" : "px-2 py-1 text-[11px]",
          useOverlay
            ? "border-rose-400/70 bg-rose-500/20 text-rose-50"
            : "border-white/10 bg-black/25",
        )}
        onClick={() => {
          setUseOverlay(true);
          setShowOuterLayer(true);
        }}
        title="Зовнішній 3D-шар (капелюх, куртка, волосся)"
      >
        3D шар
      </button>
      <label
        className={cn(
          "flex items-center gap-2 text-xs text-[var(--mc-ink-subtle)]",
          compact
            ? "min-h-11 rounded-sm border border-white/10 bg-black/25 px-3"
            : "gap-1.5 text-[11px]",
        )}
      >
        <input
          type="checkbox"
          checked={showOuterLayer}
          onChange={(e) => setShowOuterLayer(e.target.checked)}
          className={cn("accent-[var(--mc-accent)]", compact && "size-4")}
        />
        Показ 3D
      </label>
    </>
  );

  const faceSidesBlock = (forMobile: boolean) => (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-auto",
        forMobile ? "px-2 py-2 sm:px-3 sm:py-3" : "px-3 py-3",
      )}
    >
      {!forMobile ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--mc-ink-subtle)]">
          {partDef.label} · сторони
        </p>
      ) : null}
      <div className={cn("flex flex-wrap gap-1.5", forMobile ? "mb-2" : "mb-3")}>
        {availableSides.map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => setFaceSide(side)}
            className={cn(
              "lc-focus-ring rounded-sm border touch-manipulation",
              forMobile
                ? "min-h-11 px-3 py-2 text-xs"
                : "px-2.5 py-1.5 text-xs",
              faceSide === side
                ? "border-rose-400/70 bg-rose-500/20 text-rose-50"
                : "border-white/10 bg-black/25 text-[var(--mc-ink-subtle)]",
            )}
          >
            {FACE_SIDE_LABELS[side]}
          </button>
        ))}
      </div>

      <div className={cn("flex justify-center", forMobile ? "mb-3" : "mb-4")}>
        <canvas
          ref={faceCanvasRef}
          className="max-w-full cursor-crosshair touch-none rounded-sm border border-white/15 shadow-[0_0_0_1px_rgba(225,29,72,0.25)]"
          style={{ touchAction: "none" }}
          {...facePaintHandlers}
        />
      </div>

      <div
        className={cn(
          "grid gap-2",
          forMobile ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3",
        )}
      >
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
  );

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col overscroll-none bg-[#0b0f14] text-[var(--mc-ink)]"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/50 px-2 py-2 backdrop-blur-md sm:px-3">
        <Link
          href="/skins"
          className="lc-focus-ring inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-sm px-2 text-xs text-[var(--mc-ink-subtle)] touch-manipulation"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Галерея</span>
        </Link>
        <h1 className="truncate text-sm font-semibold">Редактор</h1>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="Назва"
          className="min-h-11 min-w-0 flex-1 rounded-sm border border-white/15 bg-black/40 px-2 text-sm"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,.png"
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
          className="lc-focus-ring mc-btn-secondary inline-flex min-h-11 items-center gap-1.5 px-2.5 text-xs touch-manipulation sm:px-3"
          title="Імпортувати свій PNG 64×64"
        >
          <Upload className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Імпорт</span>
        </button>
        <button
          type="button"
          onClick={exportLocal}
          className="lc-focus-ring mc-btn-secondary hidden min-h-11 items-center gap-1.5 px-3 text-xs sm:inline-flex"
        >
          <Download className="size-3.5" aria-hidden />
          PNG
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="lc-focus-ring lc-btn-accent inline-flex min-h-11 items-center gap-1.5 px-3 text-xs touch-manipulation disabled:opacity-60"
        >
          <Save className="size-3.5" aria-hidden />
          {saving ? "…" : "OK"}
        </button>
      </header>
      {error ? (
        <p className="shrink-0 bg-red-950/40 px-3 py-1.5 text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {/* Інструменти */}
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-black/35 px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible lg:px-3 lg:py-2">
        {toolBtn("pencil", "Олівець", Paintbrush)}
        {toolBtn("eraser", "Прозорість", Eraser)}
        {toolBtn("fill", "Заливка", PaintBucket)}
        {toolBtn("eyedropper", "Піпетка", Pipette)}
        <button
          type="button"
          title="Скасувати"
          disabled={!history.length}
          onClick={undo}
          className="lc-focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-black/25 touch-manipulation disabled:opacity-40 lg:size-9"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          type="button"
          title="Повторити"
          disabled={!future.length}
          onClick={redo}
          className="lc-focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-black/25 touch-manipulation disabled:opacity-40 lg:size-9"
        >
          <Redo2 className="size-4" />
        </button>
        <button
          type="button"
          title="Скинути"
          onClick={resetBlank}
          className="lc-focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-black/25 touch-manipulation lg:size-9"
        >
          <RotateCcw className="size-4" />
        </button>
        <select
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="min-h-11 shrink-0 rounded-sm border border-white/15 bg-black/40 px-2 text-xs lg:min-h-0 lg:py-1"
          aria-label="Розмір пензля"
        >
          <option value={1}>1×1</option>
          <option value={2}>2×2</option>
          <option value={3}>3×3</option>
        </select>
        <label
          className="relative size-11 shrink-0 cursor-pointer touch-manipulation lg:size-9"
          title="Відкрити палітру кольорів"
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-md shadow-[0_0_0_1px_rgba(255,255,255,0.35)]"
            style={{
              background:
                "conic-gradient(#ff0040, #ffcc00, #33ff66, #00ccff, #3355ff, #cc33ff, #ff0040)",
            }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-[3px] rounded-sm border border-black/40"
            style={{
              backgroundImage: [
                `linear-gradient(${color}, ${color})`,
                "linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)",
              ].join(", "),
              backgroundSize: "100% 100%, 8px 8px, 8px 8px, 8px 8px, 8px 8px",
              backgroundPosition: "0 0, 0 0, 0 4px, 4px -4px, -4px 0",
              backgroundColor: "#222",
            }}
            aria-hidden
          />
          <input
            type="color"
            value={color}
            onChange={(e) => selectColor(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Палітра кольорів"
          />
        </label>
        <div
          className="flex shrink-0 items-center gap-1"
          title="Останні використані кольори"
        >
          {(recentColors.length > 0 ? recentColors : SEED_COLORS).map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Колір ${c}`}
              onClick={() => selectColor(c)}
              className={cn(
                "size-9 shrink-0 rounded-sm border touch-manipulation sm:size-7 lg:size-6",
                normalizeHex(color) === c
                  ? "border-white ring-1 ring-white/60"
                  : "border-white/20",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* ПК: модель / шар у тулбарі, як раніше */}
        <div className="ml-auto hidden flex-wrap items-center gap-1.5 lg:flex">
          {modelControls(false)}
          <label className="flex items-center gap-1.5 text-[11px] text-[var(--mc-ink-subtle)]">
            <input
              type="checkbox"
              checked={paintOn3d}
              onChange={(e) => setPaintOn3d(e.target.checked)}
              className="accent-[var(--mc-accent)]"
            />
            Малювати на моделі
          </label>
        </div>
      </div>

      {!isDesktop ? (
        <>
          {/* Мобільний UI */}
          <div className="flex shrink-0 border-b border-white/10">
            {(
              [
                ["view", "3D"],
                ["paint", "Пікселі"],
                ["parts", "Частини"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMobileTab(id)}
                className={cn(
                  "lc-focus-ring min-h-12 flex-1 text-sm font-medium touch-manipulation",
                  mobileTab === id
                    ? "border-b-2 border-rose-400 text-rose-100"
                    : "text-[var(--mc-ink-subtle)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {mobileTab === "view" ? (
              <section className="relative flex min-h-0 flex-1 flex-col">
                <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-white/10 px-2 py-1.5 sm:px-3 sm:py-2">
                  <div className="flex rounded-sm border border-white/15 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPaintOn3d(true)}
                      className={cn(
                        "lc-focus-ring min-h-10 rounded-sm px-3 text-xs touch-manipulation",
                        paintOn3d
                          ? "bg-rose-500/20 text-rose-100"
                          : "text-[var(--mc-ink-subtle)]",
                      )}
                    >
                      Фарба
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaintOn3d(false)}
                      className={cn(
                        "lc-focus-ring min-h-10 rounded-sm px-3 text-xs touch-manipulation",
                        !paintOn3d
                          ? "bg-[var(--mc-accent)]/20 text-[var(--mc-ink)]"
                          : "text-[var(--mc-ink-subtle)]",
                      )}
                    >
                      Крутити
                    </button>
                  </div>
                  <select
                    value={pose}
                    onChange={(e) => setPose(e.target.value as SkinPoseId)}
                    className="min-h-10 rounded-sm border border-white/15 bg-black/40 px-2 text-xs"
                    aria-label="Поза"
                  >
                    {SKIN_POSE_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex min-h-10 items-center gap-2 text-[11px] text-[var(--mc-ink-subtle)]">
                    <span className="hidden sm:inline">Швидк.</span>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.05}
                      value={animSpeed}
                      onChange={(e) => setAnimSpeed(Number(e.target.value))}
                      className="w-20 accent-[var(--mc-accent)] sm:w-28"
                    />
                  </label>
                </div>
                <div className="relative min-h-[42vh] flex-1 sm:min-h-[48vh]">
                  <SkinViewer3D
                    skinUrl={viewerSkinUrl}
                    slim={model === "slim"}
                    fill
                    pose={pose}
                    animationSpeed={animSpeed}
                    showOuterLayer={showOuterLayer}
                    touchInteract={paintOn3d ? "paint" : "rotate"}
                    enableRotate
                    enableZoom
                    className="absolute inset-0"
                    onReady={onViewerReady}
                  />
                </div>
              </section>
            ) : null}
            {mobileTab === "paint" ? faceSidesBlock(true) : null}
            {mobileTab === "parts" ? (
              <aside className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-2 py-3 sm:px-3">
                <BodyPartPicker
                  selected={bodyPart}
                  onSelect={selectBodyPart}
                  layout="row"
                />
                <div className="flex flex-wrap gap-1.5">{modelControls(true)}</div>
              </aside>
            ) : null}
          </div>
        </>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.15fr)_11rem_minmax(0,1fr)]">
          <section className="relative flex h-full min-h-0 flex-col border-r border-white/10">
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-white/10 px-3 py-2">
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
                showOuterLayer={showOuterLayer}
                enableRotate
                enableZoom
                className="absolute inset-0"
                onReady={onViewerReady}
              />
            </div>
          </section>

          <aside className="flex h-full flex-col items-center gap-2 overflow-auto border-r border-white/10 px-2 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mc-ink-subtle)]">
              Частина
            </p>
            <BodyPartPicker
              selected={bodyPart}
              onSelect={selectBodyPart}
              layout="stack"
            />
          </aside>

          {faceSidesBlock(false)}
        </div>
      )}
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
