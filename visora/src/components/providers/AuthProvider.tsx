"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  signInWithEmail as authSignInWithEmail,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  signUpWithEmail as authSignUpWithEmail,
} from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoggedIn: boolean;
  /** @deprecated Use `isLoggedIn` */
  isAuthenticated: boolean;
  /** @deprecated Use `loading` */
  isLoading: boolean;
  authConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{
    error: Error | null;
    needsEmailConfirmation?: boolean;
    hasSession?: boolean;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => supabase !== null);

  const authConfigured = supabase !== null;

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: initial } }) => {
        if (!mounted) return;
        setSession(initial);
        setUser(initial?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await authSignInWithGoogle();
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await authSignInWithEmail(email, password);
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      const { data, error } = await authSignUpWithEmail(email, password, name);
      if (error) return { error: new Error(error.message) };
      const needsEmailConfirmation = Boolean(data?.user && !data?.session);
      return {
        error: null,
        needsEmailConfirmation,
        hasSession: Boolean(data?.session),
      };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await authSignOut();
    return { error: error ? new Error(error.message) : null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isLoggedIn: Boolean(user),
      isAuthenticated: Boolean(user),
      isLoading: loading,
      authConfigured,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [
      authConfigured,
      loading,
      session,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      signUpWithEmail,
      user,
    ],
  );

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground"
          role="status"
          aria-label="Loading authentication"
        />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
