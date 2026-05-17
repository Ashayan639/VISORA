/**
 * Template-based widget updates when OpenAI is unavailable.
 */

import type { BrandResult, Project, TrustScore, WebsiteConcept } from "@/types/visora";

export function isModificationRequest(text: string): boolean {
  return /\b(change|update|modify|make (it|the)|more |less |regenerate|redo|shorter|longer|warmer|cooler|premium|luxury|minimal|teenager|audience|tagline|hero|trust signal|don't like|do not like)\b/i.test(
    text,
  );
}

function shortenTagline(tagline: string): string {
  const trimmed = tagline.replace(/\s*[—–-]\s*.+$/, "").trim();
  if (trimmed.length <= 48) return trimmed;
  const words = trimmed.split(/\s+/);
  let out = "";
  for (const w of words) {
    const next = out ? `${out} ${w}` : w;
    if (next.length > 48) break;
    out = next;
  }
  return out || trimmed.slice(0, 48);
}

export function applyBrandModification(
  brand: BrandResult,
  userText: string,
): BrandResult {
  const lower = userText.toLowerCase();
  const next: BrandResult = { ...brand, colorPalette: [...brand.colorPalette] };

  if (/\b(shorter|short|brief|concise)\b/.test(lower) && /\btagline\b/.test(lower)) {
    next.tagline = shortenTagline(brand.tagline);
  }

  if (/\b(luxury|luxurious|premium|high[\s-]?end|upscale)\b/.test(lower)) {
    next.tone = "Refined, exclusive, and understated";
    next.tagline = `${brand.brandName} — crafted for those who expect more`;
    next.colorPalette = ["#0D0E10", "#1A1A1A", "#C9A962", "#F5F0E8", "#4A4A4A"];
  }

  if (/\b(minimal|minimalist|clean|simple)\b/.test(lower)) {
    next.tone = "Clean, quiet, and intentional";
    next.colorPalette = ["#FFFFFF", "#F4F4F5", "#18181B", "#71717A", "#A1A1AA"];
  }

  if (/\b(teenager|teen|gen z|younger audience|youth)\b/.test(lower)) {
    next.targetAudience = "Teenagers and young adults (13–19) on social-first platforms";
    next.tone = "Bold, authentic, and energetic";
    next.tagline = `${brand.brandName} — built for what's next`;
  }

  if (/\btagline\b/.test(lower) && !/\b(shorter|short)\b/.test(lower)) {
    next.tagline = shortenTagline(brand.tagline);
  }

  return next;
}

export function applyTrustModification(
  trust: TrustScore,
  userText: string,
): TrustScore {
  const lower = userText.toLowerCase();
  if (!/\b(trust|score|improve|boost|raise)\b/.test(lower)) return trust;

  const bump = 6;
  const categories = trust.categories.map((c) => ({
    ...c,
    score: Math.min(98, c.score + bump),
  }));
  const overall = Math.min(
    98,
    Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length),
  );

  return {
    ...trust,
    overallScore: overall,
    categories,
    suggestions: [
      "Add a visible founder or team line on the homepage.",
      "Surface one proof point: review count, metric, or partner logo.",
      "Align hero copy with your strongest trust signal above the fold.",
      ...trust.suggestions.slice(0, 2),
    ],
    confidence: overall >= 80 ? "High" : trust.confidence,
  };
}

export function applyWebsiteModification(
  website: WebsiteConcept,
  userText: string,
): WebsiteConcept {
  const lower = userText.toLowerCase();
  if (!/\b(trust signal|trust signals|credibility|proof)\b/.test(lower)) {
    return website;
  }

  const extra = [
    "Money-back guarantee",
    "Verified customer reviews",
    "Secure checkout badge",
    "As seen in press",
  ].filter((s) => !website.trustSignals.includes(s));

  return {
    ...website,
    trustSignals: [...website.trustSignals, ...extra].slice(0, 8),
  };
}

export function buildVisualPromptPatch(
  project: Partial<Project>,
  userText: string,
): { prompts: { type: string; title: string; prompt: string }[] } | null {
  const lower = userText.toLowerCase();
  const isImage =
    /\b(image|visual|hero|mockup|photo|regenerate|redo|warmer|cooler|darker|lighter)\b/.test(
      lower,
    );
  if (!isImage) return null;

  const name = project.brandResult?.brandName ?? "the brand";
  let visualType = "hero_image";
  if (/\b(product|mockup|packshot)\b/.test(lower)) visualType = "product_mockup";
  else if (/\b(instagram|ig|social)\b/.test(lower)) visualType = "instagram_ad";
  else if (/\b(lifestyle|scene)\b/.test(lower)) visualType = "lifestyle_scene";

  const mood: string[] = [];
  if (/\bwarmer\b/.test(lower)) mood.push("warm golden hour light, inviting tones");
  if (/\bcooler\b/.test(lower)) mood.push("cool blue-hour light, crisp atmosphere");
  if (/\bdarker\b/.test(lower)) mood.push("moody low-key lighting");
  if (/\blighter\b/.test(lower)) mood.push("bright airy high-key lighting");
  if (/\bpremium|luxury\b/.test(lower)) mood.push("luxury editorial aesthetic");
  if (/\bminimal\b/.test(lower)) mood.push("minimal composition, generous negative space");

  const moodText = mood.length ? mood.join(", ") : "premium editorial style";

  const existing = project.visuals?.find((v) => v.visualType === visualType);
  const base =
    existing?.prompt ??
    `Cinematic ${visualType.replace(/_/g, " ")} for ${name}, high-end brand mood`;

  return {
    prompts: [
      {
        type: visualType,
        title: visualType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        prompt: `${base}, ${moodText}, no on-image text`,
      },
    ],
  };
}
