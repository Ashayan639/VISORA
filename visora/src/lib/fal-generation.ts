/**
 * fal.ai visual generation — server-only.
 *
 * All callers MUST be server-side. We never expose FAL_KEY to the
 * browser; the route handlers in `/api/generate-visual*` are the only
 * entry points and they're forced into the Node runtime.
 *
 * Public API:
 *   - generateOneVisual({ prompt, visualType, title? })
 *
 * The helper always resolves — fal.ai errors, missing API key,
 * missing image URL, and timeouts all degrade to the documented
 * fallback shape with `status: "fallback"`.
 */

import { fal } from "@fal-ai/client";

import type { VisualType } from "@/types/visora";

/* ─────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────── */

/**
 * The fast schnell model is well-suited to a hackathon UX (≈2-3s per
 * image). Swap to "fal-ai/flux-pro" when quality matters more than
 * latency.
 */
export const FLUX_MODEL = "fal-ai/flux/schnell";

/** Default placeholder when type/title are unknown. */
export const PLACEHOLDER_VISUAL_URL = "/placeholder-visual.png";

export function placeholderUrlForVisual(
  visualType: string,
  title?: string,
  brandName?: string,
): string {
  const params = new URLSearchParams({
    type: visualType || "visual",
    title: title || visualType.replace(/_/g, " ") || "VISORA visual",
  });
  if (brandName) params.set("brand", brandName);
  return `/api/placeholder?${params.toString()}`;
}

/** Image size keys recognised by the flux endpoints. */
type FalImageSize =
  | "square"
  | "square_hd"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9";

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */

export type VisualResultStatus = "generated" | "fallback";

export interface VisualResult {
  imageUrl: string;
  /**
   * The originally requested visual type. Kept as a free-form string
   * (rather than the strict `VisualType` union) so callers can pass
   * arbitrary values; we never crash on unknown types.
   */
  visualType: string;
  prompt: string;
  status: VisualResultStatus;
  /** Echoed back from the request when supplied (batch route). */
  title?: string;
  /** Populated only on `status === "fallback"`. */
  error?: string;
  /** Time spent inside the generator, in ms. */
  durationMs: number;
}

export interface GenerateVisualInput {
  prompt: string;
  visualType: string;
  title?: string;
  /** Override the image size; defaults are picked per visual type. */
  imageSize?: FalImageSize;
}

/* ─────────────────────────────────────────────────────────────
   Lazy fal config
   ───────────────────────────────────────────────────────────── */

let _falConfigured: boolean | undefined;

function isUsableFalKey(key: string | undefined): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 20) return false;
  if (trimmed.toLowerCase().startsWith("your_")) return false;
  if (trimmed.toLowerCase().includes("changeme")) return false;
  return true;
}

function ensureFalConfigured(): boolean {
  if (_falConfigured !== undefined) return _falConfigured;
  const key = process.env.FAL_KEY;
  if (!isUsableFalKey(key)) {
    console.warn(
      "[fal] FAL_KEY missing or placeholder — visual generation will fall back to placeholder.",
    );
    _falConfigured = false;
    return false;
  }
  fal.config({ credentials: key });
  _falConfigured = true;
  return true;
}

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function imageSizeForVisualType(visualType: string): FalImageSize {
  // Honour the documented `VisualType` union but fall back gracefully
  // for any other string the caller supplies.
  const v = visualType as VisualType;
  switch (v) {
    case "instagram_ad":
      return "square_hd";
    case "hero_image":
      return "landscape_16_9";
    case "lifestyle_scene":
      return "landscape_16_9";
    case "product_mockup":
      return "square_hd";
    default:
      return "square_hd";
  }
}

interface FluxImage {
  url?: string;
  width?: number;
  height?: number;
  content_type?: string;
}

interface FluxOutput {
  images?: FluxImage[];
  prompt?: string;
  seed?: number;
}

function makeFallback(
  input: GenerateVisualInput,
  startedAt: number,
  reason: string,
): VisualResult {
  return {
    imageUrl: placeholderUrlForVisual(
      input.visualType,
      input.title,
    ),
    visualType: input.visualType,
    prompt: input.prompt,
    status: "fallback",
    title: input.title,
    error: reason,
    durationMs: Date.now() - startedAt,
  };
}

/* ─────────────────────────────────────────────────────────────
   Public API
   ───────────────────────────────────────────────────────────── */

/**
 * Generate a single image via fal.ai. Always resolves — never throws.
 * Errors are logged with structured context and surfaced as a
 * `status: "fallback"` result.
 */
export async function generateOneVisual(
  input: GenerateVisualInput,
): Promise<VisualResult> {
  const startedAt = Date.now();
  const promptTrimmed = (input.prompt || "").trim();

  if (!promptTrimmed) {
    return makeFallback(input, startedAt, "empty prompt");
  }
  if (!input.visualType?.trim()) {
    return makeFallback(input, startedAt, "missing visualType");
  }
  if (!ensureFalConfigured()) {
    return makeFallback(input, startedAt, "FAL_KEY missing or placeholder");
  }

  const imageSize = input.imageSize ?? imageSizeForVisualType(input.visualType);

  try {
    const result = await fal.subscribe(FLUX_MODEL, {
      input: {
        prompt: promptTrimmed,
        image_size: imageSize,
        num_images: 1,
        // schnell ignores high step counts; keep the default.
        enable_safety_checker: true,
      },
      logs: false,
    });

    const data = result?.data as FluxOutput | undefined;
    const url = data?.images?.[0]?.url;

    if (!url || typeof url !== "string") {
      console.error(
        "[fal] generation succeeded but no image URL was returned",
        {
          visualType: input.visualType,
          promptPreview: promptTrimmed.slice(0, 80),
        },
      );
      return makeFallback(input, startedAt, "no image URL in fal response");
    }

    return {
      imageUrl: url,
      visualType: input.visualType,
      prompt: promptTrimmed,
      status: "generated",
      title: input.title,
      durationMs: Date.now() - startedAt,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[fal] generation failed", {
      visualType: input.visualType,
      promptPreview: promptTrimmed.slice(0, 80),
      error: message,
    });
    return makeFallback(input, startedAt, message);
  }
}
