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
    <section className="relative w-full py-24 sm:py-32">
      <motion.div
        className="mx-auto max-w-7xl px-6 md:px-12"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
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
            show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
          }}
          className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
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
                bg-card border border-[#4F5052]/30
                transition-[border-color,box-shadow,background-color] duration-300
                hover:bg-card-hover hover:border-[#818283]/50
                hover:shadow-[0_0_40px_-12px_rgba(255,255,255,0.06)]
              "
            >
              <motion.div
                className="
                  mb-5 inline-flex h-11 w-11 items-center justify-center
                  rounded-xl bg-white/[0.04] text-foreground
                  ring-1 ring-[#4F5052]/30
                  transition-colors duration-300
                  group-hover:bg-white/[0.06]
                "
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Icon size={24} strokeWidth={1.75} />
              </motion.div>
              <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {description}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}

export default ProblemSection;
