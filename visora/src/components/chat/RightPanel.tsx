"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, RefreshCw, X } from "lucide-react";
import { useEffect } from "react";

import type { Widget, WidgetType } from "@/types/visora";
import { cn } from "@/lib/utils";

import { WidgetRenderer } from "./widgets/WidgetRenderer";

const TITLES: Record<WidgetType, string> = {
  brand_card: "Brand Brain",
  trust_score: "Trust Score",
  image_grid: "fal.ai Visuals",
  model_3d: "3D Model",
  website_preview: "Website Preview",
  marketing_pack: "Marketing Pack",
  action_buttons: "Actions",
};

export interface RightPanelProps {
  widget: Widget | null;
  onClose: () => void;
  onRegenerate?: () => void;
  onDownload?: () => void;
}

export function RightPanel({
  widget,
  onClose,
  onRegenerate,
  onDownload,
}: RightPanelProps) {
  const open = widget !== null;

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && widget ? (
        <>
          {/* Mobile-only dimmer */}
          <motion.div
            key="rp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          />

          <motion.aside
            key="rp-panel"
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "hidden lg:flex lg:w-[420px] lg:shrink-0 lg:flex-col",
              "border-l border-white/[0.06] bg-card/40 backdrop-blur-xl",
            )}
            aria-label={TITLES[widget.type as WidgetType] ?? "Artifact panel"}
          >
            <RightPanelContent
              widget={widget}
              onClose={onClose}
              onRegenerate={onRegenerate}
              onDownload={onDownload}
            />
          </motion.aside>

          {/* Mobile bottom sheet */}
          <motion.section
            key="rp-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="
              fixed inset-x-0 bottom-0 z-50 lg:hidden
              max-h-[88vh] overflow-hidden
              rounded-t-2xl border-t border-white/[0.06]
              bg-card/95 backdrop-blur-xl shadow-2xl
            "
            aria-label={TITLES[widget.type as WidgetType] ?? "Artifact panel"}
          >
            <RightPanelContent
              widget={widget}
              onClose={onClose}
              onRegenerate={onRegenerate}
              onDownload={onDownload}
              mobile
            />
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function RightPanelContent({
  widget,
  onClose,
  onRegenerate,
  onDownload,
  mobile = false,
}: {
  widget: Widget;
  onClose: () => void;
  onRegenerate?: () => void;
  onDownload?: () => void;
  mobile?: boolean;
}) {
  return (
    <div className="flex h-full max-h-[88vh] flex-col md:max-h-none">
      {mobile ? (
        <div className="flex justify-center pt-2">
          <span className="h-1 w-12 rounded-full bg-white/10" />
        </div>
      ) : null}

      <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          {TITLES[widget.type as WidgetType] ?? "Artifact"}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDownload}
            disabled={!onDownload}
            aria-label="Download"
            className="
              inline-flex h-8 w-8 items-center justify-center rounded-md
              text-muted transition-colors
              hover:text-foreground hover:bg-white/[0.05]
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            <Download size={15} />
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={!onRegenerate}
            aria-label="Regenerate"
            className="
              inline-flex h-8 w-8 items-center justify-center rounded-md
              text-muted transition-colors
              hover:text-foreground hover:bg-white/[0.05]
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="
              inline-flex h-8 w-8 items-center justify-center rounded-md
              text-muted transition-colors
              hover:text-foreground hover:bg-white/[0.05]
            "
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="mx-4 h-px bg-white/[0.06] sm:mx-5" />

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <WidgetRenderer widget={widget} />
      </div>
    </div>
  );
}

export default RightPanel;
