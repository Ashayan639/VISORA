/**
 * Brand-generation orchestrator.
 *
 * Public API: `generateBrand(input)` always returns a fully-formed
 * `GenerateBrandResult`. It tries OpenAI first; on any failure — missing
 * key, network error, malformed JSON, validation miss — it gracefully
 * degrades to the template fallback. The route should never need to
 * try/catch this function for "did it work" semantics; `meta.source`
 * tells the caller which path produced the result.
 */

import OpenAI from "openai";

import type {
  BrandResult,
  MarketingPack,
  TrustConfidence,
  TrustScore,
  TrustScoreCategory,
  UserInput,
  WebsiteConcept,
  WebsiteFAQ,
  WebsiteSection,
} from "@/types/visora";

import { buildFallbackResult } from "./fallback";
import {
  OPENAI_MODEL,
  OPENAI_TEMPERATURE,
  OPENAI_TIMEOUT_MS,
  SYSTEM_PROMPT_IDEA,
  SYSTEM_PROMPT_URL,
  buildUserPrompt,
} from "./prompts";
import type {
  FalPromptSet,
  GenerateBrandResult,
  WebsiteAnalysis,
} from "./types";

/* ─────────────────────────────────────────────────────────────
   OpenAI client (lazy-init, gracefully missing)
   ───────────────────────────────────────────────────────────── */

let _client: OpenAI | null | undefined;

function isUsableKey(key: string | undefined): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 20) return false;
  if (trimmed.toLowerCase().startsWith("your_")) return false;
  if (trimmed.toLowerCase().includes("changeme")) return false;
  return true;
}

function getOpenAIClient(): OpenAI | null {
  if (_client !== undefined) return _client;
  const key = process.env.OPENAI_API_KEY;
  if (!isUsableKey(key)) {
    _client = null;
    return null;
  }
  _client = new OpenAI({
    apiKey: key,
    timeout: OPENAI_TIMEOUT_MS,
    // No retries: we'd rather fall back to the template than spend
    // another full timeout budget on a second attempt.
    maxRetries: 0,
  });
  return _client;
}

/* ─────────────────────────────────────────────────────────────
   Tiny coercers — fail-soft, merge-with-fallback semantics
   ───────────────────────────────────────────────────────────── */

function asObject(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asString(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function asStringArray(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const arr = v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim());
  return arr.length > 0 ? arr : fallback;
}

function asNumber(v: unknown, fallback: number, min = 0, max = 100): number {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function asConfidence(v: unknown, fallback: TrustConfidence): TrustConfidence {
  if (v === "Low" || v === "Medium" || v === "High") return v;
  return fallback;
}

/* ─────────────────────────────────────────────────────────────
   Per-section coercers
   ───────────────────────────────────────────────────────────── */

function coerceBrandResult(raw: unknown, fb: BrandResult): BrandResult {
  const r = asObject(raw);
  if (!r) return fb;
  return {
    brandName: asString(r.brandName, fb.brandName),
    tagline: asString(r.tagline, fb.tagline),
    mission: asString(r.mission, fb.mission),
    targetAudience: asString(r.targetAudience, fb.targetAudience),
    tone: asString(r.tone, fb.tone),
    usp: asString(r.usp, fb.usp),
    story: asString(r.story, fb.story),
    promise: asString(r.promise, fb.promise),
    colorPalette: asStringArray(r.colorPalette, fb.colorPalette),
    painPoints: asStringArray(r.painPoints, fb.painPoints),
  };
}

function coerceTrustScore(raw: unknown, fb: TrustScore): TrustScore {
  const r = asObject(raw);
  if (!r) return fb;

  let categories: TrustScoreCategory[] = fb.categories;
  if (Array.isArray(r.categories)) {
    const filtered: TrustScoreCategory[] = [];
    for (const c of r.categories) {
      const obj = asObject(c);
      if (!obj) continue;
      const name = asString(obj.name, "");
      if (!name) continue;
      filtered.push({ name, score: asNumber(obj.score, 50) });
    }
    if (filtered.length > 0) categories = filtered;
  }

  return {
    overallScore: asNumber(r.overallScore, fb.overallScore),
    categories,
    suggestions: asStringArray(r.suggestions, fb.suggestions),
    confidence: asConfidence(r.confidence, fb.confidence),
  };
}

function coerceWebsiteConcept(raw: unknown, fb: WebsiteConcept): WebsiteConcept {
  const r = asObject(raw);
  if (!r) return fb;

  let sections: WebsiteSection[] = fb.sections;
  if (Array.isArray(r.sections)) {
    const filtered: WebsiteSection[] = [];
    for (const s of r.sections) {
      const obj = asObject(s);
      if (!obj) continue;
      const title = asString(obj.title, "");
      const content = asString(obj.content, "");
      if (title && content) filtered.push({ title, content });
    }
    if (filtered.length > 0) sections = filtered;
  }

  let faq: WebsiteFAQ[] = fb.faq;
  if (Array.isArray(r.faq)) {
    const filtered: WebsiteFAQ[] = [];
    for (const item of r.faq) {
      const obj = asObject(item);
      if (!obj) continue;
      const q = asString(obj.q, "");
      const a = asString(obj.a, "");
      if (q && a) filtered.push({ q, a });
    }
    if (filtered.length > 0) faq = filtered;
  }

  return {
    heroHeadline: asString(r.heroHeadline, fb.heroHeadline),
    heroSubheadline: asString(r.heroSubheadline, fb.heroSubheadline),
    cta: asString(r.cta, fb.cta),
    sections,
    faq,
    trustSignals: asStringArray(r.trustSignals, fb.trustSignals),
  };
}

function coerceMarketingPack(raw: unknown, fb: MarketingPack): MarketingPack {
  const r = asObject(raw);
  if (!r) return fb;
  return {
    instagramCaption: asString(r.instagramCaption, fb.instagramCaption),
    tiktokScript: asString(r.tiktokScript, fb.tiktokScript),
    whatsappMessage: asString(r.whatsappMessage, fb.whatsappMessage),
    emailSubject: asString(r.emailSubject, fb.emailSubject),
    adHeadlines: asStringArray(r.adHeadlines, fb.adHeadlines),
  };
}

function coerceFalPrompts(raw: unknown, fb: FalPromptSet): FalPromptSet {
  const r = asObject(raw);
  if (!r) return fb;
  return {
    product_mockup: asString(r.product_mockup, fb.product_mockup),
    hero_image: asString(r.hero_image, fb.hero_image),
    instagram_ad: asString(r.instagram_ad, fb.instagram_ad),
    lifestyle_scene: asString(r.lifestyle_scene, fb.lifestyle_scene),
  };
}

function coerceAnalysis(raw: unknown, fb: WebsiteAnalysis): WebsiteAnalysis {
  const r = asObject(raw);
  if (!r) return fb;
  return {
    brandDnaSummary: asString(r.brandDnaSummary, fb.brandDnaSummary),
    currentStrengths: asStringArray(r.currentStrengths, fb.currentStrengths),
    currentWeaknesses: asStringArray(r.currentWeaknesses, fb.currentWeaknesses),
    improvementDirection: asString(r.improvementDirection, fb.improvementDirection),
    refreshedVisualSuggestions: asStringArray(
      r.refreshedVisualSuggestions,
      fb.refreshedVisualSuggestions,
    ),
    campaignOpportunities: asStringArray(
      r.campaignOpportunities,
      fb.campaignOpportunities,
    ),
  };
}

/* ─────────────────────────────────────────────────────────────
   Merge OpenAI JSON with the pre-built fallback
   ───────────────────────────────────────────────────────────── */

interface MergeOutcome {
  merged: Omit<GenerateBrandResult, "meta">;
  /** Did at least the brand name or hero image come through from the LLM? */
  usedAny: boolean;
}

function mergeWithFallback(
  parsed: unknown,
  fallback: GenerateBrandResult,
  input: UserInput,
): MergeOutcome {
  const obj = asObject(parsed);
  const fb = fallback;

  const brandResult = coerceBrandResult(obj?.brandResult, fb.brandResult);
  const trustScore = coerceTrustScore(obj?.trustScore, fb.trustScore);
  const websiteConcept = coerceWebsiteConcept(obj?.websiteConcept, fb.websiteConcept);
  const marketingPack = coerceMarketingPack(obj?.marketingPack, fb.marketingPack);
  const falPrompts = coerceFalPrompts(obj?.falPrompts, fb.falPrompts);

  const analysis =
    input.inputType === "website_url"
      ? coerceAnalysis(obj?.analysis, fb.analysis ?? {
          brandDnaSummary: "",
          currentStrengths: [],
          currentWeaknesses: [],
          improvementDirection: "",
          refreshedVisualSuggestions: [],
          campaignOpportunities: [],
        })
      : undefined;

  // Cheap "did the LLM contribute" heuristic: at least one substantive
  // field differs from the pre-built fallback.
  const usedAny =
    brandResult.brandName !== fb.brandResult.brandName ||
    brandResult.tagline !== fb.brandResult.tagline ||
    falPrompts.hero_image !== fb.falPrompts.hero_image;

  return {
    merged: {
      brandResult,
      trustScore,
      websiteConcept,
      marketingPack,
      falPrompts,
      analysis,
    },
    usedAny,
  };
}

/* ─────────────────────────────────────────────────────────────
   Public API
   ───────────────────────────────────────────────────────────── */

export async function generateBrand(
  input: UserInput,
): Promise<GenerateBrandResult> {
  const started = Date.now();
  const fallbackOf = (reason: string): GenerateBrandResult =>
    buildFallbackResult(input, {
      durationMs: Date.now() - started,
      fallbackReason: reason,
    });

  const client = getOpenAIClient();
  if (!client) {
    return fallbackOf("OPENAI_API_KEY missing or placeholder");
  }

  const systemPrompt =
    input.inputType === "website_url" ? SYSTEM_PROMPT_URL : SYSTEM_PROMPT_IDEA;
  const userPrompt = buildUserPrompt(input);

  let raw: string | null = null;
  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      temperature: OPENAI_TEMPERATURE,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fallbackOf(`openai call failed: ${msg}`);
  }

  if (!raw || !raw.trim()) {
    return fallbackOf("openai returned empty content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fallbackOf(`openai response was not valid JSON: ${msg}`);
  }

  // Build the safety-net fallback so coercers can use it.
  const fallback = buildFallbackResult(input, {
    durationMs: Date.now() - started,
  });

  const { merged, usedAny } = mergeWithFallback(parsed, fallback, input);

  if (!usedAny) {
    return fallbackOf(
      "openai output failed validation (no usable fields)",
    );
  }

  return {
    ...merged,
    meta: {
      source: "openai",
      model: OPENAI_MODEL,
      durationMs: Date.now() - started,
    },
  };
}

export type { GenerateBrandResult } from "./types";
