"use client";

import { motion } from "framer-motion";
import {
  Bookmark,
  Brain,
  Component,
  Dna,
  Eye,
  FlaskConical,
  Megaphone,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "./SectionHeading";
import { RevealSection } from "./RevealSection";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: "Brand Brain",
    description: "OpenAI-driven extraction of name, mission, voice, USP, and audience.",
  },
  {
    icon: TrendingUp,
    title: "Trust Score",
    description: "Quantified launch-readiness across clarity, proof, and visual identity.",
  },
  {
    icon: FlaskConical,
    title: "Visual Lab",
    description: "Four launch-ready fal.ai images with regenerate, refine, and fork.",
  },
  {
    icon: Component,
    title: "3D Studio",
    description: "Text-to-3D and image-to-3D product previews you can embed anywhere.",
  },
  {
    icon: Eye,
    title: "Website Preview",
    description: "A full hero + sections + FAQ concept stitched from your brand brain.",
  },
  {
    icon: Megaphone,
    title: "Marketing Pack",
    description: "Captions, scripts, ad headlines, email subjects — ready to copy out.",
  },
  {
    icon: Dna,
    title: "Brand DNA Scanner",
    description: "Drop any URL and we extract its tone, palette, and trust signals.",
  },
  {
    icon: Bookmark,
    title: "Saved Gallery",
    description: "Every project lives in Supabase. Fork, share, or revisit forever.",
  },
];

export function FeaturesSection() {
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
          title="Everything You Need to Ship"
          subtitle="Eight modules. One reality engine. Use what you need, save what you build."
        />

        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
          }}
          className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.li
              key={title}
              variants={{
                hidden: { y: 20, opacity: 0 },
                show: { y: 0, opacity: 1 },
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="
                group relative rounded-2xl p-6
                bg-card border border-[#4F5052]/30
                transition-[border-color,box-shadow,background-color] duration-300
                hover:bg-card-hover hover:border-[#818283]/50
                hover:shadow-[0_0_40px_-12px_rgba(255,255,255,0.06)]
              "
            >
              <motion.div
                className="
                  mb-4 inline-flex h-10 w-10 items-center justify-center
                  rounded-xl bg-white/[0.04] text-foreground ring-1 ring-[#4F5052]/30
                  transition-colors duration-300 group-hover:bg-white/[0.06]
                "
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Icon size={20} strokeWidth={1.75} />
              </motion.div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}

export default FeaturesSection;
