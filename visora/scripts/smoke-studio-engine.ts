/**
 * Smoke test for src/lib/studioEngine.ts and the /api/generate-3d
 * data-URL hoist contract.
 *
 * Run: npx tsx scripts/smoke-studio-engine.ts
 *
 * Verifies:
 *   • Text → text_to_3d call shape
 *   • Image attachment → image_to_3d call shape (data URL passes through)
 *   • Bare URL in message → image_to_3d using that URL
 *   • Empty message + no attachment → friendly general fallback
 *   • Loading model_3d widget yielded BEFORE the API resolves
 *   • Project state patched to model3d.generated on success
 *   • Project state patched to model3d.fallback on API failure
 */

import {
  processStudioMessage,
  type StudioEngineOptions,
} from "../src/lib/studioEngine";
import type {
  ChatAttachment,
  ChatMessage,
  Project,
} from "../src/types/visora";

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

interface CapturedCall {
  url: string;
  body: { mode?: string; prompt?: string; imageUrl?: string };
}

function makeCapturingFetcher(response: Record<string, unknown>): {
  fetcher: typeof fetch;
  calls: CapturedCall[];
} {
  const calls: CapturedCall[] = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as URL).toString();
    const body = init?.body ? JSON.parse(init.body as string) : {};
    calls.push({ url, body });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { fetcher, calls };
}

async function run(): Promise<void> {
  /* ── text → text_to_3d ─────────────────────────────────── */
  console.log("\nTEST: text → text_to_3d");
  {
    const project: Partial<Project> = {};
    const { fetcher, calls } = makeCapturingFetcher({
      status: "generated",
      mode: "text_to_3d",
      modelUrl: "https://x/m.glb",
      modelType: "glb",
      durationMs: 22000,
      intermediateImageUrl: "https://x/source.png",
    });

    const messages: ChatMessage[] = [];
    await processStudioMessage(
      "Matte black wireless headphones, brushed steel accents",
      [],
      project,
      { onMessage: (m) => messages.push(m), fetcher },
    );

    expect(messages.length === 2, `2 messages (loading + final, got ${messages.length})`);
    expect(
      messages[0]?.widgets?.[0]?.type === "model_3d" &&
        (messages[0]!.widgets![0].data as { status: string }).status === "loading",
      "first message yields loading model_3d BEFORE API resolves",
    );
    expect(calls[0]?.body.mode === "text_to_3d", "calls /api/generate-3d with text_to_3d");
    expect(
      typeof calls[0]?.body.prompt === "string" && calls[0]!.body.prompt.length > 10,
      "passes user prompt to API",
    );
    expect(project.model3d?.status === "generated", "patches project.model3d to generated");
    expect(
      project.model3d?.modelUrl === "https://x/m.glb",
      "patches model3d.modelUrl from API",
    );
    expect(
      project.model3d?.sourceImageUrl === "https://x/source.png",
      "captures intermediateImageUrl as sourceImageUrl",
    );
  }

  /* ── data-URL attachment → image_to_3d ─────────────────── */
  console.log("\nTEST: image attachment → image_to_3d (data URL)");
  {
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    const attachment: ChatAttachment = {
      kind: "image",
      url: dataUrl,
      name: "headphones.png",
      mimeType: "image/png",
    };

    // Stuff into the project's transient slot, mirroring what the hook does.
    const project: Partial<Project> & { __attachments?: ChatAttachment[] } = {
      __attachments: [attachment],
    };

    const { fetcher, calls } = makeCapturingFetcher({
      status: "generated",
      mode: "image_to_3d",
      modelUrl: "https://x/m.glb",
      modelType: "glb",
      sourceImageUrl: "https://fal.media/files/abc.png",
      durationMs: 22000,
    });

    const messages: ChatMessage[] = [];
    await processStudioMessage("Make this 3D", [], project, {
      onMessage: (m) => messages.push(m),
      fetcher,
    });

    expect(messages.length === 2, `2 messages (got ${messages.length})`);
    expect(calls[0]?.body.mode === "image_to_3d", "API called with image_to_3d mode");
    expect(
      calls[0]?.body.imageUrl === dataUrl,
      "API receives the raw data URL (server-side hoist takes over)",
    );
    expect(
      project.model3d?.sourceImageUrl === "https://fal.media/files/abc.png",
      "patches model3d.sourceImageUrl to the hoisted (public) URL from the API",
    );
    // The transient attachment slot must be cleared after the turn.
    expect(
      project.__attachments === undefined,
      "transient __attachments slot is cleared after the turn",
    );
  }

  /* ── bare URL in message → image_to_3d ────────────────── */
  console.log("\nTEST: bare URL in message → image_to_3d");
  {
    const project: Partial<Project> = {};
    const { fetcher, calls } = makeCapturingFetcher({
      status: "generated",
      mode: "image_to_3d",
      modelUrl: "https://x/m.glb",
      modelType: "glb",
      sourceImageUrl: "https://example.com/p.png",
      durationMs: 1,
    });

    const messages: ChatMessage[] = [];
    await processStudioMessage(
      "Convert https://example.com/p.png into 3D",
      [],
      project,
      { onMessage: (m) => messages.push(m), fetcher },
    );

    expect(calls[0]?.body.mode === "image_to_3d", "URL routes to image_to_3d");
    expect(
      calls[0]?.body.imageUrl === "https://example.com/p.png",
      "extracts the URL from the message text",
    );
    expect(messages.length === 2, "2 messages yielded");
  }

  /* ── empty message, no attachment → general ───────────── */
  console.log("\nTEST: empty message → general fallback");
  {
    const project: Partial<Project> = {};
    const messages: ChatMessage[] = [];
    await processStudioMessage("", [], project, {
      onMessage: (m) => messages.push(m),
    });
    expect(messages.length === 1, "single fallback message");
    expect(
      typeof messages[0]?.content === "string" && messages[0].content.length > 20,
      "fallback content is helpful",
    );
    expect(project.model3d === undefined, "no model3d patch on empty input");
  }

  /* ── API failure → fallback model_3d widget ────────────── */
  console.log("\nTEST: API failure → fallback model3d");
  {
    const project: Partial<Project> = {};
    const failingFetcher = (async () =>
      new Response(JSON.stringify({ error: "internal" }), {
        status: 500,
      })) as unknown as typeof fetch;
    const opts: StudioEngineOptions = {
      onMessage: () => {},
      fetcher: failingFetcher,
    };
    const messages: ChatMessage[] = [];
    opts.onMessage = (m) => messages.push(m);

    await processStudioMessage("a hexagonal lamp", [], project, opts);
    expect(messages.length === 2, "loading + final fallback message");
    expect(project.model3d?.status === "fallback", "project.model3d → fallback");
  }

  /* ── results ──────────────────────────────────────────── */
  console.log("\n────────────────────────────");
  console.log(`PASS: ${pass}   FAIL: ${fail}`);
  if (fail > 0) {
    console.log("Failed assertions:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("All studio-engine smoke checks passed.");
}

run().catch((err) => {
  console.error("smoke runner threw:", err);
  process.exit(1);
});
