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

  const href = `/project/${encodeURIComponent(id)}`;

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "visora-card visora-gallery-card group relative flex flex-col overflow-hidden",
        "shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)]",
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
            <Pill className="border-[#4F5052]/30 bg-white/[0.06] text-foreground">
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
              className="inline-flex items-center gap-1 rounded-full border border-[#4F5052]/30 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-muted"
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
            "transition-colors duration-200 hover:border-[#4F5052]/30 hover:bg-white/[0.03] hover:text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-[#4F5052]/30",
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
        "border-foreground/30 bg-foreground/15 text-foreground",
    };
  }
  if (score >= 40) {
    return {
      classes:
        "border-hint/30 bg-hint/15 text-hint",
    };
  }
  return {
    classes: "border-disabled/30 bg-disabled/15 text-muted",
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
  const a = safe[0] ?? "#0D0E10";
  const b = safe[2] ?? "#F8FAFA";
  const c = safe[3] ?? "#818283";
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(120% 120% at 0% 0%, ${a} 0%, transparent 60%), radial-gradient(120% 120% at 100% 0%, ${b}33 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, ${c}33 0%, transparent 55%), #0D0E10`,
      }}
      aria-hidden
    />
  );
}

export default ProjectCard;
