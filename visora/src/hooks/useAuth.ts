"use client";

import { useContext } from "react";

import {
  AuthContext,
  type AuthContextValue,
} from "@/components/providers/AuthProvider";
import { mapAuthUser } from "@/lib/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface UseAuthResult extends AuthContextValue {
  /** UI-friendly user for avatars / display names */
  profile: ReturnType<typeof mapAuthUser>;
  status: AuthStatus;
}

/**
 * VISORA — Auth hook (Supabase).
 * Must be used inside `AuthProvider`.
 */
export function useAuth(): UseAuthResult {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  const status: AuthStatus = ctx.loading
    ? "loading"
    : ctx.isLoggedIn
      ? "authenticated"
      : "unauthenticated";

  return {
    ...ctx,
    profile: mapAuthUser(ctx.user),
    status,
  };
}

export default useAuth;
