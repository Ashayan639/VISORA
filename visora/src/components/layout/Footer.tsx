"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import {
  FOOTER_BADGES,
  FOOTER_PRODUCT,
  FOOTER_RESOURCES,
  SOCIAL_LINKS,
  type NavLink,
} from "@/lib/nav";
import { APP } from "@/lib/constants";

/* ─────────────────────────────────────────────────────────────
   Bits
   ───────────────────────────────────────────────────────────── */

function LogoBlock() {
  return (
    <div className="space-y-3">
      <Link href="/" className="flex items-center gap-2.5 group">
        <span
          className="
            flex h-8 w-8 items-center justify-center rounded-lg
            bg-gradient-to-br from-brand-cyan to-brand-purple
            font-bold text-white shadow-lg shadow-brand-cyan/20
            transition-shadow duration-300
            group-hover:shadow-brand-cyan/40
          "
        >
          V
        </span>
        <span className="font-semibold tracking-tight text-foreground">
          {APP.name}
        </span>
      </Link>
      <p className="max-w-xs text-sm leading-relaxed text-muted">
        {APP.tagline}
        <br />
        Powered by{" "}
        <span className="text-brand-cyan">fal.ai</span>.
      </p>
      <p className="text-xs text-hint">Built for the Best Use of fal track.</p>
    </div>
  );
}

function Column({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-hint">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Inline GitHub mark — Lucide v1 dropped brand icons. */
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.4-3.87-1.4-.52-1.34-1.27-1.7-1.27-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.2 1.76 1.2 1.03 1.78 2.7 1.27 3.36.97.1-.76.4-1.27.73-1.56-2.55-.3-5.24-1.3-5.24-5.78 0-1.27.45-2.31 1.2-3.13-.12-.3-.52-1.5.11-3.12 0 0 .97-.32 3.2 1.2a11 11 0 0 1 5.83 0c2.22-1.52 3.2-1.2 3.2-1.2.63 1.62.23 2.82.11 3.12.75.82 1.2 1.86 1.2 3.13 0 4.49-2.7 5.47-5.26 5.76.41.36.78 1.06.78 2.15v3.18c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12.3 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function BadgeStack() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-hint">
        Stack
      </h3>
      <div className="flex flex-wrap gap-2">
        {FOOTER_BADGES.map((badge) =>
          badge.href ? (
            <a
              key={badge.label}
              href={badge.href}
              target="_blank"
              rel="noreferrer noopener"
              className="
                inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium
                bg-white/[0.03] backdrop-blur-xl
                border border-white/[0.06] text-muted
                transition-colors duration-200
                hover:border-brand-cyan/40 hover:text-foreground
              "
            >
              {badge.label}
            </a>
          ) : (
            <span
              key={badge.label}
              className="
                inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium
                bg-white/[0.03] backdrop-blur-xl
                border border-white/[0.06] text-muted
              "
            >
              {badge.label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────── */

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="
        relative w-full
        bg-card-deep
        border-t border-white/[0.06]
      "
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Left: logo + tagline */}
          <div className="md:col-span-5">
            <LogoBlock />
          </div>

          {/* Center: link columns */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            <Column title="Product" links={FOOTER_PRODUCT} />
            <Column title="Resources" links={FOOTER_RESOURCES} />
          </div>

          {/* Right: stack badges */}
          <div className="md:col-span-3">
            <BadgeStack />
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="
            mt-10 pt-6 border-t border-white/[0.06]
            flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
          "
        >
          <p className="text-xs text-hint">
            © {year} {APP.name}. All rights reserved.
          </p>
          <a
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="VISORA on GitHub"
            className="
              inline-flex h-9 w-9 items-center justify-center rounded-full
              bg-white/[0.03] backdrop-blur-xl
              border border-white/[0.06] text-muted
              transition-colors duration-200
              hover:text-foreground hover:border-brand-cyan/40
            "
          >
            <GithubIcon size={16} />
          </a>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
