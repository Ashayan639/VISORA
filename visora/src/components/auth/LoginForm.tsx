"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback } from "react";

import { AuthBackdrop } from "@/components/auth/AuthBackdrop";
import { AuthCard, type AuthMode } from "@/components/auth/AuthCard";
import { cn } from "@/lib/utils";

function modeFromTab(tab: string | null): AuthMode {
  return tab === "signup" ? "signUp" : "signIn";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const mode = modeFromTab(tab);

  const handleUnconfigured = useCallback(() => {
    router.push("/generate");
  }, [router]);

  return (
    <AuthBackdrop>
      <Link
        href="/"
        className={cn(
          "absolute left-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5",
          "text-sm text-muted transition-colors hover:text-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back home
      </Link>

      <AuthCard
        key={tab ?? "signin"}
        defaultMode={mode}
        onUnconfigured={handleUnconfigured}
      />
    </AuthBackdrop>
  );
}
