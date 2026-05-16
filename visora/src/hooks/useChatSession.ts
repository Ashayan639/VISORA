"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ChatAttachment,
  ChatMessage,
  Project,
} from "@/types/visora";
import {
  processUserMessage,
  reconstructProjectFromMessages,
} from "@/lib/chatEngine";
import {
  getLastActiveSessionId,
  listSessions,
  loadMessages,
  makePreview,
  makeSessionId,
  saveMessages,
  setLastActiveSessionId,
  upsertSession,
  type SessionMeta,
} from "@/lib/sessions";

/* ─────────────────────────────────────────────────────────────
   useChatSession — wires the chat UI to a chat engine.

   Pluggable processor: pass `process` to swap the default brand
   pipeline for a different one (e.g. the studio's 3D-only engine).
   The processor signature mirrors `processUserMessage`'s exactly so
   both the chatEngine and studioEngine modules are drop-in compatible.

   Project state is reconstructed from message widgets via
   `reconstructProjectFromMessages` whenever a session is restored
   from localStorage. Without that, follow-up intents like "make 3D"
   or "save" would fire against an empty project after a page reload.
   ───────────────────────────────────────────────────────────── */

export interface ChatProcessor {
  (
    message: string,
    history: ChatMessage[],
    currentProject: Partial<Project>,
    options?: {
      onMessage?: (msg: ChatMessage) => void;
      onProjectUpdate?: (patch: Partial<Project>) => void;
      fetcher?: typeof fetch;
      baseUrl?: string;
    },
  ): Promise<ChatMessage[]>;
}

export interface UseChatSessionOptions {
  /**
   * Custom processor. Defaults to the main chatEngine (brand pipeline).
   * Pass `processStudioMessage` from `@/lib/studioEngine` for /studio.
   */
  process?: ChatProcessor;
  /**
   * Default title for new sessions. Defaults to "New Brand Reality".
   */
  defaultTitle?: string;
}

export interface UseChatSessionResult {
  /** Active session id, or `null` if no session is loaded yet. */
  sessionId: string | null;
  /** Messages in the active session. */
  messages: ChatMessage[];
  /** All known sessions, newest first. Mirrors localStorage. */
  sessions: SessionMeta[];
  /** True while the chat engine is processing the latest message. */
  isGenerating: boolean;
  /** The accumulating project state for the active session. */
  project: Partial<Project>;
  /** Send a user message; routes through the chat engine. */
  sendMessage: (content: string, attachments?: ChatAttachment[]) => void;
  /** Switch to (or create) a different session. */
  switchSession: (id: string | null) => void;
  /** Start a brand-new session. Returns the new id. */
  newSession: () => string;
  /** Hard-delete a session and its messages. */
  removeSession: (id: string) => void;
}

export function useChatSession(
  opts?: UseChatSessionOptions,
): UseChatSessionResult {
  const processor: ChatProcessor = opts?.process ?? processUserMessage;
  const defaultTitle = opts?.defaultTitle ?? "New Brand Reality";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<Partial<Project>>({});

  // The engine mutates `currentProject` in place across multi-step
  // flows. Keep a stable ref so it always has the latest merged state
  // even when React batches multiple state updates between turns.
  const projectRef = useRef<Partial<Project>>({});

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const all = listSessions();
    /* eslint-disable react-hooks/set-state-in-effect */
    setSessions(all);

    const lastId = getLastActiveSessionId();
    const restoreId =
      lastId && all.some((s) => s.id === lastId)
        ? lastId
        : all[0]?.id ?? null;

    if (restoreId) {
      const restoredMessages = loadMessages(restoreId);
      const restoredProject = reconstructProjectFromMessages(restoredMessages);
      setSessionId(restoreId);
      setMessages(restoredMessages);
      setProject(restoredProject);
      projectRef.current = restoredProject;
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Persist messages whenever they change (only after a session exists).
  useEffect(() => {
    if (!sessionId) return;
    saveMessages(sessionId, messages);
  }, [sessionId, messages]);

  /* ── Session management ─────────────────────────────────── */

  const newSession = useCallback((): string => {
    const id = makeSessionId();
    setSessionId(id);
    setMessages([]);
    setProject({});
    projectRef.current = {};
    setLastActiveSessionId(id);
    return id;
  }, []);

  const switchSession = useCallback((id: string | null) => {
    if (!id) {
      setSessionId(null);
      setMessages([]);
      setProject({});
      projectRef.current = {};
      setLastActiveSessionId(null);
      return;
    }
    const restoredMessages = loadMessages(id);
    const restoredProject = reconstructProjectFromMessages(restoredMessages);
    setSessionId(id);
    setMessages(restoredMessages);
    setProject(restoredProject);
    projectRef.current = restoredProject;
    setLastActiveSessionId(id);
  }, []);

  const removeSession = useCallback(
    (id: string) => {
      // Lazy-import to avoid pulling deleteSession when unused.
      import("@/lib/sessions").then(({ deleteSession }) => {
        deleteSession(id);
        setSessions(listSessions());
        if (id === sessionId) {
          setSessionId(null);
          setMessages([]);
          setProject({});
          projectRef.current = {};
        }
      });
    },
    [sessionId],
  );

  /* ── Sidebar metadata helpers ───────────────────────────── */

  const upsertMetaForSession = useCallback((meta: SessionMeta) => {
    upsertSession(meta);
    setSessions((prev) => {
      const without = prev.filter((s) => s.id !== meta.id);
      return [meta, ...without];
    });
  }, []);

  /* ── Send via the configured processor ──────────────────── */

  const sendMessage = useCallback(
    (rawContent: string, attachments?: ChatAttachment[]) => {
      const content = rawContent.trim();
      const hasContent = content.length > 0;
      const hasAttachment = (attachments?.length ?? 0) > 0;
      if (!hasContent && !hasAttachment) return;
      if (isGenerating) return;

      const id = sessionId ?? makeSessionId();
      const now = new Date().toISOString();
      const isFirstMessage = !sessionId;

      const userMsg: ChatMessage = {
        id: makeSessionId(),
        role: "user",
        content,
        timestamp: now,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      };

      // 1) Push the user message immediately and seed the session.
      setSessionId(id);
      setLastActiveSessionId(id);
      // Snapshot the history at the moment of send for the engine —
      // it expects "everything BEFORE the current user message".
      const historyAtSend = messages;
      setMessages((prev) => [...prev, userMsg]);

      const existing = sessions.find((s) => s.id === id);
      const previewText =
        content || (hasAttachment ? `📎 ${attachments![0].name ?? "image"}` : "");
      const initialMeta: SessionMeta = {
        id,
        title: existing?.title ?? defaultTitle,
        preview: isFirstMessage
          ? makePreview(previewText)
          : existing?.preview ?? makePreview(previewText),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      upsertMetaForSession(initialMeta);

      // 2) Drive the engine. Stream each assistant message in.
      setIsGenerating(true);

      // Stuff attachments into a transient slot on the project so the
      // processor can read them without changing its signature. The
      // studio engine clears this slot before returning.
      if (hasAttachment) {
        (projectRef.current as { __attachments?: ChatAttachment[] }).__attachments =
          attachments;
      }

      void processor(content, historyAtSend, projectRef.current, {
        onMessage: (assistantMsg) => {
          setMessages((prev) => [...prev, assistantMsg]);

          // First brand_card we see → promote the session title.
          const brandWidget = assistantMsg.widgets?.find(
            (w) => w.type === "brand_card",
          );
          if (brandWidget) {
            const brandName =
              (brandWidget.data as { brandName?: string } | undefined)?.brandName ??
              null;
            if (brandName) {
              upsertMetaForSession({
                ...initialMeta,
                title: brandName,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        },
        onProjectUpdate: (patch) => {
          Object.assign(projectRef.current, patch);
          setProject({ ...projectRef.current });
        },
      })
        .catch((err) => {
          // The engine is documented to never throw; defensive.
          console.error("[useChatSession] processor threw:", err);
        })
        .finally(() => {
          // Defensive cleanup — the studio engine clears this on its
          // own, but other processors may not.
          delete (projectRef.current as { __attachments?: ChatAttachment[] })
            .__attachments;
          setIsGenerating(false);
        });
    },
    [
      defaultTitle,
      isGenerating,
      messages,
      processor,
      sessionId,
      sessions,
      upsertMetaForSession,
    ],
  );

  return {
    sessionId,
    messages,
    sessions,
    isGenerating,
    project,
    sendMessage,
    switchSession,
    newSession,
    removeSession,
  };
}

export default useChatSession;
