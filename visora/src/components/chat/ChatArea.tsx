"use client";

import { AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import type { ChatAttachment, ChatMessage, Widget } from "@/types/visora";

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
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages / while generating.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isGenerating]);

  const showEmpty = messages.length === 0 && !isGenerating;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Top bar */}
      <header className="flex h-12 items-center gap-2 border-b border-white/[0.06] bg-background/40 backdrop-blur-xl px-3 sm:px-4">
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
        <h1 className="line-clamp-1 text-[14px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {showEmpty ? (
          emptyState ?? <EmptyState onPickSuggestion={(p) => onSend(p)} />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onOpenWidget={onOpenWidget}
                  onWidgetAction={onWidgetAction}
                />
              ))}
              {isGenerating ? <ThinkingBubble key="thinking" /> : null}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] bg-background/40 backdrop-blur-xl">
        <ChatInput
          onSend={onSend}
          disabled={isGenerating}
          placeholder={inputPlaceholder}
          enableImageUpload={enableImageUpload}
          imageUploadTrigger={imageUploadTrigger}
        />
      </div>
    </section>
  );
}

export default ChatArea;
