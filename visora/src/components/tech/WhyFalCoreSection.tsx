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

import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

const OUTPUTS: { icon: LucideIcon; label: string }[] = [
  { icon: Package, label: "Product mockups" },
  { icon: ImageIcon, label: "Hero images" },
  { icon: Megaphone, label: "Social ads" },
  { icon: Sun, label: "Lifestyle scenes" },
  { icon: Component, label: "3D product models" },
];

export function WhyFalCoreSection() {
  return (
    <section className="relative w-full py-20 sm:pb-32 sm:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent)]"
      />
      <div className="relative mx-auto max-w-4xl px-6 md:px-12">
        <SectionHeading
          eyebrow="Hackathon thesis"
          title="Why fal.ai is Core"
          align="center"
        />

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-8 flex justify-center"
        >
          <span className="relative inline-flex rounded-full p-[1px] bg-foreground text-background">
            <span className="rounded-full bg-background px-5 py-2 text-xs font-bold uppercase tracking-[0.12em]">
              <span className="bg-foreground text-background bg-clip-text text-transparent">
                Best Use of fal
              </span>
            </span>
          </span>
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
          className={cn(
            "mt-10 rounded-3xl border border-[#4F5052]/30 p-8 sm:p-10",
            "bg-white/[0.03] backdrop-blur-xl",
            "shadow-[0_0_60px_-20px_rgba(255,255,255,0.25)]",
          )}
        >
          <p className="text-base leading-relaxed text-muted sm:text-lg">
            VISORA is built around a simple split:{" "}
            <span className="text-foreground">OpenAI</span> reasons about the brand,{" "}
            <span className="text-foreground">Supabase</span> remembers it, and{" "}
            <span className="bg-foreground text-background bg-clip-text font-semibold text-transparent">
              fal.ai
            </span>{" "}
            materializes what founders and judges can actually see — launch imagery and
            spin-ready 3D product meshes. fal.ai is not a side integration; it is the
            engine that turns strategy into visual and spatial business reality.
          </p>

          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OUTPUTS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={item.label}
                  initial={{ x: -8, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                  className="flex items-center gap-3 rounded-xl border border-[#4F5052]/30 bg-white/[0.02] px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-foreground ring-1 ring-[#4F5052]/30">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </motion.li>
              );
            })}
          </ul>

          <motion.p
            initial={{ y: 12, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 border-t border-[#4F5052]/30 pt-8 text-center text-lg font-medium leading-relaxed text-foreground sm:text-xl"
          >
            OpenAI creates the brain. Supabase saves the memory.{" "}
            <span className="bg-foreground text-background bg-clip-text font-bold text-transparent">
              fal.ai creates the visual and 3D business reality.
            </span>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
