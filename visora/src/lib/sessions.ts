import type { ChatMessage } from "@/types/visora";

/**
 * VISORA — Local chat session storage.
 *
 * Hackathon mode: persist the chat sidebar's "Recent" list and per-session
 * message history in `localStorage`. Will be migrated to Supabase later,
 * which is why the shape mirrors what a `chat_sessions` table would look
 * like (id, title, preview, created_at, updated_at).
 *
 * All functions are SSR-safe — they return empty results when called on
 * the server (no `window`).
 */

export interface SessionMeta {
  id: string;
  /** Display title — brand name if known, else "New Brand Reality". */
  title: string;
  /** Truncated first user message, shown in the sidebar list. */
  preview: string;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601 — drives sort order in the sidebar (newest first). */
  updatedAt: string;
}

const SESSIONS_KEY = "visora:sessions";
const LAST_ACTIVE_KEY = "visora:last-active-session";
const messagesKey = (sessionId: string) => `visora:session:${sessionId}:messages`;

// ─────────────────────────────────────────────────────────────
// Low-level storage primitives (SSR-safe)
// ─────────────────────────────────────────────────────────────

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJSON<T>(key: string, fallback: T): T {
  const ls = safeLocalStorage();
  if (!ls) return fallback;
  try {
    const raw = ls.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or serialization failure — silently drop */
  }
}

function removeKey(key: string): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export function listSessions(): SessionMeta[] {
  const raw = readJSON<SessionMeta[]>(SESSIONS_KEY, []);
  // Newest first
  return [...raw].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

export function getSession(id: string): SessionMeta | null {
  if (!id) return null;
  return listSessions().find((s) => s.id === id) ?? null;
}

export function upsertSession(meta: SessionMeta): void {
  const all = readJSON<SessionMeta[]>(SESSIONS_KEY, []);
  const idx = all.findIndex((s) => s.id === meta.id);
  if (idx >= 0) {
    all[idx] = meta;
  } else {
    all.push(meta);
  }
  writeJSON(SESSIONS_KEY, all);
}

export function deleteSession(id: string): void {
  const all = readJSON<SessionMeta[]>(SESSIONS_KEY, []);
  writeJSON(
    SESSIONS_KEY,
    all.filter((s) => s.id !== id),
  );
  removeKey(messagesKey(id));
  if (getLastActiveSessionId() === id) setLastActiveSessionId(null);
}

/**
 * Returns the id of the session the user was last interacting with, or
 * `null` if none. Used by the chat workspace to auto-restore on mount.
 */
export function getLastActiveSessionId(): string | null {
  return readJSON<string | null>(LAST_ACTIVE_KEY, null);
}

/** Mark a session as the most-recently active. Pass `null` to clear. */
export function setLastActiveSessionId(id: string | null): void {
  if (id) writeJSON(LAST_ACTIVE_KEY, id);
  else removeKey(LAST_ACTIVE_KEY);
}

export function loadMessages(sessionId: string): ChatMessage[] {
  if (!sessionId) return [];
  return readJSON<ChatMessage[]>(messagesKey(sessionId), []);
}

export function saveMessages(
  sessionId: string,
  messages: ChatMessage[],
): void {
  if (!sessionId) return;
  writeJSON(messagesKey(sessionId), messages);
}

/** Generate a short URL-safe session id. */
export function makeSessionId(): string {
  const c =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return c;
}

/** Truncate a message to a sidebar-friendly preview. */
export function makePreview(input: string, max = 80): string {
  const flat = input.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1)}…`;
}
