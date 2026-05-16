"use client";

import { Suspense, lazy } from "react";

import { cn } from "@/lib/utils";

/**
 * Lazy-loaded Spline scene.
 *
 * `@splinetool/react-spline` ships ~700KB of WASM/runtime. We defer the
 * import until the component actually renders, and wrap it in `<Suspense>`
 * so the page paints instantly with a spinner placeholder.
 *
 * Lives behind a `"use client"` boundary so `lazy()` (and Spline itself,
 * which touches `window`) only runs in the browser.
 *
 * Note: we deliberately import the default entry, NOT the `/next` subpath.
 * `@splinetool/react-spline/next` is an **async Server Component** which
 * React 19 cannot render inside a `"use client"` Suspense boundary.
 */
const Spline = lazy(() => import("@splinetool/react-spline"));

export interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense fallback={<SplineSpinner className={className} />}>
      <Spline scene={scene} className={className} />
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
          border-2 border-brand-cyan/20 border-t-brand-cyan
          animate-spin
        "
        aria-label="Loading 3D scene"
        role="status"
      />
    </div>
  );
}

export default SplineScene;
