"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import type { ChatMessage, Widget } from "@/types/visora";

import type { ChatAction } from "./widgets/ActionButtons";
import { WidgetRenderer } from "./widgets/WidgetRenderer";

/* ─────────────────────────────────────────────────────────────
   Segment builder — interleave text and widgets by position
   ───────────────────────────────────────────────────────────── */

type MessageSegment =
  | { kind: "text"; content: string }
  | { kind: "widget"; widget: Widget };

function buildMessageSegments(content: string, widgets: Widget[]): MessageSegment[] {
  if (!widgets.length) {
    return content ? [{ kind: "text", content }] : [];
  }

  const sorted = [...widgets].sort(
    (a, b) => (a.position ?? content.length) - (b.position ?? content.length),
  );

  const segments: MessageSegment[] = [];
  let cursor = 0;

  for (const widget of sorted) {
    const pos = Math.min(
      Math.max(0, widget.position ?? content.length),
      content.length,
    );

    if (pos > cursor) {
      const slice = content.slice(cursor, pos).trimEnd();
      if (slice) segments.push({ kind: "text", content: slice });
    }

    segments.push({ kind: "widget", widget });
    cursor = pos;
  }

  const tail = content.slice(cursor).trimStart();
  if (tail) segments.push({ kind: "text", content: tail });

  return segments;
}

/* ─────────────────────────────────────────────────────────────
   Streaming text — word-by-word fade while tokens arrive
   ───────────────────────────────────────────────────────────── */

const TEXT_CLASS =
  "text-[15px] leading-relaxed text-[#F8FAFA]/90 whitespace-pre-wrap break-words";

function StreamingText({ text }: { text: string }) {
  const tokens = useMemo(() => text.match(/\S+|\s+/g) ?? [], [text]);

  if (!text) return null;

  return (
    <p className={TEXT_CLASS}>
      {tokens.map((token, i) => (
        <motion.span
          key={`${i}-${token.slice(0, 12)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.18,
            delay: Math.min(i * 0.03, 0.45),
            ease: "easeOut",
          }}
        >
          {token}
        </motion.span>
      ))}
      <motion.span
        aria-hidden
        animate={{ opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-[#F8FAFA]/50"
      />
    </p>
  );
}

function StaticText({ text }: { text: string }) {
  if (!text) return null;
  return <p className={TEXT_CLASS}>{text}</p>;
}

/* ─────────────────────────────────────────────────────────────
   Inline widget — spring entrance after stream completes
   ───────────────────────────────────────────────────────────── */

function InlineWidget({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 28,
        delay: 0.3 + index * 0.08,
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
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
        border border-[#4F5052]/30 bg-[#282728]
        text-[12px] font-bold text-[#F8FAFA]
      "
    >
      V
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   MessageBubble
   ───────────────────────────────────────────────────────────── */

interface MessageBubbleProps {
  message: ChatMessage;
  /** True while this assistant message is still receiving streamed tokens. */
  isStreaming?: boolean;
  onOpenWidget?: (widget: Widget) => void;
  onWidgetAction?: (action: ChatAction) => void;
  /** Sends a user message (widget CTAs, action buttons). */
  onSendMessage?: (text: string) => void;
}

export function MessageBubble({
  message,
  isStreaming = false,
  onOpenWidget,
  onWidgetAction,
  onSendMessage,
}: MessageBubbleProps) {
  const segments = useMemo(
    () =>
      message.role === "user"
        ? []
        : buildMessageSegments(message.content, message.widgets ?? []),
    [message.role, message.content, message.widgets],
  );

  if (message.role === "user") {
    return (
      <motion.div
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="flex w-full justify-end"
      >
        <motion.div
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className="
            max-w-[70%] rounded-2xl rounded-br-sm
            border border-[#4F5052]/30 bg-[#282728] px-4 py-3
            text-[15px] leading-relaxed text-[#F8FAFA]
            whitespace-pre-wrap break-words shadow-sm
          "
        >
          {message.content}
        </motion.div>
      </motion.div>
    );
  }

  const handleAction = (action: ChatAction) => {
    if (onWidgetAction) {
      onWidgetAction(action);
      return;
    }
    const text =
      typeof action.payload?.message === "string"
        ? action.payload.message
        : action.label;
    if (text && onSendMessage) onSendMessage(text);
  };

  let widgetIndex = 0;

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex w-full gap-3"
    >
      <VisoraAvatar />
      <motion.div
        layout
        className="flex min-w-0 flex-1 flex-col gap-3"
      >
        {isStreaming ? (
          message.content ? <StreamingText text={message.content} /> : null
        ) : segments.length > 0 ? (
          segments.map((segment, i) => {
            if (segment.kind === "text") {
              return <StaticText key={`text-${i}`} text={segment.content} />;
            }

            const idx = widgetIndex++;
            return (
              <InlineWidget key={`widget-${segment.widget.type}-${idx}`} index={idx}>
                <WidgetRenderer
                  widget={segment.widget}
                  onOpen={onOpenWidget}
                  onAction={handleAction}
                  onSendMessage={onSendMessage}
                  animate={false}
                />
              </InlineWidget>
            );
          })
        ) : (
          !(message.widgets?.length) ? null : (
            (message.widgets ?? []).map((widget, i) => (
              <InlineWidget key={`widget-fallback-${i}`} index={i}>
                <WidgetRenderer
                  widget={widget}
                  onOpen={onOpenWidget}
                  onAction={handleAction}
                  onSendMessage={onSendMessage}
                  animate={false}
                />
              </InlineWidget>
            ))
          )
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Thinking indicator — stagger bounce dots + rotating skeleton hint
   ───────────────────────────────────────────────────────────── */

export function ThinkingBubble() {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex w-full gap-3"
    >
      <VisoraAvatar />
      <motion.div
        className="flex items-center gap-1.5 rounded-2xl border border-[#4F5052]/30 bg-[#282728] px-4 py-3"
        aria-label="Generating"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 0.55,
              repeat: Infinity,
              delay: i * 0.12,
              ease: "easeInOut",
            }}
            className="h-2 w-2 rounded-full bg-[#4F5052]"
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

export default MessageBubble;
