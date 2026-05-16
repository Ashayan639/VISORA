"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Box, Sparkles } from "lucide-react";
import type { Project } from "@/types/visora";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   ProjectCard — gallery tile.

   Renders one saved Project as a glassmorphism card:
     • thumbnail (first generated visual or gradient placeholder)
     • brand name + idea
     • trust-score pill (red / amber / green)
     • "3D" pill if model3d exists
     • created-at hint
     • "Open Project" CTA spanning the bottom

   Pure presentation — all data shaping (filtering, sorting) happens
   in the parent /gallery page.
   ───────────────────────────────────────────────────────────── */

export interface ProjectCardProps {
  project: Project;
  /** Mark this card as a built-in demo example. */
  isDemo?: boolean;
  className?: string;
}

export function ProjectCard({
  project,
  isDemo = false,
  className,
}: ProjectCardProps) {
  const {
    id,
    brandResult,
    trustScore,
    visuals,
    model3d,
    userInput,
    createdAt,
    inputType,
  } = project;

  // Pick the first visual that actually has a non-placeholder URL; fall back
  // to ANY visual; render a gradient if none exist.
  const heroVisual =
    visuals.find(
      (v) => v.imageUrl && !v.imageUrl.startsWith("/placeholder"),
    ) ?? visuals[0];

  const idea =
    inputType === "website_url"
      ? userInput.websiteUrl || userInput.startupIdea || "—"
      : userInput.startupIdea || userInput.websiteUrl || "—";

  const score = clamp(trustScore?.overallScore ?? 0);
  const trustTone = scoreTone(score);
  const has3D = Boolean(model3d?.modelUrl || model3d?.id);
  const dateLabel = formatDate(createdAt);

  const href = `/gallery/${encodeURIComponent(id)}`;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl",
        "border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl",
        "shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)]",
        "transition-shadow duration-300 hover:shadow-[0_18px_48px_-18px_rgba(56,189,248,0.25)]",
        "hover:border-brand-cyan/25",
        className,
      )}
    >
      {/* ── Thumbnail ─────────────────────────────────────── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-card-deep">
        {heroVisual?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroVisual.imageUrl}
            alt={heroVisual.title || brandResult.brandName}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <GradientPlaceholder palette={brandResult.colorPalette} />
        )}

        {/* Bottom shading for legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card/95 via-card/40 to-transparent" />

        {/* Demo / input-type badge — top-left */}
        <div className="absolute left-3 top-3 flex gap-2">
          {isDemo ? (
            <Pill className="border-brand-cyan/30 bg-brand-cyan/15 text-brand-cyan">
              <Sparkles className="h-3 w-3" />
              Demo
            </Pill>
          ) : null}
          <Pill className="border-white/10 bg-card/60 text-muted">
            {inputType === "website_url" ? "URL" : "Idea"}
          </Pill>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1">
          <h3 className="text-[18px] font-semibold leading-tight text-foreground">
            {brandResult.brandName || "Untitled brand"}
          </h3>
          <p
            className="line-clamp-2 text-[14px] leading-snug text-muted"
            title={idea}
          >
            {idea}
          </p>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums",
              trustTone.classes,
            )}
            title={`Trust score: ${score}/100 • ${trustScore?.confidence ?? "Low"} confidence`}
          >
            Trust {score}
          </span>

          {has3D ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-brand-purple/30 bg-brand-purple/15 px-2.5 py-1 text-[11px] font-semibold text-brand-purple"
              title="Has a 3D model attached"
            >
              <Box className="h-3 w-3" />
              3D
            </span>
          ) : null}
        </div>

        <p className="text-[12px] text-hint">{dateLabel}</p>

        {/* CTA */}
        <Link
          href={href}
          className={cn(
            "mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-xl",
            "border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-foreground",
            "transition-colors duration-200 hover:border-brand-cyan/40 hover:bg-brand-cyan/5 hover:text-brand-cyan",
            "focus:outline-none focus:ring-2 focus:ring-brand-cyan/40",
          )}
          aria-label={`Open project ${brandResult.brandName}`}
        >
          Open Project
          <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
        className,
      )}
    >
      {children}
    </span>
  );
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

interface ScoreTone {
  classes: string;
}

function scoreTone(score: number): ScoreTone {
  if (score >= 70) {
    return {
      classes:
        "border-state-success/30 bg-state-success/15 text-state-success",
    };
  }
  if (score >= 40) {
    return {
      classes:
        "border-state-warning/30 bg-state-warning/15 text-state-warning",
    };
  }
  return {
    classes: "border-state-danger/30 bg-state-danger/15 text-state-danger",
  };
}

function formatDate(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "—";

  const diffMs = Date.now() - ts;
  const oneDay = 86_400_000;
  if (diffMs < 60_000) return "just now";
  if (diffMs < 3600_000) {
    const m = Math.floor(diffMs / 60_000);
    return `${m}m ago`;
  }
  if (diffMs < oneDay) {
    const h = Math.floor(diffMs / 3600_000);
    return `${h}h ago`;
  }
  if (diffMs < 7 * oneDay) {
    const d = Math.floor(diffMs / oneDay);
    return `${d}d ago`;
  }
  // Fall back to absolute, locale-aware short date.
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function GradientPlaceholder({ palette }: { palette: string[] }) {
  const safe = (palette ?? []).filter(
    (c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c),
  );
  const a = safe[0] ?? "#0F172A";
  const b = safe[2] ?? "#38BDF8";
  const c = safe[3] ?? "#A855F7";
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(120% 120% at 0% 0%, ${a} 0%, transparent 60%), radial-gradient(120% 120% at 100% 0%, ${b}33 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, ${c}33 0%, transparent 55%), #0a0f1e`,
      }}
      aria-hidden
    />
  );
}

export default ProjectCard;
