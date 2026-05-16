/**
 * Smoke test for src/lib/chatEngine.ts.
 *
 * Run: npx tsx scripts/smoke-chat-engine.ts
 *
 * Uses a mock fetcher so no real API is hit. Verifies:
 *  • demo intent → walks the user through the Urban Brew Ceylon project
 *  • idea_initial → returns refine action_buttons
 *  • idea_refined → kicks off the brand pipeline (mocked)
 *  • make_3d → uses image_to_3d when product_mockup is available
 *  • general → friendly fallback text
 *  • regen_brand → re-runs the pipeline
 */

import {
  processUserMessage,
  reconstructProjectFromMessages,
} from "../src/lib/chatEngine";
import { DEMO_PROJECT } from "../src/lib/demoData";
import type { ChatMessage, Project } from "../src/types/visora";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function expect(cond: unknown, label: string): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    failures.push(label);
    console.log(`  ✗ ${label}`);
  }
}

function makeMockFetcher(routes: Record<string, unknown>): typeof fetch {
  return (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === "string" ? input : (input as URL).toString();
    for (const [pattern, body] of Object.entries(routes)) {
      if (url.includes(pattern)) {
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return new Response(JSON.stringify({ error: "no mock for " + url }), {
      status: 500,
    });
  }) as unknown as typeof fetch;
}

async function run(): Promise<void> {
  /* ── demo intent ───────────────────────────────────────── */
  console.log("\nTEST: demo intent");
  {
    const project: Partial<Project> = {};
    const msgs: ChatMessage[] = [];
    await processUserMessage("show me a demo", [], project, {
      onMessage: (m) => msgs.push(m),
    });
    const types = msgs.flatMap((m) => (m.widgets ?? []).map((w) => w.type));
    expect(msgs.length >= 6, `produced ≥ 6 messages (got ${msgs.length})`);
    expect(types.includes("brand_card"), "includes brand_card widget");
    expect(types.includes("trust_score"), "includes trust_score widget");
    expect(types.includes("image_grid"), "includes image_grid widget");
    expect(types.includes("website_preview"), "includes website_preview widget");
    expect(types.includes("marketing_pack"), "includes marketing_pack widget");
    expect(types.includes("action_buttons"), "includes final action_buttons");
    expect(
      project.brandResult?.brandName === DEMO_PROJECT.brandResult.brandName,
      "patches project with Urban Brew Ceylon brandResult",
    );
    expect(
      project.trustScore?.overallScore === 78,
      "patches project with trustScore 78",
    );
  }

  /* ── idea_initial → refine ───────────────────────────── */
  console.log("\nTEST: idea_initial intent");
  {
    const project: Partial<Project> = {};
    const msgs: ChatMessage[] = [];
    await processUserMessage(
      "premium coffee for Colombo offices",
      [],
      project,
      { onMessage: (m) => msgs.push(m) },
    );
    expect(msgs.length === 1, `single ack message (got ${msgs.length})`);
    const widget = msgs[0]?.widgets?.[0];
    expect(widget?.type === "action_buttons", "ack carries action_buttons");
    expect(
      project.userInput?.startupIdea?.includes("Colombo"),
      "seeds userInput with the original idea",
    );
    expect(project.brandResult === undefined, "brand not yet generated");
  }

  /* ── idea_refined → full pipeline (mocked) ────────────── */
  console.log("\nTEST: idea_refined intent (with mock fetcher)");
  {
    const seededProject: Partial<Project> = {
      inputType: "idea",
      userInput: {
        startupIdea: "premium coffee for Colombo offices",
        websiteUrl: "",
        industry: "",
        targetAudience: "",
        location: "",
        brandStyle: "",
        productType: "",
        visualMood: "",
        inputType: "idea",
      },
    };

    const fetcher = makeMockFetcher({
      "/api/generate-brand": {
        brandResult: {
          brandName: "Mock Brew",
          tagline: "Mock tagline",
          mission: "m",
          targetAudience: "t",
          tone: "t",
          usp: "u",
          story: "s",
          promise: "p",
          colorPalette: ["#000", "#fff"],
          painPoints: ["p1"],
        },
        trustScore: {
          overallScore: 72,
          confidence: "Medium",
          categories: [{ name: "x", score: 60 }],
          suggestions: ["s1"],
        },
        websiteConcept: {
          heroHeadline: "h",
          heroSubheadline: "hs",
          cta: "c",
          sections: [],
          faq: [],
          trustSignals: [],
        },
        marketingPack: {
          instagramCaption: "i",
          tiktokScript: "t",
          whatsappMessage: "w",
          emailSubject: "e",
          adHeadlines: ["a"],
        },
        falPrompts: {
          product_mockup: "pm",
          hero_image: "hi",
          instagram_ad: "ia",
          lifestyle_scene: "ls",
        },
        meta: { source: "fallback", durationMs: 50 },
      },
      "/api/generate-all-visuals": {
        results: [
          { imageUrl: "https://x/p.png", visualType: "product_mockup", prompt: "pm", status: "generated", title: "Product mockup", durationMs: 100 },
          { imageUrl: "https://x/h.png", visualType: "hero_image", prompt: "hi", status: "generated", title: "Hero image", durationMs: 100 },
          { imageUrl: "https://x/i.png", visualType: "instagram_ad", prompt: "ia", status: "generated", title: "Instagram ad", durationMs: 100 },
          { imageUrl: "https://x/l.png", visualType: "lifestyle_scene", prompt: "ls", status: "generated", title: "Lifestyle scene", durationMs: 100 },
        ],
        summary: { total: 4, generated: 4, fallback: 0, durationMs: 100 },
      },
    });

    const msgs: ChatMessage[] = [];
    await processUserMessage("Generate the brand now", [], seededProject, {
      onMessage: (m) => msgs.push(m),
      fetcher,
    });

    const types = msgs.flatMap((m) => (m.widgets ?? []).map((w) => w.type));
    expect(msgs.length >= 6, `pipeline yields ≥ 6 messages (got ${msgs.length})`);
    expect(types.includes("brand_card"), "yields brand_card");
    expect(types.includes("trust_score"), "yields trust_score");
    expect(types.includes("image_grid"), "yields image_grid");
    expect(types.includes("website_preview"), "yields website_preview");
    expect(types.includes("marketing_pack"), "yields marketing_pack");
    expect(
      seededProject.brandResult?.brandName === "Mock Brew",
      "patches project.brandResult from API",
    );
    expect(
      (seededProject.visuals ?? []).every((v) => v.status === "generated"),
      "patches visuals to generated status",
    );
  }

  /* ── make_3d → image_to_3d when mockup exists ─────────── */
  console.log("\nTEST: make_3d intent (image_to_3d path)");
  {
    const project: Partial<Project> = {
      brandResult: DEMO_PROJECT.brandResult,
      visuals: [
        {
          id: "v1",
          visualType: "product_mockup",
          title: "Product mockup",
          prompt: "pm",
          imageUrl: "https://example.com/mock.png",
          status: "generated",
        },
      ],
    };

    let capturedBody: unknown = null;
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = init?.body ? JSON.parse(init.body as string) : null;
      return new Response(
        JSON.stringify({
          status: "generated",
          mode: "image_to_3d",
          modelUrl: "https://x/m.glb",
          modelType: "glb",
          sourceImageUrl: "https://example.com/mock.png",
          durationMs: 22000,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const msgs: ChatMessage[] = [];
    await processUserMessage("Make a 3D model of the product", [], project, {
      onMessage: (m) => msgs.push(m),
      fetcher,
    });

    expect(msgs.length === 2, `2 messages (loading + final, got ${msgs.length})`);
    expect(
      (capturedBody as { mode?: string })?.mode === "image_to_3d",
      "calls /api/generate-3d with image_to_3d mode",
    );
    expect(
      project.model3d?.status === "generated",
      "patches model3d to generated",
    );
    expect(
      project.model3d?.modelUrl === "https://x/m.glb",
      "patches model3d.modelUrl from API",
    );
  }

  /* ── general → friendly fallback ──────────────────────── */
  console.log("\nTEST: general intent");
  {
    const project: Partial<Project> = {
      brandResult: DEMO_PROJECT.brandResult,
    };
    const msgs: ChatMessage[] = [];
    // History has 2 user messages already, so we won't fall into idea_initial.
    const history: ChatMessage[] = [
      { id: "u1", role: "user", content: "hi", timestamp: new Date().toISOString() },
      { id: "u2", role: "user", content: "hello", timestamp: new Date().toISOString() },
    ];
    await processUserMessage("what is your favourite colour?", history, project, {
      onMessage: (m) => msgs.push(m),
    });
    expect(msgs.length === 1, `single fallback message (got ${msgs.length})`);
    expect(
      typeof msgs[0]?.content === "string" && msgs[0].content.length > 10,
      "fallback content is non-trivial",
    );
  }

  /* ── regen_visual → calls API for one visual ──────────── */
  console.log("\nTEST: regen_visual intent");
  {
    const project: Partial<Project> = {
      brandResult: DEMO_PROJECT.brandResult,
      visuals: DEMO_PROJECT.visuals.map((v) => ({ ...v })),
    };

    const fetcher = makeMockFetcher({
      "/api/generate-all-visuals": {
        results: [
          { imageUrl: "https://x/new-hero.png", visualType: "hero_image", prompt: "p", status: "generated", title: "Hero image", durationMs: 1 },
        ],
        summary: { total: 1, generated: 1, fallback: 0, durationMs: 1 },
      },
    });

    const msgs: ChatMessage[] = [];
    await processUserMessage("regenerate the hero image", [], project, {
      onMessage: (m) => msgs.push(m),
      fetcher,
    });
    expect(msgs.length === 2, `2 messages (loading + final, got ${msgs.length})`);
    const heroVisual = project.visuals?.find((v) => v.visualType === "hero_image");
    expect(
      heroVisual?.imageUrl === "https://x/new-hero.png",
      "hero_image visual updated to new URL",
    );
    const productVisual = project.visuals?.find(
      (v) => v.visualType === "product_mockup",
    );
    expect(
      productVisual?.imageUrl === "/placeholder-visual.png",
      "other visuals untouched",
    );
  }

  /* ── url intent ───────────────────────────────────────── */
  console.log("\nTEST: url intent (kicks off pipeline)");
  {
    const project: Partial<Project> = {};
    const fetcher = makeMockFetcher({
      "/api/generate-brand": {
        brandResult: DEMO_PROJECT.brandResult,
        trustScore: DEMO_PROJECT.trustScore,
        websiteConcept: DEMO_PROJECT.websiteConcept,
        marketingPack: DEMO_PROJECT.marketingPack,
        falPrompts: {
          product_mockup: "pm",
          hero_image: "hi",
          instagram_ad: "ia",
          lifestyle_scene: "ls",
        },
        meta: { source: "fallback", durationMs: 1 },
      },
      "/api/generate-all-visuals": {
        results: DEMO_PROJECT.visuals.map((v) => ({
          imageUrl: v.imageUrl,
          visualType: v.visualType,
          prompt: v.prompt,
          status: "generated",
          title: v.title,
          durationMs: 1,
        })),
        summary: { total: 4, generated: 4, fallback: 0, durationMs: 1 },
      },
    });
    const msgs: ChatMessage[] = [];
    await processUserMessage(
      "audit https://urbanbrew.lk/about please",
      [],
      project,
      { onMessage: (m) => msgs.push(m), fetcher },
    );
    expect(
      project.userInput?.websiteUrl === "https://urbanbrew.lk/about",
      "extracts URL into userInput.websiteUrl",
    );
    expect(project.inputType === "website_url", "sets inputType to website_url");
    expect(
      project.brandResult?.brandName === DEMO_PROJECT.brandResult.brandName,
      "patches brandResult from URL pipeline",
    );
  }

  /* ── reconstruct project from messages ─────────────────── */
  console.log("\nTEST: reconstructProjectFromMessages");
  {
    // Build a realistic chat history: user, then assistant yields the
    // full pipeline (brand → trust → visuals → website → marketing →
    // 3D), and finally a regenerated brand replaces the first one.
    const history: ChatMessage[] = [
      { id: "u", role: "user", content: "demo", timestamp: "2026" },
      {
        id: "a1",
        role: "assistant",
        content: "First brand",
        timestamp: "2026",
        widgets: [
          {
            type: "brand_card",
            data: { ...DEMO_PROJECT.brandResult, brandName: "Old Brand" },
          },
          { type: "trust_score", data: DEMO_PROJECT.trustScore },
        ],
      },
      {
        id: "a2",
        role: "assistant",
        content: "Visuals + website + marketing",
        timestamp: "2026",
        widgets: [
          { type: "image_grid", data: { assets: DEMO_PROJECT.visuals } },
          { type: "website_preview", data: DEMO_PROJECT.websiteConcept },
          { type: "marketing_pack", data: DEMO_PROJECT.marketingPack },
        ],
      },
      {
        id: "a3",
        role: "assistant",
        content: "3D model",
        timestamp: "2026",
        widgets: [
          {
            type: "model_3d",
            data: {
              id: "m",
              modelType: "image_to_3d",
              prompt: "p",
              modelUrl: "https://x/m.glb",
              status: "generated",
            },
          },
        ],
      },
      {
        id: "a4",
        role: "assistant",
        content: "Regenerated brand",
        timestamp: "2026",
        widgets: [
          {
            type: "brand_card",
            data: { ...DEMO_PROJECT.brandResult, brandName: "Urban Brew Ceylon" },
          },
        ],
      },
    ];

    const project = reconstructProjectFromMessages(history);
    expect(
      project.brandResult?.brandName === "Urban Brew Ceylon",
      "later brand_card overrides earlier one (Urban Brew Ceylon)",
    );
    expect(
      project.trustScore?.overallScore === 78,
      "trust score reconstructed from earlier message",
    );
    expect(
      (project.visuals?.length ?? 0) === 4,
      "all 4 visuals reconstructed from image_grid",
    );
    expect(
      project.model3d?.modelUrl === "https://x/m.glb",
      "3D model reconstructed from model_3d widget",
    );
    expect(
      project.websiteConcept?.heroHeadline === DEMO_PROJECT.websiteConcept.heroHeadline,
      "website concept reconstructed",
    );
    expect(
      project.marketingPack?.emailSubject === DEMO_PROJECT.marketingPack.emailSubject,
      "marketing pack reconstructed",
    );

    // Verify the engine then accepts that reconstructed state — i.e.
    // a "make 3D" call against the reconstructed project still picks
    // the right intent (image_to_3d if a product mockup is present).
    const fetcher = (async () =>
      new Response(
        JSON.stringify({
          status: "generated",
          mode: "image_to_3d",
          modelUrl: "https://x/refreshed.glb",
          modelType: "glb",
          durationMs: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as unknown as typeof fetch;

    // Replace placeholder URL with a real-looking one so the engine
    // chooses image_to_3d (the placeholder check rejects local paths).
    const visualsForReal = (project.visuals ?? []).map((v) => ({
      ...v,
      imageUrl: v.visualType === "product_mockup" ? "https://x/p.png" : v.imageUrl,
    }));
    const live: Partial<Project> = { ...project, visuals: visualsForReal };

    const msgs: ChatMessage[] = [];
    await processUserMessage(
      "Make a 3D model of the product",
      history,
      live,
      { onMessage: (m) => msgs.push(m), fetcher },
    );
    expect(
      live.model3d?.modelUrl === "https://x/refreshed.glb",
      "engine picks up reconstructed project for follow-up 3D intent",
    );
  }

  /* ── results ──────────────────────────────────────────── */
  console.log("\n────────────────────────────");
  console.log(`PASS: ${pass}   FAIL: ${fail}`);
  if (fail > 0) {
    console.log("Failed assertions:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("All chat-engine smoke checks passed.");
}

run().catch((err) => {
  console.error("smoke runner threw:", err);
  process.exit(1);
});
