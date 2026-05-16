/**
 * System & user prompt builders for the brand-generation route.
 *
 * Both prompts ask OpenAI to return STRICT JSON matching a documented
 * schema. We use OpenAI's JSON-object response mode for an extra layer
 * of safety on top of the prompt-level discipline.
 */

import type { UserInput } from "@/types/visora";

/* ─────────────────────────────────────────────────────────────
   Shared schema string
   ───────────────────────────────────────────────────────────── */

const SHARED_OUTPUT_SCHEMA = `{
  "brandResult": {
    "brandName": string,
    "tagline": string,
    "mission": string,
    "targetAudience": string,
    "tone": string,
    "usp": string,
    "story": string,
    "promise": string,
    "colorPalette": string[],   // exactly 5 hex codes, e.g. "#020617"
    "painPoints": string[]      // exactly 3 specific customer pain points
  },
  "trustScore": {
    "overallScore": number,     // 0-100
    "categories": [
      { "name": string, "score": number /* 0-100 */ }
    ],                          // exactly 10 categories
    "suggestions": string[],    // exactly 5 actionable items
    "confidence": "Low" | "Medium" | "High"
  },
  "websiteConcept": {
    "heroHeadline": string,
    "heroSubheadline": string,
    "cta": string,
    "sections": [
      { "title": string, "content": string }
    ],                          // exactly 5 sections
    "faq": [
      { "q": string, "a": string }
    ],                          // exactly 3 FAQ items
    "trustSignals": string[]    // 3 to 5 trust signals
  },
  "marketingPack": {
    "instagramCaption": string,
    "tiktokScript": string,
    "whatsappMessage": string,
    "emailSubject": string,
    "adHeadlines": string[]     // exactly 3 ad headlines
  },
  "falPrompts": {
    "product_mockup": string,
    "hero_image": string,
    "instagram_ad": string,
    "lifestyle_scene": string
  }
}`;

const URL_EXTRA_SCHEMA = `,
  "analysis": {
    "brandDnaSummary": string,
    "currentStrengths": string[],          // 3-5 items
    "currentWeaknesses": string[],         // 3-5 items
    "improvementDirection": string,
    "refreshedVisualSuggestions": string[],// 3-5 items
    "campaignOpportunities": string[]      // 3-5 items
  }`;

const SHARED_RULES = `Rules:
- Output JSON only. No markdown, no code fences, no commentary outside the JSON.
- Every string must be SPECIFIC to the user's input — weave the user's idea, audience, industry, location, brand style, and visual mood into the actual content. Never use placeholder values like "Your Brand" or "Lorem ipsum".
- Color palette: 5 cohesive hex codes that match the requested brand style and visual mood.
- falPrompts: each entry is one paragraph suitable for a text-to-image diffusion model (fal.ai). Include subject, composition, lighting, mood, color cues, and the brand name. Never instruct the model to render text, logos, or watermarks on the image.
- Keep arrays to the exact counts listed in the schema.`;

/* ─────────────────────────────────────────────────────────────
   System prompts
   ───────────────────────────────────────────────────────────── */

export const SYSTEM_PROMPT_IDEA = `You are VISORA, an AI brand strategist that turns raw startup ideas into launch-ready brand identities for early-stage founders.

Given the user's idea and brand context, return a single JSON object matching this TypeScript-style schema EXACTLY:

${SHARED_OUTPUT_SCHEMA}

${SHARED_RULES}`;

export const SYSTEM_PROMPT_URL = `You are VISORA, an AI brand auditor and refresher.

The user will provide a website URL plus brand context. You cannot actually fetch the URL — infer the likely brand DNA from the URL itself (domain, path style, hints in the name) and the supplied industry, audience, brand style, and visual mood. Combine that with best-practice brand-audit logic to produce both an audit (analysis) AND a refreshed direction.

Return a single JSON object matching this TypeScript-style schema EXACTLY:

{${URL_EXTRA_SCHEMA.replace(/^,\s*/, "")},
  ${SHARED_OUTPUT_SCHEMA.slice(1, -1).trim()}
}

${SHARED_RULES}
- The "trustScore" should reflect the brand's CURRENT state (before the refresh), so most existing brands score 45-75 with realistic per-category weaknesses.
- The "brandResult", "websiteConcept", "marketingPack", and "falPrompts" describe the REFRESHED direction, not the current state.`;

/* ─────────────────────────────────────────────────────────────
   User prompt builder
   ───────────────────────────────────────────────────────────── */

export function buildUserPrompt(input: UserInput): string {
  const lines = [
    "Context:",
    input.inputType === "website_url"
      ? `- Website URL: ${input.websiteUrl || "(not provided)"}`
      : `- Idea: ${input.startupIdea || "(not provided)"}`,
    `- Industry: ${input.industry || "(unspecified)"}`,
    `- Target audience: ${input.targetAudience || "(unspecified)"}`,
    `- Location: ${input.location || "(unspecified)"}`,
    `- Brand style: ${input.brandStyle || "(unspecified)"}`,
    `- Product type: ${input.productType || "(unspecified)"}`,
    `- Visual mood: ${input.visualMood || "(unspecified)"}`,
    "",
    "Return the JSON object now.",
  ];
  return lines.join("\n");
}

/* ─────────────────────────────────────────────────────────────
   Model + tuning
   ───────────────────────────────────────────────────────────── */

export const OPENAI_MODEL = "gpt-4o-mini";

/** Conservative temperature: enough variety, low hallucination risk. */
export const OPENAI_TEMPERATURE = 0.7;

/** Stop the call after this many ms — we'd rather fall back than hang. */
export const OPENAI_TIMEOUT_MS = 25_000;
