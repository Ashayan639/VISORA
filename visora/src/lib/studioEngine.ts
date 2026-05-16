"use client";

/**
 * VISORA — Studio engine.
 *
 * The /studio workspace is 3D-only: every user turn ends in a single
 * `model_3d` widget (loading → final). It shares the chat hook with
 * /generate (same persistence, same sidebar) but plugs in this leaner
 * processor instead of the full brand pipeline.
 *
 * Routing rules:
 *
 *   1. If the user's message has an `image` attachment → image_to_3d
 *      using the attachment URL (which may be a `data:` URL — the API
 *      route hoists those to fal.storage server-side).
 *   2. Else if the message text contains a fully-qualified `http(s)`
 *      URL → image_to_3d using that URL.
 *   3. Else → text_to_3d (chained flux + trellis on the API side).
 *
 * Like the main engine, this module never throws and streams each
 * assistant message via the optional `onMessage` callback so the chat
 * UI can append messages as they're produced.
 */

import type {
  ChatAttachment,
  ChatMessage,
  Model3D,
  Project,
  Widget,
} from "@/types/visora";

/* ─────────────────────────────────────────────────────────────
   Public types — mirror chatEngine.ts so the hook can swap engines
   ───────────────────────────────────────────────────────────── */

export interface StudioEngineOptions {
  onMessage?: (msg: ChatMessage) => void;
  onProjectUpdate?: (patch: Partial<Project>) => void;
  fetcher?: typeof fetch;
  baseUrl?: string;
}

interface Model3DResponse {
  status: "generated" | "fallback";
  mode: "text_to_3d" | "image_to_3d";
  modelUrl: string;
  modelType: "glb";
  prompt?: string;
  sourceImageUrl?: string;
  intermediateImageUrl?: string;
  error?: string;
  durationMs: number;
}

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function makeAssistantMessage(content: string, widgets: Widget[] = []): ChatMessage {
  return {
    id: makeId(),
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
    widgets,
  };
}

function getFetcher(options?: StudioEngineOptions): typeof fetch {
  return options?.fetcher ?? globalThis.fetch.bind(globalThis);
}

function url(path: string, options?: StudioEngineOptions): string {
  return `${options?.baseUrl ?? ""}${path}`;
}

const URL_RE = /https?:\/\/[^\s)]+/i;

function extractHttpUrl(text: string): string | undefined {
  const match = text.match(URL_RE);
  return match ? match[0] : undefined;
}

function findImageAttachment(
  attachments?: ChatAttachment[],
): ChatAttachment | undefined {
  return (attachments ?? []).find(
    (a) =>
      (a.kind === "image" || a.mimeType?.startsWith("image/")) &&
      typeof a.url === "string" &&
      a.url.length > 0,
  );
}

/* ─────────────────────────────────────────────────────────────
   API call
   ───────────────────────────────────────────────────────────── */

async function callGenerate3D(
  body:
    | { mode: "text_to_3d"; prompt: string }
    | { mode: "image_to_3d"; imageUrl: string },
  options?: StudioEngineOptions,
): Promise<Model3DResponse> {
  const f = getFetcher(options);
  const res = await f(url("/api/generate-3d", options), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`generate-3d ${res.status}: ${text.slice(0, 160)}`);
  }
  return (await res.json()) as Model3DResponse;
}

/* ─────────────────────────────────────────────────────────────
   Intent routing
   ───────────────────────────────────────────────────────────── */

type StudioIntent =
  | { kind: "image_to_3d"; imageUrl: string; sourceLabel: string }
  | { kind: "text_to_3d"; prompt: string }
  | { kind: "general"; text: string };

function detectStudioIntent(
  message: string,
  attachments?: ChatAttachment[],
): StudioIntent {
  const text = message.trim();

  // 1) Explicit image attachment wins.
  const attached = findImageAttachment(attachments);
  if (attached?.url) {
    return {
      kind: "image_to_3d",
      imageUrl: attached.url,
      sourceLabel: attached.name ?? "uploaded image",
    };
  }

  // 2) Bare URL in the message text → image_to_3d.
  const httpUrl = extractHttpUrl(text);
  if (httpUrl) {
    return {
      kind: "image_to_3d",
      imageUrl: httpUrl,
      sourceLabel: httpUrl,
    };
  }

  // 3) Empty message and no attachment → general fallback.
  if (!text) {
    return { kind: "general", text };
  }

  // 4) Anything else → describe-a-product flow.
  return { kind: "text_to_3d", prompt: text };
}

/* ─────────────────────────────────────────────────────────────
   Per-intent handlers
   ───────────────────────────────────────────────────────────── */

interface HandlerCtx {
  yield_: (msg: ChatMessage) => void;
  patch: (p: Partial<Project>) => void;
  options?: StudioEngineOptions;
}

async function handleImageTo3D(
  imageUrl: string,
  sourceLabel: string,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  // Don't echo the data URL into the UI — show a friendly label.
  const isDataUrl = imageUrl.startsWith("data:");
  const display = isDataUrl ? sourceLabel : sourceLabel;

  const loading: Model3D = {
    id: `m-${makeId().slice(0, 6)}`,
    modelType: "image_to_3d",
    prompt: "image-to-3D mesh",
    sourceImageUrl: isDataUrl ? undefined : imageUrl,
    modelUrl: "",
    status: "loading",
  };
  ctx.patch({ model3d: loading });

  push(
    makeAssistantMessage(
      `Forging a 3D mesh from **${display}** via fal.ai/trellis. This usually takes 20–30 seconds.`,
      [{ type: "model_3d", data: loading }],
    ),
  );

  let response: Model3DResponse;
  try {
    response = await callGenerate3D({ mode: "image_to_3d", imageUrl }, ctx.options);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const failed: Model3D = { ...loading, status: "fallback" };
    ctx.patch({ model3d: failed });
    push(
      makeAssistantMessage(
        `3D generation failed (${msg}). Try a different source image, or describe the product in text instead.`,
        [{ type: "model_3d", data: failed }],
      ),
    );
    return messages;
  }

  const final: Model3D = {
    ...loading,
    modelUrl: response.modelUrl,
    sourceImageUrl: response.sourceImageUrl ?? loading.sourceImageUrl,
    status: response.status === "generated" ? "generated" : "fallback",
  };
  ctx.patch({ model3d: final });

  push(
    makeAssistantMessage(
      response.status === "generated"
        ? `3D mesh ready in ${(response.durationMs / 1000).toFixed(1)} s. Inspect it in the viewer →`
        : `3D generation fell back: ${response.error ?? "unknown reason"}. The viewer shows the wireframe placeholder; you can retry with another image.`,
      [{ type: "model_3d", data: final }],
    ),
  );

  return messages;
}

async function handleTextTo3D(
  prompt: string,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  const loading: Model3D = {
    id: `m-${makeId().slice(0, 6)}`,
    modelType: "text_to_3d",
    prompt,
    modelUrl: "",
    status: "loading",
  };
  ctx.patch({ model3d: loading });

  push(
    makeAssistantMessage(
      `Generating a clean source image with fal.ai/flux, then forging the mesh with trellis. ~30 seconds total.`,
      [{ type: "model_3d", data: loading }],
    ),
  );

  let response: Model3DResponse;
  try {
    response = await callGenerate3D({ mode: "text_to_3d", prompt }, ctx.options);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const failed: Model3D = { ...loading, status: "fallback" };
    ctx.patch({ model3d: failed });
    push(
      makeAssistantMessage(
        `3D generation failed (${msg}). Refine the prompt — single clear object, no humans or text — and try again.`,
        [{ type: "model_3d", data: failed }],
      ),
    );
    return messages;
  }

  const final: Model3D = {
    ...loading,
    modelUrl: response.modelUrl,
    sourceImageUrl: response.intermediateImageUrl,
    status: response.status === "generated" ? "generated" : "fallback",
  };
  ctx.patch({ model3d: final });

  push(
    makeAssistantMessage(
      response.status === "generated"
        ? `Mesh ready in ${(response.durationMs / 1000).toFixed(1)} s. Source image and 3D model are both in the viewer →`
        : `3D generation fell back: ${response.error ?? "unknown reason"}. Try uploading a clean reference image instead.`,
      [{ type: "model_3d", data: final }],
    ),
  );

  return messages;
}

async function handleStudioGeneral(
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const msg = makeAssistantMessage(
    "Describe a product (\"matte black wireless headphones with brushed steel accents\") or attach an image and I'll forge a 3D mesh from it.",
  );
  ctx.yield_(msg);
  return [msg];
}

/* ─────────────────────────────────────────────────────────────
   Public dispatcher
   ───────────────────────────────────────────────────────────── */

/**
 * Studio-flavoured `processUserMessage`. Same signature as the main
 * chatEngine version so it can be plugged directly into
 * `useChatSession({ process })`.
 */
export async function processStudioMessage(
  message: string,
  history: ChatMessage[],
  currentProject: Partial<Project>,
  options?: StudioEngineOptions,
): Promise<ChatMessage[]> {
  // The studio hook stuffs the latest user message's attachments into
  // `currentProject.__attachments` (a transient slot) so the engine
  // signature can stay string-typed. If that slot exists, use it.
  const attachments =
    (currentProject as { __attachments?: ChatAttachment[] }).__attachments ?? [];

  const yield_ = (msg: ChatMessage) => options?.onMessage?.(msg);
  const patch = (p: Partial<Project>) => {
    Object.assign(currentProject, p);
    options?.onProjectUpdate?.(p);
  };
  const ctx: HandlerCtx = { yield_, patch, options };

  // We only consume the attachments for THIS turn — clear them after
  // routing so the next turn doesn't double-dip.
  delete (currentProject as { __attachments?: ChatAttachment[] }).__attachments;

  try {
    const intent = detectStudioIntent(message, attachments);
    switch (intent.kind) {
      case "image_to_3d":
        return handleImageTo3D(intent.imageUrl, intent.sourceLabel, ctx);
      case "text_to_3d":
        return handleTextTo3D(intent.prompt, ctx);
      case "general":
        return handleStudioGeneral(ctx);
    }
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    const fallback = makeAssistantMessage(
      `Studio engine hit an unexpected error (${m}). Try again, or describe a different product.`,
    );
    yield_(fallback);
    return [fallback];
  }

  // Should be unreachable — appease TypeScript exhaustiveness check.
  return [];
}

export default processStudioMessage;
