/**
 * POST /api/generate-3d
 *
 * Generates a 3D model (GLB) via fal.ai's TRELLIS endpoint. Two modes:
 *
 *   { mode: "text_to_3d",  prompt: string }
 *     → flux generates a clean product image, trellis turns it into a
 *       GLB mesh, response includes the intermediate image URL.
 *
 *   { mode: "image_to_3d", imageUrl: string }
 *     → trellis converts the supplied image into a GLB mesh.
 *
 * Both modes return the canonical shape:
 *   {
 *     modelUrl: string,        // empty string on fallback
 *     modelType: "glb",
 *     mode: Model3DMode,
 *     prompt?:   string,       // text_to_3d only
 *     sourceImageUrl?: string, // image_to_3d only
 *     intermediateImageUrl?: string, // text_to_3d only
 *     status: "generated" | "fallback",
 *     error?: string,          // present on status === "fallback"
 *     durationMs: number
 *   }
 *
 * Server-only — FAL_KEY is read from process.env and never returned.
 */

import { NextResponse } from "next/server";

import {
  generateModel3D,
  type Model3DInput,
} from "@/lib/fal-3d-generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 3D generation is the slowest call in the app (trellis ~30–90s, plus
 * an upstream flux call for text mode ~3–5s). Bump the route's max
 * duration so platforms with default timeouts (Vercel hobby = 10s)
 * don't kill the request mid-poll. Local dev ignores this.
 */
export const maxDuration = 300;

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
   Body validation (discriminated union)
   ───────────────────────────────────────────────────────────── */

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

interface ParseOk {
  ok: true;
  input: Model3DInput;
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

  const mode = asString(r.mode).trim();
  if (mode !== "text_to_3d" && mode !== "image_to_3d") {
    return {
      ok: false,
      message: 'mode must be "text_to_3d" or "image_to_3d".',
    };
  }

  if (mode === "text_to_3d") {
    const prompt = asString(r.prompt).trim();
    if (!prompt) {
      return {
        ok: false,
        message: 'prompt is required when mode is "text_to_3d".',
      };
    }
    return { ok: true, input: { mode: "text_to_3d", prompt } };
  }

  // mode === "image_to_3d"
  const imageUrl = asString(r.imageUrl).trim();
  if (!imageUrl) {
    return {
      ok: false,
      message: 'imageUrl is required when mode is "image_to_3d".',
    };
  }

  // Accept either:
  //   • a fully-qualified URL (http/https/etc), OR
  //   • a `data:image/...;base64,...` URL we'll hoist to fal.storage
  //     server-side. This is what file uploads from the studio look like.
  const isDataImage = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(
    imageUrl,
  );
  if (!isDataImage) {
    try {
      new URL(imageUrl);
    } catch {
      return {
        ok: false,
        message:
          'imageUrl must be a fully-qualified URL or a "data:image/...;base64,..." string.',
      };
    }
  }

  return { ok: true, input: { mode: "image_to_3d", imageUrl } };
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
    const result = await generateModel3D(parsed.input);
    return withCors(NextResponse.json(result, { status: 200 }));
  } catch (err) {
    // generateModel3D is designed to never throw, but be defensive.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/generate-3d] unexpected error:", message);
    return withCors(
      NextResponse.json(
        {
          status: "fallback",
          mode: parsed.input.mode,
          modelUrl: "",
          modelType: "glb",
          prompt: parsed.input.mode === "text_to_3d" ? parsed.input.prompt : undefined,
          sourceImageUrl:
            parsed.input.mode === "image_to_3d"
              ? parsed.input.imageUrl
              : undefined,
          error: message,
          durationMs: 0,
        },
        { status: 200 },
      ),
    );
  }
}
