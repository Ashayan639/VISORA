"use client";

import { WebsitePreviewWidget } from "@/components/chat/widgets/WebsitePreviewWidget";
import type { BrandResult, WebsiteConcept } from "@/types/visora";
import { cn } from "@/lib/utils";

interface WebsitePanelProps {
  concept: WebsiteConcept | null | undefined;
  brand?: BrandResult;
}

export function WebsitePanel({ concept, brand }: WebsitePanelProps) {
  if (!concept) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center backdrop-blur-xl",
        )}
      >
        <p className="text-sm text-muted">No website concept generated for this project.</p>
      </div>
    );
  }

  const domain = brand?.brandName
    ? `${brand.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "yourbrand"}.com`
    : undefined;

  return (
    <div className="max-w-3xl">
      <WebsitePreviewWidget data={concept} domain={domain} />
    </div>
  );
}
