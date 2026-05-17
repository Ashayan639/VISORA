"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Box,
  Brain,
  Database,
  Image as ImageIcon,
  LayoutGrid,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Glass + motion helpers
   ───────────────────────────────────────────────────────────── */

const glassCard =
  "rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";

function FloatingOrbs() {
  return (
    <>
      <div
        aria-hidden
        className="
          pointer-events-none fixed -top-24 -right-24
          h-[520px] w-[520px] rounded-full
          bg-brand-cyan opacity-[0.045] blur-3xl
          animate-float-slow
        "
      />
      <div
        aria-hidden
        style={{ animationDelay: "2.2s" }}
        className="
          pointer-events-none fixed -bottom-28 -left-28
          h-[440px] w-[440px] rounded-full
          bg-brand-purple opacity-[0.035] blur-3xl
          animate-float-slow
        "
      />
    </>
  );
}

function FlowNodeCard({
  index,
  total,
  scrollYProgress,
  icon: Icon,
  label,
  sub,
  iconExtra,
  highlight,
}: {
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  icon: LucideIcon;
  label: string;
  sub?: string;
  iconExtra?: React.ReactNode;
  highlight?: boolean;
}) {
  const t0 = index / total;
  const t1 = (index + 0.4) / total;
  const opacity = useTransform(scrollYProgress, [t0, t1], [0.08, 1]);
  const y = useTransform(scrollYProgress, [t0, t1], [22, 0]);
  const scale = useTransform(scrollYProgress, [t0, t1], [0.94, 1]);

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="relative z-10 flex flex-col items-center text-center"
    >
      <div
        className={cn(
          "relative w-full max-w-[200px] px-4 py-5",
          glassCard,
          "transition-[border-color,box-shadow] duration-300",
          highlight
            ? "border-brand-cyan/35 shadow-[0_0_36px_-8px_rgba(56,189,248,0.45)]"
            : "hover:border-white/10",
        )}
      >
        {highlight ? (
          <motion.span
            aria-hidden
            animate={{ opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-brand-cyan/12 via-transparent to-brand-purple/12 blur-xl"
          />
        ) : null}
        <div
          className={cn(
            "relative mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ring-1",
            highlight
              ? "bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/45"
              : "bg-brand-cyan/10 text-brand-cyan ring-brand-cyan/25",
          )}
        >
          {iconExtra ?? <Icon size={22} strokeWidth={1.75} />}
        </div>
        <p className="relative text-sm font-semibold text-foreground">{label}</p>
        {sub ? (
          <p className="relative mt-1 text-[11px] leading-snug text-muted">{sub}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

function ArchitectureFlowSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.88", "end 0.42"],
  });

  const lineProgressX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const lineProgressY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const total = 5;

  return (
    <section className="relative w-full py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <SectionHeading
          title="Architecture Flow"
          subtitle="End-to-end path from a single prompt to saved, gallery-ready assets."
          align="center"
        />

        <div ref={ref} className="relative mt-16 md:mt-20">
          {/* Desktop: horizontal connector */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[10%] right-[10%] top-[52px] z-0 hidden h-[3px] md:block"
          >
            <div className="relative h-full w-full rounded-full bg-white/[0.07]" />
            <motion.div
              style={{ scaleX: lineProgressX, transformOrigin: "0% 50%" }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan shadow-[0_0_20px_-2px_rgba(168,85,247,0.55)]"
            />
          </div>

          {/* Mobile: vertical connector */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-6 left-[28px] top-8 z-0 w-[3px] md:hidden"
          >
            <div className="absolute inset-0 rounded-full bg-white/[0.07]" />
            <motion.div
              style={{ scaleY: lineProgressY, transformOrigin: "50% 0%" }}
              className="absolute inset-0 rounded-full bg-gradient-to-b from-brand-cyan via-brand-purple to-brand-cyan"
            />
          </div>

          <div className="relative z-10 flex flex-col gap-8 pl-12 md:grid md:grid-cols-5 md:gap-3 md:px-0 md:pl-0">
            <FlowNodeCard
              index={0}
              total={total}
              scrollYProgress={scrollYProgress}
              icon={MessageSquare}
              label="User Input"
              sub="Idea, URL, or brief"
            />
            <FlowNodeCard
              index={1}
              total={total}
              scrollYProgress={scrollYProgress}
              icon={Brain}
              label="OpenAI API"
              sub="Brand + prompts"
            />
            <FlowNodeCard
              index={2}
              total={total}
              scrollYProgress={scrollYProgress}
              icon={ImageIcon}
              label="fal.ai API"
              sub="Images & 3D"
              highlight
              iconExtra={
                <span className="flex items-center gap-0.5">
                  <ImageIcon size={18} strokeWidth={1.75} />
                  <Box size={18} strokeWidth={1.75} />
                </span>
              }
            />
            <FlowNodeCard
              index={3}
              total={total}
              scrollYProgress={scrollYProgress}
              icon={Database}
              label="Supabase"
              sub="Projects + auth"
            />
            <FlowNodeCard
              index={4}
              total={total}
              scrollYProgress={scrollYProgress}
              icon={LayoutGrid}
              label="Gallery"
              sub="Revisit & share"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const API_ROUTES: { route: string; method: string; api: string; purpose: string }[] = [
  {
    route: "/api/generate-brand",
    method: "POST",
    api: "OpenAI",
    purpose: "Brand identity, trust score, marketing copy, and structured prompts for visuals.",
  },
  {
    route: "/api/generate-visual",
    method: "POST",
    api: "fal.ai",
    purpose: "Generate a single marketing image from a typed prompt (Flux).",
  },
  {
    route: "/api/generate-all-visuals",
    method: "POST",
    api: "fal.ai",
    purpose: "Parallel batch of mockup, hero, social, and lifestyle renders.",
  },
  {
    route: "/api/generate-3d",
    method: "POST",
    api: "fal.ai",
    purpose: "Text- or image-to-3D pipeline (GLB) for embeddable product reality.",
  },
  {
    route: "/api/save-project",
    method: "POST",
    api: "Supabase",
    purpose: "Persist generated brand, visuals, and metadata to user projects.",
  },
  {
    route: "/api/projects",
    method: "GET",
    api: "Supabase",
    purpose: "List saved projects for the authenticated gallery.",
  },
  {
    route: "/api/projects/[id]",
    method: "GET",
    api: "Supabase",
    purpose: "Fetch one project’s full payload for detail and remix flows.",
  },
];

export default function TechPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <FloatingOrbs />

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-6 pt-12 pb-8 text-center md:px-12 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={cn("mx-auto px-8 py-10 sm:px-12", glassCard)}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            Hackathon deep dive
          </p>
          <h1 className="text-[clamp(1.875rem,5vw,3rem)] text-center font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            How VISORA Works Under the Hood
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
            VISORA wires three best-in-class APIs into one opinionated pipeline:{" "}
            <span className="text-foreground font-medium">OpenAI</span> reasons about your
            business, <span className="text-foreground font-medium">fal.ai</span> renders the
            visual and 3D world, and{" "}
            <span className="text-foreground font-medium">Supabase</span> becomes durable
            memory for every generation you ship to the gallery.
          </p>
        </motion.div>
      </section>

      <ArchitectureFlowSection />

      {/* Three API cards */}
      <section className="relative w-full py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <SectionHeading
            title="The Three-API Core"
            subtitle="Each layer has one job — together they model a complete business presence."
            align="center"
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            <motion.article
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0, ease: "easeOut" }}
              className={cn("relative p-8", glassCard, "hover:border-brand-cyan/15")}
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/25">
                <Brain size={24} strokeWidth={1.65} />
              </div>
              <h3 className="text-xl font-semibold text-foreground">The Brand Brain</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-cyan">
                OpenAI
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Extracts positioning, voice, audience, and proof from raw ideas or live URLs.
                Outputs structured prompts that tell the visual engine exactly what to render —
                so every pixel matches the strategy.
              </p>
            </motion.article>

            <motion.article
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
              className={cn(
                "relative overflow-hidden p-8",
                glassCard,
                "border-brand-cyan/45 shadow-[0_0_42px_-10px_rgba(56,189,248,0.5)] ring-1 ring-brand-cyan/25",
              )}
            >
              <motion.span
                aria-hidden
                animate={{ opacity: [0.4, 0.75, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-brand-cyan/18 via-transparent to-brand-purple/20 blur-2xl"
              />
              <span className="absolute right-5 top-5 inline-flex items-center rounded-full bg-brand-purple/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-purple ring-1 ring-brand-purple/35">
                Core Engine
              </span>
              <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center gap-0.5 rounded-xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/40">
                <ImageIcon size={20} strokeWidth={1.65} />
                <Box size={20} strokeWidth={1.65} />
              </div>
              <h3 className="relative text-xl font-semibold text-foreground">
                The Visual Reality Engine
              </h3>
              <p className="relative mt-1 text-xs font-semibold uppercase tracking-wide text-brand-cyan">
                fal.ai
              </p>
              <p className="relative mt-4 text-sm leading-relaxed text-muted">
                Runs GPU-accelerated Flux and 3D mesh pipelines server-side. Delivers campaign-
                ready stills plus a downloadable GLB — the sensory layer customers feel, not
                just read about.
              </p>
            </motion.article>

            <motion.article
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}
              className={cn("relative p-8", glassCard, "hover:border-brand-cyan/15")}
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/25">
                <Database size={24} strokeWidth={1.65} />
              </div>
              <h3 className="text-xl font-semibold text-foreground">The Brand Memory</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-cyan">
                Supabase
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Stores projects, generations, and user sessions so the gallery is a living
                archive. Same data model powers re-entry from any device — continuity for real
                workflows, not one-off demos.
              </p>
            </motion.article>
          </div>
        </div>
      </section>

      {/* API routes table */}
      <section className="relative w-full py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <SectionHeading
            title="API Routes"
            subtitle="Every hop is a typed Next.js route — safe for keys, observable in network, and easy for judges to audit."
            align="center"
          />

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("mt-12 overflow-hidden rounded-2xl", glassCard)}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                    <th className="px-5 py-4 font-semibold text-foreground">Route</th>
                    <th className="px-4 py-4 font-semibold text-foreground">Method</th>
                    <th className="px-4 py-4 font-semibold text-foreground">API</th>
                    <th className="px-5 py-4 font-semibold text-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {API_ROUTES.map((row, i) => (
                    <tr
                      key={row.route}
                      className={cn(
                        "border-b border-white/[0.05] transition-colors hover:bg-white/[0.025]",
                        i % 2 === 1 && "bg-white/[0.015]",
                      )}
                    >
                      <td className="px-5 py-4 font-mono text-[13px] text-brand-cyan/95">
                        {row.route}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-brand-purple/15 px-2 py-0.5 text-xs font-semibold text-brand-purple ring-1 ring-brand-purple/25">
                          {row.method}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted">{row.api}</td>
                      <td className="px-5 py-4 text-muted leading-relaxed">{row.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why fal */}
      <section className="relative w-full pb-28 pt-8 sm:pb-36">
        <div className="mx-auto max-w-3xl px-6 md:px-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8 flex justify-center"
          >
            <span
              className="
                relative inline-flex items-center rounded-full
                p-[1px] bg-gradient-to-r from-brand-cyan to-brand-purple
              "
            >
              <span className="rounded-full bg-background px-4 py-1.5 text-xs font-semibold tracking-wide">
                <span className="bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent">
                  Best Use of fal
                </span>
              </span>
            </span>
          </motion.div>

          <motion.div
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" }}
            className={cn("space-y-6 px-8 py-10 sm:px-10 sm:py-12", glassCard)}
          >
            <p className="text-lg sm:text-xl leading-relaxed text-muted">
              Most hackathon stacks bolt on a single image API. VISORA treats{" "}
              <span className="font-semibold text-foreground">fal.ai</span> as the production
              render farm: it generates product mockups, hero art, social ads, lifestyle scenes,{" "}
              <span className="text-foreground font-medium">and</span> 3D product models from
              the same orchestrated pipeline — all callable from secure server routes so keys
              never touch the browser.
            </p>
            <p className="text-xl sm:text-2xl font-semibold leading-snug tracking-tight text-foreground">
              OpenAI creates the brain. Supabase saves the memory.{" "}
              <span className="bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent">
                fal.ai creates the visual and 3D business reality.
              </span>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
