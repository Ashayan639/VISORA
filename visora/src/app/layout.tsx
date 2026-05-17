import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { PageTransition } from "@/components/providers/PageTransition";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

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
      className={`${inter.variable} h-full antialiased bg-[#020617]`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col overflow-x-clip bg-[#020617] text-foreground font-sans"
        suppressHydrationWarning
      >
        <AuthProvider>
          <Navbar />
          {/* `pt-16` clears the 64px fixed navbar. */}
          <main className="flex min-h-0 flex-1 flex-col pt-16">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
