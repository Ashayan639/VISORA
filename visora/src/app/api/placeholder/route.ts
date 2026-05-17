/**
 * GET /api/placeholder
 *
 * Returns a lightweight gradient SVG placeholder for demo visuals.
 * Works offline with zero API keys.
 *
 * Query params:
 *   - type   — visual type (product_mockup, hero_image, …)
 *   - brand  — brand name for the label
 *   - title  — optional short title (defaults from type)
 */

import { NextResponse } from "next/server";

export const runtime = "edge";

const PALETTES: Record<string, [string, string, string]> = {
  product_mockup: ["#0D0E10", "#282728", "#818283"],
  hero_image: ["#0D0E10", "#1A1A1B", "#C5C6C8"],
  instagram_ad: ["#1A1A1B", "#333334", "#818283"],
  lifestyle_scene: ["#282728", "#4F5052", "#C5C6C8"],
  default: ["#0D0E10", "#282728", "#818283"],
};

function labelForType(type: string): string {
  switch (type) {
    case "product_mockup":
      return "Product mockup";
    case "hero_image":
      return "Hero image";
    case "instagram_ad":
      return "Instagram ad";
    case "lifestyle_scene":
      return "Lifestyle scene";
    default:
      return "VISORA visual";
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const type = url.searchParams.get("type")?.trim() || "visual";
  const brand = url.searchParams.get("brand")?.trim() || "VISORA";
  const title =
    url.searchParams.get("title")?.trim() || labelForType(type);

  const [c1, c2, c3] = PALETTES[type] ?? PALETTES.default;
  const safeBrand = escapeXml(brand.slice(0, 48));
  const safeTitle = escapeXml(title.slice(0, 40));
  const safeType = escapeXml(type.replace(/_/g, " "));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${c3}" stop-opacity="0.7"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <text x="512" y="470" text-anchor="middle" fill="#f8fafc" font-family="system-ui,Segoe UI,sans-serif" font-size="42" font-weight="700">${safeBrand}</text>
  <text x="512" y="530" text-anchor="middle" fill="#94a3b8" font-family="system-ui,Segoe UI,sans-serif" font-size="22" font-weight="500">${safeTitle}</text>
  <text x="512" y="580" text-anchor="middle" fill="#64748b" font-family="ui-monospace,monospace" font-size="14" letter-spacing="3">${safeType.toUpperCase()}</text>
  <text x="512" y="920" text-anchor="middle" fill="#64748b" font-family="ui-monospace,monospace" font-size="13" letter-spacing="2">VISORA DEMO</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
