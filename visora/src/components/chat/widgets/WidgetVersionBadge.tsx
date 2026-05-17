"use client";

import { cn } from "@/lib/utils";

interface WidgetVersionBadgeProps {
  version?: number;
  className?: string;
}

/** Shown on v2+ widgets so users can see modification history in the thread. */
export function WidgetVersionBadge({ version, className }: WidgetVersionBadgeProps) {
  if (!version || version < 2) return null;

  return (
    <span
      className={cn(
        "absolute right-2 top-2 z-10 rounded-full",
        "border border-[#4F5052]/40 bg-[#0D0E10]/90 px-1.5 py-0.5",
        "text-[10px] font-semibold uppercase tracking-wider text-muted",
        className,
      )}
      title={`Version ${version} of this artifact`}
    >
      v{version}
    </span>
  );
}

export default WidgetVersionBadge;
