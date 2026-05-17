"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Edit3 } from "lucide-react";

import { ProjectHero } from "@/components/project/ProjectHero";
import { ProjectTabPanels } from "@/components/project/ProjectTabPanels";
import { ProjectTabs, type ProjectTabId } from "@/components/project/ProjectTabs";
import { findDemoProject } from "@/lib/demoData";
import { getLocalProjectById } from "@/lib/galleryStorage";
import { cn } from "@/lib/utils";
import type { Project, VisualAsset } from "@/types/visora";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

type LoadStatus = "loading" | "ready" | "missing";

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [activeTab, setActiveTab] = useState<ProjectTabId>("brand");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");

      try {
        const res = await fetch(`/api/projects?withChat=1`);
        if (res.ok) {
          const data = (await res.json()) as { projects?: Project[] };
          const remote = data.projects?.find((p) => p.id === id);
          if (!cancelled && remote) {
            setProject(remote);
            setStatus("ready");
            return;
          }
        }
      } catch (err) {
        console.warn("[project/detail] projects fetch failed:", err);
      }

      const local = getLocalProjectById(id);
      if (!cancelled && local) {
        setProject(local);
        setStatus("ready");
        return;
      }

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

  const handleVisualsChange = (visuals: VisualAsset[]) => {
    setProject((prev) => (prev ? { ...prev, visuals } : prev));
  };

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

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4">
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
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white",
              "bg-foreground text-background",
              "transition-transform duration-200 hover:scale-[1.02]",
            )}
          >
            <Edit3 className="h-4 w-4" />
            Continue in chat
          </Link>
        </div>

        {status === "loading" ? (
          <DetailSkeleton />
        ) : status === "missing" || !project ? (
          <Missing id={id} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 space-y-6"
          >
            <ProjectHero project={project} />
            <ProjectTabs active={activeTab} onChange={setActiveTab} />
            <ProjectTabPanels
              project={project}
              activeTab={activeTab}
              onVisualsChange={handleVisualsChange}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-10 space-y-6">
      <div className="h-56 animate-pulse rounded-3xl bg-card-hover/30" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover/20" />
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
      <h2 className="text-lg font-semibold text-foreground">Project not found</h2>
      <p className="text-sm text-muted">
        We couldn&apos;t find a saved project with id{" "}
        <code className="rounded bg-card-hover/60 px-1.5 py-0.5 text-xs">{id}</code>.
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
