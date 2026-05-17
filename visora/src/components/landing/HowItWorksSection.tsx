"use client";

import { motion } from "framer-motion";
import {
  Bookmark,
  Box,
  Brain,
  Pencil,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "./SectionHeading";
import { RevealSection } from "./RevealSection";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: Pencil,
    title: "Enter Idea or URL",
    description: "Type a sentence or drop a live website. That's the whole intake.",
  },
  {
    icon: Brain,
    title: "AI Brand Brain",
    description: "OpenAI extracts name, mission, voice, audience, and proof points.",
  },
  {
    icon: Sparkles,
    title: "fal.ai Visuals",
    description: "Four launch-ready images — mockup, hero, social, lifestyle.",
  },
  {
    icon: Box,
    title: "fal.ai 3D Model",
    description: "A spinning product or scene rendered as a GLB you can embed.",
  },
  {
    icon: Bookmark,
    title: "Save to Gallery",
    description: "Everything lands in Supabase. Revisit, fork, or ship it live.",
  },
];

/**
 * Horizontal 5-step timeline on md+, vertical on mobile.
 *
 * The connecting gradient line uses `scaleX` from a single `motion.div`
 * with a left transform-origin so it appears to "draw" left-to-right on
 * scroll. Steps stagger in via the parent variant so each one pops as the
 * line approximately reaches it.
 */
export function HowItWorksSection() {
  return (
    <RevealSection className="relative w-full py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <SectionHeading title="How It Works" subtitle="Five steps from blank slate to launch-ready." />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.1, delayChildren: 0.15 },
            },
          }}
          className="relative mt-20"
        >
          {/* Desktop: horizontal timeline (lg+) — tablet uses vertical stack */}
          <div className="hidden lg:block">
            <div className="relative h-px w-full bg-white/[0.06]">
              <motion.div
                variants={{
                  hidden: { scaleX: 0 },
                  show: { scaleX: 1 },
                }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                style={{ transformOrigin: "left" }}
                className="
                  absolute inset-0 h-px
                  bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan
                  shadow-[0_0_18px_-2px_rgba(56,189,248,0.6)]
                "
              />
            </div>

            <ol className="relative -mt-6 grid grid-cols-5 gap-4">
              {STEPS.map(({ icon: Icon, title, description }, i) => (
                <motion.li
                  key={title}
                  variants={{
                    hidden: { y: 18, opacity: 0 },
                    show: { y: 0, opacity: 1 },
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className="
                      relative flex h-12 w-12 items-center justify-center rounded-full
                      bg-background ring-1 ring-white/10
                      text-brand-cyan
                    "
                  >
                    <Icon size={20} strokeWidth={1.75} />
                    <span
                      aria-hidden
                      className="absolute -inset-1 rounded-full bg-brand-cyan/10 blur-md"
                    />
                  </div>
                  <span className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-hint">
                    Step {i + 1}
                  </span>
                  <h3 className="mt-1 text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-1.5 max-w-[180px] text-[13px] leading-relaxed text-muted">
                    {description}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>

          {/* Mobile: vertical timeline */}
          <ol className="relative lg:hidden">
            <div className="absolute left-6 top-0 h-full w-px bg-white/[0.06]" />
            <motion.div
              variants={{
                hidden: { scaleY: 0 },
                show: { scaleY: 1 },
              }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
              className="
                absolute left-6 top-0 h-full w-px
                bg-gradient-to-b from-brand-cyan via-brand-purple to-brand-cyan
              "
            />

            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <motion.li
                key={title}
                variants={{
                  hidden: { x: -10, opacity: 0 },
                  show: { x: 0, opacity: 1 },
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex gap-5 pb-10 pl-0"
              >
                <div
                  className="
                    relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full
                    bg-background ring-1 ring-white/10 text-brand-cyan
                  "
                >
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div className="pt-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-hint">
                    Step {i + 1}
                  </span>
                  <h3 className="mt-1 text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                    {description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>
    </RevealSection>
  );
}

export default HowItWorksSection;
