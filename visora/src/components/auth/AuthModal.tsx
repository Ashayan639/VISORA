"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "signIn" | "signUp";
}

export function AuthModal({
  open,
  onClose,
  initialMode = "signIn",
}: AuthModalProps) {
  const router = useRouter();

  const handleUnconfigured = useCallback(() => {
    onClose();
    router.push("/generate");
  }, [onClose, router]);

  const handleSuccess = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="auth-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100]"
        >
          <motion.button
            type="button"
            aria-label="Close sign in dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
          />

          <div className="relative z-10 flex min-h-full items-center justify-center overflow-y-auto p-4 py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="relative w-full max-w-[420px]"
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={cn(
                  "absolute -right-2 -top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full",
                  "border border-[#4F5052]/50 bg-[#282728] text-muted",
                  "transition-colors hover:bg-card-hover hover:text-foreground",
                )}
              >
                <X size={18} />
              </button>

              <h2 id="auth-modal-title" className="sr-only">
                Sign in or create an account
              </h2>

              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl" />

              <AuthCard
                key={initialMode}
                defaultMode={initialMode}
                onUnconfigured={handleUnconfigured}
                onSuccess={handleSuccess}
                className="relative z-10"
              />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default AuthModal;
