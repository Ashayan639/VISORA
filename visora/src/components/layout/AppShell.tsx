"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/motion/PageTransition";

/** Routes that use a full-bleed layout without navbar or footer. */
function isMinimalRoute(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimal = isMinimalRoute(pathname ?? "");

  if (minimal) {
    return (
      <main className="flex min-h-screen min-h-[100dvh] flex-1 flex-col overflow-x-hidden">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden pt-16">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
