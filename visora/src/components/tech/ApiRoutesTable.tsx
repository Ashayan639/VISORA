"use client";

import { motion } from "framer-motion";

import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

interface ApiRoute {
  route: string;
  method: string;
  api: string;
  purpose: string;
}

const ROUTES: ApiRoute[] = [
  {
    route: "/api/generate-brand",
    method: "POST",
    api: "OpenAI",
    purpose: "Brand identity, trust score, website concept, marketing pack, fal prompts",
  },
  {
    route: "/api/generate-visual",
    method: "POST",
    api: "fal.ai",
    purpose: "Generate a single visual asset (mockup, hero, ad, lifestyle)",
  },
  {
    route: "/api/generate-all-visuals",
    method: "POST",
    api: "fal.ai",
    purpose: "Batch-generate the full four-image visual set",
  },
  {
    route: "/api/generate-3d",
    method: "POST",
    api: "fal.ai",
    purpose: "Text-to-3D or image-to-3D GLB via Trellis",
  },
  {
    route: "/api/save-project",
    method: "POST",
    api: "Supabase",
    purpose: "Persist a complete project with nested visuals and 3D model",
  },
  {
    route: "/api/projects",
    method: "GET",
    api: "Supabase",
    purpose: "List saved projects for the gallery grid",
  },
  {
    route: "/api/projects/[id]",
    method: "GET",
    api: "Supabase",
    purpose: "Fetch one project with relations for detail views",
  },
];

const API_TONE: Record<string, string> = {
  OpenAI: "text-muted bg-white/[0.04] border-muted/25",
  "fal.ai": "text-foreground bg-white/[0.04] border-[#4F5052]/30",
  Supabase: "text-foreground bg-foreground/10 border-[#4F5052]/30",
};

export function ApiRoutesTable() {
  return (
    <section className="relative w-full py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <SectionHeading
          eyebrow="Surface area"
          title="API Routes"
          subtitle="Server-only handlers — keys never touch the browser."
        />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "mt-12 overflow-hidden rounded-2xl border border-[#4F5052]/30",
            "bg-white/[0.03] backdrop-blur-xl",
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#4F5052]/30 bg-white/[0.02]">
                  <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-hint">
                    Route
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-hint">
                    Method
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-hint">
                    API
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-hint">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROUTES.map((row, i) => (
                  <tr
                    key={row.route}
                    className={cn(
                      "border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]",
                      i === ROUTES.length - 1 && "border-b-0",
                    )}
                  >
                    <td className="px-4 py-3.5 font-mono text-[13px] text-foreground">
                      {row.route}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
                        {row.method}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                          API_TONE[row.api] ?? "text-muted border-white/10",
                        )}
                      >
                        {row.api}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] leading-relaxed text-muted">
                      {row.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
