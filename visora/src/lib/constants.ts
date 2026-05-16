/**
 * VISORA — Design tokens
 *
 * Single source of truth for brand colors. Mirror these values in
 * `tailwind.config` / CSS variables so JS and CSS stay in sync.
 */

export const colors = {
  background: "#020617",
  card: "#0F172A",
  cardHover: "#1E293B",
  /** Deeper surface used by the footer. */
  cardDeep: "#0a0f1e",
  text: "#F8FAFC",
  muted: "#94A3B8",
  hint: "#64748B",
  cyan: "#38BDF8",
  purple: "#A855F7",
  green: "#22C55E",
  amber: "#F59E0B",
  red: "#EF4444",
} as const;

export type ColorToken = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorToken];

/** Semantic aliases used by status / score widgets. */
export const semanticColors = {
  success: colors.green,
  warning: colors.amber,
  danger: colors.red,
  info: colors.cyan,
  accent: colors.purple,
} as const;

export type SemanticColor = keyof typeof semanticColors;

/** App metadata. */
export const APP = {
  name: "VISORA",
  tagline: "Visual Business Reality Engine",
  url: "http://localhost:3000",
} as const;
