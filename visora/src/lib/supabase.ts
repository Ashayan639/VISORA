import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * VISORA — Supabase clients.
 *
 * Two clients live here:
 *   - `supabase`              → browser/anon client (safe to expose to the user).
 *   - `getServerSupabase()`   → server-only client using the service role key.
 *                               Bypasses RLS — NEVER import this in client code.
 *
 * If any required env var is missing, we log a one-time warning and return
 * `null` from the relevant accessor. Callers must handle the null case
 * gracefully (see `src/lib/database.ts`).
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

// ─────────────────────────────────────────────────────────────
// Browser / anon client (singleton)
// ─────────────────────────────────────────────────────────────

function createBrowserClient(): SupabaseClient | null {
  if (!SUPABASE_URL) {
    warnOnce(
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL is not set. Browser client disabled.",
    );
    return null;
  }
  if (!SUPABASE_ANON_KEY) {
    warnOnce(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Browser client disabled.",
    );
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase: SupabaseClient | null = createBrowserClient();

// ─────────────────────────────────────────────────────────────
// Server / service-role client (lazy singleton)
// ─────────────────────────────────────────────────────────────

let _serverClient: SupabaseClient | null | undefined;

/**
 * Returns a privileged Supabase client for server-side use (API routes,
 * Server Components, Route Handlers). Bypasses RLS. Returns `null` if any
 * required env var is missing.
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

  if (!SUPABASE_URL) {
    warnOnce(
      "NEXT_PUBLIC_SUPABASE_URL_server",
      "NEXT_PUBLIC_SUPABASE_URL is not set. Server client disabled.",
    );
    return (_serverClient = null);
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    warnOnce(
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY is not set. Server client disabled.",
    );
    return (_serverClient = null);
  }

  _serverClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
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

/** True if either a browser or server client is available. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabase) || Boolean(getServerSupabase());
}
