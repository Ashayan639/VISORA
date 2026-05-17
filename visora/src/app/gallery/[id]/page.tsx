"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Edit3 } from "lucide-react";

import { BrandCard } from "@/components/chat/widgets/BrandCard";
import { ImageGrid } from "@/components/chat/widgets/ImageGrid";
import { MarketingPackWidget } from "@/components/chat/widgets/MarketingPackWidget";
import { Model3DPreview } from "@/components/chat/widgets/Model3DPreview";
import { TrustScoreWidget } from "@/components/chat/widgets/TrustScoreWidget";
import { WebsitePreviewWidget } from "@/components/chat/widgets/WebsitePreviewWidget";
import { findDemoProject } from "@/lib/demoData";
import { getLocalProjects } from "@/lib/galleryStorage";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/visora";

/* ─────────────────────────────────────────────────────────────
   /gallery/[id]

   Lightweight read-only detail view. Reuses the chat widgets so
   we get the same visual identity as the live workspace without
   spinning up a chat session.

   Resolution order matches the listing page:
     1. Supabase  (getProjectById)
     2. localStorage  (trustforge_projects)
     3. DEMO_PROJECTS  (so demo cards always resolve)
   ───────────────────────────────────────────────────────────── */

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

type LoadStatus = "loading" | "ready" | "missing";

export default function GalleryDetailPage({ params }: DetailPageProps) {
  const { id: rawId } = use(params);
  const id = resolveProjectIdParam(rawId);
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");

      // 1. Supabase
      try {
        const { getProjectById } = await import("@/lib/database");
        const remote = await getProjectById(id);
        if (!cancelled && remote) {
          setProject(remote);
          setStatus("ready");
          return;
        }
      } catch (err) {
        console.warn("[gallery/detail] Supabase fetch failed:", err);
      }

      // 2. localStorage
      const local = getLocalProjects().find((p) => p.id === id);
      if (!cancelled && local) {
        setProject(local);
        setStatus("ready");
        return;
      }

      // 3. Demo
      const demo = findDemoProject(id);
      if (!cancelled && demo) {
        setProject(demo);
        setStatus("ready");
        return;
      }

      if (!cancelled) {
        setProject(null);
        setStatus("missing");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-32 h-[480px] w-[480px] rounded-full bg-white/[0.02] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-[40%] h-[420px] w-[420px] rounded-full bg-white/[0.02] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-8 lg:px-12">
        {/* ── Top bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link
            href="/gallery"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-card/60 px-3 py-2",
              "text-sm text-muted backdrop-blur-md transition-colors",
              "hover:border-white/20 hover:text-foreground",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to gallery
          </Link>

          <Link
            href="/generate"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold",
              "bg-foreground text-background",
              "transition-transform duration-200 hover:scale-[1.02]",
            )}
          >
            <Edit3 className="h-4 w-4" />
            Continue in chat
          </Link>
        </div>

        {/* ── Body ─────────────────────────────────────── */}
        {status === "loading" ? (
          <DetailSkeleton />
        ) : status === "missing" || !project ? (
          <Missing id={id} />
        ) : (
          <ProjectDetail project={project} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Detail body
   ───────────────────────────────────────────────────────────── */

function ProjectDetail({ project }: { project: Project }) {
  const {
    brandResult,
    trustScore,
    visuals,
    model3d,
    websiteConcept,
    marketingPack,
  } = project;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8 space-y-6"
    >
      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {brandResult.brandName || "Untitled brand"}
        </h1>
        {brandResult.tagline ? (
          <p className="max-w-2xl text-base text-muted">
            {brandResult.tagline}
          </p>
        ) : null}
      </header>

      {/* Two-up: brand card + trust */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BrandCard data={brandResult} />
        </div>
        <div>
          <TrustScoreWidget data={trustScore} />
        </div>
      </div>

      {/* Visuals */}
      {visuals && visuals.length > 0 ? (
        <ImageGrid assets={visuals} />
      ) : null}

      {/* 3D + website preview row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {model3d ? <Model3DPreview data={model3d} /> : null}
        {websiteConcept ? <WebsitePreviewWidget data={websiteConcept} /> : null}
      </div>

      {/* Marketing pack */}
      {marketingPack ? <MarketingPackWidget data={marketingPack} /> : null}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   States
   ───────────────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="mt-10 space-y-6">
      <div className="h-10 w-1/2 animate-pulse rounded-xl bg-card-hover/40" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-card-hover/30 lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-card-hover/30" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-card-hover/20" />
    </div>
  );
}

function Missing({ id }: { id: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mx-auto mt-16 flex max-w-lg flex-col items-center gap-4 rounded-2xl",
        "border border-[#4F5052]/30 bg-card/60 px-8 py-12 text-center backdrop-blur-xl",
      )}
    >
      <h2 className="text-lg font-semibold text-foreground">
        Project not found
      </h2>
      <p className="text-sm text-muted">
        We couldn&apos;t find a saved reality with id{" "}
        <code className="rounded bg-card-hover/60 px-1.5 py-0.5 text-xs">
          {id}
        </code>
        . It may have been deleted or saved on another device.
      </p>
      <Link
        href="/gallery"
        className={cn(
          "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2",
          "text-sm font-medium text-foreground hover:border-[#4F5052]/30 hover:text-foreground",
        )}
      >
        Back to gallery
      </Link>
    </motion.div>
  );
}
