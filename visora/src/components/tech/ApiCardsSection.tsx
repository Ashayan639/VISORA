"use client";

import { motion } from "framer-motion";
import { Box, Brain, Database, Image as ImageIcon } from "lucide-react";

import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

interface ApiCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Brain;
  secondaryIcon?: typeof ImageIcon;
  highlight?: boolean;
}

const CARDS: ApiCard[] = [
  {
    id: "openai",
    title: "The Brand Brain",
    subtitle: "OpenAI",
    description:
      "Parses your idea or URL into brand identity, trust score, website concept, marketing copy, and structured prompts that downstream visual pipelines consume.",
    icon: Brain,
  },
  {
    id: "fal",
    title: "The Visual Reality Engine",
    subtitle: "fal.ai",
    description:
      "Generates product mockups, hero images, social ads, lifestyle scenes, and GLB 3D models — the pixels judges can see and spin.",
    icon: ImageIcon,
    secondaryIcon: Box,
    highlight: true,
  },
  {
    id: "supabase",
    title: "The Brand Memory",
    subtitle: "Supabase",
    description:
      "Persists projects, visuals, and 3D assets so every generated reality is recallable from the gallery across sessions.",
    icon: Database,
  },
];

function ApiCardTile({ card, index }: { card: ApiCard; index: number }) {
  const Icon = card.icon;
  const Secondary = card.secondaryIcon;

  return (
    <motion.article
      initial={{ y: 24, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border p-6 sm:p-8",
        "bg-white/[0.03] backdrop-blur-xl",
        card.highlight
          ? "border-[#4F5052]/30 shadow-[0_0_48px_-12px_rgba(255,255,255,0.45)]"
          : "border-[#4F5052]/30",
      )}
    >
      {card.highlight ? (
        <>
          <motion.span
            aria-hidden
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-white/[0.02] blur-2xl"
          />
          <span className="absolute right-4 top-4 z-10 inline-flex rounded-full bg-foreground text-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg shadow-black/25">
            Core Engine
          </span>
        </>
      ) : null}

      <div className="relative flex flex-1 flex-col">
        <div className="mb-5 flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl ring-1",
              card.highlight
                ? "bg-white/[0.06] text-foreground ring-[#4F5052]/30"
                : "bg-white/[0.04] text-foreground ring-white/10",
            )}
          >
            <Icon size={24} strokeWidth={1.75} />
          </div>
          {Secondary ? (
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg ring-1",
                "bg-white/[0.06] text-muted ring-[#4F5052]/30",
              )}
            >
              <Secondary size={20} strokeWidth={1.75} />
            </div>
          ) : null}
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hint">
          {card.subtitle}
        </p>
        <h3 className="mt-1 text-xl font-bold text-foreground">{card.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
          {card.description}
        </p>
      </div>
    </motion.article>
  );
}

export function ApiCardsSection() {
  return (
    <section className="relative w-full py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(129,130,131,0.06),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <SectionHeading
          eyebrow="Stack"
          title="Three APIs, One Reality"
          subtitle="Each provider owns a distinct layer — strategy, pixels, persistence."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {CARDS.map((card, i) => (
            <ApiCardTile key={card.id} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
