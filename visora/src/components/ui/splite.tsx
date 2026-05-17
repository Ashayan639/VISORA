"use client";

import type { Application } from "@splinetool/runtime";
import { Suspense, lazy, useCallback, useState } from "react";

import { useSplineCursorLook } from "@/hooks/useSplineCursorLook";
import { cn } from "@/lib/utils";

const Spline = lazy(() => import("@splinetool/react-spline"));

export interface SplineSceneProps {
  scene: string;
  className?: string;
  /** Tilt / look-at toward cursor (desktop pointer only). */
  followCursor?: boolean;
}

function SplineSceneInner({
  scene,
  className,
  followCursor = false,
}: SplineSceneProps) {
  const [app, setApp] = useState<Application | null>(null);

  const onLoad = useCallback((instance: Application) => {
    setApp(instance);
    try {
      instance.setGlobalEvents(true);
    } catch {
      // Optional — some exports ignore global events.
    }
  }, []);

  useSplineCursorLook(app, followCursor);

  return (
    <Spline
      scene={scene}
      onLoad={onLoad}
      className={cn("h-full w-full [&_canvas]:!h-full [&_canvas]:!w-full", className)}
    />
  );
}

export function SplineScene(props: SplineSceneProps) {
  return (
    <Suspense fallback={<SplineSpinner className={props.className} />}>
      <SplineSceneInner {...props} />
    </Suspense>
  );
}

function SplineSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        className,
      )}
    >
      <div
        className="
          h-10 w-10 rounded-full
          border-2 border-[#4F5052]/30 border-t-foreground
          animate-spin
        "
        aria-label="Loading 3D scene"
        role="status"
      />
    </div>
  );
}

export default SplineScene;
