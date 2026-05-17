"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Menu, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";

import type { ChatAttachment, ChatMessage, Widget } from "@/types/visora";
import { cn } from "@/lib/utils";

import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import { MessageBubble, ThinkingBubble } from "./MessageBubble";
import type { ChatAction } from "./widgets/ActionButtons";

interface ChatAreaProps {
  /** Title shown in the top bar. */
  title: string;
  messages: ChatMessage[];
  isGenerating: boolean;
  onSend: (content: string, attachments?: ChatAttachment[]) => void;
  onOpenWidget?: (widget: Widget) => void;
  onWidgetAction?: (action: ChatAction) => void;
  /** Opens the mobile sidebar drawer. */
  onOpenSidebar: () => void;
  /** Composer placeholder. */
  inputPlaceholder?: string;
  /** Show the file-upload paperclip on the composer. */
  enableImageUpload?: boolean;
  /** Imperative trigger to open the file picker. Increment to fire. */
  imageUploadTrigger?: number;
  /**
   * Override the default `EmptyState` (suggestion cards) when there
   * are no messages. /studio uses this to render its own empty state.
   */
  emptyState?: ReactNode;
  /** Shows a purple "Demo Mode" pill in the header. */
  isDemoMode?: boolean;
  /** Loads the built-in Urban Brew demo instantly (empty state). */
  onTryDemo?: () => void;
  /** Friendly error from the chat hook (non-200 / stream failure). */
  error?: string | null;
  /** Retry the last failed user message. */
  onRetry?: () => void;
}

/**
 * VISORA — center chat column.
 *
 * Top bar (session title + mobile sidebar toggle), scrollable message list
 * with empty-state fallback, fixed input at the bottom of the column.
 */
export function ChatArea({
  title,
  messages,
  isGenerating,
  onSend,
  onOpenWidget,
  onWidgetAction,
  onOpenSidebar,
  inputPlaceholder,
  enableImageUpload,
  imageUploadTrigger,
  emptyState,
  isDemoMode = false,
  onTryDemo,
  error = null,
  onRetry,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollSignature = useMemo(
    () =>
      messages
        .map((m) => {
          const grid = m.widgets?.find((w) => w.type === "image_grid");
          const assets =
            grid?.type === "image_grid"
              ? ((grid.data as { assets?: { status?: string }[] }).assets ?? [])
              : [];
          const loading = assets.filter((a) => a.status === "loading").length;
          return `${m.id}:${m.content.length}:${m.widgets?.length ?? 0}:${loading}`;
        })
        .join("|"),
    [messages],
  );

  const isGeneratingVisuals = useMemo(
    () =>
      messages.some((m) =>
        m.widgets?.some((w) => {
          if (w.type !== "image_grid") return false;
          const assets = (w.data as { assets?: { status?: string }[] }).assets ?? [];
          return assets.some((a) => a.status === "loading");
        }),
      ),
    [messages],
  );

  // Auto-scroll as streamed text and widgets grow.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [scrollSignature, isGenerating]);

  const showEmpty = messages.length === 0 && !isGenerating;
  const lastMsg = messages[messages.length - 1];
  const showThinking =
    isGenerating &&
    (!lastMsg ||
      lastMsg.role !== "assistant" ||
      (!lastMsg.content && !(lastMsg.widgets?.length ?? 0)));
  const streamingMessageId =
    isGenerating && lastMsg?.role === "assistant" ? lastMsg.id : null;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Top bar */}
      <header className="flex h-12 items-center gap-2 border-b border-[#4F5052]/30 bg-background/40 backdrop-blur-xl px-3 sm:px-4">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open sessions sidebar"
          className="
            inline-flex h-8 w-8 items-center justify-center rounded-md
            text-muted transition-colors hover:text-foreground hover:bg-white/[0.04]
            lg:hidden
          "
        >
          <Menu size={16} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="line-clamp-1 text-[14px] font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {isDemoMode ? (
            <span
              className={cn(
                "shrink-0 rounded-full border border-[#4F5052]/30 bg-card",
                "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted",
              )}
            >
              Demo Mode
            </span>
          ) : null}
          {isGeneratingVisuals ? (
            <span
              className={cn(
                "shrink-0 rounded-full border border-[#4F5052]/30 bg-[#282728]",
                "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F8FAFA]/80",
              )}
            >
              fal.ai visuals…
            </span>
          ) : null}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {showEmpty ? (
          emptyState ?? (
            <EmptyState
              onPickSuggestion={(p) => onSend(p)}
              onTryDemo={onTryDemo}
            />
          )
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isStreaming={m.id === streamingMessageId}
                  onOpenWidget={onOpenWidget}
                  onWidgetAction={onWidgetAction}
                  onSendMessage={onSend}
                />
              ))}
              {showThinking ? <ThinkingBubble key="thinking" /> : null}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Error + input */}
      <motion.div className="border-t border-[#4F5052]/30 bg-background/40 backdrop-blur-xl">
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2 sm:px-6"
          >
            <motion.div className="flex min-w-0 items-center gap-2 text-[13px] text-red-300/90">
              <AlertCircle size={16} className="shrink-0" aria-hidden />
              <span className="line-clamp-2">{error}</span>
            </motion.div>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="
                  inline-flex shrink-0 items-center gap-1.5 rounded-md
                  border border-red-400/30 bg-red-500/10 px-2.5 py-1.5
                  text-[12px] font-medium text-red-200
                  transition-colors hover:bg-red-500/20
                "
              >
                <RotateCcw size={12} aria-hidden />
                Retry
              </button>
            ) : null}
          </motion.div>
        ) : null}
        <ChatInput
          onSend={onSend}
          disabled={isGenerating}
          placeholder={inputPlaceholder}
          enableImageUpload={enableImageUpload}
          imageUploadTrigger={imageUploadTrigger}
        />
      </motion.div>
    </section>
  );
}

export default ChatArea;
