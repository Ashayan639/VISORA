"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, isLinkActive, type NavLink } from "@/lib/nav";

/* ─────────────────────────────────────────────────────────────
   Bits
   ───────────────────────────────────────────────────────────── */

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex items-center gap-2.5 group shrink-0"
      aria-label="VISORA — home"
    >
      <span
        className="
          flex h-8 w-8 items-center justify-center rounded-lg
          border border-foreground bg-transparent font-bold text-foreground
          transition-shadow duration-300
          group-hover:shadow-[0_0_24px_rgba(248,250,250,0.06)]
        "
      >
        V
      </span>
      <span className="font-semibold tracking-tight text-foreground">VISORA</span>
    </Link>
  );
}

function LinkPill({ link, pathname }: { link: NavLink; pathname: string }) {
  const active = isLinkActive(pathname, link);
  return (
    <Link
      href={link.href}
      className={cn(
        "group relative text-[14px] transition-colors duration-200",
        active ? "text-foreground" : "text-muted hover:text-foreground",
        "after:absolute after:-bottom-1.5 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2",
        "after:bg-foreground",
        "after:transition-all after:duration-300 after:ease-out",
        "hover:after:w-full",
        active && "after:w-full",
      )}
    >
      {link.label}
    </Link>
  );
}

function UserAvatar({
  user,
  onClick,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  onClick: () => void;
}) {
  const initial = (user.name ?? user.email ?? "U").trim().charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        relative h-9 w-9 overflow-hidden rounded-full
        bg-foreground ring-1 ring-[#4F5052]/30 transition-all duration-200
        hover:ring-white/30 hover:scale-105
      "
      aria-label={`Signed in as ${user.name ?? user.email ?? "user"} — click to sign out`}
      title="Sign out"
    >
      {user.image ? (
        <Image
          src={user.image}
          alt=""
          width={36}
          height={36}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
          {initial}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Navbar
   ───────────────────────────────────────────────────────────── */

export function Navbar() {
  const pathname = usePathname() ?? "/";
  const { profile, isAuthenticated, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Scroll shadow + glass background after a few pixels.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Lock body scroll while mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 w-full",
          "transition-[background-color,backdrop-filter,border-color] duration-300",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-[#4F5052]/30"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Logo */}
          <Logo />

          {/* Center: Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {PRIMARY_NAV.map((link) => (
              <li key={link.href}>
                <LinkPill link={link} pathname={pathname} />
              </li>
            ))}
          </ul>

          {/* Right: Auth + CTA (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && profile ? (
              <UserAvatar user={profile} onClick={() => void signOut()} />
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="
                  rounded-full px-4 py-1.5 text-[13px] font-medium
                  border border-[#4F5052]/30 text-muted
                  transition-colors duration-200
                  hover:bg-white/[0.04] hover:border-[#818283]/50 hover:text-foreground
                "
              >
                Login
              </button>
            )}
            <Link
              href="/generate"
              className="
                group relative rounded-full px-4 py-1.5 text-[13px] font-medium
                bg-foreground text-background
                shadow-md shadow-black/25
                transition-all duration-200
                hover:scale-105 hover:bg-foreground/90 hover:shadow-lg hover:shadow-black/40
              "
            >
              Start Free
            </Link>
          </div>

          {/* Right: Hamburger (mobile) */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="
              md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg
              text-foreground/90 transition-colors
              hover:bg-white/[0.04]
            "
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="visora-mobile-menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="visora-mobile-menu"
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="
              fixed inset-0 z-40 md:hidden
              bg-background/95 backdrop-blur-xl
              flex flex-col
            "
          >
            <div className="h-16" aria-hidden /> {/* spacer for fixed navbar */}
            <motion.ul
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
              }}
              initial="hidden"
              animate="show"
              className="flex-1 flex flex-col items-center justify-center gap-6 px-6"
            >
              {PRIMARY_NAV.map((link) => {
                const active = isLinkActive(pathname, link);
                return (
                  <motion.li
                    key={link.href}
                    variants={{
                      hidden: { y: 12, opacity: 0 },
                      show: { y: 0, opacity: 1 },
                    }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "text-2xl font-medium tracking-tight",
                        active ? "text-foreground" : "text-muted",
                        "hover:text-foreground transition-colors",
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                );
              })}

              <motion.li
                variants={{
                  hidden: { y: 12, opacity: 0 },
                  show: { y: 0, opacity: 1 },
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mt-4 flex flex-col items-center gap-3 w-full max-w-xs"
              >
                {isAuthenticated && profile ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="
                      w-full rounded-full px-4 py-2.5 text-sm font-medium
                      border border-white/10 text-foreground
                      hover:bg-white/[0.04] transition-colors
                    "
                  >
                    Sign out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="
                      w-full rounded-full px-4 py-2.5 text-sm font-medium
                      border border-[#4F5052]/30 text-muted
                      hover:bg-white/[0.04] hover:border-[#818283]/50 hover:text-foreground transition-colors
                    "
                  >
                    Login
                  </button>
                )}
                <Link
                  href="/generate"
                  onClick={() => setMobileOpen(false)}
                  className="
                    w-full text-center rounded-full px-4 py-2.5 text-sm font-medium
                    bg-foreground text-background shadow-md shadow-black/25
                  "
                >
                  Start Free
                </Link>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

export default Navbar;
