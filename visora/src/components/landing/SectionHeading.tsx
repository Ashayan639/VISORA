"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

/**
 * Shared header for marketing sections. Animates the eyebrow → title →
 * subtitle stack with a short stagger when scrolled into view.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
      className={cn(
        "mx-auto flex max-w-3xl flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <motion.span
          variants={{
            hidden: { y: 12, opacity: 0 },
            show: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="
            inline-flex items-center rounded-full px-3 py-1
            bg-white/[0.04] border border-[#4F5052]/30
            text-[12px] font-medium text-muted
          "
        >
          {eyebrow}
        </motion.span>
      ) : null}

      <motion.h2
        variants={{
          hidden: { y: 16, opacity: 0 },
          show: { y: 0, opacity: 1 },
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="
          text-4xl sm:text-5xl font-bold tracking-tight
          text-foreground
        "
      >
        {title}
      </motion.h2>

      {subtitle ? (
        <motion.p
          variants={{
            hidden: { y: 16, opacity: 0 },
            show: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-2xl text-base sm:text-lg text-muted leading-relaxed"
        >
          {subtitle}
        </motion.p>
      ) : null}
    </motion.div>
  );
}

export default SectionHeading;
