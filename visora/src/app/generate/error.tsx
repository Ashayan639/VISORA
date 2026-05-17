"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

/**
 * Route-level error boundary for /generate.
 *
 * The chat engine is documented to never throw — every API failure
 * resolves with a friendly assistant message and a structured fallback.
 * This boundary catches everything else: rendering errors in widgets,
 * unexpected localStorage corruption, hydration failures, and so on.
 *
 * Next.js 14 app router calls this with `error` (the thrown error) and
 * `reset` (rehydrates the segment). We log to the console for dev
 * visibility and offer a "Try again" button that triggers `reset()`.
 */
export default function GenerateErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/generate error boundary]", error);
  }, [error]);

  return (
    <main
      className="
        flex min-h-[calc(100vh-4rem)] items-center justify-center
        bg-background px-6 py-16
      "
    >
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <span
          aria-hidden
          className="
            inline-flex h-14 w-14 items-center justify-center rounded-2xl
            bg-disabled/10 ring-1 ring-disabled/30 text-muted
          "
        >
          <AlertTriangle size={24} strokeWidth={1.75} />
        </span>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Something broke in the workspace
        </h1>

        <p className="max-w-md text-[14px] leading-relaxed text-muted">
          Your saved sessions are safe. Hit{" "}
          <span className="text-foreground">Try again</span> to reload the chat.
          If it keeps happening, open the browser console and share what you
          see.
        </p>

        {error.digest ? (
          <p className="text-[11px] font-mono text-hint">digest: {error.digest}</p>
        ) : null}

        <button
          type="button"
          onClick={reset}
          className="
            inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold
            bg-foreground text-background
            shadow-md shadow-black/25
            transition-all duration-200 hover:scale-[1.03] hover:opacity-90
          "
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    </main>
  );
}
