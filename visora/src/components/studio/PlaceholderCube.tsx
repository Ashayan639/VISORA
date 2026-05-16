"use client";

import { cn } from "@/lib/utils";

interface PlaceholderCubeProps {
  /** Sub-text shown below the cube. */
  label?: string;
  /** Pulsing cyan glow — used while a generation is in flight. */
  pulse?: boolean;
  className?: string;
}

/**
 * SVG isometric wireframe cube + soft cyan grid.
 *
 * Used as the "no model yet" / loading / error fallback for
 * `<ModelViewer>`. Pure CSS animation — no Three.js, no JS frame loop,
 * so it remains rock solid even when the real viewer fails to mount.
 *
 * The `visora-cube-spin` keyframes live in `globals.css`; keeping them
 * out of `<style jsx>` here is what lets this file build cleanly with
 * `next-swc-loader` (multi-line className strings + styled-jsx is a
 * known parser hazard).
 */
export function PlaceholderCube({
  label = "Your 3D model will appear here",
  pulse = false,
  className,
}: PlaceholderCubeProps) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden",
        "bg-[radial-gradient(120%_80%_at_50%_20%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(120%_80%_at_50%_100%,rgba(168,85,247,0.10),transparent_60%)]",
        className,
      )}
    >
      {/* Grid floor */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          "[background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]",
          "[background-size:32px_32px]",
        )}
      />

      {/* Rotating SVG cube */}
      <div
        className={cn(
          "relative animate-visora-cube-spin",
          pulse && "[filter:drop-shadow(0_0_18px_rgba(56,189,248,0.45))]",
        )}
        aria-hidden
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          className="text-brand-cyan/85"
        >
          <path d="M50 12 L82 28 L50 44 L18 28 Z" />
          <path d="M18 28 L18 64 L50 80 L50 44 Z" />
          <path d="M82 28 L82 64 L50 80 L50 44 Z" />
          <path d="M50 12 L50 44" strokeOpacity="0.5" />
          <path d="M18 28 L82 28" strokeOpacity="0.5" />
        </svg>
      </div>

      {/* Label */}
      <p
        className={cn(
          "relative z-10 mt-6 max-w-[72%] text-center text-[13px] leading-relaxed",
          "text-foreground/85",
        )}
      >
        {label}
      </p>
      <p className="relative z-10 mt-1 text-[11px] font-mono text-hint">
        wireframe placeholder · auto-rotate
      </p>
    </div>
  );
}

export default PlaceholderCube;
