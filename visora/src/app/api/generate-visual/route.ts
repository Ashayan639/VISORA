/**
 * POST /api/generate-visual
 *
 * Generates ONE visual via fal.ai (flux/schnell). The route is
 * server-only and Node-runtime so FAL_KEY never leaks to the browser.
 *
 * Request:
 *   { prompt: string, visualType: string, title?: string }
 *
 * Response (200 — generated):
 *   { imageUrl, visualType, prompt, status: "generated", durationMs }
 *
 * Response (200 — fallback):
 *   { imageUrl: "/placeholder-visual.png", visualType, prompt,
 *     status: "fallback", error, durationMs }
 *
 * Response (400 — validation):
 *   { error: string }
 */

import { NextResponse } from "next/server";

import {
  generateOneVisual,
  type GenerateVisualInput,
} from "@/lib/fal-generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────
   CORS
   ───────────────────────────────────────────────────────────── */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function withCors(response: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

export async function OPTIONS(): Promise<NextResponse> {
  return withCors(new NextResponse(null, { status: 204 }));
}

/* ─────────────────────────────────────────────────────────────
   Body validation
   ───────────────────────────────────────────────────────────── */

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

interface ParseOk {
  ok: true;
  input: GenerateVisualInput;
}
interface ParseErr {
  ok: false;
  message: string;
}

function parseBody(raw: unknown): ParseOk | ParseErr {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Body must be a JSON object." };
  }
  const r = raw as Record<string, unknown>;

  const prompt = asString(r.prompt).trim();
  const visualType = asString(r.visualType).trim();
  const title = asString(r.title).trim();

  if (!prompt) {
    return { ok: false, message: "prompt is required." };
  }
  if (!visualType) {
    return { ok: false, message: "visualType is required." };
  }

  return {
    ok: true,
    input: {
      prompt,
      visualType,
      title: title || undefined,
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   POST handler
   ───────────────────────────────────────────────────────────── */

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withCors(
      NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    );
  }

  const parsed = parseBody(body);
  if (!parsed.ok) {
    return withCors(
      NextResponse.json({ error: parsed.message }, { status: 400 }),
    );
  }

  try {
    const result = await generateOneVisual(parsed.input);
    return withCors(NextResponse.json(result, { status: 200 }));
  } catch (err) {
    // generateOneVisual is designed to never throw, but be defensive.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/generate-visual] unexpected error:", message);
    return withCors(
      NextResponse.json(
        {
          imageUrl: "/placeholder-visual.png",
          visualType: parsed.input.visualType,
          prompt: parsed.input.prompt,
          status: "fallback",
          error: message,
          durationMs: 0,
        },
        { status: 200 },
      ),
    );
  }
}
