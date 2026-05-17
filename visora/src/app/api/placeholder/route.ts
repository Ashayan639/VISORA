/**
 * GET /api/placeholder
 *
 * Deterministic, dependency-free SVG generator used by the demo
 * data layer so VISORA can run a full hackathon-quality experience
 * with **zero API keys configured** (no fal.ai, no OpenAI).
 *
 * The route returns a self-contained `image/svg+xml` document with:
 *   • a palette-driven diagonal gradient background,
 *   • a couple of decorative blurred orbs for depth,
 *   • the brand name (large) and an optional title (small),
 *   • a "VISORA · DEMO" stamp in the corner.
 *
 * Query parameters
 * ─────────────────
 *   type     : "product_mockup" | "hero_image" | "instagram_ad"
 *              | "lifestyle_scene"  (default: "product_mockup")
 *   brand    : Brand name shown as the headline (default: "VISORA")
 *   title    : Optional secondary label (default: pretty-printed type)
 *   palette  : Comma-separated hex colors (e.g. "#2B1B11,#C9A55B,...").
 *              `#` prefix optional. Falls back to a VISORA cyan/purple
 *              palette when missing or invalid.
 *
 * Response
 * ─────────
 *   200 image/svg+xml   — the rendered SVG
 *   400 application/json — invalid `type`
 *
 * Caching
 * ────────
 *   Output is a pure function of the query params, so we ship a long
 *   `Cache-Control: public, max-age=31536000, immutable` header. The
 *   route runs on the Node runtime to dodge edge-runtime quirks during
 *   local `next dev` on Windows.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
// We read URL search params at request time, so the route is dynamic.
// CDN caching is handled via the long-lived `Cache-Control` header on
// the response body rather than build-time static evaluation.
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */

type PlaceholderType =
  | "product_mockup"
  | "hero_image"
  | "instagram_ad"
  | "lifestyle_scene";

interface Dimensions {
  width: number;
  height: number;
}

interface RenderInput {
  type: PlaceholderType;
  brand: string;
  title: string;
  palette: string[];
}

const TYPE_LABELS: Record<PlaceholderType, string> = {
  product_mockup: "Product mockup",
  hero_image: "Hero image",
  instagram_ad: "Instagram ad",
  lifestyle_scene: "Lifestyle scene",
};

const TYPE_DIMENSIONS: Record<PlaceholderType, Dimensions> = {
  product_mockup: { width: 1200, height: 1200 },
  hero_image: { width: 1920, height: 1080 },
  instagram_ad: { width: 1080, height: 1080 },
  lifestyle_scene: { width: 1600, height: 1200 },
};

const FALLBACK_PALETTE = [
  "#020617",
  "#0F172A",
  "#38BDF8",
  "#A855F7",
  "#F8FAFC",
];

/* ─────────────────────────────────────────────────────────────
   Param parsing / validation
   ───────────────────────────────────────────────────────────── */

function asString(v: string | null): string {
  return typeof v === "string" ? v : "";
}

function normalizeHex(input: string): string | null {
  const raw = input.trim();
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/.test(withHash)) {
    return withHash;
  }
  return null;
}

function parsePalette(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((c) => normalizeHex(c))
    .filter((c): c is string => !!c);
}

function isPlaceholderType(v: string): v is PlaceholderType {
  return (
    v === "product_mockup" ||
    v === "hero_image" ||
    v === "instagram_ad" ||
    v === "lifestyle_scene"
  );
}

/* ─────────────────────────────────────────────────────────────
   Color utilities
   ───────────────────────────────────────────────────────────── */

/** Expand `#abc` → `#aabbcc`. */
function expandHex(hex: string): string {
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex.slice(0, 7);
}

function hexLuminance(hex: string): number {
  const full = expandHex(hex);
  const r = parseInt(full.slice(1, 3), 16) / 255;
  const g = parseInt(full.slice(3, 5), 16) / 255;
  const b = parseInt(full.slice(5, 7), 16) / 255;
  // Rec. 709 luma — good enough for "is this background dark?"
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Pick a readable text color (white-ish or near-black) for a background. */
function readableTextOn(hex: string): string {
  return hexLuminance(hex) > 0.5 ? "#0B1220" : "#F8FAFC";
}

/* ─────────────────────────────────────────────────────────────
   XML escape (safe for both attributes and text content)
   ───────────────────────────────────────────────────────────── */

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* ─────────────────────────────────────────────────────────────
   SVG renderer
   ───────────────────────────────────────────────────────────── */

function renderSvg({ type, brand, title, palette }: RenderInput): string {
  const { width, height } = TYPE_DIMENSIONS[type];

  // Source-of-truth palette: caller-provided + fallback, so we always
  // have at least 5 distinct stops to draw from.
  const stops = [...palette, ...FALLBACK_PALETTE];
  const bg1 = stops[0];
  const bg2 = stops[1] ?? stops[0];
  const accent1 = stops[2] ?? "#38BDF8";
  const accent2 = stops[3] ?? "#A855F7";
  const accent3 = stops[4] ?? "#F8FAFC";

  const textColor = readableTextOn(bg1);
  // Subdue secondary copy: 75% opacity of the primary text color.
  const subTextColor = textColor;

  // Type-scaled headline: hero/lifestyle widescreen reads better with
  // a slightly smaller brand glyph relative to the canvas.
  const brandFontSize = Math.round(
    type === "hero_image" || type === "lifestyle_scene"
      ? width * 0.075
      : width * 0.095,
  );
  const titleFontSize = Math.round(brandFontSize * 0.28);
  const stampFontSize = Math.max(14, Math.round(width * 0.014));
  const padding = Math.round(width * 0.05);

  const safeBrand = escapeXml(brand || "VISORA");
  const safeTitle = escapeXml(title || TYPE_LABELS[type]);
  const safeStamp = escapeXml("VISORA · DEMO");
  const titleCaps = safeTitle.toUpperCase();

  // Decorative blob positions tuned per type so each layout feels
  // intentional rather than algorithmic.
  const blobs =
    type === "hero_image"
      ? [
          { cx: width * 0.18, cy: height * 0.3, r: height * 0.5, fill: accent1, opacity: 0.45 },
          { cx: width * 0.82, cy: height * 0.7, r: height * 0.55, fill: accent2, opacity: 0.4 },
          { cx: width * 0.6, cy: height * 0.15, r: height * 0.22, fill: accent3, opacity: 0.18 },
        ]
      : type === "instagram_ad"
        ? [
            { cx: width * 0.15, cy: height * 0.2, r: width * 0.45, fill: accent1, opacity: 0.45 },
            { cx: width * 0.85, cy: height * 0.85, r: width * 0.5, fill: accent2, opacity: 0.4 },
          ]
        : type === "lifestyle_scene"
          ? [
              { cx: width * 0.25, cy: height * 0.75, r: height * 0.5, fill: accent2, opacity: 0.4 },
              { cx: width * 0.78, cy: height * 0.25, r: height * 0.45, fill: accent1, opacity: 0.45 },
              { cx: width * 0.5, cy: height * 0.55, r: height * 0.3, fill: accent3, opacity: 0.16 },
            ]
          : /* product_mockup */ [
              { cx: width * 0.2, cy: height * 0.25, r: width * 0.35, fill: accent1, opacity: 0.45 },
              { cx: width * 0.78, cy: height * 0.72, r: width * 0.4, fill: accent2, opacity: 0.42 },
              { cx: width * 0.5, cy: height * 0.5, r: width * 0.18, fill: accent3, opacity: 0.18 },
            ];

  const blobMarkup = blobs
    .map(
      (b) =>
        `<circle cx="${b.cx.toFixed(1)}" cy="${b.cy.toFixed(1)}" r="${b.r.toFixed(1)}" fill="${b.fill}" fill-opacity="${b.opacity}" filter="url(#blur)" />`,
    )
    .join("");

  // Visual chrome — a thin centered card on product_mockup / instagram
  // (gives the brand name a "label" to sit on), nothing on the wide
  // layouts so the headline can breathe.
  const cardMarkup =
    type === "product_mockup" || type === "instagram_ad"
      ? `<rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" rx="${Math.round(width * 0.035)}" ry="${Math.round(width * 0.035)}" fill="none" stroke="${textColor}" stroke-opacity="0.15" stroke-width="2" />`
      : "";

  const titleY = height / 2 + brandFontSize * 0.85;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${safeBrand} — ${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${Math.round(width * 0.035)}" />
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)" />
  <g>${blobMarkup}</g>
  ${cardMarkup}

  <g font-family="Inter, -apple-system, 'Segoe UI', Roboto, sans-serif" text-anchor="middle">
    <text x="${width / 2}" y="${height / 2}" font-size="${brandFontSize}" font-weight="700" fill="${textColor}" letter-spacing="-0.02em">${safeBrand}</text>
    <text x="${width / 2}" y="${titleY}" font-size="${titleFontSize}" font-weight="500" fill="${subTextColor}" fill-opacity="0.7" letter-spacing="0.16em">${titleCaps}</text>
  </g>

  <text x="${padding}" y="${height - padding * 0.6}" font-family="ui-monospace, 'SFMono-Regular', Menlo, monospace" font-size="${stampFontSize}" fill="${textColor}" fill-opacity="0.45">${safeStamp}</text>
  <text x="${width - padding}" y="${height - padding * 0.6}" text-anchor="end" font-family="ui-monospace, 'SFMono-Regular', Menlo, monospace" font-size="${stampFontSize}" fill="${textColor}" fill-opacity="0.45">${width} × ${height}</text>
</svg>`;
}

/* ─────────────────────────────────────────────────────────────
   GET
   ───────────────────────────────────────────────────────────── */

export function GET(req: Request): Response {
  const url = new URL(req.url);
  const params = url.searchParams;

  const rawType = asString(params.get("type")).trim() || "product_mockup";
  if (!isPlaceholderType(rawType)) {
    return NextResponse.json(
      {
        error: `Unknown type "${rawType}". Expected one of: product_mockup, hero_image, instagram_ad, lifestyle_scene.`,
      },
      { status: 400 },
    );
  }

  const brand = asString(params.get("brand")).trim().slice(0, 64) || "VISORA";
  const title =
    asString(params.get("title")).trim().slice(0, 64) || TYPE_LABELS[rawType];
  const palette = parsePalette(asString(params.get("palette")));

  const svg = renderSvg({ type: rawType, brand, title, palette });

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      // Make the response safe to embed in <img> across origins
      // (the route is same-origin, but tooling sometimes probes CORS).
      "Access-Control-Allow-Origin": "*",
    },
  });
}
