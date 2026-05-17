/**
 * POST /api/generate-all-visuals
 *
 * Generates multiple visuals in parallel via fal.ai with INDEPENDENT
 * failure handling. If a single image errors, all the others still
 * resolve — we use `Promise.allSettled` plus the `generateOneVisual()`
 * helper which is documented to never throw.
 *
 * Request:
 *   { prompts: { prompt: string, visualType: string, title?: string }[] }
 *
 * Response (200):
 *   {
 *     results: VisualResult[],     // one per input, in original order
 *     summary: {
 *       total: number,
 *       generated: number,
 *       fallback: number,
 *       durationMs: number          // server-side wall time
 *     }
 *   }
 *
 * Response (400 — validation):
 *   { error: string }
 */

import { NextResponse } from "next/server";

import {
  generateOneVisual,
  placeholderUrlForVisual,
  type GenerateVisualInput,
  type VisualResult,
} from "@/lib/fal-generation";
import { sanitizeErrorMessage } from "@/lib/sanitizeError";

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
  prompts: GenerateVisualInput[];
}
interface ParseErr {
  ok: false;
  message: string;
}

/** Cap to protect FAL budget + per-request latency. */
const MAX_PROMPTS = 8;

function parseBody(raw: unknown): ParseOk | ParseErr {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Body must be a JSON object." };
  }
  const r = raw as Record<string, unknown>;

  if (!Array.isArray(r.prompts)) {
    return { ok: false, message: "prompts must be an array." };
  }

  if (r.prompts.length === 0) {
    return { ok: false, message: "prompts array is empty." };
  }
  if (r.prompts.length > MAX_PROMPTS) {
    return {
      ok: false,
      message: `prompts array exceeds the max of ${MAX_PROMPTS} per request.`,
    };
  }

  const prompts: GenerateVisualInput[] = [];
  for (let i = 0; i < r.prompts.length; i++) {
    const item = r.prompts[i];
    if (!item || typeof item !== "object") {
      return {
        ok: false,
        message: `prompts[${i}] must be an object.`,
      };
    }
    const obj = item as Record<string, unknown>;
    const prompt = asString(obj.prompt).trim();
    const visualType = asString(obj.visualType).trim();
    const title = asString(obj.title).trim();

    if (!prompt) {
      return {
        ok: false,
        message: `prompts[${i}].prompt is required.`,
      };
    }
    if (!visualType) {
      return {
        ok: false,
        message: `prompts[${i}].visualType is required.`,
      };
    }

    prompts.push({
      prompt,
      visualType,
      title: title || undefined,
    });
  }

  return { ok: true, prompts };
}

/* ─────────────────────────────────────────────────────────────
   Reduce Promise.allSettled output
   ───────────────────────────────────────────────────────────── */

function settledToResult(
  settled: PromiseSettledResult<VisualResult>,
  input: GenerateVisualInput,
): VisualResult {
  if (settled.status === "fulfilled") return settled.value;

  // generateOneVisual is documented to never throw, but if its
  // contract is ever violated we still want to return a usable shape.
  const message =
    settled.reason instanceof Error
      ? settled.reason.message
      : String(settled.reason);

  console.error("[api/generate-all-visuals] unexpected rejection", {
    visualType: input.visualType,
    error: message,
  });

  return {
    imageUrl: placeholderUrlForVisual(input.visualType, input.title),
    visualType: input.visualType,
    prompt: input.prompt,
    status: "fallback",
    title: input.title,
    error: sanitizeErrorMessage(message),
    durationMs: 0,
  };
}

/* ─────────────────────────────────────────────────────────────
   POST handler
   ───────────────────────────────────────────────────────────── */

export async function POST(req: Request): Promise<NextResponse> {
  const startedAt = Date.now();

  try {
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

    // Fan out — Promise.allSettled means a single rejection doesn't take
    // down the whole batch.
    const settled = await Promise.allSettled(
      parsed.prompts.map((p) => generateOneVisual(p)),
    );

    const results = settled.map((s, i) =>
      settledToResult(s, parsed.prompts[i]!),
    );

    const generated = results.filter((r) => r.status === "generated").length;
    const fallback = results.length - generated;

    return withCors(
      NextResponse.json(
        {
          results,
          summary: {
            total: results.length,
            generated,
            fallback,
            durationMs: Date.now() - startedAt,
          },
        },
        { status: 200 },
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/generate-all-visuals] unexpected error:", message);

    return withCors(
      NextResponse.json(
        {
          results: [],
          summary: {
            total: 0,
            generated: 0,
            fallback: 0,
            durationMs: Date.now() - startedAt,
          },
          error: sanitizeErrorMessage(message),
        },
        { status: 500 },
      ),
    );
  }
}
