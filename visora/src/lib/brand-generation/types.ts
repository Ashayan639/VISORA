/**
 * Types for the brand-generation pipeline.
 *
 * The /api/generate-brand route consumes a `UserInput` and produces a
 * `GenerateBrandResult` — a superset of the domain types in
 * `@/types/visora` plus fal.ai prompt set, optional URL analysis, and
 * meta about how the result was produced.
 */

import type {
  BrandResult,
  MarketingPack,
  TrustScore,
  UserInput,
  WebsiteConcept,
} from "@/types/visora";

/** Visual generation prompts for the four canonical fal.ai shots. */
export interface FalPromptSet {
  product_mockup: string;
  hero_image: string;
  instagram_ad: string;
  lifestyle_scene: string;
}

/**
 * Analysis bundle produced only for `inputType === "website_url"`.
 * Captures the audit-style commentary the user asked for.
 */
export interface WebsiteAnalysis {
  brandDnaSummary: string;
  currentStrengths: string[];
  currentWeaknesses: string[];
  improvementDirection: string;
  refreshedVisualSuggestions: string[];
  campaignOpportunities: string[];
}

export type GenerateBrandSource = "openai" | "fallback";

export interface GenerateBrandMeta {
  source: GenerateBrandSource;
  model?: string;
  durationMs: number;
  /** Human-readable reason for falling back, if any. */
  fallbackReason?: string;
}

export interface GenerateBrandResult {
  brandResult: BrandResult;
  trustScore: TrustScore;
  websiteConcept: WebsiteConcept;
  marketingPack: MarketingPack;
  falPrompts: FalPromptSet;
  /** Present only when `inputType === "website_url"`. */
  analysis?: WebsiteAnalysis;
  meta: GenerateBrandMeta;
}

export type { UserInput };
