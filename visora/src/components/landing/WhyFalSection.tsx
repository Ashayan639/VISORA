"use client";

import { motion } from "framer-motion";
import {
  Component,
  Image as ImageIcon,
  Megaphone,
  Package,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "./SectionHeading";
import { RevealSection } from "./RevealSection";
import { cn } from "@/lib/utils";

interface VisualCard {
  icon: LucideIcon;
  title: string;
  description: string;
  emphasis?: boolean;
}

const CARDS: VisualCard[] = [
  {
    icon: Package,
    title: "Product Mockup",
    description: "Render the product on-shelf, in-hand, or in context. Pixel-clean.",
  },
  {
    icon: ImageIcon,
    title: "Hero Image",
    description: "A signature image for the top of every landing page.",
  },
  {
    icon: Megaphone,
    title: "Social Ad",
    description: "Instagram-ready frames sized for paid + organic campaigns.",
  },
  {
    icon: Sun,
    title: "Lifestyle Scene",
    description: "Aspirational scenes that show the product in customer life.",
  },
  {
    icon: Component,
    title: "3D Model",
    description: "A spinning, embed-ready GLB of your product. Cinema-grade.",
    emphasis: true,
  },
];

function VisualTileInner({ card }: { card: VisualCard }) {
  const { icon: Icon, title, description, emphasis } = card;
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6",
        "bg-card border border-[#4F5052]/30",
        "transition-[border-color,box-shadow,background-color] duration-300",
        "hover:bg-card-hover hover:border-[#818283]/50",
        "hover:shadow-[0_0_40px_-12px_rgba(255,255,255,0.06)]",
        emphasis && "border-[#818283]/40",
      )}
    >
      <motion.span
        aria-hidden
        animate={emphasis ? { opacity: [0.2, 0.45, 0.2] } : { opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: emphasis ? 2.4 : 3.4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-white/[0.02] blur-2xl"
      />

      <div className="relative">
        <div
          className={cn(
            "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1",
            "bg-white/[0.04] text-foreground ring-[#4F5052]/30",
            emphasis && "ring-[#818283]/40",
          )}
        >
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        {emphasis ? (
          <span className="absolute right-0 top-0 inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground ring-1 ring-[#4F5052]/30">
            3D
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function WhyFalSection() {
  return (
    <section className="relative w-full py-24 sm:py-32">
      <motion.div
        className="mx-auto max-w-7xl px-6 md:px-12"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <SectionHeading title="fal.ai Powers the Visual Reality" />

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="mt-6 flex justify-center"
        >
          <span
            className="
              relative inline-flex items-center rounded-full
              border border-[#4F5052]/30 bg-card px-4 py-1.5
              text-xs font-semibold tracking-wide text-foreground
            "
          >
            BUILT FOR BEST USE OF FAL
          </span>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
          }}
          className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5"
        >
          {CARDS.map((card) => (
            <motion.div
              key={card.title}
              variants={{
                hidden: { y: 20, opacity: 0 },
                show: { y: 0, opacity: 1 },
              }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              className="duration-200 will-change-transform"
            >
              <VisualTileInner card={card} />
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mt-16 max-w-3xl text-center text-base sm:text-lg leading-relaxed text-muted"
        >
          <span className="text-foreground">OpenAI</span> creates the brain.
          <span className="mx-2 text-[#4F5052]">·</span>
          <span className="text-foreground">Supabase</span> saves the memory.
          <span className="mx-2 text-[#4F5052]">·</span>
          <span className="font-semibold text-foreground">fal.ai</span>{" "}
          creates the visual reality.
        </motion.p>
      </motion.div>
    </section>
  );
}

export default WhyFalSection;
