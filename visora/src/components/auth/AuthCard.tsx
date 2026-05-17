"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export type AuthMode = "signIn" | "signUp";

interface AuthCardProps {
  className?: string;
  onUnconfigured?: () => void;
  onSuccess?: () => void;
  defaultMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
}

function VisoraDotLogo() {
  const dots = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto mb-6 flex h-14 w-14 items-center justify-center"
      aria-hidden
    >
      <div className="grid grid-cols-3 gap-1.5">
        {dots.flat().map((on, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-[2px]",
              on ? "bg-foreground" : "bg-transparent",
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function OrDivider() {
  return (
    <div className="relative my-6 flex items-center">
      <span className="h-px flex-1 bg-[#4F5052]/40" />
      <span className="px-4 text-[11px] font-medium uppercase tracking-[0.2em] text-hint">
        or
      </span>
      <span className="h-px flex-1 bg-[#4F5052]/40" />
    </div>
  );
}

const COPY = {
  signIn: {
    title: "Sign In",
    subtitle: "Please enter your details to sign in",
    primary: "Sign in",
    footer: "Don't have an account?",
    footerLink: "Sign up",
    switchTo: "signUp" as const,
  },
  signUp: {
    title: "Sign Up",
    subtitle: "Create your account to start building brand realities",
    primary: "Sign up",
    footer: "Already have an account?",
    footerLink: "Sign in",
    switchTo: "signIn" as const,
  },
} as const;

export function AuthCard({
  className,
  onUnconfigured,
  onSuccess,
  defaultMode = "signIn",
  onModeChange,
}: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authConfigured,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const copy = COPY[mode];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const oauthErrParam = searchParams.get("error");
  const [error, setError] = useState<string | null>(() =>
    oauthErrParam ? decodeURIComponent(oauthErrParam) : null,
  );
  const [submitting, setSubmitting] = useState(false);

  const switchMode = useCallback(
    (next: AuthMode) => {
      setMode(next);
      setError(null);
      onModeChange?.(next);
    },
    [onModeChange],
  );

  const finishSuccess = useCallback(() => {
    onSuccess?.();
    router.push("/profile");
  }, [onSuccess, router]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    if (!authConfigured) {
      onUnconfigured?.();
      return;
    }
    setSubmitting(true);
    const { error: err } = await signInWithGoogle();
    setSubmitting(false);
    if (err) setError(err.message);
    // OAuth redirects away; no finishSuccess here.
  }, [authConfigured, onUnconfigured, signInWithGoogle]);

  const handlePrimarySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!authConfigured) {
        onUnconfigured?.();
        return;
      }

      if (mode === "signUp") {
        if (!name.trim()) {
          setError("Please enter your full name.");
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
      }

      if (!email.trim()) {
        setError("Please enter your email address.");
        return;
      }
      if (!password.trim()) {
        setError("Please enter your password.");
        return;
      }

      setSubmitting(true);

      if (mode === "signUp") {
        const { error: err, needsEmailConfirmation, hasSession } =
          await signUpWithEmail(email.trim(), password, name.trim());
        setSubmitting(false);
        if (err) {
          setError(err.message);
          return;
        }
        if (needsEmailConfirmation) {
          setError("Check your email to confirm your account, then sign in.");
          return;
        }
        if (hasSession) finishSuccess();
        return;
      }

      const { error: err } = await signInWithEmail(email.trim(), password);
      setSubmitting(false);
      if (err) {
        setError(err.message);
        return;
      }
      finishSuccess();
    },
    [
      authConfigured,
      confirmPassword,
      email,
      finishSuccess,
      mode,
      name,
      onUnconfigured,
      password,
      signInWithEmail,
      signUpWithEmail,
    ],
  );

  return (
    <motion.div
      layout
      className={cn(
        "w-full max-w-[420px] rounded-2xl border border-[#4F5052]/30",
        "bg-[#282728]/80 p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-10",
        className,
      )}
    >
      <VisoraDotLogo />

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <h1 className="text-center text-[26px] font-bold tracking-tight text-foreground">
            {copy.title}
          </h1>
          <p className="mt-2 text-center text-[14px] text-muted">{copy.subtitle}</p>

          <form onSubmit={handlePrimarySubmit} className="mt-8 space-y-4">
            {mode === "signUp" ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={submitting}
                className="visora-input w-full px-4 py-3.5 text-[14px]"
              />
            ) : null}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              disabled={submitting}
              className="visora-input w-full px-4 py-3.5 text-[14px]"
            />

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                disabled={submitting}
                className="visora-input w-full px-4 py-3.5 text-[14px]"
              />
              {mode === "signIn" ? (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setError(
                        authConfigured
                          ? "Password reset: use Supabase Dashboard → Authentication → Users, or add a reset flow later."
                          : "Configure Supabase in .env.local to enable password reset.",
                      )
                    }
                    className="text-[12px] text-muted transition-colors hover:text-foreground"
                  >
                    Forgot Password?
                  </button>
                </div>
              ) : null}
            </div>

            {mode === "signUp" ? (
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                disabled={submitting}
                className="visora-input w-full px-4 py-3.5 text-[14px]"
              />
            ) : null}

            {error ? (
              <p className="text-center text-[12px] text-hint" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "visora-btn mt-2 w-full rounded-xl py-3.5 text-[15px] font-semibold",
                "bg-foreground text-background",
                "shadow-md shadow-black/30 transition-opacity hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {submitting ? "Please wait…" : copy.primary}
            </button>
          </form>

          <OrDivider />

          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={submitting}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-xl py-3.5",
              "border border-[#4F5052]/30 bg-card-hover/80 text-[14px] font-medium text-foreground",
              "transition-colors hover:border-[#818283]/50 hover:bg-card",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            Continue with Google
          </button>

          {!authConfigured ? (
            <p className="mt-4 text-center text-[11px] leading-relaxed text-hint">
              Auth is not configured. Add{" "}
              <code className="text-muted">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-muted">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code className="text-muted">.env.local</code>, or continue in demo mode.
            </p>
          ) : null}

          <p className="mt-8 text-center text-[13px] text-muted">
            {copy.footer}{" "}
            <button
              type="button"
              onClick={() => switchMode(copy.switchTo)}
              className="font-semibold text-foreground underline-offset-2 transition-colors hover:underline"
            >
              {copy.footerLink}
            </button>
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export const AuthSplitCard = AuthCard;
export default AuthCard;
