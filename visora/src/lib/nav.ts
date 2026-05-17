/**
 * VISORA — Navigation metadata.
 *
 * Single source of truth for the nav links rendered in the Navbar
 * (desktop + mobile) and the Footer columns. Edit here, both update.
 */

export interface NavLink {
  label: string;
  href: string;
  /** Whether the link should be considered active for sub-routes too. */
  matchPrefix?: boolean;
}

/** Top-level nav rendered in the Navbar center. */
export const PRIMARY_NAV: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Generate", href: "/generate", matchPrefix: true },
  { label: "3D Studio", href: "/studio", matchPrefix: true },
  { label: "Gallery", href: "/gallery", matchPrefix: true },
  { label: "Technology", href: "/tech" },
];

/** Footer column: Product. */
export const FOOTER_PRODUCT: NavLink[] = [
  { label: "Generate", href: "/generate" },
  { label: "3D Studio", href: "/studio" },
  { label: "Gallery", href: "/gallery" },
];

/** Footer column: Resources. */
export const FOOTER_RESOURCES: NavLink[] = [
  { label: "Technology", href: "/tech" },
  { label: "Demo", href: "/demo" },
];

/** Tech / partner badges shown in the footer-right. */
export const FOOTER_BADGES: { label: string; href?: string }[] = [
  { label: "Powered by fal.ai", href: "https://fal.ai" },
  { label: "OpenAI", href: "https://openai.com" },
  { label: "Supabase", href: "https://supabase.com" },
];

/** External / social links shown in the footer bottom bar. */
export const SOCIAL_LINKS = {
  github: "https://github.com",
} as const;

/**
 * Test whether a pathname should be considered "active" for a given link.
 * Exact match by default; opt-in prefix match for parent routes.
 */
export function isLinkActive(pathname: string, link: NavLink): boolean {
  if (link.href === "/") return pathname === "/";
  if (link.matchPrefix) return pathname === link.href || pathname.startsWith(`${link.href}/`);
  return pathname === link.href;
}
