/**
 * VISORA — /api/chat request & response types.
 */

import type { Project } from "@/types/visora";

export interface ChatApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatApiRequest {
  messages: ChatApiMessage[];
  currentProject?: Partial<Project>;
}

export type ChatApiSource = "openai" | "fallback";

export interface ChatApiJsonResponse {
  content: string;
  source: ChatApiSource;
  streamed: false;
}
