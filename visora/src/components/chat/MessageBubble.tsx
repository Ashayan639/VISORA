"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

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
   Generating / pipeline visuals (presentation-only rotation)
   ───────────────────────────────────────────────────────────── */

function BrandSkeletonMock() {
  return (
    <div className="flex gap-2" aria-hidden>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-14 flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]"
        >
          <div className="h-full w-full visora-shimmer-bg opacity-80" />
        </div>
      ))}
    </div>
  );
}

function ImageShimmerMock() {
  return (
    <div
      className="h-20 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.05]"
      aria-hidden
    >
      <div className="h-full w-full bg-gradient-to-r from-brand-cyan/10 via-brand-purple/15 to-brand-cyan/10 visora-shimmer-bg" />
    </div>
  );
}

function WireframeCubeMock() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <svg
        viewBox="0 0 64 64"
        className="h-14 w-14 text-brand-cyan animate-visora-cube-spin [animation-duration:10s]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        style={{ opacity: 0.75 }}
      >
        <path d="M32 8 L54 22 L54 42 L32 56 L10 42 L10 22 Z" opacity="0.9" />
        <path d="M32 8 L32 56 M10 22 L54 22 M10 42 L54 42" opacity="0.5" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Demo-mode pill — rendered above the bubble body whenever an
   assistant message was emitted by the chat engine's demo flow.
   Tiny purple capsule so judges instantly know the content is
   the canned hackathon demo, not a live model round-trip.
   ───────────────────────────────────────────────────────────── */

function DemoBadge() {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full",
        "border border-brand-purple/35 bg-brand-purple/15 px-2 py-0.5",
        "text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-purple",
        "backdrop-blur-md shadow-[0_0_18px_-6px_rgba(168,85,247,0.45)]",
      )}
    >
      <Sparkles className="h-2.5 w-2.5" aria-hidden />
      Demo Mode
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
        initial={{ x: 48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="flex w-full justify-end"
      >
        <div
          className={cn(
            "max-w-[min(100%,28rem)] rounded-2xl rounded-br-sm sm:max-w-[70%]",
            "border border-transparent bg-card-hover px-4 py-3",
            "text-[15px] leading-relaxed text-foreground",
            "whitespace-pre-wrap break-words",
            "shadow-sm",
            "transition-[border-color,box-shadow] duration-200",
            "hover:border hover:border-brand-cyan/20 hover:shadow-md hover:shadow-brand-cyan/10",
          )}
        >
          {message.content}
        </div>
      </motion.div>
    );
  }

  const widgets = message.widgets ?? [];
  const isDemo = !!message.meta?.isDemo;
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="flex w-full gap-3"
    >
      <VisoraAvatar />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {isDemo ? <DemoBadge /> : null}

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
   Thinking indicator — stagger bounce dots + rotating skeleton hint
   ───────────────────────────────────────────────────────────── */

export function ThinkingBubble() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setPhase((p) => (p + 1) % 3);
    }, 3200);
    return () => window.clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex w-full gap-3"
    >
      <VisoraAvatar />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-1.5 pt-2" aria-label="Generating">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-brand-cyan"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 0.55,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.div
          key={phase}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="max-w-md rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-hint">
            {phase === 0 ? "Brand intelligence" : phase === 1 ? "Visual generation" : "3D reality"}
          </p>
          {phase === 0 ? (
            <BrandSkeletonMock />
          ) : phase === 1 ? (
            <ImageShimmerMock />
          ) : (
            <WireframeCubeMock />
          )}
        </motion.div>

        <p className="text-[12px] text-hint">Building your reality…</p>
      </div>
    </motion.div>
  );
}

export default MessageBubble;
