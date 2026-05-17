/**
 * VISORA — Demo data.
 *
 * THREE full hackathon-quality demo brands the app can fall back on
 * when no Supabase / fal.ai / OpenAI keys are configured:
 *
 *   1. Urban Brew Ceylon — premium specialty coffee in Colombo
 *      (trust 78, no 3D yet — clicking "Generate 3D" still triggers
 *      a live trellis call when fal.ai is configured)
 *   2. EcoSip Lanka      — refillable water bottles for Sri Lankan
 *      university campuses (trust 65)
 *   3. GlowNest          — premium 4-minute morning skincare for
 *      busy women professionals (trust 82)
 *
 * Every demo's visuals point at the `/api/placeholder` SVG generator,
 * so the gallery, project page, and chat demo flow render fully even
 * with zero API keys. The URLs encode the brand name, the visual type,
 * and the project's palette so each card looks distinctly on-brand.
 *
 * `model3d` is intentionally omitted on every demo — clicking
 * "Generate 3D model" in the demo project page triggers a real
 * /api/generate-3d call so judges can see the live trellis pipeline
 * the moment FAL_KEY is added.
 */

import type { Project, VisualType } from "@/types/visora";

/* ─────────────────────────────────────────────────────────────
   Placeholder URL helper
   ───────────────────────────────────────────────────────────── */

/**
 * Build a `/api/placeholder?...` URL. The route renders a deterministic
 * SVG with a palette-driven gradient + the brand name overlaid in large
 * type — perfect for offline / zero-key demos.
 *
 * Returns a *relative* URL so it works on any host (localhost,
 * Vercel preview, custom domain) without configuration.
 */
function ph(
  type: VisualType,
  brand: string,
  title: string,
  palette: string[],
): string {
  const params = new URLSearchParams({
    type,
    brand,
    title,
    palette: palette.join(","),
  });
  return `/api/placeholder?${params.toString()}`;
}

/* ─────────────────────────────────────────────────────────────
   Demo 1 — Urban Brew Ceylon (premium specialty coffee, Colombo)
   ───────────────────────────────────────────────────────────── */

export const DEMO_PROJECT_ID = "demo-urban-brew-ceylon";
export const DEMO_ECOSIP_ID = "demo-ecosip-lanka";
export const DEMO_GLOWNEST_ID = "demo-glownest";

/**
 * Hackathon-friendly alias → canonical demo id.
 *
 * Lets short URLs like `/project/demo-1` resolve to the long canonical
 * slug (`demo-urban-brew-ceylon`) so judges and shared links don't need
 * to know the marketing name. Aliases are case-insensitive.
 */
const DEMO_ID_ALIASES: Readonly<Record<string, string>> = {
  "demo-1": DEMO_PROJECT_ID,
  "demo-2": DEMO_ECOSIP_ID,
  "demo-3": DEMO_GLOWNEST_ID,
  "demo-urban-brew": DEMO_PROJECT_ID,
  "demo-ecosip": DEMO_ECOSIP_ID,
};

/**
 * Normalises a `[id]` route param into a canonical project id:
 *   - URL-decodes percent-escapes
 *   - trims whitespace
 *   - swaps known short aliases (demo-1 / demo-2 / demo-3 / ...) for
 *     their canonical demo id
 *
 * Always returns a string (possibly empty) so callers can pass the
 * result straight into a Supabase / localStorage lookup.
 */
export function resolveProjectIdParam(rawId: string): string {
  const id = decodeURIComponent(rawId).trim();
  if (!id) return "";
  const alias = DEMO_ID_ALIASES[id.toLowerCase()];
  return alias ?? id;
}

const URBAN_BREW_PALETTE = [
  "#2B1B11",
  "#5C3A21",
  "#C9A55B",
  "#E7DDC6",
  "#FFF7EC",
];

export const DEMO_PROJECT: Project = {
  id: DEMO_PROJECT_ID,
  createdAt: "2026-05-16T12:00:00.000Z",
  inputType: "idea",

  userInput: {
    startupIdea:
      "Premium small-batch single-origin coffee for design-led office workers in Colombo who care about how their morning ritual looks and tastes.",
    websiteUrl: "",
    industry: "specialty coffee",
    targetAudience:
      "design-led office workers and creatives in Colombo, 25–40, mid-to-senior creative roles",
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
      "Help design-led founders and creatives in Colombo start their day with a coffee that looks as considered as the work they do.",
    targetAudience:
      "Design-led office workers and creatives in Colombo who want a coffee that matches their aesthetic standards.",
    tone: "Confident, warm, and quietly opinionated.",
    usp: "Single-origin Ceylon coffee in a launch-ready, design-first brand — bag, story, and brewing ritual included.",
    story:
      "Urban Brew Ceylon started where most coffee brands stop: at the surface. Colombo had great cafés, but no one was packaging that quality for the desk, the studio, the meeting at 9:14. We work with small estates in the Central Highlands, roast in two-day batches, and design every touchpoint as deliberately as the cup itself.",
    promise: "Considered coffee, delivered like a flagship product.",
    colorPalette: URBAN_BREW_PALETTE,
    painPoints: [
      "Existing premium coffee in Colombo is gatekept inside cafés, not packaged.",
      "Most local coffee brands lean nostalgic — visuals feel dated to design-led buyers.",
      "Imported specialty brands taste great but feel disconnected from local roastery culture.",
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
      "Add 2–3 founder quotes on the about page to humanise the brand.",
      "Surface estate names + roast date on the product page.",
      "Add a 'where to find us' map of cafés stocking Urban Brew.",
      "Tighten the hero to a single 6-word promise.",
      "Add a press / featured-in strip above the fold.",
    ],
  },

  visuals: [
    {
      id: "demo-urban-brew-v-product",
      visualType: "product_mockup",
      title: "Product mockup",
      prompt:
        "Editorial photograph of an Urban Brew Ceylon coffee bag on warm linen, brass accent, soft natural light, palette of warm browns and matte gold. No on-image text or logos.",
      imageUrl: ph(
        "product_mockup",
        "Urban Brew Ceylon",
        "Product mockup",
        URBAN_BREW_PALETTE,
      ),
      status: "generated",
    },
    {
      id: "demo-urban-brew-v-hero",
      visualType: "hero_image",
      title: "Hero image",
      prompt:
        "Cinematic hero image of a Colombo studio interior at dusk; a hand placing an Urban Brew Ceylon cup on a designer's desk, warm tungsten light, depth of field. No on-image text.",
      imageUrl: ph(
        "hero_image",
        "Urban Brew Ceylon",
        "Hero · The morning ritual, redrawn.",
        URBAN_BREW_PALETTE,
      ),
      status: "generated",
    },
    {
      id: "demo-urban-brew-v-ig",
      visualType: "instagram_ad",
      title: "Instagram ad",
      prompt:
        "Square Instagram ad for Urban Brew Ceylon, coffee bag hero off-center, generous negative space, palette of warm browns and cream, premium product photography.",
      imageUrl: ph(
        "instagram_ad",
        "Urban Brew Ceylon",
        "Subscribe to your ritual",
        URBAN_BREW_PALETTE,
      ),
      status: "generated",
    },
    {
      id: "demo-urban-brew-v-lifestyle",
      visualType: "lifestyle_scene",
      title: "Lifestyle scene",
      prompt:
        "Candid lifestyle scene of a designer in a Colombo studio holding an Urban Brew Ceylon cup, golden-hour light, real hands, depth of field, warm palette.",
      imageUrl: ph(
        "lifestyle_scene",
        "Urban Brew Ceylon",
        "On the desk, at 9:14",
        URBAN_BREW_PALETTE,
      ),
      status: "generated",
    },
  ],

  // model3d intentionally undefined.

  websiteConcept: {
    heroHeadline: "The morning ritual, redrawn.",
    heroSubheadline:
      "Single-origin Ceylon coffee, packaged like the work you do.",
    cta: "Start your subscription",
    sections: [
      {
        title: "Why Urban Brew",
        content:
          "Single-origin coffee from small estates in Sri Lanka's Central Highlands. Roasted in two-day batches. Packaged to live on a designer's desk.",
      },
      {
        title: "What you get",
        content:
          "A 250 g bag of single-origin beans, plus the story behind the estate, the roast date, and a brewing-ritual card.",
      },
      {
        title: "Made for Colombo",
        content:
          "Most of our subscribers are seeing the cup three times a day. We treat the bag as design, not just packaging — built for creative studios and design-led offices around the city.",
      },
      {
        title: "From estate to desk",
        content:
          "From the highland farm to your office desk in less than 14 days. Roast date printed on every bag.",
      },
      {
        title: "Save your ritual",
        content:
          "Subscribe and get a fresh bag every two weeks, with seasonal estate rotations.",
      },
    ],
    faq: [
      {
        q: "Where do the beans come from?",
        a: "Small estates in Sri Lanka's Central Highlands, primarily around Nuwara Eliya. We rotate estates seasonally based on harvest.",
      },
      {
        q: "How do I brew it?",
        a: "Each bag includes a ritual card for V60, AeroPress, and French Press, plus a QR code to a 60-second video.",
      },
      {
        q: "Do you deliver outside Colombo?",
        a: "Yes — anywhere in Sri Lanka via courier, and internationally on request.",
      },
    ],
    trustSignals: [
      "Roasted weekly in Colombo",
      "Single-origin Ceylon",
      "Subscribe — cancel anytime",
      "Designed in-house",
    ],
  },

  marketingPack: {
    instagramCaption:
      "Meet Urban Brew Ceylon.\n\nThe morning ritual, redrawn.\n\nSingle-origin Ceylon coffee, packaged like the work you do. Made for design-led desks in Colombo.\n\nTap the link to start your subscription →",
    tiktokScript: [
      'HOOK (0–2s): "What if your coffee bag looked as good as the work on your desk?"',
      "BEAT 1 (2–6s): Show a beige design studio at golden hour.",
      "BEAT 2 (6–10s): Cut to an Urban Brew Ceylon bag landing on a wooden desk.",
      'BEAT 3 (10–14s): "Single-origin Ceylon. Roasted weekly. Packaged for the way you work."',
      'CTA (14–16s): "Link in bio."',
    ].join("\n"),
    whatsappMessage:
      "Hey! Just spun up Urban Brew Ceylon on VISORA — single-origin Ceylon coffee for Colombo offices. Brand, palette, visuals, website concept — all done. Want me to send the link?",
    emailSubject: "Urban Brew Ceylon: a 60-second look at what we're shipping",
    adHeadlines: [
      "Urban Brew Ceylon — coffee that looks as considered as the work.",
      "Roasted in Colombo this week. On your desk by Wednesday.",
      "Single-origin Ceylon coffee, packaged like a flagship product.",
    ],
  },
};

/* ─────────────────────────────────────────────────────────────
   Demo 2 — EcoSip Lanka (refillable bottles for SL universities)
   ───────────────────────────────────────────────────────────── */

const ECOSIP_PALETTE = [
  "#0F1F1A",
  "#1F3A2E",
  "#3FA66D",
  "#BFE2C9",
  "#F2F0E6",
];

export const DEMO_ECOSIP: Project = {
  id: "demo-ecosip-lanka",
  createdAt: "2026-04-03T09:30:00.000Z",
  inputType: "idea",

  userInput: {
    startupIdea:
      "A refillable stainless-steel water bottle for Sri Lankan university students, paired with a free refill network across campus cafeterias to make ditching single-use plastic effortless.",
    websiteUrl: "",
    industry: "consumer goods / sustainability",
    targetAudience:
      "Undergraduates aged 18–25 across Sri Lankan universities (Colombo, Peradeniya, Moratuwa, Jaffna).",
    location: "Sri Lanka — campus-led",
    brandStyle: "eco-friendly modern",
    productType: "reusable stainless-steel water bottle + refill network",
    visualMood: "fresh-leafy",
    inputType: "idea",
  },

  brandResult: {
    brandName: "EcoSip Lanka",
    tagline: "Sip the change.",
    mission:
      "Make refilling so easy on Sri Lankan campuses that single-use plastic stops feeling like the default.",
    targetAudience:
      "Sri Lankan undergraduates who want to do the right thing without the eco lecture or the price tag.",
    tone: "Cheerful, optimistic, peer-to-peer — gentle activism, not guilt.",
    usp: "A lifetime bottle plus 60+ free refill stations across 12 partner campuses — replenishment, not just a purchase.",
    story:
      "EcoSip Lanka started in a Moratuwa engineering lecture: two students realised the campus bin was 80% PET. Instead of preaching, they shipped a bottle that pairs with a free refill network — a stainless-steel staple that pays for itself in three weeks of cafeteria coffee.",
    promise: "One bottle, free refills, zero plastic.",
    colorPalette: ECOSIP_PALETTE,
    painPoints: [
      "Reusable bottles feel expensive when you're a student on Rs.500/day.",
      "Refilling from a tap feels uncertain — students worry about water quality.",
      "Eco brands often talk down to young buyers instead of meeting them where they are.",
    ],
  },

  trustScore: {
    overallScore: 65,
    confidence: "Medium",
    categories: [
      { name: "Brand clarity", score: 78 },
      { name: "Visual identity", score: 70 },
      { name: "Trust signals", score: 60 },
      { name: "Story strength", score: 72 },
      { name: "Audience fit", score: 80 },
      { name: "USP differentiation", score: 68 },
      { name: "Tone consistency", score: 64 },
      { name: "Market readiness", score: 55 },
      { name: "Conversion potential", score: 60 },
      { name: "Cultural relevance", score: 75 },
    ],
    suggestions: [
      "Publish a map of refill stations on the homepage — turn the network into the proof.",
      "Add a 'water-tested weekly' badge with the lab partner's logo.",
      "Show 3 student founders' faces in the about section to build trust.",
      "Pin a TikTok testimonial reel above the fold (students trust students).",
      "Spell out the lifetime guarantee and the return-for-recycle promise.",
    ],
  },

  visuals: [
    {
      id: "demo-ecosip-v-product",
      visualType: "product_mockup",
      title: "Product mockup",
      prompt:
        "Editorial product shot of an EcoSip Lanka stainless-steel bottle in deep forest green with a brushed-steel cap, sitting on a textbook on a sunny university bench, soft natural light. No on-image text.",
      imageUrl: ph(
        "product_mockup",
        "EcoSip Lanka",
        "Product mockup",
        ECOSIP_PALETTE,
      ),
      status: "generated",
    },
    {
      id: "demo-ecosip-v-hero",
      visualType: "hero_image",
      title: "Hero image",
      prompt:
        "Wide hero image of a refill station outside a Sri Lankan university cafeteria, two students chatting while filling EcoSip bottles, golden afternoon light, palette of forest greens and warm sand. No on-image text.",
      imageUrl: ph(
        "hero_image",
        "EcoSip Lanka",
        "Hero · Sip the change.",
        ECOSIP_PALETTE,
      ),
      status: "generated",
    },
    {
      id: "demo-ecosip-v-ig",
      visualType: "instagram_ad",
      title: "Instagram ad",
      prompt:
        "Square Instagram ad: EcoSip bottle centred on a leafy background, generous negative space, lower-third reads 'lifetime refills · 12 campuses'. Bright, peer-to-peer feel.",
      imageUrl: ph(
        "instagram_ad",
        "EcoSip Lanka",
        "Lifetime refills · 12 campuses",
        ECOSIP_PALETTE,
      ),
      status: "generated",
    },
    {
      id: "demo-ecosip-v-lifestyle",
      visualType: "lifestyle_scene",
      title: "Lifestyle scene",
      prompt:
        "Candid lifestyle scene of a university student walking between lecture halls with an EcoSip bottle clipped to their backpack, late-afternoon shadows, palette of greens and sand.",
      imageUrl: ph(
        "lifestyle_scene",
        "EcoSip Lanka",
        "Between lectures",
        ECOSIP_PALETTE,
      ),
      status: "generated",
    },
  ],

  websiteConcept: {
    heroHeadline: "Sip the change.",
    heroSubheadline:
      "One refillable bottle. Free refills at 60+ campus stations. Zero plastic guilt.",
    cta: "Find your campus",
    sections: [
      {
        title: "How it works",
        content:
          "Buy the bottle once. Refill it free at any partner station — cafeterias, libraries, sports complexes — across 12 partner universities.",
      },
      {
        title: "Water you can trust",
        content:
          "Every refill station is filtered and tested weekly by an independent lab. The badge on the tap says when.",
      },
      {
        title: "Built to last (then recycled)",
        content:
          "Food-grade stainless steel with a lifetime guarantee. When it's done, send it back and we'll recycle it for free.",
      },
      {
        title: "Refill map",
        content:
          "60+ stations across Colombo, Peradeniya, Moratuwa, Kelaniya, Sri Jayewardenepura, Ruhuna, Jaffna and 5 more — visible on the homepage map.",
      },
      {
        title: "Campus partners wanted",
        content:
          "Run a society, hostel, or campus café? Apply to host an EcoSip station — free install, free maintenance, zero cost to the campus.",
      },
    ],
    faq: [
      {
        q: "How much does the bottle cost?",
        a: "Rs.1,890 for the 750 ml bottle with lifetime refills. About three weeks of cafeteria coffee.",
      },
      {
        q: "What if I lose my bottle?",
        a: "Bring the cap (it has your code) and we'll replace the body at half price, no questions asked.",
      },
      {
        q: "Is the water actually safe?",
        a: "Every station is filtered to WHO drinking-water standards and tested weekly. Reports are public on the site.",
      },
    ],
    trustSignals: [
      "Lifetime guarantee",
      "Weekly water testing",
      "12 campus partners",
      "60+ refill stations",
    ],
  },

  marketingPack: {
    instagramCaption:
      "Meet EcoSip Lanka.\n\nSip the change.\n\nOne refillable bottle, free refills at 60+ campus stations, lifetime guarantee. Built by students, for students — no plastic, no lecture.\n\nFind your campus refill station →",
    tiktokScript: [
      'HOOK (0–2s): "POV: your campus bin is 80% plastic bottles."',
      "BEAT 1 (2–6s): Quick cuts of overflowing campus bins.",
      "BEAT 2 (6–10s): Cut to a student clipping an EcoSip bottle onto a backpack.",
      "BEAT 3 (10–14s): Refill station tap fills the bottle — overlay '60+ stations, 12 unis'.",
      'CTA (14–16s): "Lifetime refills. Link in bio."',
    ].join("\n"),
    whatsappMessage:
      "Hey! Just spun up EcoSip Lanka on VISORA — refillable bottle + free campus refill network for SL universities. Brand, palette, website, marketing — done. Want the link?",
    emailSubject: "EcoSip Lanka: the bottle that pays for itself in 3 weeks",
    adHeadlines: [
      "EcoSip Lanka — one bottle, free refills, zero plastic.",
      "Built by students, for students.",
      "60+ refill stations. 12 campuses. Lifetime bottle.",
    ],
  },
};

/* ─────────────────────────────────────────────────────────────
   Demo 3 — GlowNest (premium 4-minute skincare)
   ───────────────────────────────────────────────────────────── */

const GLOWNEST_PALETTE = [
  "#1A0F12",
  "#3A1F25",
  "#E4A2A8",
  "#F4D5C5",
  "#FFF1E8",
];

export const DEMO_GLOWNEST: Project = {
  id: "demo-glownest",
  createdAt: "2026-03-12T17:15:00.000Z",
  inputType: "idea",

  userInput: {
    startupIdea:
      "A premium morning skincare line for busy women professionals — a four-step routine that takes four minutes, designed with a Korean dermatologist, packaged like a luxury fragrance.",
    websiteUrl: "",
    industry: "premium skincare",
    targetAudience:
      "Women 28–42 in design, consulting, law, and finance who want a serious skincare result without a 12-step routine.",
    location: "metro India + UAE; ships globally",
    brandStyle: "luxury-warm",
    productType: "morning skincare regimen, 4 products, refillable",
    visualMood: "soft-editorial",
    inputType: "idea",
  },

  brandResult: {
    brandName: "GlowNest",
    tagline: "Four minutes to glow.",
    mission:
      "Give serious skincare back to the four-minute morning — luxury results without the 12-step ritual.",
    targetAudience:
      "Women 28–42 with a calendar that says 'partner sync at 8:30' and skin that deserves better than a single wipe.",
    tone: "Quietly confident, premium, warm — evidence-led, never preachy.",
    usp: "A Korean-dermatologist-designed four-step morning regimen, refillable, that fits in the time it takes to brew a coffee.",
    story:
      "GlowNest started with one question: why does luxury skincare assume you have an hour? Our founder, a corporate lawyer, briefed a Seoul-based dermatologist to compress a serious morning regimen into four products, four minutes, four results. Each step is timed on the bottle. The packaging is refillable.",
    promise: "Real skin science, in the time it takes to brew coffee.",
    colorPalette: GLOWNEST_PALETTE,
    painPoints: [
      "Most luxury skincare ranges assume an unrealistic 10–12 step morning routine.",
      "Working professionals over-pay for products they don't have time to use correctly.",
      "Refill culture barely exists in the premium skincare aisle.",
    ],
  },

  trustScore: {
    overallScore: 82,
    confidence: "High",
    categories: [
      { name: "Brand clarity", score: 90 },
      { name: "Visual identity", score: 88 },
      { name: "Trust signals", score: 80 },
      { name: "Story strength", score: 84 },
      { name: "Audience fit", score: 86 },
      { name: "USP differentiation", score: 85 },
      { name: "Tone consistency", score: 82 },
      { name: "Market readiness", score: 76 },
      { name: "Conversion potential", score: 80 },
      { name: "Cultural relevance", score: 78 },
    ],
    suggestions: [
      "Surface the dermatologist's credentials and a short founder note on the homepage.",
      "Add before / after grids on the product page (4-week, 8-week).",
      "Publish a refill subscription with a one-tap pause option.",
      "Add a 60-second 'four-minute morning' loom to the hero.",
      "Push a refill-bottle return programme (earn credits, not guilt).",
    ],
  },

  visuals: [
    {
      id: "demo-glownest-v-product",
      visualType: "product_mockup",
      title: "Product mockup",
      prompt:
        "Editorial photograph of the GlowNest four-step morning kit lined up on a marble countertop, blush and cream tones, refillable glass bottles, soft directional light. No on-image text.",
      imageUrl: ph(
        "product_mockup",
        "GlowNest",
        "Product mockup",
        GLOWNEST_PALETTE,
      ),
      status: "generated",
    },
    {
      id: "demo-glownest-v-hero",
      visualType: "hero_image",
      title: "Hero image",
      prompt:
        "Wide hero image: a woman in her mid-30s at a sunlit bathroom mirror, mid-routine with a GlowNest serum, palette of blush, cream, and warm gold. Cinematic, calm, premium.",
      imageUrl: ph(
        "hero_image",
        "GlowNest",
        "Hero · Four minutes to glow.",
        GLOWNEST_PALETTE,
      ),
      status: "generated",
    },
    {
      id: "demo-glownest-v-ig",
      visualType: "instagram_ad",
      title: "Instagram ad",
      prompt:
        "Square Instagram ad: GlowNest serum bottle centred against a blush satin backdrop, gold accents, generous negative space, premium product photography.",
      imageUrl: ph(
        "instagram_ad",
        "GlowNest",
        "4 steps · 4 minutes · serious skin",
        GLOWNEST_PALETTE,
      ),
      status: "generated",
    },
    {
      id: "demo-glownest-v-lifestyle",
      visualType: "lifestyle_scene",
      title: "Lifestyle scene",
      prompt:
        "Candid lifestyle scene of a woman packing the GlowNest travel kit into a leather work tote, golden-hour kitchen light, palette of blush and cream. Real hands, depth of field.",
      imageUrl: ph(
        "lifestyle_scene",
        "GlowNest",
        "Mornings in the bag",
        GLOWNEST_PALETTE,
      ),
      status: "generated",
    },
  ],

  websiteConcept: {
    heroHeadline: "Four minutes to glow.",
    heroSubheadline:
      "A Korean-dermatologist-designed four-step morning routine for women who run their day, not their bathroom.",
    cta: "Start the 4-step routine",
    sections: [
      {
        title: "The four steps",
        content:
          "Cleanse · Treat · Hydrate · Defend. Each bottle is timed (60 seconds on the label). The whole routine is four minutes — set a timer if you must.",
      },
      {
        title: "Backed by a Seoul dermatologist",
        content:
          "We briefed a Seoul-based dermatologist (15 years, K-beauty labs) to compress a serious regimen into four products. Every formula is clinical-grade and patch-tested.",
      },
      {
        title: "Refillable, on purpose",
        content:
          "The outer bottles are made once. After that, you refill — at home with subscription pouches, or in-store at our two flagship counters in Mumbai and Dubai.",
      },
      {
        title: "Real receipts",
        content:
          "8-week before / after panels with 60 women. Average glow-score lift: +28%. (Yes, glow-score is a thing — we publish the methodology.)",
      },
      {
        title: "Subscribe & pause",
        content:
          "Get refills every 8 weeks, on auto. Pause with one tap from your phone. Cancel anytime — no email gauntlet.",
      },
    ],
    faq: [
      {
        q: "Is this really only four minutes?",
        a: "Yes — each bottle is timed at 60 seconds. The whole routine, including the wait between steps, is four minutes flat.",
      },
      {
        q: "Where are the products made?",
        a: "Formulated in Seoul, filled in Mumbai (premium contract manufacturer, ISO 22716 certified).",
      },
      {
        q: "How does refilling work?",
        a: "Order refill pouches via the subscription, or drop in to a flagship counter. Pouches use 78% less plastic than a fresh bottle.",
      },
    ],
    trustSignals: [
      "Korean dermatologist-designed",
      "ISO 22716 manufacturing",
      "Refillable + subscription",
      "8-week clinical panels",
    ],
  },

  marketingPack: {
    instagramCaption:
      "Meet GlowNest.\n\nFour minutes to glow.\n\nA Korean-dermatologist-designed four-step morning routine for women who run their day, not their bathroom. Each bottle is timed. The packaging refills.\n\nStart the 4-step routine →",
    tiktokScript: [
      'HOOK (0–2s): "Your skincare routine should not be longer than your stand-up."',
      "BEAT 1 (2–6s): Show a chaotic morning montage — meetings, kid, kettle.",
      "BEAT 2 (6–10s): Cut to the four GlowNest bottles, each with a 60s timer.",
      'BEAT 3 (10–14s): Founder VO: "Four steps. Four minutes. Designed in Seoul, made in Mumbai."',
      'CTA (14–16s): "Link in bio — start the routine."',
    ].join("\n"),
    whatsappMessage:
      "Hey! Just spun up GlowNest on VISORA — premium 4-step morning skincare for women who don't have an hour. Brand, palette, visuals, website, marketing — all done. Want the link?",
    emailSubject: "GlowNest: serious skincare in the time it takes to brew coffee",
    adHeadlines: [
      "GlowNest — four minutes to glow.",
      "Real skin science. Designed for the 8:30 meeting.",
      "The four-step morning, refillable, dermatologist-designed.",
    ],
  },
};

/* ─────────────────────────────────────────────────────────────
   Aggregate — the default demo gallery
   ───────────────────────────────────────────────────────────── */

/**
 * Default demo gallery — used by /gallery as a backstop when both
 * Supabase and localStorage are empty so judges and first-time users
 * always see a populated, explorable workspace. Order newest first.
 */
export const DEMO_PROJECTS: Project[] = [
  DEMO_PROJECT, // Urban Brew Ceylon — trust 78
  DEMO_ECOSIP, // EcoSip Lanka       — trust 65
  DEMO_GLOWNEST, // GlowNest          — trust 82
];

export default DEMO_PROJECT;
