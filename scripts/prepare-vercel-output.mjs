/**
 * Monorepo deploy helper: Vercel (repo root) expects .next and next.config at root
 * when framework is Next.js. The app lives in visora/.
 */
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const app = join(root, "visora");

function copyIfExists(from, to) {
  if (!existsSync(from)) return;
  cpSync(from, to, { recursive: true });
}

copyIfExists(join(app, ".next"), join(root, ".next"));
copyIfExists(join(app, "public"), join(root, "public"));

for (const name of ["next.config.ts", "next.config.mjs", "next.config.js"]) {
  const src = join(app, name);
  if (existsSync(src)) {
    cpSync(src, join(root, name));
    break;
  }
}

console.log("Prepared Vercel output: visora/.next → .next");
