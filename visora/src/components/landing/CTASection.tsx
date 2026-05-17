"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";

import { RevealSection } from "./RevealSection";

/**
 * Final landing CTA — a gradient-bordered card with a subtle animated
 * mesh background. The mesh is two slow-drifting radial gradients
 * orchestrated with Framer's `animate` prop (cheap; no JS scroll handlers).
 */
export function CTASection() {
  return (
    <RevealSection className="relative w-full pb-32 pt-16 sm:pb-40 sm:pt-24">
      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="
            relative overflow-hidden rounded-3xl
            p-[1px] bg-gradient-to-br from-brand-cyan via-brand-purple to-brand-cyan
            shadow-[0_30px_80px_-30px_rgba(56,189,248,0.45)]
          "
        >
          <div
            className="
              relative overflow-hidden rounded-[calc(1.5rem-1px)]
              bg-background
              px-6 py-16 sm:px-16 sm:py-20
            "
          >
            {/* Animated gradient mesh */}
            <motion.div
              aria-hidden
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundImage:
                  "radial-gradient(40% 50% at 20% 30%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(35% 45% at 80% 70%, rgba(168,85,247,0.18) 0%, transparent 60%), radial-gradient(30% 40% at 50% 100%, rgba(56,189,248,0.10) 0%, transparent 60%)",
                backgroundSize: "200% 200%",
              }}
              className="pointer-events-none absolute inset-0"
            />

            {/* Soft top vignette */}
            <div
              aria-hidden
              className="
                pointer-events-none absolute inset-x-0 top-0 h-40
                bg-gradient-to-b from-brand-cyan/5 to-transparent
              "
            />

            <div className="relative flex flex-col items-center text-center">
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="
                  inline-flex items-center gap-2 rounded-full px-3 py-1
                  bg-brand-cyan/10 border border-brand-cyan/30
                  text-[12px] font-medium text-brand-cyan
                "
              >
                <Rocket size={12} strokeWidth={2} />
                Ready to launch
              </motion.span>

              <motion.h2
                initial={{ y: 16, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="
                  mt-5 max-w-2xl text-3xl sm:text-5xl font-bold tracking-tight leading-tight
                  bg-clip-text text-transparent
                  bg-gradient-to-b from-neutral-50 to-neutral-400
                "
              >
                Create Your Startup Reality
                <br className="hidden sm:block" /> Before You Launch
              </motion.h2>

              <motion.p
                initial={{ y: 16, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-5 max-w-xl text-base leading-relaxed text-muted"
              >
                Brand, visuals, 3D, trust signals, marketing copy — generated, scored, and saved in minutes. No design team required.
              </motion.p>

              <motion.div
                initial={{ y: 16, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
              >
                <Link
                  href="/generate"
                  className="
                    group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white
                    bg-gradient-to-r from-brand-cyan to-brand-purple
                    shadow-lg shadow-brand-cyan/25
                    transition-all duration-200
                    hover:scale-105 hover:shadow-xl hover:shadow-brand-purple/40
                  "
                >
                  Start Building — It&apos;s Free
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
                <p className="text-xs text-hint">No credit card. No signup wall.</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </RevealSection>
  );
}

export default CTASection;
