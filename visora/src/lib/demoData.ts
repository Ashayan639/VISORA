/**
 * Urban Brew Ceylon — the canonical VISORA demo project.
 *
 * Used by:
 *   • The chat engine when the user asks for a "demo" / "example".
 *   • Future onboarding tours / empty states.
 *   • Storybook-style fixtures during development.
 *
 * The visuals all reference `/placeholder-visual.png` (the dark
 * VISORA-branded fallback) so the demo works offline. Once a real
 * fal.ai run completes, callers replace `imageUrl` with the live URL.
 *
 * `model3d` is intentionally omitted — clicking "Generate 3D model"
 * in the demo triggers a real /api/generate-3d call so judges can see
 * the live trellis pipeline.
 */

import type { Project } from "@/types/visora";

export const DEMO_PROJECT_ID = "demo-urban-brew-ceylon";

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
    usp:
      "Single-origin Ceylon coffee in a launch-ready, design-first brand — bag, story, and brewing ritual included.",
    story:
      "Urban Brew Ceylon started where most coffee brands stop: at the surface. Colombo had great cafés, but no one was packaging that quality for the desk, the studio, the meeting at 9:14. We work with small estates in the Central Highlands, roast in two-day batches, and design every touchpoint as deliberately as the cup itself.",
    promise: "Considered coffee, delivered like a flagship product.",
    colorPalette: ["#2B1B11", "#5C3A21", "#C9A55B", "#E7DDC6", "#FFF7EC"],
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
      id: "demo-v-product",
      visualType: "product_mockup",
      title: "Product mockup",
      prompt:
        "Editorial photograph of an Urban Brew Ceylon coffee bag on warm linen, brass accent, soft natural light, palette of warm browns and matte gold. No on-image text or logos.",
      imageUrl: "/placeholder-visual.png",
      status: "generated",
    },
    {
      id: "demo-v-hero",
      visualType: "hero_image",
      title: "Hero image",
      prompt:
        "Cinematic hero image of a Colombo studio interior at dusk; a hand placing an Urban Brew Ceylon cup on a designer's desk, warm tungsten light, depth of field. No on-image text.",
      imageUrl: "/placeholder-visual.png",
      status: "generated",
    },
    {
      id: "demo-v-ig",
      visualType: "instagram_ad",
      title: "Instagram ad",
      prompt:
        "Square Instagram ad for Urban Brew Ceylon, coffee bag hero off-center, generous negative space, palette of warm browns and cream, premium product photography.",
      imageUrl: "/placeholder-visual.png",
      status: "generated",
    },
    {
      id: "demo-v-lifestyle",
      visualType: "lifestyle_scene",
      title: "Lifestyle scene",
      prompt:
        "Candid lifestyle scene of a designer in a Colombo studio holding an Urban Brew Ceylon cup, golden-hour light, real hands, depth of field, warm palette.",
      imageUrl: "/placeholder-visual.png",
      status: "generated",
    },
  ],

  // model3d is intentionally undefined — a live trellis call happens
  // when the user clicks "Generate 3D" inside the demo flow.

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
   Additional demo projects.

   These showcase different shapes the gallery can render: an idea-
   based brand WITH a 3D model, a website-URL refresh, and a SaaS
   brand without 3D. They're used by /gallery as a backstop when the
   user has nothing saved yet, so the workspace never looks empty
   for the demo / hackathon judges.
   ───────────────────────────────────────────────────────────── */

export const DEMO_AURELIA: Project = {
  id: "demo-aurelia-os",
  createdAt: "2026-04-09T10:30:00.000Z",
  inputType: "idea",
  userInput: {
    startupIdea:
      "Aurelia OS — a calm, opinionated knowledge base for two-person founder teams who hate Notion sprawl.",
    websiteUrl: "",
    industry: "developer tools / SaaS",
    targetAudience:
      "two-person founder teams (engineer + designer), 25–35, building consumer / B2B products",
    location: "remote, primarily NA + EU",
    brandStyle: "minimal-modern",
    productType: "web app, SaaS",
    visualMood: "calm-clinical",
    inputType: "idea",
  },
  brandResult: {
    brandName: "Aurelia OS",
    tagline: "The calm operating system for two-person founder teams.",
    mission:
      "Replace the 47-tab knowledge mess of early-stage startups with one calm surface that two co-founders can actually keep in sync.",
    targetAudience:
      "Two-person founder teams who used to like Notion and have stopped trusting it.",
    tone: "Confident, minimal, occasionally funny.",
    usp:
      "A two-pane workspace built for exactly two writers — never more, never less — with a real opinion about hierarchy.",
    story:
      "We watched a hundred founders graduate from a single Notion doc to thirty pages, then to chaos. Every team rebuilt the same sidebar. Aurelia is the sidebar — done, opinionated, beautiful.",
    promise: "Calm, not capable.",
    colorPalette: ["#0B0F19", "#171C2A", "#7DD3FC", "#E2E8F0", "#FAFAFA"],
    painPoints: [
      "Notion sprawl after the first 90 days.",
      "Two co-founders losing track of who decided what.",
      "Tools built for 50-person teams used by two people.",
    ],
  },
  trustScore: {
    overallScore: 84,
    confidence: "High",
    categories: [
      { name: "Brand clarity", score: 92 },
      { name: "Visual identity", score: 88 },
      { name: "Trust signals", score: 78 },
      { name: "Story strength", score: 90 },
      { name: "Audience fit", score: 86 },
      { name: "USP differentiation", score: 84 },
      { name: "Tone consistency", score: 80 },
      { name: "Market readiness", score: 78 },
      { name: "Conversion potential", score: 82 },
      { name: "Cultural relevance", score: 82 },
    ],
    suggestions: [
      "Add a 30-second product loom to the hero.",
      "Surface 3–5 founder testimonials.",
      "Tighten the pricing page to a single table.",
      "Show a real user's workspace screenshot above the fold.",
      "Add an explicit 'two-person only' constraint as a feature, not a limit.",
    ],
  },
  visuals: [
    {
      id: "demo-aurelia-product",
      visualType: "product_mockup",
      title: "Product mockup",
      prompt:
        "Editorial product photo of an Aurelia OS welcome card on a designer's desk, calm minimal palette, soft natural light.",
      imageUrl: "/placeholder-visual.png",
      status: "generated",
    },
    {
      id: "demo-aurelia-hero",
      visualType: "hero_image",
      title: "Hero image",
      prompt:
        "Cinematic hero image of two co-founders at a calm desk setup, depth of field, palette desaturated cool.",
      imageUrl: "/placeholder-visual.png",
      status: "generated",
    },
  ],
  model3d: {
    id: "demo-aurelia-mesh",
    modelType: "text_to_3d",
    prompt: "Aurelia OS hero card object — minimal, isometric, single mesh.",
    sourceImageUrl: "/placeholder-visual.png",
    modelUrl:
      "https://v3b.fal.media/files/example/aurelia-card-demo.glb",
    status: "generated",
  },
  websiteConcept: {
    heroHeadline: "The calm operating system for two-person founder teams.",
    heroSubheadline:
      "Replace 47 Notion tabs with one calm surface that two co-founders can actually keep in sync.",
    cta: "Try Aurelia free",
    sections: [
      { title: "Why Aurelia", content: "We watched a hundred founders graduate from one Notion doc to thirty pages, then to chaos. Aurelia is the calm." },
      { title: "Built for exactly two", content: "Two writers, two columns, two perspectives. We had a real opinion when we built it." },
      { title: "From idea → ship", content: "A single workspace from your earliest scribble to the spec your engineer ships." },
      { title: "Calm by default", content: "No emoji storms, no notification noise. Just one surface that respects your attention." },
      { title: "Pricing", content: "Free for two co-founders. $19/mo when you grow." },
    ],
    faq: [
      { q: "What if we hire a third teammate?", a: "Aurelia is built for two. We'll suggest a graduation path to a tool that fits a 3+ team." },
      { q: "Does it import Notion?", a: "Yes — paste a Notion URL and we'll mirror the page tree as a calm two-pane structure." },
    ],
    trustSignals: ["100% calm by default", "Two-person workspace", "Notion import"],
  },
  marketingPack: {
    instagramCaption:
      "Aurelia OS — the calm operating system for two-person founder teams. Two writers. One surface. Zero sprawl.",
    tiktokScript: [
      "HOOK (0–2s): \"What if your knowledge base had a real opinion?\"",
      "BEAT 1 (2–6s): Show a typical Notion sprawl, 47 tabs.",
      "BEAT 2 (6–10s): Cut to Aurelia OS — two calm columns.",
      "CTA (10–14s): \"Calm — link in bio.\"",
    ].join("\n"),
    whatsappMessage:
      "Hey! Just spun up Aurelia OS on VISORA — calm two-person knowledge base for founder duos. Want to see?",
    emailSubject: "Aurelia OS: a calmer Notion for two co-founders",
    adHeadlines: [
      "Aurelia OS — calm, not capable.",
      "Two co-founders. One workspace. Zero sprawl.",
      "The opinionated knowledge base for founder duos.",
    ],
  },
};

export const DEMO_LANEFORD: Project = {
  id: "demo-laneford-tea-refresh",
  createdAt: "2026-02-22T16:45:00.000Z",
  inputType: "website_url",
  userInput: {
    startupIdea: "",
    websiteUrl: "https://laneford-tea.example.com",
    industry: "specialty tea",
    targetAudience:
      "30–55, design-led professionals in NYC and London who buy loose-leaf tea twice a year as gifts",
    location: "New York, NY (HQ); ships globally",
    brandStyle: "heritage-modern",
    productType: "loose-leaf tea, tin",
    visualMood: "warm-archival",
    inputType: "website_url",
  },
  brandResult: {
    brandName: "Laneford Tea Co.",
    tagline: "Old craft, new ritual.",
    mission:
      "Refresh a 60-year heritage tea brand for a new generation of gift-buyers without losing the archive that built it.",
    targetAudience:
      "Design-led professionals who want a heritage tea that looks as good on a coffee table as a Hermès scarf.",
    tone: "Considered, archival, quietly modern.",
    usp:
      "A 60-year tea archive packaged with the typographic discipline of a 2025 design studio.",
    story:
      "Laneford has been blending tea since 1965. The blends were timeless; the brand wasn't. We rebuilt the visual system without touching the recipes.",
    promise: "Heritage you can re-gift without apologising.",
    colorPalette: ["#1F1A14", "#3A2E22", "#C19A65", "#E9DCC4", "#F8F2E5"],
    painPoints: [
      "Old design felt 'grandparent gift', not 'taste-led peer'.",
      "Archive of 60 years was hidden, not surfaced.",
      "Premium tea drinkers under 40 weren't returning.",
    ],
  },
  trustScore: {
    overallScore: 65,
    confidence: "Medium",
    categories: [
      { name: "Brand clarity", score: 78 },
      { name: "Visual identity", score: 60 },
      { name: "Trust signals", score: 72 },
      { name: "Story strength", score: 75 },
      { name: "Audience fit", score: 58 },
      { name: "USP differentiation", score: 60 },
      { name: "Tone consistency", score: 55 },
      { name: "Market readiness", score: 70 },
      { name: "Conversion potential", score: 62 },
      { name: "Cultural relevance", score: 60 },
    ],
    suggestions: [
      "Surface the 1965 archive as a visible timeline.",
      "Re-shoot product photography on warm linen, not parchment.",
      "Tighten typography — one display, one body, no third.",
      "Add a 'gifted to' card on every order.",
      "Refresh the homepage hero to a single archive photo.",
    ],
  },
  visuals: [
    {
      id: "demo-laneford-product",
      visualType: "product_mockup",
      title: "Product mockup",
      prompt:
        "Editorial product shot of a Laneford Tea tin on warm linen, archival typography, soft window light.",
      imageUrl: "/placeholder-visual.png",
      status: "generated",
    },
    {
      id: "demo-laneford-lifestyle",
      visualType: "lifestyle_scene",
      title: "Lifestyle scene",
      prompt:
        "Lifestyle photo of a Laneford tin being unwrapped at a designer's coffee table, warm tones, depth of field.",
      imageUrl: "/placeholder-visual.png",
      status: "generated",
    },
  ],
  websiteConcept: {
    heroHeadline: "Old craft, new ritual.",
    heroSubheadline:
      "Sixty years of loose-leaf, packaged for the way you actually live now.",
    cta: "Shop the archive",
    sections: [
      { title: "The 1965 archive", content: "Sixty years of blends, surfaced as a visible timeline." },
      { title: "Made in small batches", content: "Every tin is blended weekly in our New York facility." },
      { title: "Gifted on purpose", content: "A 'gifted to' card on every order — designed for the giver and the receiver." },
    ],
    faq: [
      { q: "Has the recipe changed?", a: "No. We only refreshed the brand and the packaging." },
      { q: "Where do you ship?", a: "Globally, weekly, from New York." },
    ],
    trustSignals: ["Established 1965", "Blended weekly in NYC", "Gift-card included"],
  },
  marketingPack: {
    instagramCaption:
      "Laneford Tea Co. — old craft, new ritual. Sixty years of loose-leaf, packaged for the way you actually live now.",
    tiktokScript: "—",
    whatsappMessage:
      "Hey — Laneford Tea Co. just refreshed with VISORA. Same 1965 recipes, very different packaging.",
    emailSubject: "Laneford Tea Co.: refreshed, not reinvented",
    adHeadlines: [
      "Old craft, new ritual.",
      "Laneford Tea Co. — sixty years, refreshed.",
      "The tea your grandmother kept on the top shelf.",
    ],
  },
};

/**
 * Default demo gallery — used by /gallery as a backstop when both
 * Supabase and localStorage are empty. Order from newest to oldest.
 */
export const DEMO_PROJECTS: Project[] = [
  DEMO_PROJECT,    // Urban Brew Ceylon — premium coffee, 78 trust
  DEMO_AURELIA,    // Aurelia OS — calm SaaS, 84 trust, has 3D
  DEMO_LANEFORD,   // Laneford Tea Co. — URL refresh, 65 trust, no 3D
];

export default DEMO_PROJECT;
