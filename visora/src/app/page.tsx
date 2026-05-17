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
import { RevealOnScroll } from "@/components/motion/RevealOnScroll";

const SPLINE_SCENE =
  "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

const PARTNER_LOGOS = ["fal.ai", "OpenAI", "Supabase", "Next.js", "Vercel"];

/* ─────────────────────────────────────────────────────────────
   Bits
   ───────────────────────────────────────────────────────────── */

function FloatingOrbs() {
  return (
    <>
      <motion.div
        aria-hidden
        className="
          pointer-events-none absolute -top-20 -right-20
          h-[600px] w-[600px] rounded-full
          bg-white opacity-[0.02] blur-3xl
          animate-float-slow
        "
      />
      <motion.div
        aria-hidden
        style={{ animationDelay: "2s" }}
        className="
          pointer-events-none absolute -bottom-20 -left-20
          h-[400px] w-[400px] rounded-full
          bg-white opacity-[0.02] blur-3xl
          animate-float-slow
        "
      />
    </>
  );
}

function PartnerLogosRow() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-6"
    >
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#4F5052]">
        Powered by
      </span>
      {PARTNER_LOGOS.map((name) => (
        <span
          key={name}
          className="text-xs font-medium uppercase tracking-[0.14em] text-[#4F5052]"
        >
          {name}
        </span>
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <motion.div
      className="overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Hero />
      <RevealOnScroll>
        <ProblemSection />
      </RevealOnScroll>
      <RevealOnScroll>
        <SolutionSection />
      </RevealOnScroll>
      <RevealOnScroll>
        <WhyFalSection />
      </RevealOnScroll>
      <RevealOnScroll>
        <HowItWorksSection />
      </RevealOnScroll>
      <RevealOnScroll>
        <FeaturesSection />
      </RevealOnScroll>
      <RevealOnScroll>
        <CTASection />
      </RevealOnScroll>
    </motion.div>
  );
}

function Hero() {
  return (
    <section className="relative w-full">
      <Card
        className="
          relative w-full overflow-hidden rounded-none
          min-h-[calc(100vh-4rem)]
          bg-background border-0
        "
      >
        <Spotlight
          className="-top-40 left-0 md:-top-20 md:left-60"
          fill="white"
        />
        <FloatingOrbs />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="pointer-events-none hidden md:block absolute inset-y-0 right-0 z-0 w-[48%] lg:w-[52%] xl:w-[55%]"
          aria-hidden
        >
          <div className="relative h-full min-h-[calc(100vh-4rem)] w-full">
            <SplineScene
              scene={SPLINE_SCENE}
              className="h-full w-full min-h-full"
              followCursor
            />
          </div>
        </motion.div>

        <motion.div
          className="
            relative z-10 mx-auto w-full max-w-7xl
            min-h-[calc(100vh-4rem)]
            px-6 md:px-12
            py-16 md:py-0
          "
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div className="relative z-10 flex w-full flex-col justify-center gap-6 md:max-w-[52%] lg:max-w-[48%] min-h-[calc(100vh-4rem)] md:py-12">
            {/* Badge */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="
                inline-flex items-center gap-2 self-start
                rounded-full px-3 py-1
                bg-white/[0.04] border border-[#4F5052]/30
                text-[12px] font-medium text-muted
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
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
                bg-gradient-to-b from-[#F8FAFA] to-[#818283]
              "
            >
              VISORA
            </motion.h1>

            {/* Heading line 2 */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
              className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-muted"
            >
              Visual Business Reality Engine
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              className="max-w-lg text-base leading-relaxed text-hint"
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
                  rounded-full px-6 py-3 text-sm font-semibold
                  bg-foreground text-background
                  shadow-lg shadow-black/25
                  transition-all duration-200
                  hover:scale-105 hover:bg-muted hover:shadow-[0_0_40px_rgba(248,250,250,0.04)]
                "
              >
                Start Building Reality
              </Link>
              <Link
                href="/generate"
                className="
                  inline-flex items-center justify-center
                  rounded-full px-6 py-3 text-sm font-semibold
                  border border-[#4F5052]/30 text-muted
                  transition-colors duration-200
                  hover:bg-white/[0.04] hover:text-foreground hover:border-[#818283]/50
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
              className="pt-4 text-sm text-hint"
            >
              4 fal.ai Visuals
              <span className="mx-2 text-[#4F5052]">·</span>
              3D Models
              <span className="mx-2 text-[#4F5052]">·</span>
              AI Trust Score
            </motion.p>

            <PartnerLogosRow />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="relative z-10 mt-10 w-full md:hidden"
          >
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md min-h-[340px]">
              <SplineScene
                scene={SPLINE_SCENE}
                className="h-full w-full"
                followCursor
              />
            </div>
          </motion.div>
        </motion.div>
      </Card>
    </section>
  );
}
