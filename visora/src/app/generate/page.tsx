"use client";

import { useCallback, useState } from "react";

import type { Widget } from "@/types/visora";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { RightPanel } from "@/components/chat/RightPanel";
import type { ChatAction } from "@/components/chat/widgets/ActionButtons";
import { useChatSession } from "@/hooks/useChatSession";

/**
 * /generate — the core VISORA workspace.
 *
 * Three-column shell:
 *   • Left  : `ChatSidebar` (sessions list, "New Reality" button)
 *   • Center: `ChatArea`     (header, message stream, composer)
 *   • Right : `RightPanel`   (artifact viewer; closed by default)
 *
 * State here is intentionally thin — `useChatSession` owns the chat
 * model (messages, sessions, project, isGenerating) so the engine and
 * the persistence layer can be exercised in isolation. The page only
 * holds UI state (mobile drawer, which widget is in the right panel).
 *
 * The container is `h-[calc(100vh-4rem)]` — viewport minus the 64px
 * navbar set in `src/app/layout.tsx`. `overflow-hidden` keeps the
 * marketing footer below the fold so the workspace feels like an app.
 */
export default function GeneratePage() {
  const {
    sessionId,
    sessions,
    messages,
    isGenerating,
    project: currentProject,
    sendMessage,
    switchSession,
    newSession,
    removeSession,
  } = useChatSession();

  // Mobile sidebar drawer state.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Right-side artifact viewer ({ type, data } shape, i.e. Widget | null).
  const [rightPanelContent, setRightPanelContent] = useState<Widget | null>(null);

  // Header title prefers the brand name we've actually generated this
  // session over the sidebar metadata, so it stays in sync if the user
  // hasn't navigated away yet (sidebar metadata only updates on yield).
  const activeSession = sessions.find((s) => s.id === sessionId);
  const headerTitle =
    currentProject.brandResult?.brandName ??
    activeSession?.title ??
    "New Brand Reality";

  const handleNewSession = useCallback(() => {
    newSession();
    setRightPanelContent(null);
    setSidebarOpen(false);
  }, [newSession]);

  const handleSwitchSession = useCallback(
    (id: string) => {
      switchSession(id);
      setRightPanelContent(null);
      setSidebarOpen(false);
    },
    [switchSession],
  );

  /**
   * Default behavior for widget action buttons:
   *
   *   • `new_chat`  → start a fresh session
   *   • `open*`     → no-op (the widget itself is what surfaces the panel
   *                    via its primary CTA; this is just a hint)
   *   • everything  → send the action's `payload.message` (or its label)
   *     else          back through the chat so the AI can respond
   */
  const handleWidgetAction = useCallback(
    (action: ChatAction) => {
      if (action.intent === "new_chat" || action.intent === "new") {
        handleNewSession();
        return;
      }

      const message =
        typeof action.payload?.message === "string"
          ? (action.payload.message as string)
          : action.label;

      if (message) sendMessage(message);
    },
    [handleNewSession, sendMessage],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 w-full flex-1 overflow-hidden bg-background">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onNewSession={handleNewSession}
        onSwitchSession={handleSwitchSession}
        onDeleteSession={removeSession}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <ChatArea
        title={headerTitle}
        messages={messages}
        isGenerating={isGenerating}
        onSend={sendMessage}
        onOpenWidget={setRightPanelContent}
        onWidgetAction={handleWidgetAction}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      <RightPanel
        widget={rightPanelContent}
        onClose={() => setRightPanelContent(null)}
        // Hooks for later: wire to real regenerate / download actions.
        onRegenerate={undefined}
        onDownload={undefined}
      />
    </div>
  );
}
