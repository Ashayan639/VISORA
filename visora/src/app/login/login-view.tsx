"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Assets
   ───────────────────────────────────────────────────────────── */

function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
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

function GitHubMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function VisoraLogoMark() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="
          flex h-11 w-11 items-center justify-center rounded-xl
          bg-gradient-to-br from-brand-cyan to-brand-purple
          text-lg font-bold text-white shadow-lg shadow-brand-cyan/25
        "
      >
        V
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">VISORA</span>
    </div>
  );
}

function FloatingOrbs() {
  return (
    <>
      <div
        aria-hidden
        className="
          pointer-events-none fixed -top-24 -right-24
          h-[520px] w-[520px] rounded-full
          bg-brand-cyan opacity-[0.045] blur-3xl
          animate-float-slow
        "
      />
      <div
        aria-hidden
        style={{ animationDelay: "2.2s" }}
        className="
          pointer-events-none fixed -bottom-28 -left-28
          h-[440px] w-[440px] rounded-full
          bg-brand-purple opacity-[0.035] blur-3xl
          animate-float-slow
        "
      />
    </>
  );
}

const glassCard =
  "rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-xl";

const DEMO_TOAST = "Authentication coming soon — try demo mode instead";

const buttonVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.35 + i * 0.09, duration: 0.4, ease: "easeOut" as const },
  }),
};

interface LoginViewProps {
  authConfigured: boolean;
  enabledProviders: string[];
}

export function LoginView({ authConfigured, enabledProviders }: LoginViewProps) {
  const router = useRouter();
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const googleOn = enabledProviders.includes("google");
  const githubOn = enabledProviders.includes("github");

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/generate");
    }
  }, [authLoading, isAuthenticated, router]);

  const runDemoFlow = useCallback(() => {
    setToast(DEMO_TOAST);
    window.setTimeout(() => router.push("/generate"), 2000);
  }, [router]);

  const onGoogle = () => {
    if (!authConfigured) {
      runDemoFlow();
      return;
    }
    if (!googleOn) {
      setToast("Google sign-in is not configured.");
      return;
    }
    void signIn("google", { callbackUrl: "/generate" });
  };

  const onGitHub = () => {
    if (!authConfigured) {
      runDemoFlow();
      return;
    }
    if (!githubOn) {
      setToast("GitHub sign-in is not configured.");
      return;
    }
    void signIn("github", { callbackUrl: "/generate" });
  };

  const onMagicLink = (e: FormEvent) => {
    e.preventDefault();
    setToast("Magic link sign-in is coming soon — use Google or GitHub for now.");
  };

  if (authLoading) {
    return (
      <div
        className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-[#020617]"
        aria-busy="true"
        aria-label="Loading"
      >
        <FloatingOrbs />
        <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] bg-[#020617]">
      <FloatingOrbs />

      <Link
        href="/"
        className="
          absolute left-4 top-4 z-20 text-sm text-muted transition-colors
          hover:text-foreground md:left-8
        "
      >
        ← Back to home
      </Link>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={cn("w-full p-10", glassCard)}
        >
          <VisoraLogoMark />

          <h1 className="mt-8 text-center text-2xl font-semibold text-white">
            Welcome to VISORA
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Create your visual business reality
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <motion.button
              type="button"
              custom={0}
              variants={buttonVariants}
              initial="hidden"
              animate="show"
              onClick={onGoogle}
              className="
                flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3
                text-sm font-semibold text-slate-900 shadow-sm
                transition-[box-shadow,transform] duration-200
                hover:shadow-lg hover:shadow-black/15 active:scale-[0.99]
              "
            >
              <GoogleGIcon className="h-5 w-5 shrink-0" />
              Continue with Google
            </motion.button>

            <motion.button
              type="button"
              custom={1}
              variants={buttonVariants}
              initial="hidden"
              animate="show"
              onClick={onGitHub}
              className="
                flex w-full items-center justify-center gap-3 rounded-lg bg-[#1E293B] px-4 py-3
                text-sm font-semibold text-white
                transition-[box-shadow,transform,background-color] duration-200
                hover:bg-[#243047] hover:shadow-lg hover:shadow-black/25 active:scale-[0.99]
              "
            >
              <GitHubMarkIcon className="h-5 w-5 shrink-0" />
              Continue with GitHub
            </motion.button>
          </div>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/[0.1]" />
            <span className="text-xs font-medium uppercase tracking-wider text-hint">or</span>
            <div className="h-px flex-1 bg-white/[0.1]" />
          </div>

          <form onSubmit={onMagicLink} className="flex flex-col gap-3">
            <label htmlFor="login-email" className="sr-only">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm
                text-foreground placeholder:text-hint/80 backdrop-blur-md
                outline-none ring-0 transition-[border-color,box-shadow]
                focus:border-brand-cyan/40 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]
              "
            />
            <motion.button
              type="submit"
              custom={2}
              variants={buttonVariants}
              initial="hidden"
              animate="show"
              className="
                w-full rounded-lg border border-brand-cyan/35 bg-brand-cyan/10 px-4 py-3
                text-sm font-semibold text-brand-cyan transition-[background-color,box-shadow]
                hover:bg-brand-cyan/15 hover:shadow-[0_0_24px_-8px_rgba(56,189,248,0.45)]
              "
            >
              Send Magic Link
            </motion.button>
          </form>

          <p className="mt-8 text-center text-xs leading-relaxed text-hint">
            By continuing, you agree to our Terms of Service
          </p>
        </motion.div>

        <Link
          href="/"
          className="mt-8 text-sm text-muted transition-colors hover:text-foreground md:hidden"
        >
          ← Back to home
        </Link>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="
              fixed bottom-8 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2
              rounded-xl border border-white/[0.1] bg-[#0F172A]/95 px-4 py-3 text-center
              text-sm text-foreground shadow-xl shadow-black/40 backdrop-blur-xl
            "
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
