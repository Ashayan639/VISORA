"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Lightbulb, type LucideIcon } from "lucide-react";

import { SectionHeading } from "./SectionHeading";
import { RevealSection } from "./RevealSection";
import { cn } from "@/lib/utils";

interface SolutionMode {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  steps: string[];
  cta: { label: string; href: string };
  /** Slight visual emphasis for the second mode card. */
  emphasis?: boolean;
}

const MODES: SolutionMode[] = [
  {
    icon: Lightbulb,
    title: "Idea to Reality",
    subtitle: "Start from nothing but a sentence.",
    steps: [
      "Describe your startup in plain English",
      "AI builds the brand brain — name, mission, tone",
      "fal.ai renders four launch-ready visuals",
      "A 3D product model spins it into reality",
    ],
    cta: { label: "Start from an idea", href: "/generate?mode=idea" },
  },
  {
    icon: Globe,
    title: "URL to Reality",
    subtitle: "Refresh a brand you already own.",
    steps: [
      "Drop any live website URL",
      "AI extracts the existing brand DNA",
      "fal.ai regenerates visuals that fit your voice",
      "Get a Trust Score plus a refreshed launch pack",
    ],
    cta: { label: "Refresh a URL", href: "/generate?mode=url" },
    emphasis: true,
  },
];

function ModeCard({
  mode,
  fromX,
  delay,
}: {
  mode: SolutionMode;
  fromX: number;
  delay: number;
}) {
  const { icon: Icon, title, subtitle, steps, cta, emphasis } = mode;

  return (
    <motion.div
      initial={{ x: fromX, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col gap-6 rounded-3xl p-8 sm:p-10",
        "bg-card border border-[#4F5052]/30",
        "transition-[border-color,box-shadow,background-color] duration-300",
        "hover:bg-card-hover hover:border-[#818283]/50",
        "hover:shadow-[0_0_60px_-12px_rgba(255,255,255,0.08)]",
        emphasis && "border-[#818283]/40",
      )}
    >
      <motion.div
        className="flex items-start gap-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.05 }}
      >
        <motion.div
          className="
            inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1
            bg-white/[0.04] text-foreground ring-[#4F5052]/30
          "
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Icon size={26} strokeWidth={1.75} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.1 }}
        >
          <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </motion.div>
      </motion.div>

      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-sm text-muted">
            <span
              className="
                mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center
                rounded-full bg-foreground text-[10px] font-bold text-background
              "
            >
              {i + 1}
            </span>
            <span className="leading-relaxed text-foreground/85">{step}</span>
          </li>
        ))}
      </ol>

      <Link
        href={cta.href}
        className="
          group/cta mt-2 inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5
          text-sm font-semibold bg-foreground text-background shadow-md shadow-black/25
          transition-all duration-200 hover:scale-105 hover:bg-foreground/90
        "
      >
        {cta.label}
        <ArrowRight
          size={16}
          className="transition-transform duration-200 group-hover/cta:translate-x-0.5"
        />
      </Link>
    </motion.div>
  );
}

export function SolutionSection() {
  return (
    <section className="relative w-full py-24 sm:py-32">
      <motion.div
        className="mx-auto max-w-7xl px-6 md:px-12"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <SectionHeading
          title="Two Paths to Visual Reality"
          subtitle="Whether you have a napkin sketch or a live site, VISORA meets you where you are."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <ModeCard mode={MODES[0]} fromX={-40} delay={0} />
          <ModeCard mode={MODES[1]} fromX={40} delay={0.1} />
        </div>
      </motion.div>
    </section>
  );
}

export default SolutionSection;
