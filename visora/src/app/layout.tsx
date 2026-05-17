import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/providers/AuthProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "VISORA — Visual Business Reality Engine",
  description:
    "Turn an idea or URL into a brand, trust score, visuals, and a website concept.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full bg-background antialiased"
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full min-h-[100dvh] flex-col overflow-x-hidden bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
