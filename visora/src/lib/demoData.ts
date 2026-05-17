/**
 * VISORA — Demo projects for hackathon / zero-API-key mode.
 *
 * Used by the chat engine, gallery backstop, and project detail pages.
 * Visuals use `/api/placeholder` gradient SVGs — no fal.ai required.
 */

import type { Project, VisualAsset, VisualType } from "@/types/visora";

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

export function demoPlaceholderUrl(
  brand: string,
  visualType: VisualType,
  title: string,
): string {
  const params = new URLSearchParams({
    type: visualType,
    brand,
    title,
  });
  return `/api/placeholder?${params.toString()}`;
}

function demoVisual(
  id: string,
  brand: string,
  visualType: VisualType,
  title: string,
  prompt: string,
): VisualAsset {
  return {
    id,
    visualType,
    title,
    prompt,
    imageUrl: demoPlaceholderUrl(brand, visualType, title),
    status: "generated",
  };
}

export const DEMO_PROJECT_IDS = new Set([
  "demo-urban-brew-ceylon",
  "demo-ecosip-lanka",
  "demo-glownest",
]);

/** Friendly aliases for docs / smoke tests (e.g. `/project/demo-1`). */
const DEMO_ID_ALIASES: Record<string, string> = {
  "demo-1": "demo-urban-brew-ceylon",
};

export function resolveDemoProjectId(id: string): string {
  return DEMO_ID_ALIASES[id] ?? id;
}

export function findDemoProject(id: string): Project | undefined {
  const resolved = resolveDemoProjectId(id);
  return DEMO_PROJECTS.find((p) => p.id === resolved);
}

export function isDemoProjectId(id: string): boolean {
  if (id in DEMO_ID_ALIASES) return true;
  return DEMO_PROJECT_IDS.has(id);
}

/* ─────────────────────────────────────────────────────────────
   Demo 1 — Urban Brew Ceylon
   ───────────────────────────────────────────────────────────── */

export const DEMO_PROJECT_ID = "demo-urban-brew-ceylon";

export const DEMO_URBAN_BREW: Project = {
  id: DEMO_PROJECT_ID,
  createdAt: "2026-05-16T12:00:00.000Z",
  inputType: "idea",
  userInput: {
    startupIdea:
      "Premium small-batch single-origin coffee for young professionals in Colombo who want a morning ritual that looks as considered as their work.",
    websiteUrl: "",
    industry: "specialty coffee",
    targetAudience:
      "Young professionals and creatives in Colombo, 25–40, design-led offices",
    location: "Colombo, Sri Lanka",
    brandStyle: "premium-warm",
    productType: "single-origin coffee beans, packaged",
    visualMood: "warm-cinematic",
    inputType: "idea",
  },
  brandResult: {
    brandName: "Urban Brew Ceylon",
    tagline: "The morning ritual, redrawn.",
    mission:
      "Help Colombo's young professionals start their day with coffee that matches their aesthetic standards — taste, packaging, and ritual included.",
    targetAudience:
      "Young professionals in Colombo who want premium coffee without the café queue.",
    tone: "Confident, warm, and quietly opinionated.",
    usp:
      "Single-origin Ceylon coffee in a launch-ready, design-first brand — bag, story, and brewing ritual included.",
    story:
      "Urban Brew Ceylon started where most coffee brands stop: at the surface. Colombo had great cafés, but no one was packaging that quality for the desk, the studio, the meeting at 9:14.",
    promise: "Considered coffee, delivered like a flagship product.",
    colorPalette: ["#2B1B11", "#5C3A21", "#C9A55B", "#E7DDC6", "#FFF7EC"],
    painPoints: [
      "Premium coffee in Colombo is gatekept inside cafés, not packaged for desks.",
      "Most local brands lean nostalgic — visuals feel dated to design-led buyers.",
      "Imported specialty brands feel disconnected from local roastery culture.",
    ],
  },
  trustScore: {
    overallScore: 78,
    confidence: "High",
    categories: [
      { name: "Brand clarity", score: 88 },
      { name: "Visual identity", score: 82 },
      { name: "Trust signals", score: 70 },
      { name: "Story strength", score: 85 },
      { name: "Audience fit", score: 84 },
      { name: "USP differentiation", score: 79 },
      { name: "Tone consistency", score: 77 },
      { name: "Market readiness", score: 72 },
      { name: "Conversion potential", score: 70 },
      { name: "Cultural relevance", score: 83 },
    ],
    suggestions: [
      "Add founder quotes on the about page.",
      "Surface estate names and roast dates on the product page.",
      "Add a 'where to find us' map for partner cafés.",
    ],
  },
  visuals: [
    demoVisual(
      "demo-ub-product",
      "Urban Brew Ceylon",
      "product_mockup",
      "Product mockup",
      "Editorial photograph of an Urban Brew Ceylon coffee bag on warm linen, brass accent, soft natural light. No on-image text.",
    ),
    demoVisual(
      "demo-ub-hero",
      "Urban Brew Ceylon",
      "hero_image",
      "Hero image",
      "Cinematic hero of a Colombo studio at dusk; hand placing an Urban Brew cup on a designer desk, warm tungsten light.",
    ),
    demoVisual(
      "demo-ub-ig",
      "Urban Brew Ceylon",
      "instagram_ad",
      "Instagram ad",
      "Square Instagram ad, coffee bag hero off-center, generous negative space, warm browns and cream.",
    ),
    demoVisual(
      "demo-ub-lifestyle",
      "Urban Brew Ceylon",
      "lifestyle_scene",
      "Lifestyle scene",
      "Designer in a Colombo studio holding an Urban Brew cup, golden-hour light, warm palette.",
    ),
  ],
  websiteConcept: {
    heroHeadline: "The morning ritual, redrawn.",
    heroSubheadline:
      "Single-origin Ceylon coffee, packaged like the work you do.",
    cta: "Start your subscription",
    sections: [
      {
        title: "Why Urban Brew",
        content:
          "Single-origin coffee from small estates in Sri Lanka's Central Highlands. Roasted in two-day batches.",
      },
      {
        title: "What you get",
        content:
          "A 250 g bag, estate story, roast date, and a brewing-ritual card.",
      },
      {
        title: "Made for Colombo",
        content:
          "Built for creative studios and design-led offices around the city.",
      },
    ],
    faq: [
      {
        q: "Where do the beans come from?",
        a: "Small estates in the Central Highlands, rotated seasonally.",
      },
      {
        q: "Do you deliver outside Colombo?",
        a: "Yes — anywhere in Sri Lanka via courier.",
      },
    ],
    trustSignals: [
      "Roasted weekly in Colombo",
      "Single-origin Ceylon",
      "Subscribe — cancel anytime",
    ],
  },
  marketingPack: {
    instagramCaption:
      "Meet Urban Brew Ceylon.\n\nThe morning ritual, redrawn.\n\nSingle-origin Ceylon coffee for Colombo professionals. Tap to subscribe →",
    tiktokScript:
      'HOOK: "What if your coffee bag looked as good as the work on your desk?"\nBEAT: Bag lands on a wooden desk.\nCTA: "Link in bio."',
    whatsappMessage:
      "Hey! Just spun up Urban Brew Ceylon on VISORA — premium Colombo coffee with brand, visuals, and site concept. Want the link?",
    emailSubject: "Urban Brew Ceylon: your 60-second brand reality",
    adHeadlines: [
      "Coffee that looks as considered as the work.",
      "Roasted in Colombo this week. On your desk by Wednesday.",
      "Single-origin Ceylon, packaged like a flagship product.",
    ],
  },
};

/** @deprecated Use `DEMO_URBAN_BREW` */
export const DEMO_PROJECT = DEMO_URBAN_BREW;

/* ─────────────────────────────────────────────────────────────
   Demo 2 — EcoSip Lanka
   ───────────────────────────────────────────────────────────── */

export const DEMO_ECOSIP: Project = {
  id: "demo-ecosip-lanka",
  createdAt: "2026-04-28T09:15:00.000Z",
  inputType: "website_url",
  userInput: {
    startupIdea:
      "Reusable stainless water bottles for university students in Sri Lanka — eco-friendly, campus-ready, and priced for refills not landfill.",
    websiteUrl: "https://ecosip.lk",
    industry: "sustainable consumer goods",
    targetAudience:
      "University students 18–24 across Colombo and Kandy, eco-conscious, campus social life",
    location: "Sri Lanka",
    brandStyle: "fresh-eco",
    productType: "reusable water bottle",
    visualMood: "bright-natural",
    inputType: "website_url",
  },
  brandResult: {
    brandName: "EcoSip Lanka",
    tagline: "Sip smarter. Waste less.",
    mission:
      "Replace single-use plastic on Sri Lankan campuses with a bottle students actually want to carry — durable, refillable, and visibly eco-forward.",
    targetAudience:
      "University students who care about the planet but won't sacrifice style for a grim eco product.",
    tone: "Optimistic, clear, peer-to-peer — never preachy.",
    usp:
      "Campus refill stations + a bottle designed for backpacks, lectures, and Instagram — not lecture-hall guilt.",
    story:
      "EcoSip started at a Kandy hostel common room: twelve empty plastic bottles on one table. We built a bottle students would sticker, share, and refill — then partnered with cafés for free campus refills.",
    promise: "One bottle. Free refills on campus. Zero lecture about guilt.",
    colorPalette: ["#052E16", "#166534", "#4ADE80", "#BBF7D0", "#F0FDF4"],
    painPoints: [
      "Campus vending still defaults to single-use plastic.",
      "Eco bottles look clinical — students don't carry them.",
      "Refill culture exists but isn't branded or visible.",
    ],
  },
  trustScore: {
    overallScore: 65,
    confidence: "Medium",
    categories: [
      { name: "Brand clarity", score: 72 },
      { name: "Visual identity", score: 68 },
      { name: "Trust signals", score: 58 },
      { name: "Story strength", score: 70 },
      { name: "Audience fit", score: 78 },
      { name: "USP differentiation", score: 62 },
      { name: "Tone consistency", score: 66 },
      { name: "Market readiness", score: 60 },
      { name: "Conversion potential", score: 64 },
      { name: "Cultural relevance", score: 74 },
    ],
    suggestions: [
      "Add campus partner logos above the fold.",
      "Show refill station map with live locations.",
      "Publish impact counter (bottles saved from landfill).",
      "Offer a student ID discount at checkout.",
    ],
  },
  visuals: [
    demoVisual(
      "demo-es-product",
      "EcoSip Lanka",
      "product_mockup",
      "Product mockup",
      "Product photo of a matte green EcoSip bottle on a campus bench, morning light, dew on grass, no text on bottle.",
    ),
    demoVisual(
      "demo-es-hero",
      "EcoSip Lanka",
      "hero_image",
      "Hero image",
      "Wide hero of students walking across a tropical campus with EcoSip bottles, bright natural light, optimistic mood.",
    ),
    demoVisual(
      "demo-es-ig",
      "EcoSip Lanka",
      "instagram_ad",
      "Instagram ad",
      "Square ad: EcoSip bottle with 'refill free on campus' energy, green palette, Gen-Z friendly composition.",
    ),
    demoVisual(
      "demo-es-lifestyle",
      "EcoSip Lanka",
      "lifestyle_scene",
      "Lifestyle scene",
      "Students at an outdoor lecture refill EcoSip bottles at a branded station, candid, sunny.",
    ),
  ],
  websiteConcept: {
    heroHeadline: "Sip smarter. Waste less.",
    heroSubheadline:
      "The reusable bottle built for Sri Lankan campuses — with free refills where you already hang out.",
    cta: "Get your EcoSip",
    sections: [
      {
        title: "One bottle, many refills",
        content:
          "Stainless steel, leak-proof, fits standard backpack pockets. Buy once, refill free at partner cafés.",
      },
      {
        title: "Campus map",
        content:
          "50+ refill stations across Colombo and Kandy universities — updated weekly.",
      },
      {
        title: "Impact you can see",
        content:
          "Every EcoSip ships with a QR to your personal 'plastic saved' counter.",
      },
    ],
    faq: [
      {
        q: "Is it really free to refill?",
        a: "Yes — show your bottle at any partner station on the campus map.",
      },
      {
        q: "What sizes do you offer?",
        a: "500 ml and 750 ml — both fit cup holders and side pockets.",
      },
    ],
    trustSignals: [
      "BPA-free steel",
      "50+ campus refill points",
      "Student discount",
    ],
  },
  marketingPack: {
    instagramCaption:
      "EcoSip Lanka is here.\n\nSip smarter. Waste less.\n\nReusable bottles + free campus refills. Link in bio for student pricing.",
    tiktokScript:
      "HOOK: POV you never buy plastic on campus again.\nSHOW: Refill station + bottle close-up.\nCTA: EcoSip link in bio.",
    whatsappMessage:
      "Bro — check EcoSip Lanka. Reusable bottle + free refills on campus. VISORA built the whole brand in one shot.",
    emailSubject: "EcoSip Lanka — your campus bottle, visualized",
    adHeadlines: [
      "Stop buying plastic between lectures.",
      "Free refills. One bottle. Zero guilt trip.",
      "The campus bottle students actually carry.",
    ],
  },
};

/* ─────────────────────────────────────────────────────────────
   Demo 3 — GlowNest
   ───────────────────────────────────────────────────────────── */

export const DEMO_GLOWNEST: Project = {
  id: "demo-glownest",
  createdAt: "2026-05-02T14:20:00.000Z",
  inputType: "idea",
  userInput: {
    startupIdea:
      "Premium skincare for busy women professionals — minimalist routines, clinical efficacy, luxury packaging that fits a 6am calendar.",
    websiteUrl: "",
    industry: "beauty / skincare",
    targetAudience:
      "Women professionals 28–45, urban, time-poor, willing to pay for efficacy and ritual",
    location: "Colombo & regional capitals",
    brandStyle: "luxury-minimal",
    productType: "skincare serum and moisturizer set",
    visualMood: "soft-luxury",
    inputType: "idea",
  },
  brandResult: {
    brandName: "GlowNest",
    tagline: "Ritual-grade skin in ten minutes.",
    mission:
      "Give busy professionals a two-step skincare system that performs like a clinic and looks like a vanity object — not another shelf of half-used bottles.",
    targetAudience:
      "Busy women professionals who want luxury skincare without a 12-step routine or aesthetic compromise.",
    tone: "Calm, assured, sensual but never fussy.",
    usp:
      "Dermatologist-backed actives in refillable glass — two products, one ritual, under ten minutes.",
    story:
      "GlowNest began when our founder counted eleven products in her gym bag and used three. We lab-tested a serum + cream pair that covers 90% of concerns — then designed packaging you'd leave on the desk, not hide in a drawer.",
    promise: "Ten minutes. Two products. Skin that reads 'rested' on Zoom.",
    colorPalette: ["#1A0F1E", "#4C1D4F", "#E9A8C9", "#F5E6D3", "#FFFBF7"],
    painPoints: [
      "Routine fatigue — too many steps, low adherence.",
      "Luxury skincare often skews generic or overly clinical.",
      "Busy professionals need proof, not poetry, before they switch.",
    ],
  },
  trustScore: {
    overallScore: 82,
    confidence: "High",
    categories: [
      { name: "Brand clarity", score: 90 },
      { name: "Visual identity", score: 88 },
      { name: "Trust signals", score: 76 },
      { name: "Story strength", score: 84 },
      { name: "Audience fit", score: 86 },
      { name: "USP differentiation", score: 80 },
      { name: "Tone consistency", score: 85 },
      { name: "Market readiness", score: 78 },
      { name: "Conversion potential", score: 81 },
      { name: "Cultural relevance", score: 79 },
    ],
    suggestions: [
      "Add dermatologist endorsement strip on PDP.",
      "Publish clinical trial summary (2-week hydration lift).",
      "Offer subscription with refill glass discount.",
    ],
  },
  visuals: [
    demoVisual(
      "demo-gn-product",
      "GlowNest",
      "product_mockup",
      "Product mockup",
      "Luxury product shot of GlowNest serum and cream on marble, soft rose light, glass reflections, no text.",
    ),
    demoVisual(
      "demo-gn-hero",
      "GlowNest",
      "hero_image",
      "Hero image",
      "Hero: professional woman applying GlowNest serum at dawn, soft window light, minimal vanity, rose and cream palette.",
    ),
    demoVisual(
      "demo-gn-ig",
      "GlowNest",
      "instagram_ad",
      "Instagram ad",
      "Square luxury ad: GlowNest duo on silk, negative space, serif-adjacent layout feel, premium skincare.",
    ),
    demoVisual(
      "demo-gn-lifestyle",
      "GlowNest",
      "lifestyle_scene",
      "Lifestyle scene",
      "Busy professional finishing skincare before laptop opens, calm morning, GlowNest on desk.",
    ),
  ],
  websiteConcept: {
    heroHeadline: "Ritual-grade skin in ten minutes.",
    heroSubheadline:
      "Two dermatologist-backed products. One calm morning ritual. Luxury you won't skip.",
    cta: "Shop the duo",
    sections: [
      {
        title: "The two-step system",
        content:
          "Luminous Serum (actives) + Cloud Cream (barrier) — designed to be used together, morning and night.",
      },
      {
        title: "Clinical, not clinical-looking",
        content:
          "2-week hydration study available. Formulated without fragrance overload.",
      },
      {
        title: "Refillable glass",
        content:
          "Buy once, refill forever — 30% off refills on subscription.",
      },
    ],
    faq: [
      {
        q: "Is it suitable for sensitive skin?",
        a: "Yes — patch-tested, fragrance-optional line launching Q3.",
      },
      {
        q: "How long does the ritual take?",
        a: "Under ten minutes — serum, cream, done.",
      },
    ],
    trustSignals: [
      "Dermatologist reviewed",
      "Refillable glass",
      "2-week hydration study",
    ],
  },
  marketingPack: {
    instagramCaption:
      "GlowNest — ritual-grade skin in ten minutes.\n\nTwo products. One calm ritual. Link to shop the duo.",
    tiktokScript:
      "HOOK: My entire skincare routine fits in one hand.\nSHOW: Serum + cream, 10-second application.\nCTA: GlowNest — link in bio.",
    whatsappMessage:
      "You need to see GlowNest — luxury skincare brand VISORA generated in one pass. Serum + cream, full visual set.",
    emailSubject: "GlowNest: ten-minute luxury skincare, visualized",
    adHeadlines: [
      "Ten minutes. Two products. Skin that reads rested.",
      "Luxury skincare without the 12-step guilt.",
      "Ritual-grade skin for busy professionals.",
    ],
  },
  model3d: {
    id: "demo-gn-model",
    modelType: "image_to_3d",
    prompt: "GlowNest serum and cream duo, luxury glass packaging, soft rose light",
    sourceImageUrl: demoPlaceholderUrl(
      "GlowNest",
      "product_mockup",
      "Product mockup",
    ),
    modelUrl:
      "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
    status: "generated",
  },
};

/** Gallery + detail fallback — newest first. */
export const DEMO_PROJECTS: Project[] = [
  DEMO_URBAN_BREW,
  DEMO_GLOWNEST,
  DEMO_ECOSIP,
];

export default DEMO_URBAN_BREW;
