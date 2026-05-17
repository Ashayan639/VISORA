"use client";

import { motion } from "framer-motion";
import { Maximize2, RefreshCw } from "lucide-react";

import { ImageTileSkeleton } from "@/components/ui/Skeleton";
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
  loading: "bg-muted/10 text-muted border-muted/30",
  generated: "bg-foreground/10 text-foreground border-foreground/30",
  fallback: "bg-hint/10 text-hint border-hint/30",
  error: "bg-disabled/10 text-muted border-disabled/30",
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
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl",
        "bg-[#282728] border border-[#4F5052]/30",
        "transition-[transform,border-color] duration-200",
        "hover:scale-[1.02] hover:border-muted/30",
      )}
    >
      {/* Image OR skeleton */}
      {isLoading && !asset.imageUrl ? (
        <ImageTileSkeleton />
      ) : asset.imageUrl ? (
        // Using <img> rather than next/image because fal.ai returns
        // arbitrary cross-domain URLs; configuring next.config remoteImages
        // for every provider is too brittle for the hackathon.
        <motion.img
          key={asset.imageUrl}
          src={asset.imageUrl}
          alt={asset.title}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <motion.div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-2 p-3",
            "bg-[#282728]",
            isLoading && "animate-pulse",
          )}
        >
          <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-[#F8FAFA]/70">
            {isLoading ? "Generating…" : asset.title}
          </span>
          {!isLoading && asset.prompt ? (
            <span className="line-clamp-4 text-center text-[10px] leading-snug text-[#F8FAFA]/50">
              {asset.prompt}
            </span>
          ) : null}
        </motion.div>
      )}

      {asset.status === "fallback" && asset.prompt ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="pointer-events-none absolute inset-x-0 bottom-8 max-h-[40%] overflow-hidden px-2"
          aria-hidden
        >
          <p className="line-clamp-3 text-[9px] leading-snug text-[#F8FAFA]/50">
            {asset.prompt}
          </p>
        </motion.div>
      ) : null}

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
              transition-colors hover:text-foreground hover:border-muted/40
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
              transition-colors hover:text-foreground hover:border-muted/40
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
        border border-[#4F5052]/30
      "
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-hint">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-hint" />
          fal.ai Visuals
        </div>
        <span
          className="
            inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium
            bg-white/[0.04] backdrop-blur-md
            border border-[#4F5052]/30 text-muted
          "
        >
          Powered by{" "}
          <span className="font-semibold text-foreground">
            fal.ai
          </span>
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-[#4F5052]/30 p-6 text-sm text-hint">
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
            border border-[#4F5052]/30 text-foreground/85
            transition-colors hover:bg-white/[0.05] hover:border-muted/40
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
