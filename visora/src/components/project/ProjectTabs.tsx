"use client";

import { motion } from "framer-motion";
import { useCallback, useRef } from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   ProjectTabs

   Horizontal tab bar used by /project/[id]. Active tab gets a
   sliding gradient underline (shared `layoutId` so Framer animates
   between positions). Calls `onChange(id, direction)` so the parent
   can drive a directional slide for tab content.
   ───────────────────────────────────────────────────────────── */

export interface ProjectTabDef {
  id: string;
  label: string;
}

export interface ProjectTabsProps {
  tabs: ProjectTabDef[];
  activeId: string;
  onChange: (id: string, direction: 1 | -1) => void;
  /** Layout id for the underline — override only if you render two ProjectTabs on the same page. */
  underlineLayoutId?: string;
  className?: string;
}

export function ProjectTabs({
  tabs,
  activeId,
  onChange,
  underlineLayoutId = "visora-project-tab-underline",
  className,
}: ProjectTabsProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleClick = useCallback(
    (nextId: string) => {
      if (nextId === activeId) return;
      const currentIdx = tabs.findIndex((t) => t.id === activeId);
      const nextIdx = tabs.findIndex((t) => t.id === nextId);
      const direction: 1 | -1 = nextIdx > currentIdx ? 1 : -1;
      onChange(nextId, direction);
    },
    [activeId, onChange, tabs],
  );

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Project sections"
      className={cn(
        "relative flex items-end gap-1 overflow-x-auto",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "border-b border-white/[0.06]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleClick(tab.id)}
            className={cn(
              "relative shrink-0 px-4 py-3 text-[13.5px] font-medium tracking-tight transition-colors",
              "sm:px-5 sm:py-3.5 sm:text-sm",
              "focus:outline-none focus-visible:text-foreground",
              isActive
                ? "text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            <span className="relative z-10">{tab.label}</span>
            {isActive ? (
              <motion.span
                layoutId={underlineLayoutId}
                className={cn(
                  "pointer-events-none absolute inset-x-2 -bottom-px h-[2px] rounded-full",
                  "bg-gradient-to-r from-brand-cyan to-brand-purple",
                  "shadow-[0_0_10px_-2px_rgba(56,189,248,0.55)]",
                )}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default ProjectTabs;
