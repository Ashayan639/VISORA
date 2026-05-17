/**
 * VISORA monorepo: the Next.js app lives in `visora/`.
 * When the Vercel project's Root Directory is the repo root, the platform
 * still expects framework artifacts relative to that root. Mirror the app
 * output (and config) after `npm run build --prefix visora`.
 *
 * Runs only when VERCEL=1 (see Vercel system env vars).
 */
import { cpSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));

if (process.env.VERCEL !== "1") {
  console.log("[prepare-vercel-output] Skipped (not on Vercel).");
  process.exit(0);
}

function mirrorDir(rel) {
  const src = join(root, "visora", rel);
  const dest = join(root, rel);
  if (!existsSync(src)) {
    console.error(`[prepare-vercel-output] Missing ${src}`);
    process.exit(1);
  }
  if (existsSync(dest)) rmSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[prepare-vercel-output] ${rel}/ -> ./${rel}/`);
}

mirrorDir(".next");
mirrorDir("public");

const cfgSrc = join(root, "visora", "next.config.ts");
const cfgDest = join(root, "next.config.ts");
if (existsSync(cfgSrc)) {
  copyFileSync(cfgSrc, cfgDest);
  console.log("[prepare-vercel-output] next.config.ts -> ./next.config.ts");
}
