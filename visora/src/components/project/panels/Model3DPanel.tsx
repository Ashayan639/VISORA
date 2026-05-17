"use client";

import Link from "next/link";
import { Box } from "lucide-react";

import { ModelViewer } from "@/components/studio/ModelViewer";
import type { Model3D } from "@/types/visora";
import { cn } from "@/lib/utils";

interface Model3DPanelProps {
  model: Model3D | null | undefined;
}

export function Model3DPanel({ model }: Model3DPanelProps) {
  const hasModel =
    !!model?.modelUrl &&
    model.status === "generated" &&
    !model.modelUrl.startsWith("/placeholder");

  if (!hasModel) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-white/[0.08]",
          "bg-white/[0.02] px-6 py-16 text-center backdrop-blur-xl",
        )}
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#4F5052]/30 bg-white/[0.04] text-muted">
          <Box className="h-7 w-7" />
        </span>
        <div className="max-w-sm space-y-2">
          <h2 className="text-lg font-semibold text-foreground">No 3D model yet</h2>
          <p className="text-sm text-muted">
            Forge a mesh from your product visuals in the 3D studio.
          </p>
        </div>
        <Link
          href="/studio"
          className={cn(
            "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white",
            "bg-foreground text-background",
            "transition-transform hover:scale-[1.02]",
          )}
        >
          Generate 3D Model
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#4F5052]/30 bg-white/[0.03] backdrop-blur-xl",
        "h-[min(70vh,560px)]",
      )}
    >
      <ModelViewer model={model} title="3D Model" className="h-full rounded-2xl" />
    </div>
  );
}
