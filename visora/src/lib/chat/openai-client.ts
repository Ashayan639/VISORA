/**
 * Lazy OpenAI client for /api/chat (server-only).
 */

import OpenAI from "openai";

let _client: OpenAI | null | undefined;

export function isUsableOpenAIKey(key: string | undefined): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 20) return false;
  if (trimmed.toLowerCase().startsWith("your_")) return false;
  if (trimmed.toLowerCase().includes("changeme")) return false;
  return true;
}

export function getChatOpenAIClient(): OpenAI | null {
  if (_client !== undefined) return _client;
  const key = process.env.OPENAI_API_KEY;
  if (!isUsableOpenAIKey(key)) {
    _client = null;
    return null;
  }
  _client = new OpenAI({
    apiKey: key,
    maxRetries: 0,
    timeout: 60_000,
  });
  return _client;
}

export const CHAT_MODEL = "gpt-4o-mini";
export const CHAT_TEMPERATURE = 0.8;
export const CHAT_MAX_TOKENS = 4000;
