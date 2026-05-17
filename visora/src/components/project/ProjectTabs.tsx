"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export const PROJECT_TABS = [
  { id: "brand", label: "Brand Identity" },
  { id: "visuals", label: "Visuals" },
  { id: "model3d", label: "3D Model" },
  { id: "website", label: "Website" },
  { id: "marketing", label: "Marketing" },
  { id: "trust", label: "Trust Score" },
] as const;

export type ProjectTabId = (typeof PROJECT_TABS)[number]["id"];

export function tabIndex(id: ProjectTabId): number {
  return PROJECT_TABS.findIndex((t) => t.id === id);
}

interface ProjectTabsProps {
  active: ProjectTabId;
  onChange: (id: ProjectTabId) => void;
}

export function ProjectTabs({ active, onChange }: ProjectTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Project sections"
      className="relative flex gap-1 overflow-x-auto border-b border-[#4F5052]/30 pb-px scrollbar-none"
    >
      {PROJECT_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 px-4 py-3 text-[13px] font-semibold transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F5052]/30 rounded-t-lg",
              isActive ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="project-tab-underline"
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-foreground"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
