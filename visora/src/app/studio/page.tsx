"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import type { Model3D } from "@/types/visora";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ModelViewer } from "@/components/studio/ModelViewer";
import { StudioEmptyState } from "@/components/studio/StudioEmptyState";
import type { ChatAction } from "@/components/chat/widgets/ActionButtons";
import { useChatSession } from "@/hooks/useChatSession";
import { processStudioMessage } from "@/lib/studioEngine";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   /studio — the 3D Product Studio.

   Same three-column shell as /generate, but tuned for 3D:
     • Sidebar     : shared sessions (same component, same store).
     • Center chat : 3D-focused empty state, image-upload composer.
     • Right panel : ALWAYS visible on desktop (`md:flex`), never
                     conditional. Renders <ModelViewer> with the
                     latest `model_3d` widget from the conversation.

   Mobile: the viewer becomes a bottom sheet that auto-opens when a
   3D model arrives, with a dismiss button so the user can collapse
   it back to the chat.
   ───────────────────────────────────────────────────────────── */

export default function StudioPage() {
  const {
    sessionId,
    sessions,
    messages,
    isGenerating,
    sendMessage,
    switchSession,
    newSession,
    removeSession,
  } = useChatSession({
    process: processStudioMessage,
    defaultTitle: "New 3D Reality",
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /**
   * Mobile bottom-sheet visibility is *derived* from:
   *   • the latest `model_3d` widget existing, AND
   *   • the user not having explicitly dismissed THIS model id.
   *
   * Tracking dismissal by model id (instead of a boolean) means a
   * brand new generation auto-reopens the sheet, while the user's
   * close gesture still sticks for the model they actually closed.
   */
  const [dismissedModelId, setDismissedModelId] = useState<string | null>(null);

  // Imperative trigger for the file picker (used by the empty-state
  // "Upload image for 3D conversion" suggestion).
  const [uploadTrigger, setUploadTrigger] = useState(0);

  /* ── Latest model from the message stream ───────────────── */

  /**
   * Walk the conversation in reverse and surface the most recent
   * `model_3d` widget. That's the one the viewer should show — newer
   * generations override older ones, and a "loading" widget cleanly
   * transitions to a "generated" widget on the same render pass.
   */
  const latestModel: Model3D | null = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== "assistant") continue;
      const w = m.widgets?.find((widget) => widget.type === "model_3d");
      if (w) return w.data as Model3D;
    }
    return null;
  }, [messages]);

  const mobileSheetOpen =
    !!latestModel && latestModel.id !== dismissedModelId;
  const closeMobileSheet = () => {
    if (latestModel) setDismissedModelId(latestModel.id);
  };
  const openMobileSheet = () => setDismissedModelId(null);

  /* ── Header title ───────────────────────────────────────── */

  const activeSession = sessions.find((s) => s.id === sessionId);
  const headerTitle = activeSession?.title ?? "New 3D Reality";

  /* ── Session actions ───────────────────────────────────── */

  const handleNewSession = useCallback(() => {
    newSession();
    setSidebarOpen(false);
    setDismissedModelId(null);
  }, [newSession]);

  const handleSwitchSession = useCallback(
    (id: string) => {
      switchSession(id);
      setSidebarOpen(false);
      setDismissedModelId(null);
    },
    [switchSession],
  );

  /* ── Widget action buttons ──────────────────────────────── */

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

  /* ── Save to gallery (real Supabase save when configured) ── */

  const handleSaveToGallery = useCallback(
    async (model: Model3D) => {
      try {
        const fullProject = {
          id: sessionId ?? `studio-${Date.now()}`,
          createdAt: new Date().toISOString(),
          inputType: "idea" as const,
          userInput: {
            startupIdea: model.prompt || "3D model",
            websiteUrl: "",
            industry: "",
            targetAudience: "",
            location: "",
            brandStyle: "",
            productType: "",
            visualMood: "",
            inputType: "idea" as const,
          },
          brandResult: {
            brandName: model.prompt
              ? `Studio: ${model.prompt.slice(0, 32)}${model.prompt.length > 32 ? "…" : ""}`
              : "Studio Model",
            tagline: "Generated in the 3D Studio.",
            mission: "",
            targetAudience: "",
            tone: "",
            usp: "",
            story: "",
            promise: "",
            colorPalette: [],
            painPoints: [],
          },
          trustScore: {
            overallScore: 0,
            categories: [],
            suggestions: [],
            confidence: "Low" as const,
          },
          visuals: [],
          model3d: model,
          websiteConcept: {
            heroHeadline: "",
            heroSubheadline: "",
            cta: "",
            sections: [],
            faq: [],
            trustSignals: [],
          },
          marketingPack: {
            instagramCaption: "",
            tiktokScript: "",
            whatsappMessage: "",
            emailSubject: "",
            adHeadlines: [],
          },
        };

        const { saveProject } = await import("@/lib/database");
        const created = await saveProject(fullProject);
        if (created) {
          sendMessage("Saved this 3D model to my gallery.");
        } else {
          // Supabase not configured — persist locally so /gallery picks it up.
          const { saveLocalProject } = await import("@/lib/galleryStorage");
          saveLocalProject(fullProject);
          sendMessage("Saved this 3D model locally. Open the gallery to find it.");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sendMessage(`Couldn't save: ${msg}.`);
      }
    },
    [sendMessage, sessionId],
  );

  /* ── Empty state — chat-area override ───────────────────── */

  const studioEmpty = (
    <StudioEmptyState
      onPickPrompt={(prompt) => sendMessage(prompt)}
      onTriggerUpload={() => setUploadTrigger((n) => n + 1)}
    />
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 w-full flex-1 overflow-hidden bg-background">
      {/* ── Sidebar (shared sessions) ────────────────────── */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onNewSession={handleNewSession}
        onSwitchSession={handleSwitchSession}
        onDeleteSession={removeSession}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* ── Center chat ──────────────────────────────────── */}
      <ChatArea
        title={headerTitle}
        messages={messages}
        isGenerating={isGenerating}
        onSend={sendMessage}
        onWidgetAction={handleWidgetAction}
        onOpenSidebar={() => setSidebarOpen(true)}
        inputPlaceholder="Describe a product, paste an image URL, or attach a file…"
        enableImageUpload
        imageUploadTrigger={uploadTrigger}
        emptyState={studioEmpty}
      />

      {/* ── Right panel — ALWAYS visible on desktop ──────── */}
      <aside
        className={cn(
          "hidden md:flex md:w-[440px] md:shrink-0 md:flex-col",
          "border-l border-[#4F5052]/30",
        )}
        aria-label="3D viewer"
      >
        <ModelViewer
          model={latestModel}
          onSaveToGallery={latestModel ? handleSaveToGallery : undefined}
          title="3D Studio"
        />
      </aside>

      {/* ── Mobile bottom-sheet viewer ───────────────────── */}
      <AnimatePresence>
        {mobileSheetOpen && latestModel ? (
          <>
            <motion.div
              key="sheet-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobileSheet}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
            />
            <motion.section
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="
                fixed inset-x-0 bottom-0 z-50 lg:hidden
                h-[80vh]
                rounded-t-2xl border-t border-[#4F5052]/30
                bg-card/95 backdrop-blur-xl shadow-2xl
                overflow-hidden
              "
              aria-label="3D viewer"
            >
              <div className="flex justify-center pt-2">
                <span className="h-1 w-12 rounded-full bg-white/10" />
              </div>
              <button
                type="button"
                onClick={closeMobileSheet}
                aria-label="Close 3D viewer"
                className="
                  absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md
                  text-muted hover:text-foreground hover:bg-white/[0.05]
                "
              >
                <X size={16} />
              </button>
              <div className="h-full pb-2">
                <ModelViewer
                  model={latestModel}
                  onSaveToGallery={handleSaveToGallery}
                  title="3D Studio"
                  className="h-full"
                />
              </div>
            </motion.section>
          </>
        ) : null}
      </AnimatePresence>

      {/* ── Mobile reopen button (when sheet is closed but a model exists) ── */}
      {!mobileSheetOpen && latestModel ? (
        <button
          type="button"
          onClick={openMobileSheet}
          aria-label="Open 3D viewer"
          className="
            fixed bottom-24 right-4 z-30 lg:hidden
            inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white
            bg-foreground text-background
            shadow-md shadow-black/25
          "
        >
          <ChevronUp size={13} />
          View 3D
        </button>
      ) : null}
    </div>
  );
}
