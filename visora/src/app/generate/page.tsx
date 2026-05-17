"use client";

import { useCallback, useMemo, useState } from "react";

import type { Widget } from "@/types/visora";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { RightPanel } from "@/components/chat/RightPanel";
import type { ChatAction } from "@/components/chat/widgets/ActionButtons";
import { useChatSession } from "@/hooks/useChatSession";

/**
 * /generate — the core VISORA workspace.
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
    loadDemo,
    isDemoMode,
    error,
    retry,
    saveToGallery,
  } = useChatSession();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [manualPanel, setManualPanel] = useState<Widget | null>(null);
  const [dismissedModelUrl, setDismissedModelUrl] = useState<string | null>(null);

  const autoModelPanel = useMemo((): Widget | null => {
    const model = currentProject.model3d;
    if (
      model?.status === "generated" &&
      model.modelUrl &&
      dismissedModelUrl !== model.modelUrl
    ) {
      return { type: "model_3d", data: model };
    }
    return null;
  }, [currentProject.model3d, dismissedModelUrl]);

  const rightPanelContent = manualPanel ?? autoModelPanel;

  const activeSession = sessions.find((s) => s.id === sessionId);
  const headerTitle =
    currentProject.brandResult?.brandName ??
    activeSession?.title ??
    "New Brand Reality";

  const handleNewSession = useCallback(() => {
    newSession();
    setManualPanel(null);
    setDismissedModelUrl(null);
    setSidebarOpen(false);
  }, [newSession]);

  const handleSwitchSession = useCallback(
    (id: string) => {
      switchSession(id);
      setManualPanel(null);
      setDismissedModelUrl(null);
      setSidebarOpen(false);
    },
    [switchSession],
  );

  const handleClosePanel = useCallback(() => {
    const modelUrl = currentProject.model3d?.modelUrl;
    if (modelUrl && !manualPanel) {
      setDismissedModelUrl(modelUrl);
    }
    setManualPanel(null);
  }, [currentProject.model3d?.modelUrl, manualPanel]);

  const handleWidgetAction = useCallback(
    (action: ChatAction) => {
      if (action.intent === "new_chat" || action.intent === "new") {
        handleNewSession();
        return;
      }

      if (
        action.intent === "save_project" ||
        action.intent === "save" ||
        /\bsave\b/i.test(action.label)
      ) {
        void saveToGallery();
        return;
      }

      const message =
        typeof action.payload?.message === "string"
          ? (action.payload.message as string)
          : action.label;

      if (
        message &&
        /\b(save|gallery)\b/i.test(message) &&
        currentProject.brandResult
      ) {
        void saveToGallery();
        return;
      }

      if (message) sendMessage(message);
    },
    [currentProject.brandResult, handleNewSession, saveToGallery, sendMessage],
  );

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-[100vw] overflow-hidden bg-background">
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
        onOpenWidget={setManualPanel}
        onWidgetAction={handleWidgetAction}
        onOpenSidebar={() => setSidebarOpen(true)}
        isDemoMode={isDemoMode}
        onTryDemo={loadDemo}
        error={error?.message ?? null}
        onRetry={error?.retryText ? retry : undefined}
      />

      <RightPanel
        widget={rightPanelContent}
        onClose={handleClosePanel}
        onRegenerate={undefined}
        onDownload={undefined}
      />
    </div>
  );
}
