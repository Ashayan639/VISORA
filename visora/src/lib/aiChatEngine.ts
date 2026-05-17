/**
 * VISORA — AI chat processor (client).
 *
 * Routes demo / operational intents to the legacy pipeline, and
 * everything else through POST /api/chat with token streaming.
 */

import type {
  BrandResult,
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
import type { ChatEngineOptions } from "@/lib/chatEngine";
import { processUserMessage } from "@/lib/chatEngine";

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
  if (/\b(save|download|export)\b/.test(lower) && project.brandResult) return true;
  if (
    /\b(3d|3-d|make.*3d|generate.*3d|create.*3d|render.*3d|product model|mesh)\b/.test(
      lower,
    ) &&
    project.brandResult
  ) {
    return true;
  }
  if (/\b(regenerate|redo|retry|regen)\b/.test(lower) && project.brandResult) {
    return true;
  }
  if (/\b(improve|boost|raise).*(trust|score)\b/.test(lower) && project.trustScore) {
    return true;
  }
  return false;
}

function toApiMessages(history: ChatMessage[], userMessage: string) {
  const api = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content || "",
    }));
  api.push({ role: "user", content: userMessage });
  return api;
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
      case "model_3d":
        patch({ model3d: w.data as Model3D });
        break;
      case "website_preview":
        patch({ websiteConcept: w.data as WebsiteConcept });
        break;
      case "marketing_pack":
        patch({ marketingPack: w.data as MarketingPack });
        break;
    }
  }
}

async function callGenerateAllVisuals(
  prompts: VisualPromptItem[],
  options?: ChatEngineOptions,
): Promise<{
  results: Array<{
    imageUrl: string;
    visualType: string;
    status: string;
    title?: string;
  }>;
}> {
  const f = options?.fetcher ?? globalThis.fetch.bind(globalThis);
  const base = options?.baseUrl ?? "";
  const res = await f(`${base}/api/generate-all-visuals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompts: prompts.map((p) => ({
        prompt: p.prompt,
        visualType: p.type,
        title: p.title,
      })),
    }),
  });
  if (!res.ok) {
    throw new Error(`generate-all-visuals ${res.status}`);
  }
  return res.json() as Promise<{
    results: Array<{
      imageUrl: string;
      visualType: string;
      status: string;
      title?: string;
    }>;
  }>;
}

async function generateVisualsFromPrompts(
  prompts: VisualPromptItem[],
  ctx: {
    options?: ChatEngineOptions;
    patch: (p: Partial<Project>) => void;
    yield_: (m: ChatMessage) => void;
  },
): Promise<void> {
  if (prompts.length === 0) return;

  const loading: VisualAsset[] = prompts.map((p, i) => ({
    id: `v-ai-${i}-${makeId().slice(0, 6)}`,
    visualType: p.type,
    title: p.title,
    prompt: p.prompt,
    imageUrl: "",
    status: "loading",
  }));

  ctx.patch({ visuals: loading });
  ctx.yield_({
    id: makeId(),
    role: "assistant",
    content: "Generating your fal.ai visuals now — this takes a few seconds per image.",
    timestamp: new Date().toISOString(),
    widgets: [{ type: "image_grid", data: { assets: loading } }],
  });

  try {
    const batch = await callGenerateAllVisuals(prompts, ctx.options);
    const assets: VisualAsset[] = loading.map((skeleton, i) => {
      const r = batch.results[i];
      if (!r) return skeleton;
      return {
        ...skeleton,
        imageUrl: r.imageUrl,
        status: r.status === "generated" ? "generated" : "fallback",
      };
    });
    ctx.patch({ visuals: assets });
    ctx.yield_({
      id: makeId(),
      role: "assistant",
      content: "Your visual set is ready — tap any card to inspect.",
      timestamp: new Date().toISOString(),
      widgets: [{ type: "image_grid", data: { assets } }],
    });
  } catch (err) {
    console.warn("[aiChatEngine] visual generation failed:", err);
    ctx.yield_({
      id: makeId(),
      role: "assistant",
      content:
        "Visual generation hit a snag — placeholders are shown. Try again in a moment or check your FAL_KEY.",
      timestamp: new Date().toISOString(),
    });
  }
}

function shouldAutoGenerateVisuals(
  message: string,
  visualPrompts: VisualPromptItem[],
): boolean {
  if (visualPrompts.length === 0) return false;
  return /\b(generate visual|create visual|yes|go ahead|run them|generate them|make visual)\b/i.test(
    message,
  );
}

/**
 * Main AI chat processor — use as default in useChatSession.
 */
export async function processAIChatMessage(
  message: string,
  history: ChatMessage[],
  currentProject: Partial<Project>,
  options?: ChatEngineOptions,
): Promise<ChatMessage[]> {
  if (isDemoIntent(message) || isLegacyPipelineIntent(message, currentProject)) {
    return processUserMessage(message, history, currentProject, options);
  }

  const messages: ChatMessage[] = [];
  const yield_ = (msg: ChatMessage) => {
    messages.push(msg);
    options?.onMessage?.(msg);
  };
  const patch = (p: Partial<Project>) => {
    Object.assign(currentProject, p);
    options?.onProjectUpdate?.(p);
  };

  const assistantId = makeId();
  const startedAt = new Date().toISOString();
  const streamMsg: ChatMessage = {
    id: assistantId,
    role: "assistant",
    content: "",
    timestamp: startedAt,
  };
  options?.onStreamStart?.(streamMsg);

  const f = options?.fetcher ?? globalThis.fetch.bind(globalThis);
  const base = options?.baseUrl ?? "";

  let fullText = "";

  try {
    const res = await f(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: toApiMessages(history, message),
        currentProject,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`chat ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    const source = res.headers.get("X-Visora-Source") ?? "openai";

    if (contentType.includes("application/json")) {
      const data = (await res.json()) as { content?: string };
      fullText = data.content ?? "";
    } else if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const display = stripWidgetTagsForDisplay(fullText);
        options?.onStreamDelta?.(assistantId, display);
      }
    } else {
      fullText = await res.text();
    }

    void source;
  } catch (err) {
    console.error("[aiChatEngine] /api/chat failed:", err);
    const fallback: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content:
        "I couldn't reach the AI service right now. Try again, or say **show me a demo** for an offline walkthrough.",
      timestamp: new Date().toISOString(),
    };
    yield_(fallback);
    return messages;
  }

  const parsed = parseAssistantResponse(fullText);
  const finalMsg: ChatMessage = {
    id: assistantId,
    role: "assistant",
    content: parsed.text,
    timestamp: new Date().toISOString(),
    widgets: parsed.widgets.length > 0 ? parsed.widgets : undefined,
  };

  patchFromWidgets(parsed.widgets, patch);
  yield_(finalMsg);

  if (
    parsed.visualPrompts.length > 0 &&
    (shouldAutoGenerateVisuals(message, parsed.visualPrompts) ||
      /\b(generate visual|create visual|run them)\b/i.test(message))
  ) {
    await generateVisualsFromPrompts(parsed.visualPrompts, {
      options,
      patch,
      yield_,
    });
  } else if (
    parsed.visualPrompts.length > 0 &&
    !currentProject.visuals?.length
  ) {
    yield_({
      id: makeId(),
      role: "assistant",
      content:
        'Say **"generate visuals"** when you want me to run these prompts through fal.ai.',
      timestamp: new Date().toISOString(),
      widgets: [
        {
          type: "action_buttons",
          data: {
            actions: [
              {
                id: "gen-visuals",
                label: "Generate visuals",
                intent: "generate_visuals",
                payload: { message: "Generate visuals" },
              },
            ],
          },
        },
      ],
    });
  }

  return messages;
}

export default processAIChatMessage;
