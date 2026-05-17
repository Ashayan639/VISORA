import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * VISORA — Supabase clients.
 *
 *   - `supabase`            → browser client (anon key, cookie-backed via @supabase/ssr).
 *   - `getServerSupabase()`   → service-role client for server DB writes (bypasses RLS).
 *
 * If env vars are missing, clients are `null` and callers must degrade gracefully.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const warned = new Set<string>();
function warnOnce(name: string, message: string) {
  if (warned.has(name)) return;
  warned.add(name);
  console.warn(`[visora/supabase] ${message}`);
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  return v.length === 0 || v.startsWith("your_");
}

// ─────────────────────────────────────────────────────────────
// Browser client (singleton)
// ─────────────────────────────────────────────────────────────

function createBrowserSupabaseClient(): SupabaseClient | null {
  if (isPlaceholder(SUPABASE_URL)) {
    warnOnce(
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL is not set. Browser client disabled.",
    );
    return null;
  }
  if (isPlaceholder(SUPABASE_ANON_KEY)) {
    warnOnce(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Browser client disabled.",
    );
    return null;
  }

  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}

export const supabase: SupabaseClient | null = createBrowserSupabaseClient();

// ─────────────────────────────────────────────────────────────
// Server / service-role client (lazy singleton)
// ─────────────────────────────────────────────────────────────

let _serverClient: SupabaseClient | null | undefined;

/**
 * Privileged Supabase client for API routes / server logic. Bypasses RLS.
 * NEVER import in client components.
 */
export function getServerSupabase(): SupabaseClient | null {
  if (_serverClient !== undefined) return _serverClient;

  if (typeof window !== "undefined") {
    warnOnce(
      "server-in-browser",
      "getServerSupabase() called in the browser. This should only run on the server.",
    );
    return (_serverClient = null);
  }

  if (isPlaceholder(SUPABASE_URL)) {
    warnOnce(
      "NEXT_PUBLIC_SUPABASE_URL_server",
      "NEXT_PUBLIC_SUPABASE_URL is not set. Server client disabled.",
    );
    return (_serverClient = null);
  }
  if (isPlaceholder(SUPABASE_SERVICE_ROLE_KEY)) {
    warnOnce(
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY is not set. Server client disabled.",
    );
    return (_serverClient = null);
  }

  _serverClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { "x-application-name": "visora" },
    },
  });
  return _serverClient;
}

/** True when browser or service-role client is available. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabase) || Boolean(getServerSupabase());
}
