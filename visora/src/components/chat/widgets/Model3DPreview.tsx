"use client";

import { motion } from "framer-motion";
import { Download, Maximize2 } from "lucide-react";

import type { Model3D } from "@/types/visora";
import { cn } from "@/lib/utils";

interface Model3DPreviewProps {
  data: Model3D;
  /** Open the full 3D viewer in the right panel. */
  onOpen?: () => void;
  /** Trigger a GLB download (parent provides the URL → blob handling). */
  onDownload?: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Auto-rotating wireframe cube placeholder
   ───────────────────────────────────────────────────────────── */

function RotatingCube({ pulse = false }: { pulse?: boolean }) {
  // SVG isometric cube wireframe. The container rotates on Z for an
  // unmistakably "spinning model" feel without pulling in three.js.
  return (
    <motion.svg
      animate={{
        rotate: 360,
        ...(pulse ? { opacity: [0.45, 1, 0.45], scale: [0.96, 1.04, 0.96] } : {}),
      }}
      transition={{
        rotate: { duration: pulse ? 6 : 12, repeat: Infinity, ease: "linear" },
        ...(pulse
          ? {
              opacity: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
            }
          : {}),
      }}
      viewBox="-60 -60 120 120"
      width="120"
      height="120"
      aria-hidden
      className="drop-shadow-[0_0_15px_rgba(255,255,255,0.35)]"
    >
      <defs>
        <linearGradient id="cube-stroke" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFA" />
          <stop offset="100%" stopColor="#818283" />
        </linearGradient>
      </defs>

      {/* Back face */}
      <polygon
        points="-26,-30 22,-44 22,4 -26,18"
        fill="none"
        stroke="url(#cube-stroke)"
        strokeOpacity="0.35"
        strokeWidth="1.25"
      />
      {/* Front face */}
      <polygon
        points="-22,-18 26,-32 26,16 -22,30"
        fill="rgba(255,255,255,0.04)"
        stroke="url(#cube-stroke)"
        strokeWidth="1.5"
      />
      {/* Connectors */}
      <line
        x1="-26"
        y1="-30"
        x2="-22"
        y2="-18"
        stroke="url(#cube-stroke)"
        strokeOpacity="0.5"
        strokeWidth="1.25"
      />
      <line
        x1="22"
        y1="-44"
        x2="26"
        y2="-32"
        stroke="url(#cube-stroke)"
        strokeOpacity="0.5"
        strokeWidth="1.25"
      />
      <line
        x1="22"
        y1="4"
        x2="26"
        y2="16"
        stroke="url(#cube-stroke)"
        strokeOpacity="0.5"
        strokeWidth="1.25"
      />
      <line
        x1="-26"
        y1="18"
        x2="-22"
        y2="30"
        stroke="url(#cube-stroke)"
        strokeOpacity="0.5"
        strokeWidth="1.25"
      />
    </motion.svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Model3DPreview
   ───────────────────────────────────────────────────────────── */

export function Model3DPreview({
  data,
  onOpen,
  onDownload,
}: Model3DPreviewProps) {
  const isReady = data.modelUrl && data.status === "generated";
  const isLoading = data.status === "loading";

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="
        relative overflow-hidden rounded-2xl
        bg-white/[0.03] backdrop-blur-xl
        border border-[#4F5052]/30
      "
    >
      {/* Eyebrow row */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-hint" />
          3D Model
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            isReady
              ? "bg-foreground/10 text-foreground border-foreground/30"
              : isLoading
                ? "bg-white/[0.04] text-foreground border-[#4F5052]/30"
                : "bg-white/[0.04] text-muted border-[#4F5052]/30",
          )}
        >
          {isReady ? "Ready" : isLoading ? "Forging…" : "Pending"}
        </span>
      </div>

      {/* Viewer placeholder — fixed 200px height */}
      <div
        className={cn(
          "relative mt-3 flex items-center justify-center overflow-hidden",
          "border-y border-[#4F5052]/30",
          "bg-[radial-gradient(120%_80%_at_50%_20%,rgba(255,255,255,0.10),transparent_60%),radial-gradient(120%_80%_at_50%_100%,rgba(129,130,131,0.10),transparent_60%)]",
        )}
        style={{ height: 200 }}
      >
        {/* Grid floor */}
        <div
          aria-hidden
          className="
            pointer-events-none absolute inset-0
            [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]
            [background-size:20px_20px]
          "
        />

        <RotatingCube pulse={isLoading} />

        {isReady ? null : (
          <span className="absolute bottom-2 right-3 text-[10px] font-mono text-hint">
            {isLoading ? "forging mesh…" : "placeholder · auto-rotate"}
          </span>
        )}
      </div>

      {/* Footer / prompt + actions */}
      <div className="space-y-3 p-4">
        {data.prompt ? (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-muted">
            <span className="text-hint">Prompt · </span>
            {data.prompt}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="
                group/btn inline-flex items-center gap-1.5 rounded-full
                px-4 py-2 text-[12px] font-semibold text-white
                bg-foreground text-background
                shadow-md shadow-black/25
                transition-all duration-200
                hover:scale-[1.03] hover:shadow-lg hover:shadow-black/35
              "
            >
              <Maximize2 size={13} />
              Open 3D Studio
            </button>
          ) : null}

          <button
            type="button"
            onClick={onDownload}
            disabled={!isReady || !onDownload}
            className="
              inline-flex items-center gap-1.5 rounded-full
              px-3 py-2 text-[12px] font-semibold
              bg-white/[0.04] backdrop-blur-md
              border border-[#4F5052]/30 text-foreground/85
              transition-colors duration-200
              hover:border-[#4F5052]/30 hover:text-foreground
              disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#4F5052]/30 disabled:hover:text-foreground/85
            "
          >
            <Download size={13} />
            Download GLB
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default Model3DPreview;
