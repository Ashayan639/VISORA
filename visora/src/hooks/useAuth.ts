"use client";

import {
  signIn,
  signOut,
  useSession,
  type SignInOptions,
  type SignOutParams,
} from "next-auth/react";
import type { Session } from "next-auth";
import { useCallback } from "react";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface UseAuthResult {
  session: Session | null;
  user: Session["user"] | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Trigger NextAuth sign-in. Defaults to the `google` provider. */
  signIn: (
    provider?: string,
    options?: SignInOptions,
  ) => ReturnType<typeof signIn>;
  /** Trigger NextAuth sign-out. */
  signOut: (options?: SignOutParams) => ReturnType<typeof signOut>;
}

/**
 * VISORA — Auth convenience hook.
 *
 * Thin wrapper over `useSession()` that exposes everything most components
 * need (session, status booleans, sign-in, sign-out) in one shot.
 *
 * Safe to call even when no providers are configured: `status` will simply
 * stay `"unauthenticated"` forever, and `signIn()` will redirect to the
 * NextAuth error page instead of crashing the app.
 */
export function useAuth(): UseAuthResult {
  const { data: session, status } = useSession();

  const handleSignIn = useCallback(
    (provider: string = "google", options?: SignInOptions) =>
      signIn(provider, options),
    [],
  );

  const handleSignOut = useCallback(
    (options?: SignOutParams) => signOut(options),
    [],
  );

  return {
    session: session ?? null,
    user: session?.user ?? null,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}

export default useAuth;
