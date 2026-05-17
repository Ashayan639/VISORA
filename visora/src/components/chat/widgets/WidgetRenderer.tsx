"use client";

import { motion } from "framer-motion";
import type {
  BrandResult,
  MarketingPack,
  Model3D,
  TrustScore,
  VisualAsset,
  WebsiteConcept,
  Widget,
  WidgetType,
} from "@/types/visora";

import { ActionButtons, type ActionButtonsData, type ChatAction } from "./ActionButtons";
import { BrandCard } from "./BrandCard";
import { ImageGrid } from "./ImageGrid";
import { MarketingPackWidget } from "./MarketingPackWidget";
import { Model3DPreview } from "./Model3DPreview";
import { TrustScoreWidget } from "./TrustScoreWidget";
import { WebsitePreviewWidget } from "./WebsitePreviewWidget";

/**
 * VISORA — Widget dispatcher.
 *
 * Each widget type is implemented in its own file under this directory.
 * This component is intentionally thin: it inspects `widget.type` and
 * delegates to the matching component. Callbacks bubble up:
 *
 *   • `onOpen(widget)` — promote the widget to the right-side panel
 *   • `onAction(action)` — used by `action_buttons` only
 */

export interface WidgetRendererProps {
  widget: Widget;
  onOpen?: (widget: Widget) => void;
  onAction?: (action: ChatAction) => void;
}

export function WidgetRenderer({
  widget,
  onOpen,
  onAction,
}: WidgetRendererProps) {
  const open = onOpen ? () => onOpen(widget) : undefined;

  const inner = (() => {
    switch (widget.type as WidgetType) {
      case "brand_card":
        return <BrandCard data={widget.data as BrandResult} onOpen={open} />;

      case "trust_score":
        return (
          <TrustScoreWidget data={widget.data as TrustScore} onImprove={open} />
        );

      case "image_grid": {
        const { assets = [] } = widget.data as { assets?: VisualAsset[] };
        return (
          <ImageGrid
            assets={assets}
            onOpenAll={open}
            onOpenAsset={onOpen ? () => onOpen(widget) : undefined}
          />
        );
      }

      case "model_3d":
        return <Model3DPreview data={widget.data as Model3D} onOpen={open} />;

      case "website_preview":
        return (
          <WebsitePreviewWidget data={widget.data as WebsiteConcept} onOpen={open} />
        );

      case "marketing_pack":
        return <MarketingPackWidget data={widget.data as MarketingPack} />;

      case "action_buttons":
        return (
          <ActionButtons
            data={widget.data as ActionButtonsData}
            onAction={onAction}
          />
        );

      default:
        return null;
    }
  })();

  if (!inner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="min-w-0"
    >
      {inner}
    </motion.div>
  );
}

export default WidgetRenderer;
