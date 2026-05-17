"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AuthBackdrop } from "@/components/auth/AuthBackdrop";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, isLoggedIn, loading, signOut, authConfigured } = useAuth();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  if (!isLoggedIn || !profile) {
    return null;
  }

  const initial = (profile.name ?? profile.email ?? "U").trim().charAt(0).toUpperCase();

  return (
    <AuthBackdrop>
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border border-[#4F5052]/30",
          "bg-[#282728]/80 p-8 backdrop-blur-xl sm:p-10",
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full bg-foreground ring-2 ring-[#4F5052]/30">
            {profile.image ? (
              <Image
                src={profile.image}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-background">
                {initial}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {profile.name ?? "VISORA user"}
          </h1>
          {profile.email ? (
            <p className="mt-1 text-sm text-muted">{profile.email}</p>
          ) : null}
          {!authConfigured ? (
            <p className="mt-3 text-xs text-hint">Demo mode — Supabase not configured.</p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/generate"
            className="visora-btn w-full rounded-xl bg-foreground py-3 text-center text-[15px] font-semibold text-background hover:opacity-90"
          >
            Open Studio
          </Link>
          <Link
            href="/gallery"
            className="w-full rounded-xl border border-[#4F5052]/30 py-3 text-center text-[14px] font-medium text-foreground transition-colors hover:bg-card-hover"
          >
            View Gallery
          </Link>
          <button
            type="button"
            onClick={() => void signOut().then(() => router.push("/"))}
            className="w-full rounded-xl py-3 text-[14px] text-muted transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </AuthBackdrop>
  );
}
