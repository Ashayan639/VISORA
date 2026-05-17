/**
 * VISORA — Design tokens (monochrome)
 *
 * Single source of truth for UI colors. Mirror these values in
 * `globals.css` / `@theme` so JS and CSS stay in sync.
 */

export const colors = {
  background: "#0D0E10",
  card: "#282728",
  cardHover: "#1A1A1B",
  cardElevated: "#333334",
  cardDeep: "#0D0E10",
  text: "#F8FAFA",
  muted: "#C5C6C8",
  hint: "#818283",
  disabled: "#4F5052",
  border: "#4F5052",
  borderHover: "#818283",
  borderActive: "#C5C6C8",
} as const;

export type ColorToken = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorToken];

/** App metadata. */
export const APP = {
  name: "VISORA",
  tagline: "Visual Business Reality Engine",
  url: "http://localhost:3000",
} as const;
