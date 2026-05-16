"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
  /** Optional pre-fetched session (Server Component → Client boundary). */
  session?: Session | null;
}

/**
 * VISORA — Client-side wrapper around `next-auth/react`'s `SessionProvider`.
 *
 * Mount this at the root of the App Router tree (in `layout.tsx`) so that
 * `useSession()` / `useAuth()` work everywhere. It's always safe to render
 * even when no auth providers are configured — `useSession()` will simply
 * return `{ data: null, status: "unauthenticated" }`.
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}

export default AuthProvider;
