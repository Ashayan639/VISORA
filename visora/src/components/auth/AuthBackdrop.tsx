"use client";

import { motion } from "framer-motion";

import { Spotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/utils";

interface AuthBackdropProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-screen auth shell — VISORA dark background + diagonal spotlight.
 */
export function AuthBackdrop({ children, className }: AuthBackdropProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-10",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[#0D0E10]"
        aria-hidden
      />
      <Spotlight
        className="-top-32 right-0 md:right-8 md:top-0 lg:right-16"
        fill="white"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[480px] w-[480px] rounded-full bg-white/[0.02] blur-3xl"
      />
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}
