/**
 * Template-based chat fallback when OpenAI is unavailable.
 */

import type { Project } from "@/types/visora";
import {
  applyBrandModification,
  applyTrustModification,
  applyWebsiteModification,
  buildVisualPromptPatch,
  isModificationRequest,
} from "@/lib/chat/modification-fallback";
import type { ChatApiMessage } from "./types";

const STOP = new Set([
  "the", "a", "an", "and", "or", "for", "in", "of", "to", "with", "is", "on",
  "at", "by", "my", "our", "that", "this", "be", "it", "i", "you", "your",
  "want", "need", "help", "create", "build", "make", "brand", "business",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : null;
}

function inferBrandName(idea: string, location: string): string {
  const kw = tokens(idea);
  const stem = kw.find((w) => w.length > 3) ?? "venture";
  const loc = location ? titleCase(tokens(location)[0] ?? location) : "";
  return loc ? `${titleCase(stem)} ${loc}` : titleCase(stem);
}

function buildBrandWidgets(idea: string, url: string | null) {
  const kw = tokens(idea);
  const industry = kw.slice(0, 2).join(" ") || "consumer";
  const location =
    idea.match(/\b(?:in|at|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)?.[1] ?? "";
  const brandName = inferBrandName(idea, location);
  const audience = `Professionals and early adopters interested in ${industry}`;

  const brand = {
    brandName,
    tagline: `${brandName} — clarity you can ship.`,
    mission: `Help customers experience ${industry} with a brand that feels launch-ready from day one.`,
    targetAudience: audience,
    tone: "Confident, warm, and precise",
    usp: `A focused ${industry} offer with premium positioning and fast time-to-market.`,
    story: url
      ? `We studied ${url} and distilled what works — then sharpened the story for a cleaner market read.`
      : `Born from the idea: "${idea.slice(0, 120)}${idea.length > 120 ? "…" : ""}"`,
    promise: "Look credible before you launch.",
    colorPalette: ["#0D0E10", "#282728", "#F8FAFA", "#C5C6C8", "#818283"],
    painPoints: [
      "Brand story feels vague before visuals exist",
      "Hard to test positioning without a cohesive kit",
    ],
  };

  const trust = {
    overallScore: 68,
    categories: [
      { name: "Brand clarity", score: 72 },
      { name: "Visual identity", score: 64 },
      { name: "Trust signals", score: 60 },
      { name: "Audience fit", score: 70 },
    ],
    suggestions: [
      "Add a founder line on the about section",
      "Show one proof point (review, metric, or partner logo)",
    ],
    confidence: "Medium" as const,
  };

  return { brand, trust };
}

function wantsVisuals(text: string): boolean {
  return /\b(yes|visual|image|mockup|generate|create|go ahead|sure|please)\b/i.test(
    text,
  );
}

function wantsWebsiteOrMarketing(text: string): boolean {
  return /\b(website|marketing|pack|instagram|email|ads)\b/i.test(text);
}

export function generateFallbackChatResponse(
  messages: ChatApiMessage[],
  currentProject: Partial<Project> | undefined,
): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content?.trim() ?? "";
  const turnCount = messages.filter((m) => m.role === "user").length;
  const url = extractUrl(userText);
  const hasBrand = Boolean(currentProject?.brandResult?.brandName);

  if (turnCount <= 1 && !hasBrand) {
    if (url) {
      return `Great — I'll treat **${url}** as your brand DNA starting point.

Before I generate the full kit, what's the single outcome you want visitors to feel in the first 5 seconds — trust, excitement, or premium calm?

Once you answer, I'll produce your brand card and trust score.`;
    }
    return `Love the direction. To shape a credible brand reality, tell me:

1. Who is the core customer (one sentence)?
2. What makes you different from alternatives nearby?

Share those and I'll generate your **brand identity** and **trust score** in the next step.`;
  }

  if (!hasBrand && (turnCount >= 2 || userText.length > 80)) {
    const idea = userText || "your startup idea";
    const { brand, trust } = buildBrandWidgets(idea, url);

    return `I've got enough to draft your first brand reality. Here's the strategic core — review it and tell me what to sharpen.

[WIDGET:BRAND_CARD]
${JSON.stringify(brand)}
[/WIDGET]

[WIDGET:TRUST_SCORE]
${JSON.stringify(trust)}
[/WIDGET]

Want me to create **four fal.ai visuals** (product mockup, hero, Instagram ad, lifestyle scene) for ${brand.brandName}?`;
  }

  if (hasBrand && wantsVisuals(userText) && !currentProject?.visuals?.length) {
    const name = currentProject!.brandResult!.brandName;
    const prompts = {
      prompts: [
        {
          type: "product_mockup",
          title: "Product Mockup",
          prompt: `Editorial product photograph for ${name}, premium packaging, soft studio light, no on-image text, monochrome luxury aesthetic`,
        },
        {
          type: "hero_image",
          title: "Hero Image",
          prompt: `Cinematic hero banner for ${name}, aspirational lifestyle, shallow depth of field, high-end SaaS brand mood`,
        },
        {
          type: "instagram_ad",
          title: "Instagram Ad",
          prompt: `Square Instagram ad for ${name}, bold product focus, negative space for headline, modern minimal design`,
        },
        {
          type: "lifestyle_scene",
          title: "Lifestyle Scene",
          prompt: `Lifestyle scene featuring ${name} in real-world use, natural light, authentic moment, premium editorial style`,
        },
      ],
    };

    return `Perfect — here are production-ready prompts for fal.ai. I'll use these to generate your visual set next.

[WIDGET:VISUAL_PROMPTS]
${JSON.stringify(prompts)}
[/WIDGET]

Say **"generate visuals"** and I'll run them, or ask for tweaks to any prompt first.`;
  }

  if (hasBrand && isModificationRequest(userText)) {
    const brand = currentProject!.brandResult!;

    if (/\b(website|trust signal|trust signals)\b/i.test(userText) && currentProject?.websiteConcept) {
      const website = applyWebsiteModification(currentProject.websiteConcept, userText);
      return `I've updated your website concept — here's what changed:

**Trust signals** — added credibility markers visitors expect before they buy.

[WIDGET:WEBSITE_PREVIEW]
${JSON.stringify(website)}
[/WIDGET]

Want more changes to copy, sections, or the hero?`;
    }

    const visualPatch = buildVisualPromptPatch(currentProject!, userText);
    if (visualPatch) {
      return `Got it — I've refreshed the image prompt to match your feedback. Regenerating that visual now.

[WIDGET:VISUAL_PROMPTS]
${JSON.stringify(visualPatch)}
[/WIDGET]`;
    }

    if (/\b(trust|score)\b/i.test(userText) && currentProject?.trustScore) {
      const trust = applyTrustModification(currentProject.trustScore, userText);
      return `Here are ways to strengthen trust, plus an updated score reflecting those improvements:

[WIDGET:TRUST_SCORE]
${JSON.stringify(trust)}
[/WIDGET]

Tell me which suggestion you want to implement first.`;
    }

    const updated = applyBrandModification(brand, userText);
    const changed: string[] = [];
    if (updated.tagline !== brand.tagline) changed.push("tagline");
    if (updated.tone !== brand.tone) changed.push("tone");
    if (updated.targetAudience !== brand.targetAudience) changed.push("target audience");
    if (JSON.stringify(updated.colorPalette) !== JSON.stringify(brand.colorPalette)) {
      changed.push("colors");
    }
    const summary =
      changed.length > 0 ? changed.join(", ") : "brand positioning";

    return `Done — I updated the **${summary}** while keeping everything else intact.

[WIDGET:BRAND_CARD]
${JSON.stringify(updated)}
[/WIDGET]

What should we refine next?`;
  }

  if (hasBrand && wantsWebsiteOrMarketing(userText)) {
    const name = currentProject!.brandResult!.brandName;
    const website = {
      heroHeadline: `${name} — built to look launch-ready`,
      heroSubheadline:
        "Turn your positioning into a site visitors trust in seconds.",
      cta: "Start free",
      sections: [
        {
          title: "Why it matters",
          content: "Clarity, proof, and visuals aligned to one story.",
        },
        {
          title: "How it works",
          content: "Idea → brand → visuals → 3D → marketing pack.",
        },
      ],
      faq: [
        { q: "Do I need an API key?", a: "Demo mode works without keys." },
        { q: "Can I iterate?", a: "Yes — ask to refine any widget." },
      ],
      trustSignals: ["Brand audit", "Trust score", "Launch-ready assets"],
    };
    const marketing = {
      instagramCaption: `${name} is live. Premium brand kit generated in one session. Link in bio.`,
      tiktokScript: `Hook: We turned an idea into a full brand in minutes. Show: mockups + trust score. CTA: Try VISORA.`,
      whatsappMessage: `Check out ${name} — full brand reality from VISORA.`,
      emailSubject: `Introducing ${name}`,
      adHeadlines: [
        `Meet ${name}`,
        "Launch-ready brand visuals",
        "From idea to reality",
      ],
    };

    return `Here's your website concept and marketing pack for **${name}**:

[WIDGET:WEBSITE_PREVIEW]
${JSON.stringify(website)}
[/WIDGET]

[WIDGET:MARKETING_PACK]
${JSON.stringify(marketing)}
[/WIDGET]

What should we refine next — copy, visuals, or trust score?`;
  }

  return `I'm here to help you build a credible brand reality.

You can:
- Share a startup idea or paste a website URL
- Ask me to **generate visuals** once your brand card exists
- Request changes like "make the tone more premium" or "improve trust score"

What would you like to tackle next?`;
}
