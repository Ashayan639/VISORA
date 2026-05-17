"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

interface RevealOnScrollProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
  /** Stagger direct motion children by 0.1s */
  stagger?: boolean;
}

const viewport = { once: true, amount: 0.12 } as const;

/**
 * Fades the section up when it enters the viewport (once).
 */
export function RevealOnScroll({
  children,
  className,
  stagger = false,
  ...props
}: RevealOnScrollProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={{
        hidden: {},
        show: {
          transition: stagger ? { staggerChildren: 0.1 } : undefined,
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}

interface RevealItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

/** Child item for use inside `RevealOnScroll` with `stagger`. */
export function RevealItem({ children, className, ...props }: RevealItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 28 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: "easeOut" },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
