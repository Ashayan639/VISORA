/**
 * GET /api/projects — list saved gallery projects (newest first).
 *
 * Query: `withChat=1` includes `chatMessages` when stored in Supabase.
 */

import { NextResponse } from "next/server";

import { getProjectsForGallery } from "@/lib/database";
import { getLocalProjects } from "@/lib/galleryStorage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { sanitizeErrorMessage } from "@/lib/sanitizeError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const withChat = url.searchParams.get("withChat") === "1";

    let remote = isSupabaseConfigured() ? await getProjectsForGallery() : [];

    if (!withChat) {
      remote = remote.map((p) => {
        const { chatMessages, sessionId, ...rest } = p;
        void chatMessages;
        void sessionId;
        return rest;
      });
    }

    const local = getLocalProjects();
    const byId = new Map<string, (typeof remote)[number]>();
    for (const p of remote) byId.set(p.id, p);
    for (const p of local) {
      if (!byId.has(p.id)) byId.set(p.id, p);
    }

    const projects = Array.from(byId.values()).sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );

    return withCors(
      NextResponse.json({
        projects,
        storage: isSupabaseConfigured() ? "supabase" : "local",
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/projects]", message);
    return withCors(
      NextResponse.json(
        { projects: [], error: sanitizeErrorMessage(message) },
        { status: 500 },
      ),
    );
  }
}
