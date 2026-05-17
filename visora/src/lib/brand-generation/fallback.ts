/**
 * Template-based brand generation fallback.
 *
 * Goal: even with zero LLM access, the result MUST still feel specific to
 * the user's input — their idea keywords, audience, location, brand
 * style, and visual mood should all show up in the output.
 *
 * This file is intentionally dependency-free so it can be unit-tested in
 * isolation and so the route can always fall back, no matter what.
 */

import type {
  BrandResult,
  MarketingPack,
  TrustScore,
  UserInput,
  WebsiteConcept,
} from "@/types/visora";

import type {
  FalPromptSet,
  GenerateBrandResult,
  WebsiteAnalysis,
} from "./types";

/* ─────────────────────────────────────────────────────────────
   Small text utilities
   ───────────────────────────────────────────────────────────── */

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "in", "of", "to", "with",
  "is", "on", "at", "by", "my", "our", "that", "this", "be", "it",
  "as", "but", "not", "we", "i", "they", "them", "their", "you",
  "your", "are", "was", "were", "have", "has", "from", "into",
  "about", "like", "want", "wants", "need", "needs",
]);

/** Common product-noun stems we'll happily promote as a brand stem. */
const PRODUCT_NOUNS = new Set([
  "coffee", "tea", "candle", "soap", "skincare", "makeup", "fragrance",
  "perfume", "wine", "spirits", "chocolate", "bakery", "pastry",
  "food", "snack", "juice", "smoothie", "kombucha", "honey",
  "clothing", "fashion", "shoes", "sneakers", "jewelry", "watch",
  "bag", "wallet", "leather", "linen", "ceramic", "pottery",
  "furniture", "lamp", "lighting", "art", "print", "frame",
  "app", "saas", "platform", "tool", "studio", "agency", "store",
  "shop", "marketplace", "service", "consultancy", "academy",
  "school", "course", "book", "podcast", "newsletter",
  "wellness", "fitness", "yoga", "meditation", "supplement",
  "gym", "salon", "spa", "clinic", "kitchen", "restaurant", "cafe",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function keywords(text: string): string[] {
  return tokens(text).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function capitalize(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function titleCase(text: string): string {
  return text.split(/\s+/).filter(Boolean).map(capitalize).join(" ");
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/* ─────────────────────────────────────────────────────────────
   Style → vocabulary maps (kept small but evocative)
   ───────────────────────────────────────────────────────────── */

interface StyleProfile {
  suffix: string;
  adjective: string;
  palette: string[];
  toneWords: string[];
  moodWords: string[];
}

const STYLE_PROFILES: Record<string, StyleProfile> = {
  luxury: {
    suffix: "& Co.",
    adjective: "quietly luxurious",
    palette: ["#0B0B0B", "#1A1A1A", "#C9A55B", "#E7DDC6", "#FFFFFF"],
    toneWords: ["assured", "refined", "deliberate"],
    moodWords: ["editorial", "low-key opulent"],
  },
  premium: {
    suffix: "& Co.",
    adjective: "premium",
    palette: ["#0F1115", "#1F232A", "#C6A45A", "#EDE6D6", "#F8F8F8"],
    toneWords: ["confident", "polished", "considered"],
    moodWords: ["studio-lit", "warm-premium"],
  },
  minimal: {
    suffix: "Studio",
    adjective: "deliberate, minimal",
    palette: ["#FFFFFF", "#F4F4F4", "#0A0A0A", "#1F1F1F", "#5C5C5C"],
    toneWords: ["calm", "exact", "honest"],
    moodWords: ["clean", "negative-space-heavy"],
  },
  modern: {
    suffix: "Labs",
    adjective: "modern, clear-headed",
    palette: ["#0D0E10", "#282728", "#F8FAFA", "#C5C6C8", "#818283"],
    toneWords: ["sharp", "warm", "useful"],
    moodWords: ["editorial-modern", "soft-tech"],
  },
  playful: {
    suffix: "Co.",
    adjective: "playful",
    palette: ["#FF5C8A", "#FFD166", "#06D6A0", "#118AB2", "#073B4C"],
    toneWords: ["friendly", "warm", "a little cheeky"],
    moodWords: ["bright", "candid"],
  },
  earthy: {
    suffix: "& Co.",
    adjective: "earthy",
    palette: ["#2B1B11", "#5C3A21", "#A57A4B", "#D9C2A6", "#F1E6D2"],
    toneWords: ["grounded", "warm", "honest"],
    moodWords: ["natural light", "linen-and-clay"],
  },
  futuristic: {
    suffix: "Labs",
    adjective: "future-forward",
    palette: ["#04060A", "#0A0F1E", "#22D3EE", "#818283", "#E0E7FF"],
    toneWords: ["precise", "ambitious", "kinetic"],
    moodWords: ["neon-dusk", "soft-cyberpunk"],
  },
  warm: {
    suffix: "Co.",
    adjective: "warm",
    palette: ["#3B1F15", "#8C4A2B", "#E8A87C", "#F4E1C1", "#FFF7EC"],
    toneWords: ["welcoming", "intimate", "honest"],
    moodWords: ["golden-hour", "candid"],
  },
  bold: {
    suffix: "Works",
    adjective: "bold",
    palette: ["#0A0A0A", "#FF3D00", "#FFD166", "#06D6A0", "#FFFFFF"],
    toneWords: ["direct", "fearless", "warm-blunt"],
    moodWords: ["high-contrast", "graphic"],
  },
  classic: {
    suffix: "House",
    adjective: "classic",
    palette: ["#0E1A2B", "#1B2A41", "#C9A55B", "#E5E1D0", "#FFFFFF"],
    toneWords: ["measured", "trustworthy", "warm"],
    moodWords: ["timeless", "heritage"],
  },
};

function resolveStyleProfile(style: string): StyleProfile {
  const key = (style || "").toLowerCase().trim();
  if (key && key in STYLE_PROFILES) return STYLE_PROFILES[key]!;

  // Loose match: "premium minimal" → minimal wins, but premium-palette feel.
  for (const k of Object.keys(STYLE_PROFILES)) {
    if (key.includes(k)) return STYLE_PROFILES[k]!;
  }
  return STYLE_PROFILES.modern!;
}

/* ─────────────────────────────────────────────────────────────
   Mood → adjective bank (small overlay on top of style)
   ───────────────────────────────────────────────────────────── */

const MOOD_ADJECTIVES: Record<string, string> = {
  warm: "warm and golden-hour",
  cold: "cool, slate-toned",
  earthy: "earthy and tactile",
  futuristic: "future-forward and kinetic",
  minimal: "spacious and exact",
  cinematic: "cinematic, soft-contrast",
  vibrant: "vibrant and saturated",
  muted: "muted and editorial",
  dreamy: "soft, dreamy, depth-of-field",
};

function moodAdjective(mood: string): string | null {
  const key = (mood || "").toLowerCase().trim();
  if (key && key in MOOD_ADJECTIVES) return MOOD_ADJECTIVES[key]!;
  for (const k of Object.keys(MOOD_ADJECTIVES)) {
    if (key.includes(k)) return MOOD_ADJECTIVES[k]!;
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────
   Brand-name derivation
   ───────────────────────────────────────────────────────────── */

function brandNameFromIdea(input: UserInput, profile: StyleProfile): string {
  // 1) If the idea contains a known product noun, prefer that as the stem.
  const ideaKw = keywords(input.startupIdea);
  const prodKw = keywords(input.productType);
  const candidates = uniq([...ideaKw, ...prodKw]);

  const product = candidates.find((w) => PRODUCT_NOUNS.has(w));
  const locationToken = (input.location || "").trim()
    ? capitalize(tokens(input.location).find((t) => t.length > 2) ?? "")
    : "";

  let stem: string;
  if (product && locationToken) {
    stem = `${locationToken} ${capitalize(product)}`;
  } else if (product) {
    stem = capitalize(product);
  } else if (candidates.length > 0) {
    stem = candidates
      .slice(0, 2)
      .map(capitalize)
      .join(" ");
  } else if (locationToken) {
    stem = locationToken;
  } else {
    stem = "Lumen";
  }

  return `${stem} ${profile.suffix}`.replace(/\s+/g, " ").trim();
}

function splitOnProductNoun(stem: string): string {
  // "acmecandles" → "Acme Candles" when we can find a known product
  // noun embedded in the hostname.
  for (const noun of PRODUCT_NOUNS) {
    if (stem.length <= noun.length) continue;
    const idx = stem.indexOf(noun);
    if (idx > 0) {
      const head = stem.slice(0, idx);
      const tail = stem.slice(idx);
      return `${capitalize(head)} ${capitalize(tail)}`.trim();
    }
  }
  return titleCase(stem);
}

function brandNameFromUrl(input: UserInput, profile: StyleProfile): string {
  const raw = (input.websiteUrl || "").trim();
  if (!raw) return brandNameFromIdea(input, profile);

  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^www\./, "");
    const stem = (host.split(".")[0] ?? "yourbrand").replace(/[-_]+/g, " ");

    const pretty = stem.includes(" ")
      ? titleCase(stem)
      : splitOnProductNoun(stem);

    return `${pretty} ${profile.suffix}`.trim();
  } catch {
    return brandNameFromIdea(input, profile);
  }
}

/* ─────────────────────────────────────────────────────────────
   Brand result
   ───────────────────────────────────────────────────────────── */

function buildBrandResult(input: UserInput): BrandResult {
  const profile = resolveStyleProfile(input.brandStyle);
  const adj = moodAdjective(input.visualMood) ?? profile.adjective;
  const audience = (input.targetAudience || "early-stage founders").trim();
  const location = (input.location || "").trim();
  const productType = (input.productType || "product").trim();
  const industry = (input.industry || "").trim();

  const brandName =
    input.inputType === "website_url"
      ? brandNameFromUrl(input, profile)
      : brandNameFromIdea(input, profile);

  const inProduct = productType.toLowerCase();
  const tagline = location
    ? `${capitalize(adj)} ${inProduct}, made for ${audience} in ${titleCase(location)}.`
    : `${capitalize(adj)} ${inProduct}, made for ${audience}.`;

  const mission = `${brandName} helps ${audience} ${
    industry ? `cut through ${industry.toLowerCase()} noise and ` : ""
  }get a ${adj} ${inProduct} without the usual friction.`;

  const tone = profile.toneWords.join(", ");

  const usp = `Brand brain + ${profile.moodWords[0] ?? "polished"} visuals + 3D mockups + marketing pack — generated, refined, and saved in one session.`;

  const story =
    input.inputType === "website_url"
      ? `${brandName} exists because the brand already works — it just needs visuals that match the ambition behind the product. We rebuild the visual reality around the same promise the founders started with.`
      : `${brandName} starts where most founders get stuck: turning a good idea into something that *looks* finished on day one. We compress a month of branding and visual work into one session — so ${audience} can ship, learn, and iterate.`;

  const promise =
    input.inputType === "website_url"
      ? "Same DNA, sharper visuals, launch-ready in one pass."
      : "Launch-ready in one session.";

  return {
    brandName,
    tagline,
    mission,
    targetAudience: audience,
    tone,
    usp,
    story,
    promise,
    colorPalette: [...profile.palette],
    painPoints: [
      `Generic AI-looking brands that ${audience} can spot in 2 seconds`,
      "Stock-photo visuals that don't match the ambition of the product",
      "Branding, visuals, 3D and marketing scattered across five disconnected tools",
    ],
  };
}

/* ─────────────────────────────────────────────────────────────
   Trust score
   ───────────────────────────────────────────────────────────── */

const TRUST_CATEGORY_NAMES = [
  "Brand clarity",
  "Visual identity",
  "Trust signals",
  "Story strength",
  "Audience fit",
  "USP differentiation",
  "Tone consistency",
  "Market readiness",
  "Conversion potential",
  "Cultural relevance",
];

function buildTrustScore(input: UserInput): TrustScore {
  // URL audits start lower (existing brand has gaps), idea mode starts higher.
  const isUrl = input.inputType === "website_url";
  const base = isUrl ? 58 : 76;

  // Tiny deterministic jitter from the idea text so each call differs.
  const seed = (input.startupIdea || input.websiteUrl || "lumen").length;
  const jitter = (i: number) => ((seed * 7 + i * 13) % 17) - 8; // -8..+8

  const categories = TRUST_CATEGORY_NAMES.map((name, i) => ({
    name,
    score: Math.max(35, Math.min(95, base + jitter(i))),
  }));

  const overallScore = Math.round(
    categories.reduce((s, c) => s + c.score, 0) / categories.length,
  );

  const audience = (input.targetAudience || "your audience").trim();
  const suggestions = isUrl
    ? [
        `Refresh the hero with a clearer promise tailored to ${audience}.`,
        "Add 2–3 customer logos or testimonials above the fold.",
        "Replace stock photography with fal.ai brand-true visuals.",
        "Tighten the tagline to under 8 words.",
        "Add a founder note to humanize the brand.",
      ]
    : [
        `Lead the hero with one sharp promise to ${audience}.`,
        "Add at least one social-proof element on day one.",
        "Commit to a 5-color palette and use it consistently everywhere.",
        "Use fal.ai visuals instead of stock imagery from the first launch.",
        "Write a single founder note that explains why this exists.",
      ];

  return {
    overallScore,
    categories,
    suggestions,
    confidence: isUrl ? "Medium" : "High",
  };
}

/* ─────────────────────────────────────────────────────────────
   Website concept
   ───────────────────────────────────────────────────────────── */

function buildWebsiteConcept(
  input: UserInput,
  brand: BrandResult,
): WebsiteConcept {
  const audience = brand.targetAudience;
  const productType = (input.productType || "product").trim();

  return {
    heroHeadline: brand.tagline,
    heroSubheadline: `${brand.mission} Built for ${audience}.`,
    cta: input.inputType === "website_url" ? "See the refresh" : "Start free",
    sections: [
      {
        title: "Why " + brand.brandName,
        content: brand.usp,
      },
      {
        title: "What you get",
        content: `A complete launch kit: brand brain, ${productType} visuals, a 3D mockup, a website concept, and a marketing pack — all consistent.`,
      },
      {
        title: "Made for " + audience,
        content: `Every output is tuned for ${audience}, not a generic SMB. We use your industry, audience, location, and visual mood directly in the generation pipeline.`,
      },
      {
        title: "Powered by fal.ai",
        content: `Four launch-ready visuals — product mockup, hero image, social ad, and a lifestyle scene — generated on fal.ai in seconds.`,
      },
      {
        title: "Save everything",
        content: "Projects, visuals, and 3D models are saved to your gallery. Iterate without losing the version you liked.",
      },
    ],
    faq: [
      {
        q: `Will the visuals actually match ${brand.brandName}?`,
        a: "Yes — every prompt is conditioned on the brand brain, palette, audience, and visual mood. You can regenerate any visual that misses the mark.",
      },
      {
        q: "What if my idea changes?",
        a: "Start a new session. Sessions are saved, so you can compare and merge directions.",
      },
      {
        q: "Do I own the output?",
        a: "Yes. The brand brain, visuals, 3D model, website concept, and marketing pack are yours to use.",
      },
    ],
    trustSignals: [
      "Powered by fal.ai",
      "OpenAI brand brain",
      "Saved to your gallery",
      "Generated in minutes",
    ],
  };
}

/* ─────────────────────────────────────────────────────────────
   Marketing pack
   ───────────────────────────────────────────────────────────── */

function buildMarketingPack(input: UserInput, brand: BrandResult): MarketingPack {
  const audience = brand.targetAudience;
  const name = brand.brandName;
  const productType = (input.productType || "product").trim().toLowerCase();

  return {
    instagramCaption: `Meet ${name}.\n\n${brand.tagline}\n\nMade for ${audience}. Built for the way you actually ship.\n\nTap the link to start →`,
    tiktokScript: [
      `HOOK (0–2s): "What if your ${productType} looked finished — before you even launched?"`,
      `BEAT 1 (2–6s): Show the messy doc / spreadsheet most founders start with.`,
      `BEAT 2 (6–10s): Cut to ${name}'s hero image + product mockup, side by side.`,
      `BEAT 3 (10–14s): "All of this — brand, visuals, 3D, marketing — in one session."`,
      `CTA (14–16s): "Link in bio."`,
    ].join("\n"),
    whatsappMessage: `Hey! Just spun up ${name} on VISORA — brand, palette, fal.ai visuals, and even a 3D mock. Want me to send the link so you can see?`,
    emailSubject: `${name}: a 60-second look at what we're building for ${audience}`,
    adHeadlines: [
      `${name} — ${productType} that looks like you already raised`,
      `Make every launch feel like a flagship.`,
      `Brand + 3D + marketing for ${audience}, in one session.`,
    ],
  };
}

/* ─────────────────────────────────────────────────────────────
   fal.ai prompts
   ───────────────────────────────────────────────────────────── */

function buildFalPrompts(input: UserInput, brand: BrandResult): FalPromptSet {
  const profile = resolveStyleProfile(input.brandStyle);
  const moodAdj = moodAdjective(input.visualMood) ?? profile.adjective;
  const product = (input.productType || "product").trim().toLowerCase();
  const audience = brand.targetAudience;
  const palette = brand.colorPalette.slice(0, 3).join(", ");
  const location = (input.location || "").trim();
  const place = location ? `, set in ${titleCase(location)}` : "";

  return {
    product_mockup: `${capitalize(moodAdj)} editorial product photograph of a ${product} for ${brand.brandName}, ${profile.moodWords[0] ?? "studio-lit"} composition${place}. Soft directional lighting, shallow depth of field, premium textures (matte paper, brushed metal, linen). Color palette grounded in ${palette}. Centered subject, generous negative space, no humans, no text.`,
    hero_image: `Cinematic wide hero image for ${brand.brandName}'s website. ${capitalize(moodAdj)} scene featuring a ${product} as the focal point${place}, surrounded by environmental cues that evoke ${audience}. Soft golden-hour or studio light, gentle haze, narrative composition with leading lines. Palette: ${palette}. No on-image typography.`,
    instagram_ad: `Square Instagram ad for ${brand.brandName}, ${profile.moodWords[0] ?? "high-contrast"} ${moodAdj} composition. Hero ${product} positioned slightly off-center, bold negative space for caption overlay (rendered by client, not in image). Palette anchored in ${palette}. Crisp, scroll-stopping, premium product photography aesthetic.`,
    lifestyle_scene: `Candid lifestyle scene of ${audience} using a ${product} from ${brand.brandName}${place}. ${capitalize(moodAdj)} mood, natural light, real hands, slight motion blur, depth of field. Background details hint at ${input.industry || "the industry"} without becoming the subject. Palette: ${palette}.`,
  };
}

/* ─────────────────────────────────────────────────────────────
   Website analysis (URL mode only)
   ───────────────────────────────────────────────────────────── */

function buildWebsiteAnalysis(input: UserInput, brand: BrandResult): WebsiteAnalysis {
  const audience = brand.targetAudience;
  const industry = (input.industry || "the category").trim();

  let host = "the site";
  try {
    const u = new URL(
      (input.websiteUrl || "").startsWith("http")
        ? input.websiteUrl
        : `https://${input.websiteUrl}`,
    );
    host = u.hostname.replace(/^www\./, "");
  } catch {
    /* keep default */
  }

  return {
    brandDnaSummary: `${host} reads as a ${brand.tone.split(",")[0]?.trim() ?? "modern"} brand in ${industry}, aimed at ${audience}. The promise is implicit — solid product, but the visuals and story haven't caught up yet.`,
    currentStrengths: [
      "Clear product category — visitors can place the brand within 5 seconds.",
      "Real signal of effort and care in the existing copy.",
      "Working URL with at least basic SEO hygiene.",
    ],
    currentWeaknesses: [
      `Hero doesn't promise anything specific to ${audience}.`,
      "Visuals lean on stock or first-gen AI imagery — not brand-true.",
      "No consistent palette across the hero, social, and product surfaces.",
      "Trust signals are buried below the fold (if present at all).",
    ],
    improvementDirection: `Reposition ${brand.brandName} around one sharp promise to ${audience}, with fal.ai-generated brand-true visuals, a tightened palette, and a marketing pack that reuses the same visual language across every channel.`,
    refreshedVisualSuggestions: [
      "Replace the current hero with a fal.ai cinematic scene that includes the product in context.",
      "Add a 3D product mockup on the pricing or hero section to signal a premium tier.",
      "Use the same 5-color palette across web, social, and email — no exceptions.",
      "Move trust signals (logos, press, testimonials) above the fold.",
    ],
    campaignOpportunities: [
      `An Instagram carousel: "5 things ${audience} actually want from a ${industry} brand".`,
      `A 14-second TikTok showing the refresh: before/after of the hero and product page.`,
      "A founder note email (subject in the marketing pack) timed with the relaunch.",
    ],
  };
}

/* ─────────────────────────────────────────────────────────────
   Public API
   ───────────────────────────────────────────────────────────── */

export function buildFallbackResult(
  input: UserInput,
  meta: {
    durationMs: number;
    fallbackReason?: string;
  },
): GenerateBrandResult {
  const brand = buildBrandResult(input);
  const trustScore = buildTrustScore(input);
  const websiteConcept = buildWebsiteConcept(input, brand);
  const marketingPack = buildMarketingPack(input, brand);
  const falPrompts = buildFalPrompts(input, brand);

  return {
    brandResult: brand,
    trustScore,
    websiteConcept,
    marketingPack,
    falPrompts,
    analysis:
      input.inputType === "website_url"
        ? buildWebsiteAnalysis(input, brand)
        : undefined,
    meta: {
      source: "fallback",
      durationMs: meta.durationMs,
      fallbackReason: meta.fallbackReason,
    },
  };
}
