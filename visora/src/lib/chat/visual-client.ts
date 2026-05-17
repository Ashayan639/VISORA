/**
 * Client-side helpers for fal.ai visual generation routes.
 */

import type { VisualAsset, VisualType } from "@/types/visora";
import type { VisualPromptItem } from "@/lib/chat/parse-widgets";

export interface VisualApiResult {
  imageUrl: string;
  visualType: string;
  prompt: string;
  status: "generated" | "fallback";
  title?: string;
  error?: string;
  durationMs?: number;
}

export interface GenerateAllVisualsResponse {
  results: VisualApiResult[];
  summary?: {
    total: number;
    generated: number;
    fallback: number;
    durationMs: number;
  };
  error?: string;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v-${Math.random().toString(36).slice(2, 10)}`;
}

/** Branded SVG placeholder when FAL_KEY is missing or a call fails. */
export function buildPlaceholderImageUrl(
  visualType: string,
  title: string,
  brandName?: string,
): string {
  const params = new URLSearchParams({
    type: visualType,
    title: title || visualType.replace(/_/g, " "),
  });
  if (brandName) params.set("brand", brandName);
  return `/api/placeholder?${params.toString()}`;
}

export function buildLoadingAssets(prompts: VisualPromptItem[]): VisualAsset[] {
  return prompts.map((p, i) => ({
    id: `v-${i}-${makeId().slice(0, 8)}`,
    visualType: p.type,
    title: p.title,
    prompt: p.prompt,
    imageUrl: "",
    status: "loading" as const,
  }));
}

export function mergeApiResultsIntoAssets(
  skeletons: VisualAsset[],
  results: VisualApiResult[],
  brandName?: string,
): VisualAsset[] {
  return skeletons.map((skeleton, i) => {
    const r = results[i];
    if (!r) {
      return {
        ...skeleton,
        imageUrl: buildPlaceholderImageUrl(
          skeleton.visualType,
          skeleton.title,
          brandName,
        ),
        status: "fallback" as const,
      };
    }
    const isGenerated = r.status === "generated" && Boolean(r.imageUrl);
    return {
      ...skeleton,
      imageUrl: isGenerated
        ? r.imageUrl
        : buildPlaceholderImageUrl(skeleton.visualType, skeleton.title, brandName),
      prompt: r.prompt || skeleton.prompt,
      status: isGenerated ? "generated" : "fallback",
    };
  });
}

export function mergeSingleResultIntoGrid(
  existing: VisualAsset[],
  visualType: VisualType,
  result: VisualApiResult,
  newPrompt: string,
  brandName?: string,
): VisualAsset[] {
  return existing.map((asset) => {
    if (asset.visualType !== visualType) return asset;
    const isGenerated = result.status === "generated" && Boolean(result.imageUrl);
    return {
      ...asset,
      prompt: newPrompt || result.prompt || asset.prompt,
      imageUrl: isGenerated
        ? result.imageUrl
        : buildPlaceholderImageUrl(asset.visualType, asset.title, brandName),
      status: isGenerated ? "generated" : "fallback",
    };
  });
}

export async function callGenerateAllVisuals(
  prompts: VisualPromptItem[],
  options?: { fetcher?: typeof fetch; baseUrl?: string },
): Promise<GenerateAllVisualsResponse> {
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
    const body = await res.text().catch(() => "");
    throw new Error(
      body ? `generate-all-visuals ${res.status}` : `generate-all-visuals ${res.status}`,
    );
  }

  return res.json() as Promise<GenerateAllVisualsResponse>;
}

export async function callGenerateSingleVisual(
  prompt: VisualPromptItem,
  options?: { fetcher?: typeof fetch; baseUrl?: string },
): Promise<VisualApiResult> {
  const f = options?.fetcher ?? globalThis.fetch.bind(globalThis);
  const base = options?.baseUrl ?? "";
  const res = await f(`${base}/api/generate-visual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: prompt.prompt,
      visualType: prompt.type,
      title: prompt.title,
    }),
  });

  if (!res.ok) {
    throw new Error(`generate-visual ${res.status}`);
  }

  return res.json() as Promise<VisualApiResult>;
}

export function detectVisualTypeFromMessage(
  message: string,
): VisualType | undefined {
  const lower = message.toLowerCase();
  if (/\b(product|mockup|packshot)\b/.test(lower)) return "product_mockup";
  if (/\b(hero|banner|header)\b/.test(lower)) return "hero_image";
  if (/\b(instagram|ig|social ad|square ad)\b/.test(lower)) return "instagram_ad";
  if (/\b(lifestyle|scene|ambient)\b/.test(lower)) return "lifestyle_scene";
  return undefined;
}

export function is3DIntent(message: string): boolean {
  return /\b(3d|3-d|three[\s-]?d|create.*3d|generate.*3d|make.*3d|product model|mesh)\b/i.test(
    message.trim(),
  );
}
