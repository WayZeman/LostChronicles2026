"use client";

import { useEffect, useRef } from "react";
import {
  CrouchAnimation,
  IdleAnimation,
  RunningAnimation,
  SkinViewer,
  SwimAnimation,
  WalkingAnimation,
  type PlayerAnimation,
} from "skinview3d";
import { cn } from "@/lib/utils";

export type SkinPoseId =
  | "stand"
  | "idle"
  | "walk"
  | "run"
  | "crouch"
  | "swim";

export const SKIN_POSE_OPTIONS: { id: SkinPoseId; label: string }[] = [
  { id: "stand", label: "Стоячи" },
  { id: "idle", label: "Idle" },
  { id: "walk", label: "Ходьба" },
  { id: "run", label: "Біг" },
  { id: "crouch", label: "Сидіння" },
  { id: "swim", label: "Плавання" },
];

function createPoseAnimation(pose: SkinPoseId): PlayerAnimation | null {
  switch (pose) {
    case "stand":
      return null;
    case "idle": {
      const a = new IdleAnimation();
      a.speed = 0.7;
      return a;
    }
    case "walk": {
      const a = new WalkingAnimation();
      a.speed = 0.7;
      return a;
    }
    case "run": {
      const a = new RunningAnimation();
      a.speed = 0.85;
      return a;
    }
    case "crouch": {
      const a = new CrouchAnimation();
      a.speed = 0.5;
      return a;
    }
    case "swim": {
      const a = new SwimAnimation();
      a.speed = 0.7;
      return a;
    }
    default:
      return null;
  }
}

type Props = {
  skinUrl: string;
  slim?: boolean;
  width?: number;
  height?: number;
  /** Якщо true — розтягується на батьківський контейнер. */
  fill?: boolean;
  className?: string;
  animate?: boolean;
  pose?: SkinPoseId;
  onReady?: (viewer: SkinViewer) => void;
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
};

export function SkinViewer3D({
  skinUrl,
  slim = false,
  width = 220,
  height = 300,
  fill = false,
  className,
  animate = false,
  pose,
  onReady,
  enableRotate = true,
  enableZoom = true,
  enablePan = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startW = fill ? Math.max(wrapRef.current?.clientWidth || width, 120) : width;
    const startH = fill
      ? Math.max(wrapRef.current?.clientHeight || height, 160)
      : height;

    const viewer = new SkinViewer({
      canvas,
      width: startW,
      height: startH,
      skin: skinUrl,
      model: slim ? "slim" : "default",
    });
    viewer.controls.enableRotate = enableRotate;
    viewer.controls.enableZoom = enableZoom;
    viewer.controls.enablePan = enablePan;
    viewer.autoRotate = false;

    const initialPose = pose ?? (animate ? "walk" : "stand");
    const anim = createPoseAnimation(initialPose);
    if (anim) {
      viewer.animation = anim;
    } else {
      viewer.animation = null;
      viewer.playerObject.skin.resetJoints();
    }

    viewerRef.current = viewer;
    onReadyRef.current?.(viewer);

    let ro: ResizeObserver | null = null;
    if (fill && wrapRef.current) {
      ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry || !viewerRef.current) return;
        const { width: cw, height: ch } = entry.contentRect;
        if (cw < 40 || ch < 40) return;
        viewerRef.current.width = Math.floor(cw);
        viewerRef.current.height = Math.floor(ch);
      });
      ro.observe(wrapRef.current);
    }

    return () => {
      ro?.disconnect();
      viewer.dispose();
      viewerRef.current = null;
    };
    // Mount once; updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fill) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.width = width;
    viewer.height = height;
  }, [width, height, fill]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !skinUrl) return;
    void viewer.loadSkin(skinUrl, { model: slim ? "slim" : "default" });
  }, [skinUrl, slim]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.controls.enableRotate = enableRotate;
    viewer.controls.enableZoom = enableZoom;
    viewer.controls.enablePan = enablePan;
  }, [enableRotate, enableZoom, enablePan]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const next = pose ?? (animate ? "walk" : "stand");
    const anim = createPoseAnimation(next);
    if (anim) {
      viewer.animation = anim;
    } else {
      viewer.animation = null;
      viewer.playerObject.resetJoints();
    }
  }, [pose, animate]);

  return (
    <div
      ref={wrapRef}
      className={cn(fill && "h-full w-full min-h-0", className)}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "touch-none bg-[rgba(0,0,0,0.28)]",
          fill ? "h-full w-full" : "rounded-sm",
        )}
        style={fill ? { width: "100%", height: "100%" } : { width, height }}
        width={width}
        height={height}
      />
    </div>
  );
}
