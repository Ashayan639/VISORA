"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  BrandResult,
  ChatAttachment,
  ChatMessage,
  MarketingPack,
  Model3D,
  Project,
  TrustScore,
  VisualAsset,
  WebsiteConcept,
  Widget,
} from "@/types/visora";
import {
  parseAssistantResponse,
  stripWidgetTagsForDisplay,
  type VisualPromptItem,
} from "@/lib/chat/parse-widgets";
import {
  buildLoadingAssets,
  buildPlaceholderImageUrl,
  callGenerateAllVisuals,
  callGenerateSingleVisual,
  is3DIntent,
  mergeApiResultsIntoAssets,
  mergeSingleResultIntoGrid,
} from "@/lib/chat/visual-client";
import {
  assignWidgetVersions,
  projectPatchFromLatestWidgets,
  rebuildWidgetVersionCounters,
  type WidgetVersionCounters,
} from "@/lib/chat/widget-versions";
import { processUserMessage, reconstructProjectFromMessages } from "@/lib/chatEngine";
import { GLOBAL_PROJECT_KEY, saveProject } from "@/lib/sessions";

/* ─────────────────────────────────────────────────────────────
   useChat — single source of truth for chat + project state.

   Streams POST /api/chat, parses [WIDGET:…] blocks incrementally,
   auto-runs fal.ai when VISUAL_PROMPTS appears, and persists project
   snapshots to localStorage on every update.
   ───────────────────────────────────────────────────────────── */

export interface ChatError {
  message: string;
  /** Last user text that failed — used by retry(). */
  retryText?: string;
}

export interface UseChatOptions {
  /** Bound session id for per-session project storage. */
  sessionId?: string | null;
  /** Called after project patches (e.g. sidebar title sync). */
  onProjectUpdate?: (project: Partial<Project>) => void;
  /** Called when a brand_card widget arrives (sidebar title). */
  onBrandDetected?: (brandName: string) => void;
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export interface UseChatResult {
  messages: ChatMessage[];
  currentProject: Partial<Project>;
  sendMessage: (text: string, attachments?: ChatAttachment[]) => void;
  isStreaming: boolean;
  error: ChatError | null;
  retry: () => void;
  clearChat: () => void;
  loadSession: (messages: ChatMessage[], project?: Partial<Project>) => void;
  setCurrentProject: (project: Partial<Project>) => void;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function isDemoIntent(message: string): boolean {
  return /\b(try demo|show me a demo|see a demo|demo mode|urban brew|sample demo|example demo)\b/i.test(
    message.trim(),
  );
}

function isLegacyPipelineIntent(message: string, project: Partial<Project>): boolean {
  const lower = message.trim().toLowerCase();
  if (/\b(download|export)\b/.test(lower) && project.brandResult) return true;
  return false;
}

function toApiMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content || "",
    }));
}

function patchFromWidgets(
  widgets: Widget[],
  patch: (p: Partial<Project>) => void,
): void {
  for (const w of widgets) {
    switch (w.type) {
      case "brand_card":
        patch({ brandResult: w.data as BrandResult });
        break;
      case "trust_score":
        patch({ trustScore: w.data as TrustScore });
        break;
      case "image_grid": {
        const data = w.data as { assets?: VisualAsset[] };
        if (data?.assets?.length) patch({ visuals: data.assets });
        break;
      }
      case "website_preview":
        patch({ websiteConcept: w.data as WebsiteConcept });
        break;
      case "marketing_pack":
        patch({ marketingPack: w.data as MarketingPack });
        break;
      case "model_3d":
        patch({ model3d: w.data as Model3D });
        break;
    }
  }
}

function imageGridWidget(assets: VisualAsset[]): Widget {
  return { type: "image_grid", data: { assets } };
}

function persistProject(
  sessionId: string | null | undefined,
  project: Partial<Project>,
): void {
  saveProject(sessionId ?? null, project);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GLOBAL_PROJECT_KEY, JSON.stringify(project));
    }
  } catch {
    /* ignore */
  }
}

export function useChat(options?: UseChatOptions): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Partial<Project>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);

  const projectRef = useRef<Partial<Project>>({});
  const abortRef = useRef<AbortController | null>(null);
  const visualGenTriggeredRef = useRef<Set<string>>(new Set());
  const model3dTriggeredRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef<ChatMessage[]>([]);
  const widgetVersionCountsRef = useRef<WidgetVersionCounters>({});

  const sessionId = options?.sessionId;
  const fetcher = options?.fetcher;
  const baseUrl = options?.baseUrl;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const applyProjectPatch = useCallback(
    (patch: Partial<Project>) => {
      Object.assign(projectRef.current, patch);
      const next = { ...projectRef.current };
      setCurrentProjectState(next);
      persistProject(sessionId, next);
      options?.onProjectUpdate?.(next);
    },
    [options, sessionId],
  );

  const setCurrentProject = useCallback(
    (project: Partial<Project>) => {
      projectRef.current = { ...project };
      setCurrentProjectState(projectRef.current);
      persistProject(sessionId, projectRef.current);
    },
    [sessionId],
  );

  const versionWidgets = useCallback((widgets: Widget[]): Widget[] => {
    if (widgets.length === 0) return widgets;
    return assignWidgetVersions(widgets, widgetVersionCountsRef.current);
  }, []);

  const syncProjectFromMessages = useCallback(
    (msgs: ChatMessage[]) => {
      const patch = projectPatchFromLatestWidgets(msgs);
      if (Object.keys(patch).length > 0) {
        applyProjectPatch(patch);
      }
    },
    [applyProjectPatch],
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    projectRef.current = {};
    setCurrentProjectState({});
    persistProject(sessionId, {});
    visualGenTriggeredRef.current.clear();
    model3dTriggeredRef.current.clear();
    widgetVersionCountsRef.current = {};
  }, [sessionId]);

  const loadSession = useCallback(
    (loaded: ChatMessage[], project?: Partial<Project>) => {
      abortRef.current?.abort();
      abortRef.current = null;
      setError(null);
      setIsStreaming(false);
      visualGenTriggeredRef.current.clear();
      model3dTriggeredRef.current.clear();
      widgetVersionCountsRef.current = rebuildWidgetVersionCounters(loaded);
      setMessages(loaded);
      const restored =
        project ??
        (Object.keys(projectPatchFromLatestWidgets(loaded)).length > 0
          ? projectPatchFromLatestWidgets(loaded)
          : reconstructProjectFromMessages(loaded));
      projectRef.current = restored;
      setCurrentProjectState(restored);
      persistProject(sessionId, restored);
    },
    [sessionId],
  );

  const runVisualGeneration = useCallback(
    async (
      prompts: VisualPromptItem[],
      opts?: { userMessage?: string; attachToMessageId?: string },
    ): Promise<void> => {
      if (prompts.length === 0) return;

      const brand = projectRef.current.brandResult?.brandName;
      const existingAssets = projectRef.current.visuals ?? [];
      const promptTypes = new Set(prompts.map((p) => p.type));
      const isPartialRegen =
        existingAssets.length > 0 &&
        prompts.length > 0 &&
        prompts.length < existingAssets.length;

      const genKey = `${isPartialRegen ? "partial" : "batch"}:${prompts.map((p) => p.type).join(",")}`;
      if (visualGenTriggeredRef.current.has(genKey)) return;
      visualGenTriggeredRef.current.add(genKey);

      let loadingAssets: VisualAsset[];
      if (isPartialRegen) {
        loadingAssets = existingAssets.map((asset) =>
          promptTypes.has(asset.visualType)
            ? { ...asset, imageUrl: "", status: "loading" as const, prompt: prompts.find((p) => p.type === asset.visualType)?.prompt ?? asset.prompt }
            : asset,
        );
      } else {
        loadingAssets = buildLoadingAssets(prompts);
      }

      const visualMsgId = opts?.attachToMessageId ?? makeId();
      const attachToExisting = Boolean(opts?.attachToMessageId);
      const loadingWidget = versionWidgets([imageGridWidget(loadingAssets)])[0]!;

      applyProjectPatch({ visuals: loadingAssets });

      if (attachToExisting) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== visualMsgId) return m;
            const withoutGrid = (m.widgets ?? []).filter((w) => w.type !== "image_grid");
            return {
              ...m,
              content: "Generating your brand visuals with fal.ai…",
              widgets: [...withoutGrid, loadingWidget],
            };
          }),
        );
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: visualMsgId,
            role: "assistant" as const,
            content: isPartialRegen
              ? `Regenerating ${prompts.map((p) => p.title).join(", ")} with fal.ai…`
              : "Generating your brand visuals with fal.ai…",
            timestamp: new Date().toISOString(),
            widgets: [loadingWidget],
          },
        ]);
      }

      try {
        let finalAssets: VisualAsset[];

        if (isPartialRegen) {
          finalAssets = [...loadingAssets];
          for (const prompt of prompts) {
            const result = await callGenerateSingleVisual(prompt, { fetcher, baseUrl });
            finalAssets = mergeSingleResultIntoGrid(
              finalAssets,
              prompt.type,
              result,
              prompt.prompt,
              brand,
            );
          }
        } else {
          const batch = await callGenerateAllVisuals(prompts, { fetcher, baseUrl });
          finalAssets = mergeApiResultsIntoAssets(loadingAssets, batch.results, brand);
        }

        const doneWidget = versionWidgets([imageGridWidget(finalAssets)])[0]!;
        const generatedCount = finalAssets.filter((a) => a.status === "generated").length;

        applyProjectPatch({ visuals: finalAssets });

        setMessages((prev) => {
          const next = prev.map((m) => {
            if (m.id !== visualMsgId) return m;
            const withoutGrid = (m.widgets ?? []).filter((w) => w.type !== "image_grid");
            return {
              ...m,
              content: isPartialRegen
                ? `**${prompts.map((p) => p.title).join(", ")}** refreshed.`
                : generatedCount > 0
                  ? `Your visual set is ready — ${generatedCount} of ${finalAssets.length} generated on fal.ai.`
                  : "Visual placeholders are shown — add FAL_KEY in .env.local for live fal.ai images.",
              widgets: [...withoutGrid, doneWidget],
            };
          });
          syncProjectFromMessages(next);
          return next;
        });
      } catch (err) {
        console.warn("[useChat] visual generation failed:", err);
        const fallbackAssets = loadingAssets.map((skeleton) => ({
          ...skeleton,
          imageUrl: buildPlaceholderImageUrl(skeleton.visualType, skeleton.title, brand),
          status: "fallback" as const,
        }));

        applyProjectPatch({ visuals: fallbackAssets });

        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === visualMsgId
              ? {
                  ...m,
                  content:
                    "Visual generation hit a snag — placeholders are shown. Check FAL_KEY or try again.",
                  widgets: versionWidgets([imageGridWidget(fallbackAssets)]),
                }
              : m,
          );
          syncProjectFromMessages(next);
          return next;
        });
      }

    },
    [applyProjectPatch, baseUrl, fetcher, syncProjectFromMessages, versionWidgets],
  );

  const run3DGeneration = useCallback(async (): Promise<void> => {
    if (!projectRef.current.brandResult) return;

    const genKey = "3d:session";
    if (model3dTriggeredRef.current.has(genKey)) return;
    model3dTriggeredRef.current.add(genKey);

    const product = projectRef.current.visuals?.find(
      (v) => v.visualType === "product_mockup",
    );
    const brand = projectRef.current.brandResult;
    const promptText =
      product?.prompt ??
      `${brand.brandName} premium product, studio-lit, clean background`;

    const loadingModel: Model3D = {
      id: makeId(),
      modelType:
        product?.imageUrl && product.status === "generated"
          ? "image_to_3d"
          : "text_to_3d",
      prompt: promptText,
      sourceImageUrl: product?.imageUrl || undefined,
      modelUrl: "",
      status: "loading",
    };

    const modelMsgId = makeId();
    const loadingWidget = versionWidgets([
      { type: "model_3d", data: loadingModel },
    ])[0]!;

    applyProjectPatch({ model3d: loadingModel });

    setMessages((prev) => [
      ...prev,
      {
        id: modelMsgId,
        role: "assistant" as const,
        content: "Forging your 3D product model with fal.ai/trellis — ~20–30 seconds.",
        timestamp: new Date().toISOString(),
        widgets: [loadingWidget],
      },
    ]);

    try {
      const f = fetcher ?? globalThis.fetch.bind(globalThis);
      const base = baseUrl ?? "";
      const body =
        loadingModel.modelType === "image_to_3d" && product?.imageUrl
          ? { mode: "image_to_3d", imageUrl: product.imageUrl }
          : { mode: "text_to_3d", prompt: promptText };

      const res = await f(`${base}/api/generate-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as {
        status?: string;
        modelUrl?: string;
        mode?: Model3D["modelType"];
      };

      const finalModel: Model3D = {
        ...loadingModel,
        modelType: (data.mode as Model3D["modelType"]) ?? loadingModel.modelType,
        modelUrl: data.modelUrl ?? "",
        status:
          data.status === "generated" && data.modelUrl ? "generated" : "fallback",
      };

      applyProjectPatch({ model3d: finalModel });

      const doneWidget = versionWidgets([{ type: "model_3d", data: finalModel }])[0]!;

      setMessages((prev) => {
        const next = prev.map((m) =>
          m.id === modelMsgId
            ? {
                ...m,
                content:
                  finalModel.status === "generated"
                    ? "Your 3D model is ready — open it in the panel to inspect."
                    : "3D generation fell back — check FAL_KEY or try again.",
                widgets: [doneWidget],
              }
            : m,
        );
        syncProjectFromMessages(next);
        return next;
      });
    } catch (err) {
      console.warn("[useChat] 3D generation failed:", err);
      const failed: Model3D = { ...loadingModel, status: "fallback" };
      applyProjectPatch({ model3d: failed });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === modelMsgId
            ? {
                ...m,
                content: "3D generation failed — try again in a moment.",
                widgets: versionWidgets([{ type: "model_3d", data: failed }]),
              }
            : m,
        ),
      );
    }
  }, [applyProjectPatch, baseUrl, fetcher, syncProjectFromMessages, versionWidgets]);

  const streamFromApi = useCallback(
    async (
      apiMessages: ReturnType<typeof toApiMessages>,
      assistantId: string,
      userMessage: string,
    ): Promise<void> => {
      const f = fetcher ?? globalThis.fetch.bind(globalThis);
      const base = baseUrl ?? "";
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await f(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          currentProject: projectRef.current,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        let friendly = "The AI service couldn't respond. Please try again.";
        try {
          const parsed = JSON.parse(errBody) as { error?: string };
          if (parsed.error) friendly = parsed.error;
        } catch {
          /* use default */
        }
        throw new Error(friendly);
      }

      let fullText = "";
      let assistantPlaced = false;
      const contentType = res.headers.get("content-type") ?? "";

      const ensureAssistantMessage = () => {
        if (assistantPlaced) return;
        assistantPlaced = true;
        setMessages((prev) => {
          if (prev.some((m) => m.id === assistantId)) return prev;
          return [
            ...prev,
            {
              id: assistantId,
              role: "assistant" as const,
              content: "",
              timestamp: new Date().toISOString(),
            },
          ];
        });
      };

      const applyStreamChunk = () => {
        const parsed = parseAssistantResponse(fullText);
        const display = stripWidgetTagsForDisplay(fullText);

        // Preview widgets while streaming — versions assigned once at end.
        if (parsed.widgets.length > 0) {
          patchFromWidgets(parsed.widgets, applyProjectPatch);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: display,
                  widgets:
                    parsed.widgets.length > 0 ? parsed.widgets : m.widgets,
                }
              : m,
          ),
        );
      };

      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { content?: string };
        fullText = data.content ?? "";
        ensureAssistantMessage();
      } else if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          ensureAssistantMessage();
          applyStreamChunk();
        }
      } else {
        fullText = await res.text();
        ensureAssistantMessage();
      }

      ensureAssistantMessage();

      const parsed = parseAssistantResponse(fullText);
      const versioned =
        parsed.widgets.length > 0
          ? versionWidgets(parsed.widgets)
          : parsed.widgets;

      if (versioned.length > 0) {
        patchFromWidgets(versioned, applyProjectPatch);
      }

      for (const w of versioned) {
        if (w.type === "brand_card") {
          const name = (w.data as BrandResult).brandName;
          if (name) options?.onBrandDetected?.(name);
        }
      }

      setMessages((prev) => {
        const next = prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: parsed.text,
                widgets: versioned.length > 0 ? versioned : undefined,
              }
            : m,
        );
        syncProjectFromMessages(next);
        return next;
      });

      if (parsed.visualPrompts.length > 0) {
        await runVisualGeneration(parsed.visualPrompts, { userMessage });
      } else if (is3DIntent(userMessage) && projectRef.current.brandResult) {
        await run3DGeneration();
      }
    },
    [
      applyProjectPatch,
      baseUrl,
      fetcher,
      options,
      run3DGeneration,
      runVisualGeneration,
      syncProjectFromMessages,
      versionWidgets,
    ],
  );

  const sendMessage = useCallback(
    (rawText: string, attachments?: ChatAttachment[]) => {
      const text = rawText.trim();
      const hasText = text.length > 0;
      const hasAttachment = (attachments?.length ?? 0) > 0;
      if (!hasText && !hasAttachment) return;
      if (isStreaming) return;

      setError(null);

      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
        attachments: hasAttachment ? attachments : undefined,
      };

      const historyWithUser = [...messages, userMsg];
      setMessages(historyWithUser);

      const assistantId = makeId();

      setIsStreaming(true);

      const finish = () => {
        abortRef.current = null;
        setIsStreaming(false);
      };

      const runLegacy = async () => {
        if (hasAttachment) {
          (projectRef.current as { __attachments?: ChatAttachment[] }).__attachments =
            attachments;
        }
        try {
          await processUserMessage(text, messages, projectRef.current, {
            fetcher,
            baseUrl,
            onMessage: (msg) => {
              setMessages((prev) => [...prev, msg]);
            },
            onProjectUpdate: applyProjectPatch,
          });
        } finally {
          delete (projectRef.current as { __attachments?: ChatAttachment[] })
            .__attachments;
        }
      };

      const runStreaming = async () => {
        try {
          await streamFromApi(toApiMessages(historyWithUser), assistantId, text);
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
          const message =
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.";
          setError({ message, retryText: text });
          setMessages((prev) => {
            const hasAssistant = prev.some((m) => m.id === assistantId);
            if (hasAssistant) {
              return prev.map((m) =>
                m.id === assistantId ? { ...m, content: message } : m,
              );
            }
            return [
              ...prev,
              {
                id: assistantId,
                role: "assistant" as const,
                content: message,
                timestamp: new Date().toISOString(),
              },
            ];
          });
        }
      };

      void (async () => {
        try {
          if (
            isDemoIntent(text) ||
            isLegacyPipelineIntent(text, projectRef.current)
          ) {
            await runLegacy();
          } else {
            await runStreaming();
          }
        } finally {
          finish();
        }
      })();
    },
    [
      applyProjectPatch,
      baseUrl,
      fetcher,
      isStreaming,
      messages,
      streamFromApi,
    ],
  );

  const retry = useCallback(() => {
    const retryText = error?.retryText;
    if (!retryText) return;
    setError(null);
    setMessages((prev) => {
      let next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") next = next.slice(0, -1);
      const tail = next[next.length - 1];
      if (tail?.role === "user" && tail.content === retryText) {
        next = next.slice(0, -1);
      }
      return next;
    });
    sendMessage(retryText);
  }, [error, sendMessage]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    messages,
    currentProject,
    sendMessage,
    isStreaming,
    error,
    retry,
    clearChat,
    loadSession,
    setCurrentProject,
  };
}

export default useChat;
