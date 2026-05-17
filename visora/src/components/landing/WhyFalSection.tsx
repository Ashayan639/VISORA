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
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6",
        "bg-white/[0.03] backdrop-blur-xl",
        "border border-white/[0.06]",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-brand-cyan/25 hover:shadow-[0_0_40px_-12px_rgba(56,189,248,0.35)]",
        emphasis && "border-brand-cyan/30",
      )}
    >
      <motion.span
        aria-hidden
        animate={emphasis ? { opacity: [0.35, 0.7, 0.35] } : { opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: emphasis ? 2.4 : 3.4, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "pointer-events-none absolute -inset-px rounded-2xl blur-2xl",
          emphasis
            ? "bg-gradient-to-br from-brand-cyan/20 via-transparent to-brand-purple/20"
            : "bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-purple/10",
        )}
      />

      <div className="relative">
        <div
          className={cn(
            "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1",
            emphasis
              ? "bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/40"
              : "bg-brand-cyan/10 text-brand-cyan ring-brand-cyan/20",
          )}
        >
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        {emphasis ? (
          <span className="absolute right-0 top-0 inline-flex items-center rounded-full bg-brand-purple/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-purple ring-1 ring-brand-purple/30">
            3D
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function WhyFalSection() {
  return (
    <RevealSection className="relative w-full py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
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
              p-[1px] bg-gradient-to-r from-brand-cyan to-brand-purple
            "
          >
            <span className="rounded-full bg-background px-4 py-1.5 text-xs font-semibold tracking-wide">
              <span className="bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent">
                BUILT FOR BEST USE OF FAL
              </span>
            </span>
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
          <span className="mx-2 text-hint/60">·</span>
          <span className="text-foreground">Supabase</span> saves the memory.
          <span className="mx-2 text-hint/60">·</span>
          <span className="bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text font-semibold text-transparent">
            fal.ai
          </span>{" "}
          creates the visual reality.
        </motion.p>
      </div>
    </RevealSection>
  );
}

export default WhyFalSection;
