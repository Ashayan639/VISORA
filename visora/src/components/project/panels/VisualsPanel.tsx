"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { useCallback, useState } from "react";

import type { VisualAsset } from "@/types/visora";
import { cn } from "@/lib/utils";

interface VisualsPanelProps {
  visuals: VisualAsset[];
  onVisualsChange?: (visuals: VisualAsset[]) => void;
}

export function VisualsPanel({ visuals, onVisualsChange }: VisualsPanelProps) {
  const [lightbox, setLightbox] = useState<VisualAsset | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const patchItems = useCallback(
    (updater: (prev: VisualAsset[]) => VisualAsset[]) => {
      const next = updater(visuals);
      onVisualsChange?.(next);
    },
    [onVisualsChange, visuals],
  );

  const handleRegenerate = useCallback(
    async (asset: VisualAsset) => {
      setRegeneratingId(asset.id);
      const loading: VisualAsset = { ...asset, status: "loading", imageUrl: "" };
      patchItems((prev) => prev.map((v) => (v.id === asset.id ? loading : v)));

      try {
        const res = await fetch("/api/generate-visual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: asset.prompt,
            visualType: asset.visualType,
            title: asset.title,
          }),
        });
        const data = (await res.json()) as {
          imageUrl?: string;
          status?: VisualAsset["status"];
        };
        const updated: VisualAsset = {
          ...asset,
          imageUrl: data.imageUrl ?? asset.imageUrl,
          status: data.status ?? (res.ok ? "generated" : "error"),
        };
        patchItems((prev) => prev.map((v) => (v.id === asset.id ? updated : v)));
      } catch {
        patchItems((prev) =>
          prev.map((v) => (v.id === asset.id ? { ...asset, status: "error" } : v)),
        );
      } finally {
        setRegeneratingId(null);
      }
    },
    [patchItems],
  );

  const grid = visuals.slice(0, 4);

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border border-[#4F5052]/30 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8",
        )}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Visuals</h2>
          <span className="text-[11px] font-medium text-hint">Powered by fal.ai</span>
        </div>

        {grid.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#4F5052]/30 px-4 py-10 text-center text-sm text-muted">
            No visuals generated yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {grid.map((asset, i) => (
              <VisualTile
                key={asset.id}
                asset={asset}
                delay={i * 0.05}
                busy={regeneratingId === asset.id}
                onOpen={() => setLightbox(asset)}
                onRegenerate={() => void handleRegenerate(asset)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox ? (
          <Lightbox asset={lightbox} onClose={() => setLightbox(null)} />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function VisualTile({
  asset,
  delay,
  busy,
  onOpen,
  onRegenerate,
}: {
  asset: VisualAsset;
  delay: number;
  busy: boolean;
  onOpen: () => void;
  onRegenerate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl",
        "border border-[#4F5052]/30 bg-card-deep",
        "transition-colors hover:border-[#4F5052]/30",
      )}
    >
      {asset.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.imageUrl}
          alt={asset.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/[0.04] to-white/[0.02] text-xs text-hint">
          {busy ? "Regenerating…" : asset.title}
        </div>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F5052]/30"
        aria-label={`View ${asset.title}`}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-8">
        <span className="line-clamp-1 text-[12px] font-semibold text-foreground">
          {asset.title}
        </span>
      </div>
      <button
        type="button"
        onClick={onRegenerate}
        disabled={busy}
        className={cn(
          "absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg",
          "border border-white/10 bg-background/80 text-foreground opacity-0 backdrop-blur-md",
          "transition-opacity group-hover:opacity-100 focus:opacity-100",
          busy && "opacity-100",
        )}
        aria-label={`Regenerate ${asset.title}`}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
      </button>
    </motion.div>
  );
}

function Lightbox({ asset, onClose }: { asset: VisualAsset; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={asset.title}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-background/80 text-foreground hover:border-[#4F5052]/30"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {asset.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.imageUrl}
            alt={asset.title}
            className="max-h-[85vh] w-full object-contain"
          />
        ) : (
          <div className="flex h-64 w-80 items-center justify-center text-muted">
            No image available
          </div>
        )}
        <div className="border-t border-[#4F5052]/30 px-4 py-3">
          <p className="font-semibold text-foreground">{asset.title}</p>
          <p className="mt-1 text-xs text-muted line-clamp-2">{asset.prompt}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
