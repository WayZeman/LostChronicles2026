"use client";

import { useEffect, useRef } from "react";
import { SkinViewer, WalkingAnimation } from "skinview3d";
import { cn } from "@/lib/utils";

type Props = {
  skinUrl: string;
  slim?: boolean;
  width?: number;
  height?: number;
  className?: string;
  /** Якщо true — повільна ходьба в превʼю галереї. */
  animate?: boolean;
  /** Доступ до інстансу (для raycast-малювання). */
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
  className,
  animate = false,
  onReady,
  enableRotate = true,
  enableZoom = true,
  enablePan = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewer = new SkinViewer({
      canvas,
      width,
      height,
      skin: skinUrl,
      model: slim ? "slim" : "default",
    });
    viewer.controls.enableRotate = enableRotate;
    viewer.controls.enableZoom = enableZoom;
    viewer.controls.enablePan = enablePan;
    viewer.autoRotate = false;
    if (animate) {
      viewer.animation = new WalkingAnimation();
      viewer.animation.speed = 0.6;
    }
    viewerRef.current = viewer;
    onReadyRef.current?.(viewer);

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
    // Mount once; skin/slim updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.width = width;
    viewer.height = height;
  }, [width, height]);

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

  return (
    <canvas
      ref={canvasRef}
      className={cn("touch-none rounded-sm bg-[rgba(0,0,0,0.25)]", className)}
      style={{ width, height }}
      width={width}
      height={height}
    />
  );
}
