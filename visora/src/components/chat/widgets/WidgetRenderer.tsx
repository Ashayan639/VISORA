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

import { WidgetMotion } from "@/components/motion/WidgetMotion";

import { ActionButtons, type ActionButtonsData, type ChatAction } from "./ActionButtons";
import { BrandCard } from "./BrandCard";
import { WidgetVersionBadge } from "./WidgetVersionBadge";
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
  /** Sends a user message into the chat composer pipeline. */
  onSendMessage?: (message: string) => void;
  /** When false, skip WidgetMotion wrapper (parent handles entrance). */
  animate?: boolean;
}

export function WidgetRenderer({
  widget,
  onOpen,
  onAction,
  onSendMessage,
  animate = true,
}: WidgetRendererProps) {
  const open = onOpen ? () => onOpen(widget) : undefined;
  const send = onSendMessage;

  const wrap = (node: React.ReactNode) => {
    const inner = (
      <motion.div className="relative w-full">
        <WidgetVersionBadge version={widget.version} />
        {node}
      </motion.div>
    );
    return animate ? <WidgetMotion>{inner}</WidgetMotion> : inner;
  };

  switch (widget.type as WidgetType) {
    case "brand_card":
      return wrap(
        <BrandCard
          data={widget.data as BrandResult}
          onOpen={open}
          onEdit={
            send
              ? () => send("I want to modify the brand identity")
              : undefined
          }
        />,
      );

    case "trust_score":
      return wrap(
        <TrustScoreWidget
          data={widget.data as TrustScore}
          onImprove={
            send
              ? () =>
                  send(
                    "How can I improve my brand trust score? Give me specific, actionable tips.",
                  )
              : open
          }
        />,
      );

    case "image_grid": {
      const { assets = [] } = widget.data as { assets?: VisualAsset[] };
      return wrap(
        <ImageGrid
          assets={assets}
          onOpenAll={open}
          onOpenAsset={
            onOpen
              ? (asset) =>
                  onOpen({
                    ...widget,
                    data: { assets: [asset] },
                  })
              : undefined
          }
          onRegenerateAsset={
            send
              ? (asset) =>
                  send(
                    `Regenerate the ${asset.visualType.replace(/_/g, " ")} image with a different style`,
                  )
              : undefined
          }
        />,
      );
    }
  })();

    case "model_3d":
      return wrap(<Model3DPreview data={widget.data as Model3D} onOpen={open} />);

    case "website_preview":
      return wrap(
        <WebsitePreviewWidget data={widget.data as WebsiteConcept} onOpen={open} />,
      );

    case "marketing_pack":
      return wrap(<MarketingPackWidget data={widget.data as MarketingPack} />);

    case "action_buttons":
      return wrap(
        <ActionButtons
          data={widget.data as ActionButtonsData}
          onAction={onAction}
        />,
      );

    default:
      return null;
  }
}

export default WidgetRenderer;
