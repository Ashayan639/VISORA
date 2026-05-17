/**
 * POST /api/chat
 *
 * Main VISORA intelligence route — multi-turn OpenAI chat with streaming.
 * Falls back to a template engine when OPENAI_API_KEY is missing or the API fails.
 */

import OpenAI from "openai";

import { generateFallbackChatResponse } from "@/lib/chat/fallback-chat";
import { getChatOpenAIClient, CHAT_MAX_TOKENS, CHAT_MODEL, CHAT_TEMPERATURE } from "@/lib/chat/openai-client";
import {
  buildProjectContextBlock,
  VISORA_CHAT_SYSTEM_PROMPT,
} from "@/lib/chat/system-prompt";
import type { ChatApiMessage, ChatApiRequest } from "@/lib/chat/types";
import { sanitizeErrorMessage } from "@/lib/sanitizeError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function withCorsHeaders(headers: HeadersInit = {}): HeadersInit {
  return { ...CORS_HEADERS, ...headers };
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: withCorsHeaders() });
}

function parseBody(raw: unknown): ChatApiRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.messages)) return null;

  const messages: ChatApiMessage[] = [];
  for (const m of r.messages) {
    if (!m || typeof m !== "object") continue;
    const o = m as Record<string, unknown>;
    const role = o.role === "user" || o.role === "assistant" ? o.role : null;
    const content = typeof o.content === "string" ? o.content : "";
    if (!role) continue;
    messages.push({ role, content });
  }

  if (messages.length === 0) return null;

  return {
    messages,
    currentProject:
      r.currentProject && typeof r.currentProject === "object"
        ? (r.currentProject as ChatApiRequest["currentProject"])
        : undefined,
  };
}

function buildOpenAIMessages(
  messages: ChatApiMessage[],
  currentProject: ChatApiRequest["currentProject"],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const systemParts = [
    VISORA_CHAT_SYSTEM_PROMPT,
    "",
    "---",
    buildProjectContextBlock(currentProject),
  ];

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemParts.join("\n") },
  ];

  for (const m of messages) {
    openaiMessages.push({
      role: m.role,
      content: m.content,
    });
  }

  return openaiMessages;
}

/** Fallback path — single JSON payload (not token-streamed). */
function jsonFallbackResponse(text: string): Response {
  return new Response(
    JSON.stringify({
      content: text,
      source: "fallback" as const,
      streamed: false,
    }),
    {
      status: 200,
      headers: withCorsHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Visora-Source": "fallback",
        "X-Visora-Streamed": "false",
      }),
    },
  );
}

async function streamOpenAIResponse(
  openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<Response> {
  const client = getChatOpenAIClient();
  if (!client) {
    throw new Error("OpenAI client unavailable");
  }

  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: openaiMessages,
    temperature: CHAT_TEMPERATURE,
    max_tokens: CHAT_MAX_TOKENS,
    stream: true,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[api/chat] stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: withCorsHeaders({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Visora-Source": "openai",
      "X-Visora-Streamed": "true",
    }),
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
        status: 400,
        headers: withCorsHeaders({ "Content-Type": "application/json" }),
      });
    }

    const parsed = parseBody(body);
    if (!parsed) {
      return new Response(
        JSON.stringify({
          error: "Body must include messages: { role, content }[].",
        }),
        {
          status: 400,
          headers: withCorsHeaders({ "Content-Type": "application/json" }),
        },
      );
    }

    const { messages, currentProject } = parsed;
    const client = getChatOpenAIClient();

    if (!client) {
      const text = generateFallbackChatResponse(messages, currentProject);
      return jsonFallbackResponse(text);
    }

    try {
      const openaiMessages = buildOpenAIMessages(messages, currentProject);
      return await streamOpenAIResponse(openaiMessages);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[api/chat] OpenAI failed, using fallback:", message);

      const text = generateFallbackChatResponse(messages, currentProject);
      if (!text) {
        return new Response(
          JSON.stringify({
            error: "Chat generation failed.",
            detail: sanitizeErrorMessage(message),
          }),
          {
            status: 500,
            headers: withCorsHeaders({ "Content-Type": "application/json" }),
          },
        );
      }
      return jsonFallbackResponse(text);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/chat] unexpected error:", message);
    return new Response(
      JSON.stringify({
        error: "Chat route failed unexpectedly.",
        detail: sanitizeErrorMessage(message),
      }),
      {
        status: 500,
        headers: withCorsHeaders({ "Content-Type": "application/json" }),
      },
    );
  }
}
