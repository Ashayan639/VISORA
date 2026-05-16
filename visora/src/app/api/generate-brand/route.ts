/**
 * POST /api/generate-brand
 *
 * Accepts a `UserInput` payload and returns a `GenerateBrandResult`
 * (BrandResult, TrustScore, WebsiteConcept, MarketingPack, FalPromptSet,
 * + optional WebsiteAnalysis for URL mode). Calls OpenAI when configured,
 * always degrades to a template fallback. Never throws.
 */

import { NextResponse } from "next/server";

import type { UserInput } from "@/types/visora";
import { generateBrand } from "@/lib/brand-generation";

/**
 * Use the Node runtime — the `openai` SDK relies on Node APIs and our
 * fallback / template logic uses no edge-only primitives anyway.
 */
export const runtime = "nodejs";

/** LLM output is non-deterministic. Don't let Next try to cache it. */
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
   Body parsing & validation
   ───────────────────────────────────────────────────────────── */

interface ValidationOk {
  ok: true;
  input: UserInput;
}
interface ValidationErr {
  ok: false;
  status: number;
  message: string;
}
type ValidationResult = ValidationOk | ValidationErr;

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function parseUserInput(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return {
      ok: false,
      status: 400,
      message: "Body must be a JSON object matching the UserInput shape.",
    };
  }

  const r = raw as Record<string, unknown>;

  const rawType = asString(r.inputType).trim();
  const inputType =
    rawType === "website_url" ? "website_url" : rawType === "idea" ? "idea" : null;
  if (!inputType) {
    return {
      ok: false,
      status: 400,
      message: 'inputType must be "idea" or "website_url".',
    };
  }

  const startupIdea = asString(r.startupIdea).trim();
  const websiteUrl = asString(r.websiteUrl).trim();

  if (inputType === "idea" && !startupIdea) {
    return {
      ok: false,
      status: 400,
      message: 'startupIdea is required when inputType is "idea".',
    };
  }
  if (inputType === "website_url" && !websiteUrl) {
    return {
      ok: false,
      status: 400,
      message: 'websiteUrl is required when inputType is "website_url".',
    };
  }

  const input: UserInput = {
    startupIdea,
    websiteUrl,
    industry: asString(r.industry).trim(),
    targetAudience: asString(r.targetAudience).trim(),
    location: asString(r.location).trim(),
    brandStyle: asString(r.brandStyle).trim(),
    productType: asString(r.productType).trim(),
    visualMood: asString(r.visualMood).trim(),
    inputType,
  };

  return { ok: true, input };
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
      NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      ),
    );
  }

  const validation = parseUserInput(body);
  if (!validation.ok) {
    return withCors(
      NextResponse.json(
        { error: validation.message },
        { status: validation.status },
      ),
    );
  }

  try {
    const result = await generateBrand(validation.input);
    return withCors(NextResponse.json(result, { status: 200 }));
  } catch (err) {
    // generateBrand is designed to never throw, but defensively:
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/generate-brand] unexpected error:", message);
    return withCors(
      NextResponse.json(
        { error: "Generation failed unexpectedly.", detail: message },
        { status: 500 },
      ),
    );
  }
}
