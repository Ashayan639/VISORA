"use client";

import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";
import {
  BookmarkPlus,
  Download,
  Lightbulb,
  Loader2,
  RotateCcw,
  Sun,
  Sunset,
} from "lucide-react";

import type { Model3D } from "@/types/visora";
import { cn } from "@/lib/utils";

import { PlaceholderCube } from "./PlaceholderCube";

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */

export type LightingPreset = "studio" | "outdoor" | "dramatic";

export interface ModelViewerProps {
  /** Latest 3D model state from the chat. `null` = no model yet. */
  model: Model3D | null;
  /** Save the current model to the gallery. Disabled if undefined. */
  onSaveToGallery?: (model: Model3D) => void;
  /** Title for the panel header. */
  title?: string;
  className?: string;
}

/* ─────────────────────────────────────────────────────────────
   Lazy-loaded scene.

   Three.js, fiber, and drei are heavy and strictly client-only. We
   skip SSR and show the wireframe cube as the loading fallback so
   the experience is never blank.
   ───────────────────────────────────────────────────────────── */

const ModelScene = dynamic(
  () => import("./ModelScene").then((m) => m.ModelScene),
  {
    ssr: false,
    loading: () => (
      <PlaceholderCube label="Loading viewer…" pulse className="absolute inset-0" />
    ),
  },
);

/* ─────────────────────────────────────────────────────────────
   Error boundary — catches Three.js / fiber crashes so the whole
   page never goes white. Falls back to the wireframe placeholder.
   ───────────────────────────────────────────────────────────── */

interface SceneErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
}

class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error("[ModelViewer] scene error:", error);
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* ─────────────────────────────────────────────────────────────
   Lighting selector
   ───────────────────────────────────────────────────────────── */

const LIGHTING_OPTIONS: Array<{
  id: LightingPreset;
  label: string;
  icon: typeof Sun;
}> = [
  { id: "studio", label: "Studio", icon: Lightbulb },
  { id: "outdoor", label: "Outdoor", icon: Sun },
  { id: "dramatic", label: "Dramatic", icon: Sunset },
];

function LightingSelector({
  value,
  onChange,
  disabled,
}: {
  value: LightingPreset;
  onChange: (v: LightingPreset) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Lighting preset"
      className="
        inline-flex items-center gap-0.5 rounded-full p-0.5
        bg-white/[0.03] border border-white/[0.06]
      "
    >
      {LIGHTING_OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              "transition-colors duration-150",
              active
                ? "bg-brand-cyan/15 text-foreground border border-brand-cyan/30"
                : "text-muted hover:text-foreground hover:bg-white/[0.04]",
              disabled && "opacity-40 cursor-not-allowed",
            )}
            title={label}
          >
            <Icon size={12} aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ModelViewer
   ───────────────────────────────────────────────────────────── */

export function ModelViewer({
  model,
  onSaveToGallery,
  title = "3D Studio",
  className,
}: ModelViewerProps) {
  const [lighting, setLighting] = useState<LightingPreset>("studio");
  const [autoRotate, setAutoRotate] = useState(true);

  const isLoading = model?.status === "loading";
  const hasModel =
    !!model &&
    model.status === "generated" &&
    typeof model.modelUrl === "string" &&
    model.modelUrl.length > 0;

  const placeholderLabel = isLoading
    ? "Forging your 3D mesh…"
    : model?.status === "fallback"
      ? "Viewer unavailable — showing placeholder."
      : "Your 3D model will appear here";

  const handleDownload = () => {
    if (!model?.modelUrl) return;
    // Open in a new tab so the browser handles the GLB download / view.
    window.open(model.modelUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-card/40 backdrop-blur-xl",
        className,
      )}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-[14px] font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {isLoading ? (
            <Loader2
              size={13}
              className="shrink-0 animate-spin text-brand-cyan"
              aria-label="Generating"
            />
          ) : null}
        </div>

        <LightingSelector
          value={lighting}
          onChange={setLighting}
          disabled={!hasModel}
        />
      </header>

      {/* ── Scene ──────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {hasModel && model ? (
          <SceneErrorBoundary
            fallback={
              <PlaceholderCube
                label="3D viewer hit a snag — showing placeholder. Open the GLB in a new tab below."
                className="absolute inset-0"
              />
            }
          >
            <ModelScene
              url={model.modelUrl}
              preset={lighting}
              autoRotate={autoRotate}
            />
          </SceneErrorBoundary>
        ) : (
          <PlaceholderCube
            label={placeholderLabel}
            pulse={isLoading}
            className="absolute inset-0"
          />
        )}
      </div>

      {/* ── Footer controls ───────────────────────────────── */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          disabled={!hasModel}
          aria-pressed={autoRotate}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
            "border transition-colors duration-150 backdrop-blur-md",
            autoRotate && hasModel
              ? "bg-brand-cyan/15 border-brand-cyan/30 text-foreground"
              : "bg-white/[0.04] border-white/[0.08] text-muted hover:text-foreground",
            !hasModel && "opacity-40 cursor-not-allowed",
          )}
          title={autoRotate ? "Pause auto-rotate" : "Resume auto-rotate"}
        >
          <RotateCcw
            size={12}
            className={cn(
              "transition-transform duration-300",
              autoRotate && hasModel && "animate-[spin_4s_linear_infinite]",
            )}
            aria-hidden
          />
          {autoRotate ? "Auto-rotate" : "Paused"}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasModel}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
              "border transition-colors duration-150 backdrop-blur-md",
              hasModel
                ? "bg-white/[0.04] border-white/[0.08] text-foreground/85 hover:text-foreground hover:border-brand-cyan/30"
                : "bg-white/[0.04] border-white/[0.08] text-muted opacity-40 cursor-not-allowed",
            )}
          >
            <Download size={12} aria-hidden />
            Download GLB
          </button>

          <button
            type="button"
            onClick={() => model && onSaveToGallery?.(model)}
            disabled={!hasModel || !onSaveToGallery}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
              "transition-all duration-200",
              hasModel && onSaveToGallery
                ? "bg-gradient-to-r from-brand-cyan to-brand-purple text-white shadow-md shadow-brand-cyan/20 hover:scale-[1.03] hover:shadow-lg hover:shadow-brand-purple/30"
                : "bg-white/[0.04] border border-white/[0.08] text-muted opacity-40 cursor-not-allowed",
            )}
          >
            <BookmarkPlus size={12} aria-hidden />
            Save to Gallery
          </button>
        </div>
      </footer>
    </div>
  );
}

export default ModelViewer;
