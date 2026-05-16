"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Globe,
  Lightbulb,
  Maximize2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface ChatAction {
  id: string;
  label: string;
  /** Optional intent the client should dispatch when clicked. */
  intent?: string;
  payload?: Record<string, unknown>;
}

export interface ActionButtonsData {
  actions: ChatAction[];
}

interface ActionButtonsProps {
  data: ActionButtonsData;
  /**
   * Fired when an action button is clicked.
   * Defaults: if the intent is `send_message` (or unspecified), the
   * parent should send `payload.message ?? action.label` as a chat
   * message; otherwise it can route to a feature handler.
   */
  onAction?: (action: ChatAction) => void;
}

/* ─────────────────────────────────────────────────────────────
   Intent → icon mapping
   ───────────────────────────────────────────────────────────── */

const INTENT_ICONS: Record<string, LucideIcon> = {
  regenerate: RefreshCw,
  save: Bookmark,
  save_project: Bookmark,
  bookmark: Bookmark,
  open: Maximize2,
  open_panel: Maximize2,
  view: Maximize2,
  improve: Wand2,
  improve_score: TrendingUp,
  send_message: Send,
  new_chat: Plus,
  new: Plus,
  idea: Lightbulb,
  url: Globe,
  website: Globe,
};

function pickIcon(action: ChatAction): LucideIcon {
  if (action.intent && INTENT_ICONS[action.intent]) {
    return INTENT_ICONS[action.intent];
  }
  // Cheap label-based fallback.
  const label = action.label.toLowerCase();
  if (label.includes("regenerate") || label.includes("retry")) return RefreshCw;
  if (label.includes("save") || label.includes("bookmark")) return Bookmark;
  if (label.includes("improve")) return TrendingUp;
  if (label.includes("open") || label.includes("view")) return Maximize2;
  if (label.includes("idea")) return Lightbulb;
  if (label.includes("url") || label.includes("website")) return Globe;
  if (label.includes("new")) return Plus;
  if (label.includes("send")) return Send;
  return Sparkles;
}

/* ─────────────────────────────────────────────────────────────
   ActionButtons widget
   ───────────────────────────────────────────────────────────── */

export function ActionButtons({ data, onAction }: ActionButtonsProps) {
  const actions = data.actions ?? [];
  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Suggested actions"
    >
      {actions.map((action, i) => {
        const Icon = pickIcon(action);
        const isPrimary = i === 0;
        return (
          <motion.button
            key={action.id}
            type="button"
            onClick={() => onAction?.(action)}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.05 * i,
              ease: "easeOut",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            data-intent={action.intent}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
              "transition-colors duration-200",
              "border backdrop-blur-md",
              isPrimary
                ? "bg-gradient-to-r from-brand-cyan/15 to-brand-purple/15 border-brand-cyan/30 text-foreground hover:border-brand-cyan/60"
                : "bg-white/[0.04] border-white/[0.08] text-foreground/85 hover:text-foreground hover:border-brand-cyan/30 hover:bg-brand-cyan/5",
            )}
          >
            <Icon size={13} aria-hidden />
            <span>{action.label}</span>
            {isPrimary ? (
              <ArrowRight size={11} className="-mr-0.5 opacity-70" aria-hidden />
            ) : null}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export default ActionButtons;
