"use client";

import type { Project } from "@/types/visora";
import { cn } from "@/lib/utils";

import { GradientPlaceholder } from "./shared/GradientPlaceholder";
import { TrustScoreRing } from "./shared/TrustScoreRing";

function pickHeroVisual(project: Project) {
  const hero = project.visuals?.find((v) => v.visualType === "hero_image");
  const generated = project.visuals?.find(
    (v) => v.imageUrl && !v.imageUrl.startsWith("/placeholder"),
  );
  return hero ?? generated ?? project.visuals?.[0];
}

interface ProjectHeroProps {
  project: Project;
}

export function ProjectHero({ project }: ProjectHeroProps) {
  const { brandResult, trustScore } = project;
  const visual = pickHeroVisual(project);
  const score = trustScore?.overallScore ?? 0;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-[#4F5052]/30",
        "bg-gradient-to-br from-[#0D0E10] via-card to-[#0D0E10]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/[0.04] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/[0.04] blur-3xl"
      />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start gap-5">
            <div className="min-w-0 flex-1">
              <h1 className="text-[48px] font-bold leading-[1.05] tracking-tight text-foreground">
                {brandResult.brandName || "Untitled brand"}
              </h1>
              {brandResult.tagline ? (
                <p className="mt-2 max-w-lg text-base leading-relaxed text-muted">
                  {brandResult.tagline}
                </p>
              ) : null}
            </div>
            <TrustScoreRing score={score} size={72} className="mt-1" />
          </div>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#4F5052]/30 bg-card-deep shadow-lg">
          {visual?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={visual.imageUrl}
              alt={visual.title || "Hero visual"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <GradientPlaceholder palette={brandResult.colorPalette} />
          )}
          <div className="absolute bottom-2 right-3 text-[10px] font-mono text-hint">
            powered by fal.ai
          </div>
        </div>
      </div>
    </section>
  );
}
