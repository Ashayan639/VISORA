"use client";

import { motion } from "framer-motion";
import { Maximize2, RefreshCw } from "lucide-react";

import type { VisualAsset } from "@/types/visora";
import { cn } from "@/lib/utils";

interface ImageGridProps {
  assets: VisualAsset[];
  /** Open the full-size view in the right panel. */
  onOpenAsset?: (asset: VisualAsset) => void;
  onRegenerateAsset?: (asset: VisualAsset) => void;
  /** Open the grid as a whole (e.g. full image_grid widget). */
  onOpenAll?: () => void;
}

const STATUS_COPY: Record<VisualAsset["status"], string> = {
  loading: "Generating",
  generated: "Ready",
  fallback: "Fallback",
  error: "Error",
};

const STATUS_TONE: Record<VisualAsset["status"], string> = {
  loading: "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30",
  generated: "bg-state-success/10 text-state-success border-state-success/30",
  fallback: "bg-state-warning/10 text-state-warning border-state-warning/30",
  error: "bg-state-danger/10 text-state-danger border-state-danger/30",
};

/* ─────────────────────────────────────────────────────────────
   Single tile
   ───────────────────────────────────────────────────────────── */

function ImageTile({
  asset,
  delay,
  onOpen,
  onRegenerate,
}: {
  asset: VisualAsset;
  delay: number;
  onOpen?: () => void;
  onRegenerate?: () => void;
}) {
  const isLoading = asset.status === "loading";

  return (
    <motion.div
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="
        group relative aspect-square overflow-hidden rounded-xl
        bg-card-hover/40 border border-white/[0.06]
        transition-colors duration-200 hover:border-brand-cyan/20
      "
    >
      {/* Image OR skeleton */}
      {asset.imageUrl ? (
        // Using <img> rather than next/image because fal.ai returns
        // arbitrary cross-domain URLs; configuring next.config remoteImages
        // for every provider is too brittle for the hackathon.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.imageUrl}
          alt={asset.title}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center",
            "bg-gradient-to-br from-brand-cyan/10 via-card-hover/30 to-brand-purple/10",
            isLoading && "animate-pulse",
          )}
        >
          <span className="px-3 text-center text-[11px] uppercase tracking-wider text-hint">
            {isLoading ? "Generating…" : asset.title}
          </span>
        </div>
      )}

      {/* Bottom gradient + title overlay */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-x-0 bottom-0 h-20
          bg-gradient-to-t from-black/70 via-black/30 to-transparent
        "
      />

      {/* Status badge (top-left) */}
      <span
        className={cn(
          "absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          STATUS_TONE[asset.status],
        )}
      >
        {STATUS_COPY[asset.status]}
      </span>

      {/* Title (bottom-left) */}
      <span className="absolute bottom-2 left-2.5 right-16 truncate text-[12px] font-semibold text-foreground">
        {asset.title}
      </span>

      {/* Per-tile actions (hover) */}
      <div
        className="
          absolute right-2 top-2 flex items-center gap-1 opacity-0
          transition-opacity duration-200
          group-hover:opacity-100 focus-within:opacity-100
        "
      >
        {onRegenerate ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
            aria-label={`Regenerate ${asset.title}`}
            className="
              inline-flex h-7 w-7 items-center justify-center rounded-md
              bg-background/70 backdrop-blur-md
              text-foreground/85 border border-white/[0.08]
              transition-colors hover:text-foreground hover:border-brand-cyan/30
            "
          >
            <RefreshCw size={13} />
          </button>
        ) : null}
        {onOpen ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            aria-label={`View ${asset.title} full size`}
            className="
              inline-flex h-7 w-7 items-center justify-center rounded-md
              bg-background/70 backdrop-blur-md
              text-foreground/85 border border-white/[0.08]
              transition-colors hover:text-foreground hover:border-brand-cyan/30
            "
          >
            <Maximize2 size={13} />
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ImageGrid
   ───────────────────────────────────────────────────────────── */

export function ImageGrid({
  assets,
  onOpenAsset,
  onRegenerateAsset,
  onOpenAll,
}: ImageGridProps) {
  const items = assets.slice(0, 4);

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="
        relative overflow-hidden rounded-2xl p-4
        bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.06]
      "
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-cyan">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-cyan" />
          fal.ai Visuals
        </div>
        <span
          className="
            inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium
            bg-white/[0.04] backdrop-blur-md
            border border-white/[0.06] text-muted
          "
        >
          Powered by{" "}
          <span className="bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text font-semibold text-transparent">
            fal.ai
          </span>
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-white/[0.06] p-6 text-sm text-hint">
          No visuals yet — once fal.ai responds, they&apos;ll land here.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((asset, i) => (
            <ImageTile
              key={asset.id}
              asset={asset}
              delay={i * 0.07}
              onOpen={onOpenAsset ? () => onOpenAsset(asset) : undefined}
              onRegenerate={
                onRegenerateAsset ? () => onRegenerateAsset(asset) : undefined
              }
            />
          ))}
        </div>
      )}

      {onOpenAll ? (
        <button
          type="button"
          onClick={onOpenAll}
          className="
            mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold
            bg-white/[0.03] backdrop-blur-md
            border border-white/[0.06] text-foreground/85
            transition-colors hover:bg-white/[0.05] hover:border-brand-cyan/30
          "
        >
          <Maximize2 size={13} />
          Open Visual Lab
        </button>
      ) : null}
    </motion.div>
  );
}

export default ImageGrid;
