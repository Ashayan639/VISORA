"use client";

import { motion } from "framer-motion";

import type { ChatMessage, Widget } from "@/types/visora";
import { cn } from "@/lib/utils";

import type { ChatAction } from "./widgets/ActionButtons";
import { WidgetRenderer } from "./widgets/WidgetRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
  onOpenWidget?: (widget: Widget) => void;
  onWidgetAction?: (action: ChatAction) => void;
}

/* ─────────────────────────────────────────────────────────────
   V avatar (small, gradient)
   ───────────────────────────────────────────────────────────── */

function VisoraAvatar() {
  return (
    <span
      aria-hidden
      className="
        flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
        bg-gradient-to-br from-brand-cyan to-brand-purple
        text-[12px] font-bold text-white
        shadow-md shadow-brand-cyan/20
      "
    >
      V
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   MessageBubble
   ───────────────────────────────────────────────────────────── */

export function MessageBubble({
  message,
  onOpenWidget,
  onWidgetAction,
}: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <motion.div
        initial={{ x: 16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex w-full justify-end"
      >
        <div
          className="
            max-w-[70%] rounded-2xl rounded-br-sm
            bg-card-hover px-4 py-3
            text-[15px] leading-relaxed text-foreground
            whitespace-pre-wrap break-words
            shadow-sm
          "
        >
          {message.content}
        </div>
      </motion.div>
    );
  }

  // Assistant
  const widgets = message.widgets ?? [];
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex w-full gap-3"
    >
      <VisoraAvatar />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {message.content ? (
          <p
            className={cn(
              "text-[15px] leading-relaxed text-foreground/90",
              "whitespace-pre-wrap break-words",
            )}
          >
            {message.content}
          </p>
        ) : null}

        {widgets.map((widget, i) => (
          <WidgetRenderer
            key={`${message.id}-w-${i}`}
            widget={widget}
            onOpen={onOpenWidget}
            onAction={onWidgetAction}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Thinking indicator (animated dots)
   ───────────────────────────────────────────────────────────── */

export function ThinkingBubble() {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex w-full gap-3"
    >
      <VisoraAvatar />
      <div className="flex items-center gap-1.5 pt-2" aria-label="Generating">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
            className="h-1.5 w-1.5 rounded-full bg-brand-cyan"
          />
        ))}
      </div>
    </motion.div>
  );
}

export default MessageBubble;
