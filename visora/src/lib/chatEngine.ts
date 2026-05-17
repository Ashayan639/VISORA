"use client";

/**
 * VISORA — Chat engine.
 *
 * `processUserMessage()` is the brain that powers the /generate
 * conversation. It:
 *
 *   1. Detects user intent from a message (idea, URL, demo,
 *      regenerate, 3D, save, general).
 *   2. Dispatches to a per-intent handler that orchestrates the
 *      correct sequence of assistant messages and widgets.
 *   3. Calls our internal API routes (/api/generate-brand,
 *      /api/generate-all-visuals, /api/generate-3d) when needed.
 *   4. Streams each new assistant message via the optional
 *      `onMessage` callback, so the chat UI can append messages as
 *      they're produced (no monolithic "wait 30 s and dump").
 *   5. Patches `currentProject` with everything the engine learns,
 *      surfacing each patch via `onProjectUpdate` for React-friendly
 *      consumption.
 *
 * The file is dependency-light: no React, no heavy libs. Anything
 * that needs the DOM (`crypto.randomUUID`, `fetch`) is checked or
 * overrideable via `ChatEngineOptions` so this module can be unit
 * tested or run server-side later.
 */

import type {
  BrandResult,
  ChatMessage,
  MarketingPack,
  Model3D,
  Project,
  TrustScore,
  UserInput,
  VisualAsset,
  VisualType,
  WebsiteConcept,
  Widget,
} from "@/types/visora";

import { DEMO_PROJECT } from "./demoData";

/* ─────────────────────────────────────────────────────────────
   Public types
   ───────────────────────────────────────────────────────────── */

export interface ChatEngineOptions {
  /** Called for each assistant message as it's produced. */
  onMessage?: (msg: ChatMessage) => void;
  /** Called whenever the engine learns something about the project. */
  onProjectUpdate?: (patch: Partial<Project>) => void;
  /** Override fetch (handy for tests). */
  fetcher?: typeof fetch;
  /** Base URL for API calls. Defaults to '' (relative). */
  baseUrl?: string;
}

/* ─────────────────────────────────────────────────────────────
   Internal API DTOs (mirror our route handlers)
   ───────────────────────────────────────────────────────────── */

interface BrandGenResponse {
  brandResult: BrandResult;
  trustScore: TrustScore;
  websiteConcept: WebsiteConcept;
  marketingPack: MarketingPack;
  falPrompts: {
    product_mockup: string;
    hero_image: string;
    instagram_ad: string;
    lifestyle_scene: string;
  };
  analysis?: {
    brandDnaSummary: string;
    currentStrengths: string[];
    currentWeaknesses: string[];
    improvementDirection: string;
    refreshedVisualSuggestions: string[];
    campaignOpportunities: string[];
  };
  meta: { source: "openai" | "fallback"; durationMs: number };
}

interface VisualResultDTO {
  imageUrl: string;
  visualType: string;
  prompt: string;
  status: "generated" | "fallback";
  title?: string;
  error?: string;
  durationMs: number;
}

interface VisualsBatchResponse {
  results: VisualResultDTO[];
  summary: {
    total: number;
    generated: number;
    fallback: number;
    durationMs: number;
  };
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
   Intent
   ───────────────────────────────────────────────────────────── */

type Intent =
  | { kind: "demo" }
  | { kind: "url"; url: string }
  | { kind: "idea_initial"; text: string }
  | { kind: "idea_refined"; text: string; styleHint?: string }
  | { kind: "make_3d" }
  | { kind: "regen_visual"; which?: VisualType }
  | { kind: "regen_brand"; hint?: string }
  | { kind: "improve_trust" }
  | { kind: "save_project" }
  | { kind: "general"; text: string };

const STYLE_KEYWORDS: Record<string, string> = {
  premium: "premium",
  luxury: "luxury",
  minimal: "minimal",
  modern: "modern",
  playful: "playful",
  warm: "warm",
  earthy: "earthy",
  futuristic: "futuristic",
  bold: "bold",
  classic: "classic",
};

function detectStyleHint(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const k of Object.keys(STYLE_KEYWORDS)) {
    if (lower.includes(k)) return STYLE_KEYWORDS[k];
  }
  return undefined;
}

function extractUrl(text: string): string | undefined {
  const explicit = text.match(/https?:\/\/[^\s]+/i);
  if (explicit) return explicit[0];
  const bare = text.match(/(?:^|\s)([a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?)(?:\s|$)/i);
  if (bare) return `https://${bare[1]}`;
  return undefined;
}

function userMessageCount(history: ChatMessage[]): number {
  return history.filter((m) => m.role === "user").length;
}

function detectIntent(
  message: string,
  history: ChatMessage[],
  project: Partial<Project>,
): Intent {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (/\b(demo|show me a demo|sample|example)\b/.test(lower)) {
    return { kind: "demo" };
  }

  const url = extractUrl(text);
  if (url) return { kind: "url", url };

  if (/\b(save|download|export|gallery)\b/.test(lower) && project.brandResult) {
    return { kind: "save_project" };
  }

  if (
    /\b(3d|3-d|3d model|3d-model|make.*3d|generate.*3d|create.*3d|render.*3d|product model|mesh)\b/.test(
      lower,
    ) &&
    project.brandResult
  ) {
    return { kind: "make_3d" };
  }

  if (/\b(regenerate|redo|retry|try again)\b/.test(lower) || /\bregen\b/.test(lower)) {
    const visualMatch = lower.match(
      /\b(hero image|hero|product mockup|product|instagram ad|instagram|ig ad|lifestyle|mockup|ad)\b/,
    );
    if (visualMatch && (project.visuals?.length ?? 0) > 0) {
      const which = mapVisualKeyword(visualMatch[1]);
      if (which) return { kind: "regen_visual", which };
    }
    if (project.brandResult) {
      const hint = detectStyleHint(lower);
      return { kind: "regen_brand", hint };
    }
  }

  if (/\b(make it (?:more )?(?:premium|luxury|minimal|modern|playful|warm|earthy|bold|classic|futuristic))\b/.test(
    lower,
  ) && project.brandResult) {
    const hint = detectStyleHint(lower);
    return { kind: "regen_brand", hint };
  }

  if (/\b(improve|fix|raise|boost)\b.*\b(trust|score)\b/.test(lower) && project.trustScore) {
    return { kind: "improve_trust" };
  }

  // Have we already seeded a userInput? Then any non-special message is
  // a refinement of the original idea.
  if (!project.brandResult && project.userInput?.startupIdea) {
    return { kind: "idea_refined", text, styleHint: detectStyleHint(lower) };
  }

  // First-time idea: only treat the message as one if there's no brand
  // yet AND this is one of the first user messages.
  if (!project.brandResult && userMessageCount(history) <= 1) {
    return { kind: "idea_initial", text };
  }

  return { kind: "general", text };
}

function mapVisualKeyword(kw: string): VisualType | undefined {
  const k = kw.toLowerCase();
  if (k.includes("hero")) return "hero_image";
  if (k.includes("product") || k.includes("mockup")) return "product_mockup";
  if (k.includes("instagram") || k.includes("ig") || k.includes("ad")) return "instagram_ad";
  if (k.includes("lifestyle")) return "lifestyle_scene";
  return undefined;
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

function makeAssistantMessage(
  content: string,
  widgets: Widget[] = [],
  meta?: ChatMessage["meta"],
): ChatMessage {
  return {
    id: makeId(),
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
    widgets,
    ...(meta ? { meta } : {}),
  };
}

/**
 * Convenience wrapper for the demo flow — stamps every assistant
 * message with `meta.isDemo: true` so the chat UI can render a
 * "Demo Mode" badge and judges always know when they're looking at
 * canned demo content rather than a live model round-trip.
 */
function makeDemoMessage(content: string, widgets: Widget[] = []): ChatMessage {
  return makeAssistantMessage(content, widgets, { isDemo: true });
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Best-effort UserInput from a free-form startup idea text. */
function inferUserInput(text: string): UserInput {
  const trimmed = text.trim();
  return {
    startupIdea: trimmed,
    websiteUrl: "",
    industry: "",
    targetAudience: "",
    location: "",
    brandStyle: detectStyleHint(trimmed) ?? "",
    productType: "",
    visualMood: "",
    inputType: "idea",
  };
}

function buildLoadingVisuals(falPrompts: BrandGenResponse["falPrompts"]): VisualAsset[] {
  const order: Array<{ type: VisualType; title: string; prompt: string }> = [
    { type: "product_mockup", title: "Product mockup", prompt: falPrompts.product_mockup },
    { type: "hero_image", title: "Hero image", prompt: falPrompts.hero_image },
    { type: "instagram_ad", title: "Instagram ad", prompt: falPrompts.instagram_ad },
    { type: "lifestyle_scene", title: "Lifestyle scene", prompt: falPrompts.lifestyle_scene },
  ];
  return order.map((entry, i) => ({
    id: `v-${i}-${makeId().slice(0, 6)}`,
    visualType: entry.type,
    title: entry.title,
    prompt: entry.prompt,
    imageUrl: "",
    status: "loading",
  }));
}

function mapVisualResults(
  results: VisualResultDTO[],
  loading: VisualAsset[],
): VisualAsset[] {
  return loading.map((skeleton, i) => {
    const result = results[i];
    if (!result) return skeleton;
    return {
      ...skeleton,
      imageUrl: result.imageUrl,
      status: result.status,
    };
  });
}

/* ─────────────────────────────────────────────────────────────
   API wrappers
   ───────────────────────────────────────────────────────────── */

function getFetcher(options?: ChatEngineOptions): typeof fetch {
  return options?.fetcher ?? globalThis.fetch.bind(globalThis);
}

function url(path: string, options?: ChatEngineOptions): string {
  const base = options?.baseUrl ?? "";
  return `${base}${path}`;
}

async function callGenerateBrand(
  input: UserInput,
  options?: ChatEngineOptions,
): Promise<BrandGenResponse> {
  const f = getFetcher(options);
  const res = await f(url("/api/generate-brand", options), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`generate-brand ${res.status}: ${body.slice(0, 160)}`);
  }
  return (await res.json()) as BrandGenResponse;
}

async function callGenerateAllVisuals(
  prompts: Array<{ prompt: string; visualType: string; title: string }>,
  options?: ChatEngineOptions,
): Promise<VisualsBatchResponse> {
  const f = getFetcher(options);
  const res = await f(url("/api/generate-all-visuals", options), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompts }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`generate-all-visuals ${res.status}: ${body.slice(0, 160)}`);
  }
  return (await res.json()) as VisualsBatchResponse;
}

async function callGenerate3D(
  body: { mode: "text_to_3d"; prompt: string } | { mode: "image_to_3d"; imageUrl: string },
  options?: ChatEngineOptions,
): Promise<Model3DResponse> {
  const f = getFetcher(options);
  const res = await f(url("/api/generate-3d", options), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const respBody = await res.text().catch(() => "");
    throw new Error(`generate-3d ${res.status}: ${respBody.slice(0, 160)}`);
  }
  return (await res.json()) as Model3DResponse;
}

/* ─────────────────────────────────────────────────────────────
   Action sets used in multiple places
   ───────────────────────────────────────────────────────────── */

function refineIdeaActions(): Widget {
  return {
    type: "action_buttons",
    data: {
      actions: [
        {
          id: "go-now",
          label: "Generate now",
          intent: "generate_now",
          payload: { message: "Generate the brand now" },
        },
        {
          id: "style-premium",
          label: "Make it premium",
          intent: "refine_style",
          payload: { message: "Make it premium and warm" },
        },
        {
          id: "style-minimal",
          label: "Make it minimal",
          intent: "refine_style",
          payload: { message: "Make it minimal and modern" },
        },
        {
          id: "style-playful",
          label: "Make it playful",
          intent: "refine_style",
          payload: { message: "Make it playful and warm" },
        },
      ],
    },
  };
}

function postBrandActions(): Widget {
  return {
    type: "action_buttons",
    data: {
      actions: [
        {
          id: "make-3d",
          label: "Generate 3D model",
          intent: "make_3d",
          payload: { message: "Make a 3D model of the product" },
        },
        {
          id: "regen-brand",
          label: "Regenerate brand",
          intent: "regenerate",
          payload: { message: "Regenerate the brand with a different angle" },
        },
        {
          id: "save",
          label: "Save to gallery",
          intent: "save_project",
          payload: { message: "Save this project to my gallery" },
        },
      ],
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   Handlers — yield an array of new messages
   ───────────────────────────────────────────────────────────── */

interface HandlerCtx {
  yield_: (msg: ChatMessage) => void;
  patch: (p: Partial<Project>) => void;
  options?: ChatEngineOptions;
}

/**
 * Pace between yields when there are no API calls between them
 * (e.g. the demo walkthrough). Real flows already have their own
 * natural pacing because the API calls take time.
 */
const DEMO_PACE_MS = 700;

/* ── Demo ────────────────────────────────────────────────────── */

async function handleDemo(ctx: HandlerCtx): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  // Patch the entire demo project up front so the right-panel /
  // session title pick up the brand name immediately.
  ctx.patch(DEMO_PROJECT);

  push(
    makeDemoMessage(
      "Sure — here's our hero demo, **Urban Brew Ceylon**: a premium small-batch coffee brand for design-led offices in Colombo. Walking you through what we generated — no API keys required.",
    ),
  );
  await delay(DEMO_PACE_MS);

  push(
    makeDemoMessage("Brand brain — name, tagline, story, palette:", [
      { type: "brand_card", data: DEMO_PROJECT.brandResult },
    ]),
  );
  await delay(DEMO_PACE_MS);

  push(
    makeDemoMessage(
      `Trust audit — ${DEMO_PROJECT.trustScore.overallScore}/100 across ${DEMO_PROJECT.trustScore.categories.length} categories:`,
      [{ type: "trust_score", data: DEMO_PROJECT.trustScore }],
    ),
  );
  await delay(DEMO_PACE_MS);

  push(
    makeDemoMessage("Four launch-ready visuals (rendered locally for the demo):", [
      { type: "image_grid", data: { assets: DEMO_PROJECT.visuals } },
    ]),
  );
  await delay(DEMO_PACE_MS);

  push(
    makeDemoMessage("Here's the website concept:", [
      { type: "website_preview", data: DEMO_PROJECT.websiteConcept },
    ]),
  );
  await delay(DEMO_PACE_MS);

  push(
    makeDemoMessage("And the marketing pack — IG, TikTok, WhatsApp, email, ads:", [
      { type: "marketing_pack", data: DEMO_PROJECT.marketingPack },
    ]),
  );
  await delay(DEMO_PACE_MS);

  push(
    makeDemoMessage(
      "Want me to spin up a real 3D model from the product mockup? Or save this demo as a starting point?",
      [postBrandActions()],
    ),
  );

  return messages;
}

/* ── Idea — initial (ask refinements) ────────────────────────── */

async function handleIdeaInitial(
  text: string,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  // Seed userInput so we can detect we're in "refining" mode on the
  // next turn.
  ctx.patch({
    inputType: "idea",
    userInput: inferUserInput(text),
  });

  push(
    makeAssistantMessage(
      "Got it. Before I spin up the full brand reality, one quick refinement — these tilt the palette and visual mood fal.ai generates:",
      [refineIdeaActions()],
    ),
  );

  return messages;
}

/* ── Idea — refined (run full flow) ──────────────────────────── */

async function handleIdeaRefined(
  text: string,
  styleHint: string | undefined,
  project: Partial<Project>,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  // Merge any style hint or extra context into the seeded userInput.
  const mergedInput: UserInput = {
    ...(project.userInput ?? inferUserInput("")),
    startupIdea:
      project.userInput?.startupIdea ||
      (text.length > 30 ? text : "Generated startup idea"),
    brandStyle: styleHint ?? project.userInput?.brandStyle ?? "",
  };
  if (text && !mergedInput.startupIdea.includes(text) && text.length > 30) {
    mergedInput.startupIdea = `${mergedInput.startupIdea}. ${text}`;
  }
  ctx.patch({ userInput: mergedInput });

  push(
    makeAssistantMessage(
      "Generating your brand reality — brand brain → trust audit → fal.ai visuals → website + marketing pack. Hang tight, ~30 seconds.",
    ),
  );

  return runBrandPipeline(mergedInput, ctx, push, messages);
}

/* ── URL flow ────────────────────────────────────────────────── */

async function handleUrl(
  rawUrl: string,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  const userInput: UserInput = {
    startupIdea: "",
    websiteUrl: rawUrl,
    industry: "",
    targetAudience: "",
    location: "",
    brandStyle: "",
    productType: "",
    visualMood: "",
    inputType: "website_url",
  };
  ctx.patch({ inputType: "website_url", userInput });

  push(
    makeAssistantMessage(
      `Auditing **${rawUrl}** and drafting a refresh direction. Brand audit → refreshed brain → trust audit → fal.ai visuals → marketing pack. Hang tight.`,
    ),
  );

  return runBrandPipeline(userInput, ctx, push, messages);
}

/* ── Shared brand pipeline (idea + URL) ──────────────────────── */

async function runBrandPipeline(
  input: UserInput,
  ctx: HandlerCtx,
  push: (m: ChatMessage) => void,
  messages: ChatMessage[],
): Promise<ChatMessage[]> {
  let brand: BrandGenResponse;
  try {
    brand = await callGenerateBrand(input, ctx.options);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    push(
      makeAssistantMessage(
        `Brand generation failed (${msg}). Try again, or say "show me a demo" to see what a finished output looks like.`,
      ),
    );
    return messages;
  }

  ctx.patch({
    brandResult: brand.brandResult,
    trustScore: brand.trustScore,
    websiteConcept: brand.websiteConcept,
    marketingPack: brand.marketingPack,
  });

  push(
    makeAssistantMessage(
      `Here's **${brand.brandResult.brandName}** — your brand brain:`,
      [{ type: "brand_card", data: brand.brandResult }],
    ),
  );
  push(
    makeAssistantMessage(
      `Trust audit: ${brand.trustScore.overallScore}/100 (${brand.trustScore.confidence} confidence).`,
      [{ type: "trust_score", data: brand.trustScore }],
    ),
  );

  // Visuals — show a loading grid first so the UI reacts immediately.
  const loadingVisuals = buildLoadingVisuals(brand.falPrompts);
  ctx.patch({ visuals: loadingVisuals });

  push(
    makeAssistantMessage("Now generating 4 fal.ai visuals in parallel:", [
      { type: "image_grid", data: { assets: loadingVisuals } },
    ]),
  );

  let visuals = loadingVisuals;
  try {
    const batch = await callGenerateAllVisuals(
      [
        { prompt: brand.falPrompts.product_mockup, visualType: "product_mockup", title: "Product mockup" },
        { prompt: brand.falPrompts.hero_image, visualType: "hero_image", title: "Hero image" },
        { prompt: brand.falPrompts.instagram_ad, visualType: "instagram_ad", title: "Instagram ad" },
        { prompt: brand.falPrompts.lifestyle_scene, visualType: "lifestyle_scene", title: "Lifestyle scene" },
      ],
      ctx.options,
    );
    visuals = mapVisualResults(batch.results, loadingVisuals);
    ctx.patch({ visuals });

    push(
      makeAssistantMessage(
        `${batch.summary.generated}/${batch.summary.total} visuals ready (${(batch.summary.durationMs / 1000).toFixed(1)} s).`,
        [{ type: "image_grid", data: { assets: visuals } }],
      ),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    push(
      makeAssistantMessage(
        `Visual generation hiccupped (${msg}). I'll keep going — you can regenerate them anytime.`,
      ),
    );
  }

  push(
    makeAssistantMessage("Here's the website concept:", [
      { type: "website_preview", data: brand.websiteConcept },
    ]),
  );
  push(
    makeAssistantMessage("And the marketing pack:", [
      { type: "marketing_pack", data: brand.marketingPack },
    ]),
  );

  push(
    makeAssistantMessage(
      "Want a 3D product model from the mockup, or save this to your gallery?",
      [postBrandActions()],
    ),
  );

  return messages;
}

/* ── 3D model ────────────────────────────────────────────────── */

async function handle3D(
  project: Partial<Project>,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  // Prefer image-to-3D using the existing product mockup. Fall back
  // to text-to-3D if no usable image is available.
  const productMockup = project.visuals?.find((v) => v.visualType === "product_mockup");
  const usableImage =
    productMockup && productMockup.status === "generated" && productMockup.imageUrl &&
    !productMockup.imageUrl.startsWith("/")
      ? productMockup.imageUrl
      : null;

  const loadingModel: Model3D = {
    id: `m-${makeId().slice(0, 6)}`,
    modelType: usableImage ? "image_to_3d" : "text_to_3d",
    prompt:
      project.brandResult?.brandName
        ? `${project.brandResult.brandName} hero product, isometric, single mesh`
        : "hero product, isometric, single mesh",
    sourceImageUrl: usableImage ?? undefined,
    modelUrl: "",
    status: "loading",
  };
  ctx.patch({ model3d: loadingModel });

  push(
    makeAssistantMessage(
      usableImage
        ? "Forging a 3D mesh from the product mockup via fal.ai/trellis. This usually takes 20–30 seconds."
        : "No product mockup yet — I'll generate a clean source image first, then trellis builds the mesh. ~30 seconds.",
      [{ type: "model_3d", data: loadingModel }],
    ),
  );

  let response: Model3DResponse;
  try {
    response = await callGenerate3D(
      usableImage
        ? { mode: "image_to_3d", imageUrl: usableImage }
        : {
            mode: "text_to_3d",
            prompt: loadingModel.prompt,
          },
      ctx.options,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const failed: Model3D = { ...loadingModel, status: "fallback" };
    ctx.patch({ model3d: failed });
    push(
      makeAssistantMessage(
        `3D generation failed (${msg}). You can retry — the brand and visuals are still saved.`,
        [{ type: "model_3d", data: failed }],
      ),
    );
    return messages;
  }

  const finalModel: Model3D = {
    ...loadingModel,
    modelUrl: response.modelUrl,
    sourceImageUrl: response.sourceImageUrl ?? loadingModel.sourceImageUrl,
    status: response.status === "generated" ? "generated" : "fallback",
  };
  ctx.patch({ model3d: finalModel });

  push(
    makeAssistantMessage(
      response.status === "generated"
        ? `3D mesh ready in ${(response.durationMs / 1000).toFixed(1)} s. Click "Open 3D Studio" to inspect.`
        : `3D generation fell back: ${response.error ?? "unknown reason"}. You can retry or download the source image.`,
      [{ type: "model_3d", data: finalModel }],
    ),
  );

  return messages;
}

/* ── Regenerate brand ────────────────────────────────────────── */

async function handleRegenBrand(
  hint: string | undefined,
  project: Partial<Project>,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  const baseInput: UserInput = project.userInput ?? inferUserInput("");
  const newInput: UserInput = {
    ...baseInput,
    brandStyle: hint ?? baseInput.brandStyle,
  };
  ctx.patch({ userInput: newInput });

  push(
    makeAssistantMessage(
      hint
        ? `Regenerating with a **${hint}** angle — same idea, sharper direction. ~25 s.`
        : "Regenerating the brand with a fresh take. ~25 s.",
    ),
  );

  return runBrandPipeline(newInput, ctx, push, messages);
}

/* ── Regenerate ONE visual ───────────────────────────────────── */

async function handleRegenVisual(
  which: VisualType | undefined,
  project: Partial<Project>,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  const visuals = project.visuals ?? [];
  const target = which ? visuals.find((v) => v.visualType === which) : undefined;
  if (!target) {
    push(
      makeAssistantMessage(
        "I couldn't tell which visual to regenerate. Try \"regenerate the hero image\" or \"redo the product mockup\".",
      ),
    );
    return messages;
  }

  const updatedLoading = visuals.map((v) =>
    v.id === target.id ? { ...v, status: "loading" as const, imageUrl: "" } : v,
  );
  ctx.patch({ visuals: updatedLoading });

  push(
    makeAssistantMessage(`Regenerating **${target.title}**…`, [
      { type: "image_grid", data: { assets: updatedLoading } },
    ]),
  );

  let batch: VisualsBatchResponse;
  try {
    batch = await callGenerateAllVisuals(
      [{ prompt: target.prompt, visualType: target.visualType, title: target.title }],
      ctx.options,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    push(
      makeAssistantMessage(
        `Couldn't regenerate that visual (${msg}). Try once more or refine the prompt.`,
      ),
    );
    return messages;
  }

  const result = batch.results[0];
  const updatedFinal = visuals.map((v) =>
    v.id === target.id && result
      ? { ...v, imageUrl: result.imageUrl, status: result.status }
      : v,
  );
  ctx.patch({ visuals: updatedFinal });

  push(
    makeAssistantMessage(`Done — ${target.title} refreshed.`, [
      { type: "image_grid", data: { assets: updatedFinal } },
    ]),
  );

  return messages;
}

/* ── Improve trust score (text suggestions) ──────────────────── */

async function handleImproveTrust(
  project: Partial<Project>,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  const score = project.trustScore;
  if (!score) {
    push(
      makeAssistantMessage("Generate a brand first and I'll show you exactly what to improve."),
    );
    return messages;
  }

  // Surface the lowest-scoring categories with the matching suggestions.
  const lowest = [...score.categories]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  const lines = [
    `Your current score is **${score.overallScore}/100**. Quickest wins:`,
    "",
    ...lowest.map(
      (c, i) => `${i + 1}. **${c.name}** (${c.score}/100) — focus area`,
    ),
    "",
    "Concrete actions:",
    ...score.suggestions.slice(0, 5).map((s) => `• ${s}`),
  ];
  push(
    makeAssistantMessage(lines.join("\n"), [
      { type: "trust_score", data: score },
    ]),
  );

  return messages;
}

/* ── Save project ────────────────────────────────────────────── */

async function handleSave(
  project: Partial<Project>,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  if (!project.brandResult) {
    push(
      makeAssistantMessage(
        "Nothing to save yet — generate a brand first, then I'll save it to your gallery.",
      ),
    );
    return messages;
  }

  // Fire-and-forget: import the database helper lazily so this
  // module stays light and doesn't pull Supabase on first paint.
  try {
    const fullProject: Project = {
      id: project.id ?? `local-${makeId().slice(0, 8)}`,
      createdAt: project.createdAt ?? new Date().toISOString(),
      inputType: project.inputType ?? "idea",
      userInput: project.userInput ?? inferUserInput(""),
      brandResult: project.brandResult,
      trustScore: project.trustScore ?? {
        overallScore: 0,
        categories: [],
        suggestions: [],
        confidence: "Low",
      },
      visuals: project.visuals ?? [],
      model3d: project.model3d,
      websiteConcept: project.websiteConcept ?? {
        heroHeadline: "",
        heroSubheadline: "",
        cta: "",
        sections: [],
        faq: [],
        trustSignals: [],
      },
      marketingPack: project.marketingPack ?? {
        instagramCaption: "",
        tiktokScript: "",
        whatsappMessage: "",
        emailSubject: "",
        adHeadlines: [],
      },
    };

    const { saveProject } = await import("./database");
    const saved = await saveProject(fullProject);
    if (saved) {
      ctx.patch({ id: saved.id, createdAt: saved.createdAt });
      push(
        makeAssistantMessage(
          `Saved **${project.brandResult.brandName}** to your gallery.`,
        ),
      );
    } else {
      // Supabase unavailable — persist to localStorage so the project
      // still shows up in /gallery on this device.
      const { saveLocalProject } = await import("./galleryStorage");
      const local = saveLocalProject(fullProject);
      ctx.patch({ id: local.id, createdAt: local.createdAt });
      push(
        makeAssistantMessage(
          `Saved **${project.brandResult.brandName}** locally. Open the [gallery](/gallery) to find it.`,
        ),
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    push(
      makeAssistantMessage(
        `Couldn't save right now (${msg}). The project is still in this session.`,
      ),
    );
  }

  return messages;
}

/* ── General fallback ────────────────────────────────────────── */

async function handleGeneral(
  text: string,
  project: Partial<Project>,
  ctx: HandlerCtx,
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  const push = (m: ChatMessage) => {
    messages.push(m);
    ctx.yield_(m);
  };

  const tips = project.brandResult
    ? `For **${project.brandResult.brandName}**, you can ask me to: regenerate the brand, redo a specific visual ("redo the hero image"), generate a 3D model, improve the trust score, or save to gallery.`
    : "Tell me a startup idea (\"premium coffee for Colombo offices\"), paste a website URL, or say \"show me a demo\" to see a finished example.";

  push(
    makeAssistantMessage(
      text.length > 0
        ? `I want to make sure I help correctly. ${tips}`
        : tips,
    ),
  );

  return messages;
}

/* ─────────────────────────────────────────────────────────────
   Public dispatcher
   ───────────────────────────────────────────────────────────── */

/**
 * Process a user message. Always resolves; never throws.
 *
 * Streaming UX: pass `options.onMessage` to receive each assistant
 * message as it's produced. The full array is also returned at the
 * end for callers that prefer a non-streaming API.
 */
export async function processUserMessage(
  message: string,
  history: ChatMessage[],
  currentProject: Partial<Project>,
  options?: ChatEngineOptions,
): Promise<ChatMessage[]> {
  const yield_ = (msg: ChatMessage) => options?.onMessage?.(msg);
  const patch = (p: Partial<Project>) => {
    Object.assign(currentProject, p);
    options?.onProjectUpdate?.(p);
  };
  const ctx: HandlerCtx = { yield_, patch, options };

  try {
    const intent = detectIntent(message, history, currentProject);

    switch (intent.kind) {
      case "demo":
        return handleDemo(ctx);
      case "url":
        return handleUrl(intent.url, ctx);
      case "idea_initial":
        return handleIdeaInitial(intent.text, ctx);
      case "idea_refined":
        return handleIdeaRefined(intent.text, intent.styleHint, currentProject, ctx);
      case "make_3d":
        return handle3D(currentProject, ctx);
      case "regen_brand":
        return handleRegenBrand(intent.hint, currentProject, ctx);
      case "regen_visual":
        return handleRegenVisual(intent.which, currentProject, ctx);
      case "improve_trust":
        return handleImproveTrust(currentProject, ctx);
      case "save_project":
        return handleSave(currentProject, ctx);
      case "general":
        return handleGeneral(intent.text, currentProject, ctx);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const fallback = makeAssistantMessage(
      `Something unexpected happened (${msg}). Try again, or say "show me a demo".`,
    );
    yield_(fallback);
    return [fallback];
  }
}

export default processUserMessage;

/* ─────────────────────────────────────────────────────────────
   Project state reconstruction.

   Walks a chat history and rebuilds the running `Partial<Project>`
   from each assistant widget's snapshot data. Used by the chat hook
   to restore project state when a session is reloaded from
   localStorage — without this, follow-up intents like "make 3D" or
   "save" would fire against an empty project and silently miss
   context after a page refresh.

   Later widgets override earlier ones, so a regenerated brand or a
   refreshed visual ends up as the canonical state.
   ───────────────────────────────────────────────────────────── */

export function reconstructProjectFromMessages(
  messages: ChatMessage[],
): Partial<Project> {
  const project: Partial<Project> = {};

  for (const m of messages) {
    if (m.role !== "assistant") continue;
    const widgets: Widget[] = m.widgets ?? [];
    for (const w of widgets) {
      switch (w.type) {
        case "brand_card":
          project.brandResult = w.data as BrandResult;
          break;
        case "trust_score":
          project.trustScore = w.data as TrustScore;
          break;
        case "image_grid": {
          const data = w.data as { assets?: VisualAsset[] } | undefined;
          if (data?.assets?.length) project.visuals = data.assets;
          break;
        }
        case "model_3d":
          project.model3d = w.data as Model3D;
          break;
        case "website_preview":
          project.websiteConcept = w.data as WebsiteConcept;
          break;
        case "marketing_pack":
          project.marketingPack = w.data as MarketingPack;
          break;
        // action_buttons carry no project state.
      }
    }
  }

  return project;
}
