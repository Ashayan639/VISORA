"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Lightbulb, type LucideIcon } from "lucide-react";

import { SectionHeading } from "./SectionHeading";
import { cn } from "@/lib/utils";

interface SolutionMode {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  steps: string[];
  cta: { label: string; href: string };
  /** Tailwind classes for the icon tile + accent border glow. */
  accent: "cyan" | "purple";
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
    accent: "cyan",
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
    accent: "purple",
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
  const { icon: Icon, title, subtitle, steps, cta, accent } = mode;
  const accentClasses = {
    cyan: {
      iconBg: "bg-brand-cyan/10 text-brand-cyan ring-brand-cyan/30",
      stepDot: "bg-brand-cyan",
      ctaBg: "from-brand-cyan to-brand-purple",
      hoverGlow:
        "hover:border-brand-cyan/30 hover:shadow-[0_0_60px_-12px_rgba(56,189,248,0.35)]",
    },
    purple: {
      iconBg: "bg-brand-purple/10 text-brand-purple ring-brand-purple/30",
      stepDot: "bg-brand-purple",
      ctaBg: "from-brand-purple to-brand-cyan",
      hoverGlow:
        "hover:border-brand-purple/30 hover:shadow-[0_0_60px_-12px_rgba(168,85,247,0.35)]",
    },
  }[accent];

  return (
    <motion.div
      initial={{ x: fromX, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col gap-6 rounded-3xl p-8 sm:p-10",
        "bg-white/[0.03] backdrop-blur-xl",
        "border border-white/[0.06]",
        "transition-[border-color,box-shadow] duration-300",
        accentClasses.hoverGlow,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1",
            accentClasses.iconBg,
          )}
        >
          <Icon size={26} strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-sm text-muted">
            <span
              className={cn(
                "mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                accentClasses.stepDot,
              )}
            >
              {i + 1}
            </span>
            <span className="leading-relaxed text-foreground/85">{step}</span>
          </li>
        ))}
      </ol>

      <Link
        href={cta.href}
        className={cn(
          "group/cta mt-2 inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-semibold text-white",
          "bg-gradient-to-r shadow-md shadow-brand-cyan/15",
          "transition-all duration-200 hover:scale-105",
          accentClasses.ctaBg,
        )}
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
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <SectionHeading
          title="Two Paths to Visual Reality"
          subtitle="Whether you have a napkin sketch or a live site, VISORA meets you where you are."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <ModeCard mode={MODES[0]} fromX={-40} delay={0} />
          <ModeCard mode={MODES[1]} fromX={40} delay={0.1} />
        </div>
      </div>
    </section>
  );
}

export default SolutionSection;
