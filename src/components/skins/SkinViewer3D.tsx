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
import { TOUCH } from "three";
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

function createPoseAnimation(
  pose: SkinPoseId,
  speed: number,
): PlayerAnimation | null {
  const s = Math.min(3, Math.max(0, speed));
  switch (pose) {
    case "stand":
      return null;
    case "idle": {
      const a = new IdleAnimation();
      a.speed = s;
      return a;
    }
    case "walk": {
      const a = new WalkingAnimation();
      a.speed = s;
      return a;
    }
    case "run": {
      const a = new RunningAnimation();
      a.speed = s;
      return a;
    }
    case "crouch": {
      const a = new CrouchAnimation();
      a.speed = s;
      return a;
    }
    case "swim": {
      const a = new SwimAnimation();
      a.speed = s;
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
  fill?: boolean;
  className?: string;
  animate?: boolean;
  pose?: SkinPoseId;
  /** 0 = пауза, 1 = нормально, до 3. */
  animationSpeed?: number;
  /** Показувати 3D overlay-шар (капелюх/куртка тощо). */
  showOuterLayer?: boolean;
  /**
   * touchInteract:
   * - paint — один палець не крутить (для малювання зверху)
   * - rotate — один палець крутить модель
   */
  touchInteract?: "paint" | "rotate";
  onReady?: (viewer: SkinViewer) => void;
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
};

function applyTouchMode(
  viewer: SkinViewer,
  mode: "paint" | "rotate",
  enableRotate: boolean,
) {
  // Фарба: 1 палець не крутить (enableRotate off), 2 пальці — зум/обертання
  if (mode === "paint") {
    viewer.controls.enableRotate = false;
    viewer.controls.enablePan = false;
    viewer.controls.touches = {
      ONE: TOUCH.ROTATE,
      TWO: TOUCH.DOLLY_ROTATE,
    };
  } else {
    viewer.controls.enableRotate = enableRotate;
    viewer.controls.enablePan = false;
    viewer.controls.touches = {
      ONE: TOUCH.ROTATE,
      TWO: TOUCH.DOLLY_PAN,
    };
  }
}

export function SkinViewer3D({
  skinUrl,
  slim = false,
  width = 220,
  height = 300,
  fill = false,
  className,
  animate = false,
  pose,
  animationSpeed = 0.7,
  showOuterLayer = true,
  touchInteract = "rotate",
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
  const slimRef = useRef(slim);
  slimRef.current = slim;
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const speedRef = useRef(animationSpeed);
  speedRef.current = animationSpeed;
  const animateRef = useRef(animate);
  animateRef.current = animate;

  const applyPose = (viewer: SkinViewer) => {
    const next = poseRef.current ?? (animateRef.current ? "walk" : "stand");
    const speed = speedRef.current;
    if (speed <= 0.001 || next === "stand") {
      viewer.animation = null;
      viewer.playerObject.resetJoints();
      return;
    }
    const anim = createPoseAnimation(next, speed);
    if (anim) {
      viewer.animation = anim;
    } else {
      viewer.animation = null;
      viewer.playerObject.resetJoints();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startW = fill
      ? Math.max(wrapRef.current?.clientWidth || width, 120)
      : width;
    const startH = fill
      ? Math.max(wrapRef.current?.clientHeight || height, 160)
      : height;

    const viewer = new SkinViewer({
      canvas,
      width: startW,
      height: startH,
      skin: skinUrl,
      model: slim ? "slim" : "default",
      zoom: fill ? 0.92 : 0.9,
    });
    viewer.controls.enableZoom = enableZoom;
    viewer.controls.enablePan = enablePan;
    viewer.autoRotate = false;
    applyTouchMode(viewer, touchInteract, enableRotate);
    applyPose(viewer);

    viewerRef.current = viewer;
    onReadyRef.current?.(viewer);

    let ro: ResizeObserver | null = null;
    if (fill && wrapRef.current) {
      ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry || !viewerRef.current) return;
        const { width: cw, height: ch } = entry.contentRect;
        if (cw < 40 || ch < 40) return;
        const v = viewerRef.current;
        v.width = Math.floor(cw);
        v.height = Math.floor(ch);
        v.adjustCameraDistance();
      });
      ro.observe(wrapRef.current);
    }

    return () => {
      ro?.disconnect();
      viewer.dispose();
      viewerRef.current = null;
    };
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
    void viewer.loadSkin(skinUrl, {
      model: slimRef.current ? "slim" : "default",
    });
  }, [skinUrl, slim]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.controls.enableZoom = enableZoom;
    viewer.controls.enablePan = enablePan;
    applyTouchMode(viewer, touchInteract, enableRotate);
  }, [enableRotate, enableZoom, enablePan, touchInteract]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    applyPose(viewer);
  }, [pose, animate, animationSpeed]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.playerObject.skin.setOuterLayerVisible(showOuterLayer);
  }, [showOuterLayer]);

  return (
    <div
      ref={wrapRef}
      className={cn(fill && "h-full w-full min-h-0", className)}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "touch-none bg-[rgba(0,0,0,0.28)] [-webkit-touch-callout:none]",
          fill ? "h-full w-full" : "rounded-sm",
        )}
        style={
          fill
            ? { width: "100%", height: "100%", touchAction: "none" }
            : { width, height, touchAction: "none" }
        }
        width={width}
        height={height}
      />
    </div>
  );
}
