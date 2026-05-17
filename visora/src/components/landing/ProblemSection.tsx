"use client";

import { motion } from "framer-motion";
import {
  Box,
  Image as ImageIcon,
  RefreshCw,
  ShieldOff,
  Sparkles,
  Unplug,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "./SectionHeading";
import { RevealSection } from "./RevealSection";

interface Problem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PROBLEMS: Problem[] = [
  {
    icon: Sparkles,
    title: "Generic AI Brands",
    description:
      "Every prompt-built startup looks the same. Same fonts, same gradients, same hollow voice.",
  },
  {
    icon: ShieldOff,
    title: "Low Customer Trust",
    description:
      "AI-generated copy without proof, story, or signals leaves visitors skeptical at first glance.",
  },
  {
    icon: ImageIcon,
    title: "Weak Visual Identity",
    description:
      "Stock photos and placeholder mockups break the spell. Founders can't ship without real imagery.",
  },
  {
    icon: Box,
    title: "No 3D Experience",
    description:
      "Modern brands hint at physicality. Most launch pages still feel like flat 2010 marketing.",
  },
  {
    icon: Unplug,
    title: "Disconnected Tools",
    description:
      "Branding lives here, visuals there, copy somewhere else. Founders ship slower because of it.",
  },
  {
    icon: RefreshCw,
    title: "Stale Existing Brands",
    description:
      "Live websites grow stale fast. There's no easy way to refresh visuals without a redesign.",
  },
];

export function ProblemSection() {
  return (
    <RevealSection className="relative w-full py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <SectionHeading
          title="The Problem with AI-Generated Brands"
          subtitle="AI makes content easy. But easy doesn't mean trusted."
        />

        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
          }}
          className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {PROBLEMS.map(({ icon: Icon, title, description }) => (
            <motion.li
              key={title}
              variants={{
                hidden: { y: 24, opacity: 0 },
                show: { y: 0, opacity: 1 },
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              className="
                group relative rounded-2xl p-8
                bg-white/[0.03] backdrop-blur-xl
                border border-white/[0.06]
                transition-[border-color,box-shadow,transform] duration-200
                hover:border-brand-cyan/20 hover:shadow-[0_0_40px_-12px_rgba(56,189,248,0.35)]
              "
            >
              <div
                className="
                  mb-5 inline-flex h-11 w-11 items-center justify-center
                  rounded-xl bg-brand-cyan/10 text-brand-cyan
                  ring-1 ring-brand-cyan/20
                  transition-colors duration-300
                  group-hover:bg-brand-cyan/15
                "
              >
                <Icon size={24} strokeWidth={1.75} />
              </div>
              <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {description}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </RevealSection>
  );
}

export default ProblemSection;
