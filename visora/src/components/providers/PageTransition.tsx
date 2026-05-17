"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Route-level enter/exit: fade + slight rise on enter, quick fade on exit.
 * Children may be Server Components — only this shell is a client boundary.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className="flex min-h-0 w-full flex-1 flex-col"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        exit={{
          opacity: 0,
          transition: { duration: 0.2, ease: "easeOut" },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
