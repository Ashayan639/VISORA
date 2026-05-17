/**
 * POST /api/save-project
 *
 * Persists the current generated project + full chat to Supabase (when
 * configured) or localStorage fallback.
 */

import { NextResponse } from "next/server";

import {
  persistProjectToGallery,
  type SaveProjectPayload,
} from "@/lib/save-project";
import { sanitizeErrorMessage } from "@/lib/sanitizeError";
import type { ChatMessage, Project, UserInput } from "@/types/visora";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function parseBody(raw: unknown): SaveProjectPayload | { error: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "Body must be a JSON object." };
  }
  const r = raw as Record<string, unknown>;

  if (!r.currentProject || typeof r.currentProject !== "object") {
    return { error: "currentProject is required." };
  }

  if (!Array.isArray(r.chatMessages)) {
    return { error: "chatMessages must be an array." };
  }

  const chatMessages = r.chatMessages as ChatMessage[];
  const currentProject = r.currentProject as Partial<Project>;
  const userInput =
    r.userInput && typeof r.userInput === "object"
      ? (r.userInput as UserInput)
      : undefined;
  const sessionId =
    typeof r.sessionId === "string" ? r.sessionId : undefined;

  return {
    currentProject,
    chatMessages,
    userInput,
    sessionId,
  };
}

export async function POST(req: Request): Promise<NextResponse> {
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
    if ("error" in parsed) {
      return withCors(
        NextResponse.json({ error: parsed.error }, { status: 400 }),
      );
    }

    const result = await persistProjectToGallery(parsed);

    return withCors(
      NextResponse.json(
        {
          ok: true,
          project: result.project,
          storage: result.storage,
        },
        { status: 200 },
      ),
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save project.";
    const status = message.includes("Nothing to save") ? 400 : 500;
    console.error("[api/save-project]", err);
    return withCors(
      NextResponse.json(
        { ok: false, error: sanitizeErrorMessage(message) },
        { status },
      ),
    );
  }
}
