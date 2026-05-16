"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Box, Globe, Lightbulb, Play, type LucideIcon } from "lucide-react";

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

type Suggestion = SendSuggestion | NavigateSuggestion;

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
    kind: "send",
    icon: Play,
    title: "Show me a demo",
    prompt: "Show me a demo with Urban Brew Ceylon",
  },
];

interface EmptyStateProps {
  /** Fired when a `kind: "send"` suggestion card is clicked. */
  onPickSuggestion: (prompt: string) => void;
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
          bg-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/20
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

export function EmptyState({ onPickSuggestion }: EmptyStateProps) {
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
            bg-gradient-to-br from-brand-cyan to-brand-purple
            shadow-[0_20px_60px_-15px_rgba(56,189,248,0.5)]
          "
        >
          <span className="text-4xl font-bold text-white">V</span>
          <span
            aria-hidden
            className="
              pointer-events-none absolute -inset-2 rounded-3xl blur-2xl opacity-50
              bg-gradient-to-br from-brand-cyan to-brand-purple
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
                    "group relative flex items-start gap-3 rounded-2xl p-4 text-left",
                    "bg-white/[0.03] backdrop-blur-xl",
                    "border border-white/[0.06]",
                    "transition-[border-color,box-shadow] duration-200",
                    "hover:border-brand-cyan/25 hover:shadow-[0_0_30px_-12px_rgba(56,189,248,0.5)]",
                  )}
                >
                  <SuggestionCardBody Icon={s.icon} title={s.title} prompt={s.prompt} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onPickSuggestion(s.prompt)}
                  data-suggestion-kind="send"
                  className={cn(
                    "group relative flex w-full items-start gap-3 rounded-2xl p-4 text-left",
                    "bg-white/[0.03] backdrop-blur-xl",
                    "border border-white/[0.06]",
                    "transition-[border-color,box-shadow] duration-200",
                    "hover:border-brand-cyan/25 hover:shadow-[0_0_30px_-12px_rgba(56,189,248,0.5)]",
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
