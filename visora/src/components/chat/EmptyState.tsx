"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Box, Globe, Lightbulb, Sparkles, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Suggestion cards
   ───────────────────────────────────────────────────────────── */

type SendSuggestion = {
  kind: "send";
  icon: LucideIcon;
  title: string;
  /** Shown in the card body — also the message that gets sent. */
  prompt: string;
};

type NavigateSuggestion = {
  kind: "navigate";
  icon: LucideIcon;
  title: string;
  /** Shown in the card body. */
  prompt: string;
  /** Where the card navigates to. */
  href: string;
};

type DemoSuggestion = {
  kind: "demo";
  icon: LucideIcon;
  title: string;
  prompt: string;
};

type Suggestion = SendSuggestion | NavigateSuggestion | DemoSuggestion;

const SUGGESTIONS: Suggestion[] = [
  {
    kind: "send",
    icon: Lightbulb,
    title: "I have a startup idea",
    prompt: "I want to start a business. Help me create a brand reality.",
  },
  {
    kind: "send",
    icon: Globe,
    title: "Analyze my website",
    prompt: "I want to analyze my existing website and refresh my brand.",
  },
  {
    kind: "navigate",
    icon: Box,
    title: "Create a 3D product",
    prompt: "Open the 3D Studio to render a hero product mesh.",
    href: "/studio",
  },
  {
    kind: "demo",
    icon: Sparkles,
    title: "Try Demo",
    prompt: "Load Urban Brew Ceylon — brand, trust, visuals, site, and marketing pack instantly.",
  },
];

interface EmptyStateProps {
  /** Fired when a `kind: "send"` suggestion card is clicked. */
  onPickSuggestion: (prompt: string) => void;
  /** Fired when "Try Demo" is clicked — loads full demo instantly. */
  onTryDemo?: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Card body — shared between button and link variants so the two
   look identical.
   ───────────────────────────────────────────────────────────── */

function SuggestionCardBody({
  Icon,
  title,
  prompt,
}: {
  Icon: LucideIcon;
  title: string;
  prompt: string;
}) {
  return (
    <>
      <span
        className="
          inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
          bg-card text-muted ring-1 ring-[#4F5052]/30
        "
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-muted">
          {prompt}
        </span>
      </span>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   EmptyState
   ───────────────────────────────────────────────────────────── */

export function EmptyState({ onPickSuggestion, onTryDemo }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
        }}
        className="flex w-full max-w-3xl flex-col items-center gap-8 text-center"
      >
        {/* Big gradient V */}
        <motion.div
          variants={{
            hidden: { scale: 0.85, opacity: 0 },
            show: { scale: 1, opacity: 1 },
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="
            relative flex h-20 w-20 items-center justify-center rounded-2xl
            border border-foreground bg-transparent
            shadow-[0_0_80px_rgba(248,250,250,0.03)]
          "
        >
          <span className="text-4xl font-bold text-foreground">V</span>
          <span
            aria-hidden
            className="
              pointer-events-none absolute -inset-2 rounded-3xl blur-2xl opacity-20
              bg-white/5
            "
          />
        </motion.div>

        <motion.h1
          variants={{
            hidden: { y: 12, opacity: 0 },
            show: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]"
        >
          What would you like to build?
        </motion.h1>

        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
          }}
          className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {SUGGESTIONS.map((s) => (
            <motion.div
              key={s.title}
              variants={{
                hidden: { y: 16, opacity: 0 },
                show: { y: 0, opacity: 1 },
              }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              whileHover={{ y: -2 }}
            >
              {s.kind === "navigate" ? (
                <Link
                  href={s.href}
                  data-suggestion-kind="navigate"
                  className={cn(
                    "visora-card visora-card-interactive group relative flex items-start gap-3 p-4 text-left",
                    "hover:shadow-[0_0_30px_-12px_rgba(0,0,0,0.4)]",
                  )}
                >
                  <SuggestionCardBody Icon={s.icon} title={s.title} prompt={s.prompt} />
                </Link>
              ) : s.kind === "demo" ? (
                <button
                  type="button"
                  onClick={() => onTryDemo?.()}
                  data-suggestion-kind="demo"
                  className={cn(
                    "group relative flex w-full items-start gap-3 rounded-2xl p-4 text-left",
                    "bg-white/[0.03] backdrop-blur-xl",
                    "border border-muted/20",
                    "transition-[border-color,box-shadow] duration-200",
                    "hover:border-muted/40 hover:shadow-[0_0_30px_-12px_rgba(0,0,0,0.4)]",
                  )}
                >
                  <SuggestionCardBody Icon={s.icon} title={s.title} prompt={s.prompt} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPickSuggestion(s.prompt)}
                  data-suggestion-kind="send"
                  className={cn(
                    "visora-card visora-card-interactive group relative flex w-full items-start gap-3 p-4 text-left",
                    "hover:shadow-[0_0_30px_-12px_rgba(0,0,0,0.4)]",
                  )}
                >
                  <SuggestionCardBody Icon={s.icon} title={s.title} prompt={s.prompt} />
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default EmptyState;
