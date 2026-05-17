"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ChatAttachment,
  ChatMessage,
  Project,
} from "@/types/visora";
import { useChat } from "@/hooks/useChat";
import {
  createInstantDemoConversation,
  reconstructProjectFromMessages,
} from "@/lib/chatEngine";
import { extractUserInputFromMessages } from "@/lib/buildProjectFromChat";
import {
  findSessionByGalleryProjectId,
  getLastActiveSessionId,
  getSession,
  listSessions,
  loadGalleryProjectChat,
  loadMessages,
  loadProject,
  makePreview,
  makeSessionId,
  saveGalleryProjectChat,
  saveMessages,
  saveProject,
  setLastActiveSessionId,
  upsertSession,
  type SessionMeta,
} from "@/lib/sessions";

/* ─────────────────────────────────────────────────────────────
   useChatSession — session sidebar + persistence around useChat.

   Default path: `useChat` streams POST /api/chat with full history.
   Custom `process` (e.g. studio 3D engine) uses a parallel message
   buffer with the same persistence hooks.
   ───────────────────────────────────────────────────────────── */

export interface ChatProcessor {
  (
    message: string,
    history: ChatMessage[],
    currentProject: Partial<Project>,
    options?: {
      onMessage?: (msg: ChatMessage) => void;
      onStreamStart?: (msg: ChatMessage) => void;
      onStreamDelta?: (messageId: string, content: string) => void;
      onProjectUpdate?: (patch: Partial<Project>) => void;
      fetcher?: typeof fetch;
      baseUrl?: string;
    },
  ): Promise<ChatMessage[]>;
}

export interface UseChatSessionOptions {
  process?: ChatProcessor;
  defaultTitle?: string;
}

export interface SaveToGalleryResult {
  ok: boolean;
  projectId?: string;
  storage?: "supabase" | "local";
  error?: string;
}

export interface UseChatSessionResult {
  sessionId: string | null;
  messages: ChatMessage[];
  sessions: SessionMeta[];
  isGenerating: boolean;
  project: Partial<Project>;
  sendMessage: (content: string, attachments?: ChatAttachment[]) => void;
  switchSession: (id: string | null) => void;
  newSession: () => string;
  removeSession: (id: string) => void;
  loadDemo: () => void;
  isDemoMode: boolean;
  error: ReturnType<typeof useChat>["error"];
  retry: () => void;
  saveToGallery: () => Promise<SaveToGalleryResult>;
  isSaving: boolean;
  refreshSessions: () => Promise<void>;
}

export function useChatSession(
  opts?: UseChatSessionOptions,
): UseChatSessionResult {
  const customProcessor = opts?.process;
  const defaultTitle = opts?.defaultTitle ?? "New Brand Reality";
  const usesCustomEngine = Boolean(customProcessor);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [customMessages, setCustomMessages] = useState<ChatMessage[]>([]);
  const [customProject, setCustomProject] = useState<Partial<Project>>({});
  const [customGenerating, setCustomGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const projectRef = useRef<Partial<Project>>({});
  const upsertMetaRef = useRef<(meta: SessionMeta) => void>(() => {});

  const chat = useChat({
    sessionId: usesCustomEngine ? null : sessionId,
    onProjectUpdate: (patch) => {
      if (patch.id != null && String(patch.id).startsWith("demo-")) {
        setIsDemoMode(true);
      }
    },
    onBrandDetected: (brandName) => {
      if (!sessionId) return;
      const existing = sessions.find((s) => s.id === sessionId);
      if (!existing) return;
      upsertMetaRef.current({
        ...existing,
        title: brandName,
        updatedAt: new Date().toISOString(),
      });
    },
  });

  const messages = usesCustomEngine ? customMessages : chat.messages;
  const project = usesCustomEngine ? customProject : chat.currentProject;
  const isGenerating = usesCustomEngine
    ? customGenerating
    : chat.isStreaming;

  const upsertMetaForSession = useCallback((meta: SessionMeta) => {
    upsertSession(meta);
    setSessions((prev) => {
      const without = prev.filter((s) => s.id !== meta.id);
      return [meta, ...without];
    });
  }, []);

  useEffect(() => {
    upsertMetaRef.current = upsertMetaForSession;
  }, [upsertMetaForSession]);

  const hydrateSession = useCallback(
    (id: string, restoredMessages: ChatMessage[], restoredProject: Partial<Project>) => {
      setSessionId(id);
      projectRef.current = restoredProject;
      setIsDemoMode(
        restoredProject.id != null &&
          String(restoredProject.id).startsWith("demo-"),
      );
      if (usesCustomEngine) {
        setCustomMessages(restoredMessages);
        setCustomProject(restoredProject);
      } else {
        chat.loadSession(restoredMessages, restoredProject);
      }
    },
    [chat, usesCustomEngine],
  );

  const mergeGalleryIntoSessions = useCallback(
    (local: SessionMeta[], galleryProjects: Project[]): SessionMeta[] => {
      const byId = new Map<string, SessionMeta>();
      for (const s of local) byId.set(s.id, s);

      for (const p of galleryProjects) {
        if (!p.brandResult?.brandName) continue;
        const existing = findSessionByGalleryProjectId(p.id);
        if (existing) {
          byId.set(existing.id, {
            ...existing,
            title: p.brandResult.brandName,
            galleryProjectId: p.id,
            updatedAt: p.createdAt,
          });
          continue;
        }

        const resumeId = p.sessionId ?? `gallery-${p.id}`;
        if (!byId.has(resumeId)) {
          byId.set(resumeId, {
            id: resumeId,
            title: p.brandResult.brandName,
            preview: p.userInput?.startupIdea
              ? makePreview(p.userInput.startupIdea)
              : "Saved to gallery",
            createdAt: p.createdAt,
            updatedAt: p.createdAt,
            galleryProjectId: p.id,
            fromGallery: true,
          });

          if (p.chatMessages?.length) {
            saveMessages(resumeId, p.chatMessages);
            saveProject(resumeId, p);
            saveGalleryProjectChat(p.id, p.chatMessages);
          }
        }
      }

      return Array.from(byId.values()).sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      );
    },
    [],
  );

  const fetchMergedSessions = useCallback(async (): Promise<SessionMeta[]> => {
    const local = listSessions();
    try {
      const res = await fetch("/api/projects?withChat=1");
      if (res.ok) {
        const data = (await res.json()) as { projects?: Project[] };
        return mergeGalleryIntoSessions(local, data.projects ?? []);
      }
    } catch (err) {
      console.warn("[useChatSession] fetchMergedSessions:", err);
    }
    return local;
  }, [mergeGalleryIntoSessions]);

  const refreshSessions = useCallback(async () => {
    const merged = await fetchMergedSessions();
    setSessions(merged);
  }, [fetchMergedSessions]);

  useEffect(() => {
    void (async () => {
      const all = await fetchMergedSessions();
      setSessions(all);
      const lastId = getLastActiveSessionId();
      const restoreId =
        lastId && all.some((s) => s.id === lastId)
          ? lastId
          : all[0]?.id ?? null;

      if (restoreId) {
        const meta = all.find((s) => s.id === restoreId);
        let restoredMessages = loadMessages(restoreId);
        if (meta?.galleryProjectId) {
          const galleryChat = loadGalleryProjectChat(meta.galleryProjectId);
          if (galleryChat.length > 0) restoredMessages = galleryChat;
        }
        const storedProject = loadProject(restoreId);
        const restoredProject =
          Object.keys(storedProject).length > 0
            ? storedProject
            : reconstructProjectFromMessages(restoredMessages);
        hydrateSession(restoreId, restoredMessages, restoredProject);
      }
    })();
  }, [fetchMergedSessions, hydrateSession]);

  useEffect(() => {
    if (!sessionId) return;
    saveMessages(sessionId, messages);
  }, [sessionId, messages]);

  useEffect(() => {
    if (!sessionId) return;
    saveProject(sessionId, project);
    projectRef.current = project;
  }, [sessionId, project]);

  const newSession = useCallback((): string => {
    const id = makeSessionId();
    setSessionId(id);
    projectRef.current = {};
    setIsDemoMode(false);
    if (usesCustomEngine) {
      setCustomMessages([]);
      setCustomProject({});
    } else {
      chat.clearChat();
    }
    setLastActiveSessionId(id);
    return id;
  }, [chat, usesCustomEngine]);

  const switchSession = useCallback(
    (id: string | null) => {
      if (!id) {
        setSessionId(null);
        projectRef.current = {};
        setIsDemoMode(false);
        if (usesCustomEngine) {
          setCustomMessages([]);
          setCustomProject({});
        } else {
          chat.clearChat();
        }
        setLastActiveSessionId(null);
        return;
      }

      const meta = sessions.find((s) => s.id === id) ?? getSession(id);
      let restoredMessages = loadMessages(id);
      const storedProject = loadProject(id);

      if (meta?.galleryProjectId) {
        const galleryChat = loadGalleryProjectChat(meta.galleryProjectId);
        if (galleryChat.length > 0) restoredMessages = galleryChat;

        if (Object.keys(storedProject).length === 0) {
          void (async () => {
            try {
              const res = await fetch("/api/projects?withChat=1");
              if (!res.ok) return;
              const data = (await res.json()) as { projects?: Project[] };
              const remote = data.projects?.find(
                (p) => p.id === meta.galleryProjectId,
              );
              if (!remote) return;
              const msgs =
                remote.chatMessages?.length
                  ? remote.chatMessages
                  : restoredMessages;
              hydrateSession(id, msgs, remote);
              saveMessages(id, msgs);
              saveProject(id, remote);
              if (remote.chatMessages?.length) {
                saveGalleryProjectChat(meta.galleryProjectId!, msgs);
              }
            } catch {
              /* ignore */
            }
          })();
        }
      }

      const restoredProject =
        Object.keys(storedProject).length > 0
          ? storedProject
          : reconstructProjectFromMessages(restoredMessages);
      hydrateSession(id, restoredMessages, restoredProject);
      setLastActiveSessionId(id);
    },
    [chat, hydrateSession, sessions, usesCustomEngine],
  );

  const saveToGallery = useCallback(async (): Promise<SaveToGalleryResult> => {
    if (!project.brandResult?.brandName) {
      return {
        ok: false,
        error: "Nothing to save yet — generate a brand first.",
      };
    }

    setIsSaving(true);
    const activeId = sessionId ?? makeSessionId();
    if (!sessionId) setSessionId(activeId);

    try {
      const res = await fetch("/api/save-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentProject: project,
          userInput: extractUserInputFromMessages(messages, project),
          chatMessages: messages,
          sessionId: activeId,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        project?: Project;
        storage?: "supabase" | "local";
        error?: string;
      };

      if (!res.ok || !data.ok || !data.project) {
        return { ok: false, error: data.error ?? "Could not save project." };
      }

      const saved = data.project;
      const brandName = saved.brandResult.brandName;
      const now = new Date().toISOString();

      saveGalleryProjectChat(saved.id, messages);
      saveMessages(activeId, messages);
      saveProject(activeId, { ...project, ...saved, id: saved.id });

      const existing = getSession(activeId);
      upsertMetaForSession({
        id: activeId,
        title: brandName,
        preview: existing?.preview ?? makePreview(messages[0]?.content ?? brandName),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        galleryProjectId: saved.id,
      });

      projectRef.current = { ...projectRef.current, id: saved.id };
      if (usesCustomEngine) {
        setCustomProject({ ...projectRef.current });
      } else {
        chat.setCurrentProject({ ...projectRef.current, id: saved.id });
      }

      const confirm: ChatMessage = {
        id: makeSessionId(),
        role: "assistant",
        content:
          data.storage === "supabase"
            ? `Saved **${brandName}** to your gallery. View it at [/gallery](/gallery) or [/project/${saved.id}](/project/${saved.id}).`
            : `Saved **${brandName}** locally. Open the [gallery](/gallery) to find it.`,
        timestamp: now,
      };

      const withConfirm = [...messages, confirm];
      if (usesCustomEngine) {
        setCustomMessages(withConfirm);
      } else {
        chat.loadSession(withConfirm, { ...projectRef.current, id: saved.id });
      }
      saveMessages(activeId, withConfirm);

      await refreshSessions();

      return { ok: true, projectId: saved.id, storage: data.storage };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save project.";
      return { ok: false, error: message };
    } finally {
      setIsSaving(false);
    }
  }, [
    chat,
    messages,
    project,
    refreshSessions,
    sessionId,
    upsertMetaForSession,
    usesCustomEngine,
  ]);

  const removeSession = useCallback(
    (id: string) => {
      import("@/lib/sessions").then(({ deleteSession }) => {
        deleteSession(id);
        setSessions(listSessions());
        if (id === sessionId) {
          setSessionId(null);
          projectRef.current = {};
          if (usesCustomEngine) {
            setCustomMessages([]);
            setCustomProject({});
          } else {
            chat.clearChat();
          }
        }
      });
    },
    [chat, sessionId, usesCustomEngine],
  );

  const loadDemo = useCallback(() => {
    if (isGenerating) return;

    const { messages: demoMessages, project: demoProject } =
      createInstantDemoConversation();
    const id = sessionId ?? makeSessionId();
    const now = new Date().toISOString();
    const brandName = demoProject.brandResult.brandName;

    hydrateSession(id, demoMessages, demoProject);
    setIsDemoMode(true);
    setLastActiveSessionId(id);

    upsertMetaForSession({
      id,
      title: brandName,
      preview: "Demo — Urban Brew Ceylon",
      createdAt: now,
      updatedAt: now,
    });
  }, [hydrateSession, isGenerating, sessionId, upsertMetaForSession]);

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
      const existing = sessions.find((s) => s.id === id);

      if (isFirstMessage) setIsDemoMode(false);

      if (
        /\b(save|gallery)\b/i.test(content) &&
        projectRef.current.brandResult &&
        !usesCustomEngine
      ) {
        setSessionId(id);
        setLastActiveSessionId(id);
        upsertMetaForSession({
          id,
          title:
            projectRef.current.brandResult?.brandName ??
            existing?.title ??
            defaultTitle,
          preview: makePreview(content),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        });
        void saveToGallery();
        return;
      }

      setSessionId(id);
      setLastActiveSessionId(id);
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

      if (customProcessor) {
        const userMsg: ChatMessage = {
          id: makeSessionId(),
          role: "user",
          content,
          timestamp: now,
          attachments: hasAttachment ? attachments : undefined,
        };

        const historyAtSend = customMessages;
        setCustomMessages((prev) => [...prev, userMsg]);

        if (hasAttachment) {
          (projectRef.current as { __attachments?: ChatAttachment[] }).__attachments =
            attachments;
        }

        setCustomGenerating(true);
        const streamingIdRef = { current: null as string | null };

        void customProcessor(content, historyAtSend, projectRef.current, {
          onStreamStart: (assistantMsg) => {
            streamingIdRef.current = assistantMsg.id;
            setCustomMessages((prev) => [...prev, assistantMsg]);
          },
          onStreamDelta: (messageId, deltaContent) => {
            setCustomMessages((prev) =>
              prev.map((m) =>
                m.id === messageId ? { ...m, content: deltaContent } : m,
              ),
            );
          },
          onMessage: (assistantMsg) => {
            const streamId = streamingIdRef.current;
            if (streamId && assistantMsg.id === streamId) {
              setCustomMessages((prev) =>
                prev.map((m) => (m.id === streamId ? assistantMsg : m)),
              );
              streamingIdRef.current = null;
            } else {
              setCustomMessages((prev) => [...prev, assistantMsg]);
            }

            const brandWidget = assistantMsg.widgets?.find(
              (w) => w.type === "brand_card",
            );
            if (brandWidget) {
              const brandName =
                (brandWidget.data as { brandName?: string } | undefined)
                  ?.brandName ?? null;
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
            if (patch.id != null && String(patch.id).startsWith("demo-")) {
              setIsDemoMode(true);
            }
            setCustomProject({ ...projectRef.current });
          },
        })
          .catch((err) => {
            console.error("[useChatSession] processor threw:", err);
            setCustomMessages((prev) => [
              ...prev,
              {
                id: makeSessionId(),
                role: "assistant",
                content:
                  "Something went wrong while processing your message. Please try again.",
                timestamp: new Date().toISOString(),
              },
            ]);
          })
          .finally(() => {
            delete (projectRef.current as { __attachments?: ChatAttachment[] })
              .__attachments;
            setCustomGenerating(false);
          });
        return;
      }

      chat.sendMessage(content, attachments);
    },
    [
      chat,
      customMessages,
      customProcessor,
      defaultTitle,
      isGenerating,
      saveToGallery,
      sessionId,
      sessions,
      upsertMetaForSession,
      usesCustomEngine,
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
    loadDemo,
    isDemoMode,
    error: usesCustomEngine ? null : chat.error,
    retry: usesCustomEngine ? () => {} : chat.retry,
    saveToGallery,
    isSaving,
    refreshSessions,
  };
}

export default useChatSession;
