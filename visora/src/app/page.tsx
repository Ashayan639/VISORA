"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { SplineScene } from "@/components/ui/splite";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { WhyFalSection } from "@/components/landing/WhyFalSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";

const SPLINE_SCENE =
  "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

/* ─────────────────────────────────────────────────────────────
   Bits
   ───────────────────────────────────────────────────────────── */

function FloatingOrbs() {
  return (
    <>
      <div
        aria-hidden
        className="
          pointer-events-none absolute -top-20 -right-20
          h-[600px] w-[600px] rounded-full
          bg-brand-cyan opacity-[0.04] blur-3xl
          animate-float-slow
        "
      />
      <div
        aria-hidden
        style={{ animationDelay: "2s" }}
        className="
          pointer-events-none absolute -bottom-20 -left-20
          h-[400px] w-[400px] rounded-full
          bg-brand-purple opacity-[0.03] blur-3xl
          animate-float-slow
        "
      />
    </>
  );
}

function MobileSplinePlaceholder() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      <div
        className="
          absolute inset-0 rounded-3xl
          bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20
          backdrop-blur-xl border border-white/[0.06]
        "
      />
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="
          absolute top-8 left-8 h-16 w-16 rounded-2xl
          bg-brand-cyan/40 blur-xl
        "
      />
      <motion.div
        animate={{ y: [0, -16, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          delay: 0.6,
          ease: "easeInOut",
        }}
        className="
          absolute bottom-8 right-8 h-20 w-20 rounded-2xl
          bg-brand-purple/40 blur-xl
        "
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="
            text-7xl font-bold tracking-tight
            bg-clip-text text-transparent
            bg-gradient-to-br from-brand-cyan to-brand-purple
            drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]
          "
        >
          V
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <WhyFalSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
    </>
  );
}

function Hero() {
  return (
    <section className="relative w-full">
      <Card
        className="
          relative w-full overflow-hidden rounded-none
          min-h-[calc(100vh-4rem)]
          bg-black/[0.96] border-0
        "
      >
        <Spotlight
          className="-top-40 left-0 md:-top-20 md:left-60"
          fill="white"
        />
        <FloatingOrbs />

        <div
          className="
            relative z-10 mx-auto flex w-full max-w-7xl
            flex-col-reverse md:flex-row
            items-center
            min-h-[calc(100vh-4rem)]
            gap-12 md:gap-8
            px-6 md:px-12
            py-16 md:py-12
          "
        >
          {/* ── Left: copy ─────────────────────────────────── */}
          <div className="flex flex-1 flex-col justify-center gap-6">
            {/* Badge */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="
                inline-flex items-center gap-2 self-start
                rounded-full px-3 py-1
                bg-brand-cyan/10 border border-brand-cyan/30
                text-[12px] font-medium text-brand-cyan
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" />
              Powered by fal.ai
            </motion.div>

            {/* Heading line 1 */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              className="
                text-6xl sm:text-7xl font-bold tracking-tight leading-[0.95]
                bg-clip-text text-transparent
                bg-gradient-to-b from-neutral-50 to-neutral-400
              "
            >
              VISORA
            </motion.h1>

            {/* Heading line 2 */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
              className="
                text-2xl sm:text-3xl font-semibold tracking-tight leading-tight
                bg-clip-text text-transparent
                bg-gradient-to-b from-neutral-50 to-neutral-400
              "
            >
              Visual Business Reality Engine
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              className="max-w-lg text-base leading-relaxed text-[#94A3B8]"
            >
              Turn startup ideas and existing websites into market-ready brand
              visuals, 3D product models, trust scores, and launch-ready
              marketing assets.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <Link
                href="/generate"
                className="
                  group relative inline-flex items-center justify-center
                  rounded-full px-6 py-3 text-sm font-semibold text-white
                  bg-gradient-to-r from-brand-cyan to-brand-purple
                  shadow-lg shadow-brand-cyan/20
                  transition-all duration-200
                  hover:scale-105 hover:shadow-xl hover:shadow-brand-purple/45
                "
              >
                Start Building Reality
              </Link>
              <Link
                href="/demo"
                className="
                  inline-flex items-center justify-center
                  rounded-full px-6 py-3 text-sm font-semibold
                  border border-brand-cyan/40 text-muted
                  transition-all duration-200
                  hover:scale-105 hover:bg-brand-cyan/5 hover:text-foreground hover:border-brand-cyan
                "
              >
                Watch Demo
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
              className="pt-4 text-sm text-[#64748B]"
            >
              4 fal.ai Visuals
              <span className="mx-2 text-hint/50">·</span>
              3D Models
              <span className="mx-2 text-hint/50">·</span>
              AI Trust Score
            </motion.p>
          </div>

          {/* ── Right: Spline / mobile placeholder ─────────── */}
          <div className="relative flex flex-1 items-center justify-center w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="
                hidden md:block
                relative aspect-square w-full max-w-[450px] max-h-[450px]
              "
            >
              <SplineScene scene={SPLINE_SCENE} className="h-full w-full" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="md:hidden w-full"
            >
              <MobileSplinePlaceholder />
            </motion.div>
          </div>
        </div>
      </Card>
    </section>
  );
}
