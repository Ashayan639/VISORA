"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { RevealOnScroll } from "@/components/motion/RevealOnScroll";
import { ApiCardsSection } from "@/components/tech/ApiCardsSection";
import { ApiRoutesTable } from "@/components/tech/ApiRoutesTable";
import { ArchitectureFlow } from "@/components/tech/ArchitectureFlow";
import { WhyFalCoreSection } from "@/components/tech/WhyFalCoreSection";
import { cn } from "@/lib/utils";

export default function TechnologyPage() {
  return (
    <div className="relative w-full overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-24 h-[420px] w-[420px] rounded-full bg-hint/[0.05] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-[45%] h-[380px] w-[380px] rounded-full bg-white/[0.03] blur-3xl"
      />

      {/* Section 1 — Hero */}
      <section className="relative mx-auto max-w-4xl px-6 pb-8 pt-14 text-center sm:px-8 sm:pt-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1",
              "border border-[#4F5052]/30 bg-white/[0.04]",
              "text-[12px] font-medium text-foreground",
            )}
          >
            For hackathon judges
          </span>
          <h1 className="mt-6 text-[48px] font-bold leading-[1.08] tracking-tight text-foreground">
            How VISORA Works Under the Hood
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            A three-API architecture:{" "}
            <span className="text-foreground">OpenAI</span> builds the brand brain,{" "}
            <span className="text-foreground">fal.ai</span> renders visuals and 3D
            reality, and{" "}
            <span className="text-foreground">Supabase</span> stores every generated
            project for the gallery.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/generate"
              className={cn(
                "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white",
                "bg-foreground text-background",
                "transition-transform hover:scale-[1.02]",
              )}
            >
              Try the pipeline
            </Link>
            <Link
              href="/gallery"
              className={cn(
                "inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-2.5",
                "text-sm font-medium text-foreground backdrop-blur-md",
                "hover:border-[#4F5052]/30 hover:text-foreground",
              )}
            >
              View gallery
            </Link>
          </div>
        </motion.div>
      </section>

      <RevealOnScroll>
        <ArchitectureFlow />
      </RevealOnScroll>
      <RevealOnScroll>
        <ApiCardsSection />
      </RevealOnScroll>
      <RevealOnScroll>
        <ApiRoutesTable />
      </RevealOnScroll>
      <RevealOnScroll>
        <WhyFalCoreSection />
      </RevealOnScroll>
    </div>
  );
}
