// SUPABASE SETUP REQUIRED:
// 1. Go to supabase.com → your project → Authentication → Providers
// 2. Enable Google provider:
//    - Google Client ID: from Google Cloud Console
//    - Google Client Secret: from Google Cloud Console
// 3. Enable Email provider (should be enabled by default):
//    - Enable email confirmations: OFF for development (faster testing)
//    - Enable email signup: ON
// 4. Go to Authentication → URL Configuration:
//    - Site URL: http://localhost:3000
//    - Redirect URLs: add http://localhost:3000/auth/callback
// 5. Go to Google Cloud Console → OAuth → Authorized redirect URIs:
//    - Add: https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback

import type { AuthError, Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const NOT_CONFIGURED: AuthError = {
  name: "AuthError",
  message: "Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
  status: 503,
} as AuthError;

function authRedirectUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${site.replace(/\/$/, "")}/auth/callback`;
}

/** Google OAuth login */
export async function signInWithGoogle() {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authRedirectUrl(),
      queryParams: {
        prompt: "select_account",
        access_type: "online",
      },
    },
  });
  return { data, error };
}

/** Manual email/password signup */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
) {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  return { data, error };
}

/** Manual email/password login */
export async function signInWithEmail(email: string, password: string) {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/** Logout */
export async function signOut() {
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.signOut();
  return { error };
}

/** Get current session */
export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/** Get current user */
export async function getUser(): Promise<User | null> {
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** True when Supabase browser auth client is available. */
export function isAuthConfigured(): boolean {
  return supabase !== null;
}

/** Auth methods available when configured. */
export function getEnabledProviderIds(): string[] {
  return isAuthConfigured() ? ["google", "email"] : [];
}

export function isProviderEnabled(providerId: string): boolean {
  return getEnabledProviderIds().includes(providerId);
}

/** Map Supabase user → UI-friendly shape (navbar avatar, etc.). */
export function mapAuthUser(user: User | null) {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  return {
    id: user.id,
    name:
      (typeof meta?.full_name === "string" && meta.full_name) ||
      (typeof meta?.name === "string" && meta.name) ||
      null,
    email: user.email ?? null,
    image:
      (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta?.picture === "string" && meta.picture) ||
      null,
  };
}

/** NextAuth provider ids currently enabled (e.g. `google`, `github`). */
export function getEnabledAuthProviderIds(): string[] {
  return authOptions.providers.map((p) => p.id);
}
