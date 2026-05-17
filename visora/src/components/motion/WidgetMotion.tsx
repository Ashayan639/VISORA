"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface WidgetMotionProps {
  children: React.ReactNode;
  className?: string;
}

/** Spring entrance for chat widgets. */
export function WidgetMotion({ children, className }: WidgetMotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 28,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
