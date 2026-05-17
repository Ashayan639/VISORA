"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Shimmer block for loading placeholders. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-white/[0.04]",
        "ring-1 ring-inset ring-white/[0.06]",
        className,
      )}
      aria-hidden
    />
  );
}

/** Brand-card shaped skeleton stack. */
export function BrandCardSkeleton() {
  return (
    <div
      className={cn(
        "visora-card space-y-4 rounded-2xl p-5",
        "border border-[#4F5052]/30 bg-card",
      )}
    >
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-3/4 max-w-[280px]" />
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14 sm:col-span-2" />
      </div>
      <div className="flex gap-2 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/** Square tile for image grid loading. */
export function ImageTileSkeleton() {
  return (
    <Skeleton className="aspect-square w-full rounded-xl bg-gradient-to-br from-white/[0.04] via-card-hover/40 to-white/[0.02]" />
  );
}
