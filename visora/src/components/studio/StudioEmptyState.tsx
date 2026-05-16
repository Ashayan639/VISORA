"use client";

import { motion } from "framer-motion";
import { Box, ImagePlus, Type, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Suggestion model (studio-flavoured)
   ───────────────────────────────────────────────────────────── */

type StudioSuggestion = {
  id: "describe" | "upload";
  icon: LucideIcon;
  title: string;
  prompt: string;
  /** What pressing this card actually does. */
  kind: "send" | "upload";
};

const SUGGESTIONS: StudioSuggestion[] = [
  {
    id: "describe",
    kind: "send",
    icon: Type,
    title: "Describe a product for 3D",
    prompt:
      "Matte black wireless headphones with brushed steel accents, premium product photography.",
  },
  {
    id: "upload",
    kind: "upload",
    icon: ImagePlus,
    title: "Upload image for 3D conversion",
    prompt: "Pick a clean product photo — single subject, plain background.",
  },
];

interface StudioEmptyStateProps {
  /** Send a message immediately (used by the "describe" suggestion). */
  onPickPrompt: (prompt: string) => void;
  /** Open the file picker (used by the "upload" suggestion). */
  onTriggerUpload: () => void;
}

/* ─────────────────────────────────────────────────────────────
   StudioEmptyState
   ───────────────────────────────────────────────────────────── */

export function StudioEmptyState({
  onPickPrompt,
  onTriggerUpload,
}: StudioEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
        }}
        className="flex w-full max-w-2xl flex-col items-center gap-8 text-center"
      >
        {/* Big gradient cube logo */}
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
          <Box size={32} strokeWidth={1.75} className="text-white" />
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
          Forge a 3D product mesh
        </motion.h1>

        <motion.p
          variants={{
            hidden: { y: 12, opacity: 0 },
            show: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="-mt-4 max-w-md text-[14px] leading-relaxed text-muted"
        >
          Describe a product or drop in a clean photo. fal.ai/trellis turns it
          into a downloadable GLB you can spin and inspect.
        </motion.p>

        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
          }}
          className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {SUGGESTIONS.map(({ id, icon: Icon, title, prompt, kind }) => (
            <motion.button
              key={id}
              type="button"
              onClick={() =>
                kind === "upload" ? onTriggerUpload() : onPickPrompt(prompt)
              }
              variants={{
                hidden: { y: 16, opacity: 0 },
                show: { y: 0, opacity: 1 },
              }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              data-suggestion-id={id}
              data-suggestion-kind={kind}
              className={cn(
                "group relative flex w-full items-start gap-3 rounded-2xl p-4 text-left",
                "bg-white/[0.03] backdrop-blur-xl",
                "border border-white/[0.06]",
                "transition-[border-color,box-shadow] duration-200",
                "hover:border-brand-cyan/25 hover:shadow-[0_0_30px_-12px_rgba(56,189,248,0.5)]",
              )}
            >
              <span
                className="
                  inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                  bg-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/20
                "
              >
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {title}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-muted">
                  {prompt}
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default StudioEmptyState;
