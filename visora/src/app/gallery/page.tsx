"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Filter,
  Grid as GridIcon,
  Image as ImageIcon,
  Inbox,
  Search,
  X,
} from "lucide-react";

import { ProjectCard } from "@/components/gallery/ProjectCard";
import { DEMO_PROJECTS } from "@/lib/demoData";
import { getLocalProjects } from "@/lib/galleryStorage";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/visora";

/* ─────────────────────────────────────────────────────────────
   Filter definitions
   ───────────────────────────────────────────────────────────── */

type FilterId = "all" | "idea" | "url" | "3d" | "high_trust";

interface FilterDef {
  id: FilterId;
  label: string;
  predicate: (p: Project) => boolean;
}

const FILTERS: FilterDef[] = [
  { id: "all", label: "All", predicate: () => true },
  {
    id: "idea",
    label: "From Idea",
    predicate: (p) => p.inputType === "idea",
  },
  {
    id: "url",
    label: "From URL",
    predicate: (p) => p.inputType === "website_url",
  },
  {
    id: "3d",
    label: "Has 3D",
    predicate: (p) =>
      Boolean(
        p.model3d &&
          typeof p.model3d.modelUrl === "string" &&
          p.model3d.modelUrl.length > 0 &&
          p.model3d.status !== "fallback",
      ),
  },
  {
    id: "high_trust",
    label: "High Trust Score",
    predicate: (p) => (p.trustScore?.overallScore ?? 0) > 70,
  },
];

/* ─────────────────────────────────────────────────────────────
   Merge Supabase + local (trustforge_projects), dedupe by id
   ───────────────────────────────────────────────────────────── */

function mergeGallery(remote: Project[], local: Project[]): Project[] {
  const byId = new Map<string, Project>();
  for (const p of remote) byId.set(p.id, p);
  for (const p of local) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  return Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

type LoadStatus = "loading" | "ready";
type Source = "supabase" | "local" | "demo" | "mixed";

export default function GalleryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [source, setSource] = useState<Source>("demo");
  const [status, setStatus] = useState<LoadStatus>("loading");

  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");

      let remote: Project[] = [];
      try {
        const { getProjectsForGallery } = await import("@/lib/database");
        remote = await getProjectsForGallery();
      } catch (err) {
        console.warn("[gallery] Supabase fetch failed:", err);
      }

      const local = getLocalProjects();
      let merged = mergeGallery(remote, local);

      let nextSource: Source = "demo";
      if (merged.length === 0) {
        merged = [...DEMO_PROJECTS];
        nextSource = "demo";
      } else {
        const hasRemote = remote.length > 0;
        const hasLocalOnlyExtras = local.some(
          (p) => !remote.some((r) => r.id === p.id),
        );
        if (hasRemote && hasLocalOnlyExtras) nextSource = "mixed";
        else if (hasRemote) nextSource = "supabase";
        else nextSource = "local";
      }

      if (!cancelled) {
        setProjects(merged);
        setSource(nextSource);
        setStatus("ready");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const def = FILTERS.find((f) => f.id === activeFilter) ?? FILTERS[0];
    const q = query.trim().toLowerCase();

    return projects.filter((p) => {
      if (!def.predicate(p)) return false;
      if (!q) return true;
      const name = (p.brandResult?.brandName ?? "").toLowerCase();
      return name.includes(q);
    });
  }, [projects, activeFilter, query]);

  const total = projects.length;
  const isShowingDemos = source === "demo";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-32 h-[520px] w-[520px] rounded-full bg-brand-purple/[0.04] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-[40%] h-[420px] w-[420px] rounded-full bg-brand-cyan/[0.04] blur-3xl"
      />

      <section className="relative mx-auto w-full max-w-7xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        {/* ── Top headings (48px white, muted subtitle) ─────── */}
        <header className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-[48px] font-bold leading-tight tracking-tight text-foreground"
          >
            Brand Reality Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mx-auto mt-3 max-w-2xl text-base text-muted"
          >
            Your saved visual business realities
          </motion.p>
        </header>

        {/* ── Toolbar: filters + search ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <FilterTabs
            active={activeFilter}
            onChange={setActiveFilter}
            counts={countByFilter(projects)}
          />
          <SearchBox value={query} onChange={setQuery} />
        </motion.div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-hint">
          <GridIcon className="h-3.5 w-3.5 shrink-0" />
          <span>
            {status === "loading"
              ? "Loading your gallery…"
              : `Showing ${filtered.length} of ${total}`}
          </span>
          {isShowingDemos && status === "ready" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-cyan">
              Demo
            </span>
          ) : null}
          {source === "local" && status === "ready" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Local
            </span>
          ) : null}
          {source === "supabase" && status === "ready" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Cloud
            </span>
          ) : null}
          {source === "mixed" && status === "ready" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-purple/25 bg-brand-purple/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-purple">
              Cloud + local
            </span>
          ) : null}
        </div>

        {/* ── Grid ──────────────────────────────────────────── */}
        <div className="mt-8">
          {status === "loading" ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <EmptyState
              hasAnySaved={total > 0 && !isShowingDemos}
              hasFilter={activeFilter !== "all" || query.length > 0}
              onClearFilters={() => {
                setActiveFilter("all");
                setQuery("");
              }}
            />
          ) : (
            <ul
              className={cn(
                "grid list-none gap-6 p-0",
                "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12, scale: 0.97 }}
                    transition={{
                      opacity: { duration: 0.22 },
                      layout: { type: "spring", stiffness: 380, damping: 34 },
                    }}
                    className="list-none"
                  >
                    <ProjectCard project={p} isDemo={isShowingDemos} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Toolbar
   ───────────────────────────────────────────────────────────── */

interface FilterTabsProps {
  active: FilterId;
  onChange: (id: FilterId) => void;
  counts: Record<FilterId, number>;
}

function FilterTabs({ active, onChange, counts }: FilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter projects"
      className={cn(
        "relative flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06]",
        "bg-white/[0.03] p-1.5 backdrop-blur-xl",
      )}
    >
      <Filter aria-hidden className="ml-2 h-3.5 w-3.5 shrink-0 text-hint" />
      {FILTERS.map((f) => {
        const isActive = active === f.id;
        const n = counts[f.id] ?? 0;
        return (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(f.id)}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-[13px] font-medium",
              "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan/40",
              isActive ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="visora-gallery-tab"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-cyan/15 to-brand-purple/15 ring-1 ring-inset ring-white/10"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            ) : null}
            <span className="relative z-10">{f.label}</span>
            <span
              className={cn(
                "relative z-10 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                isActive
                  ? "bg-foreground/10 text-foreground"
                  : "bg-card-hover/60 text-hint",
              )}
            >
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
}

function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <label
      className={cn(
        "group relative flex w-full items-center gap-2 rounded-2xl border border-white/[0.06]",
        "bg-white/[0.03] px-4 py-2.5 backdrop-blur-xl transition-colors",
        "focus-within:border-brand-cyan/40 lg:max-w-sm lg:ml-auto",
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-hint group-focus-within:text-brand-cyan" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by brand name…"
        className={cn(
          "w-full bg-transparent text-[14px] text-foreground placeholder:text-hint",
          "outline-none focus:outline-none",
        )}
        aria-label="Search by brand name"
      />
      <AnimatePresence>
        {value ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => onChange("")}
            className="rounded-full p-1 text-hint hover:bg-white/5 hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </label>
  );
}

/* ─────────────────────────────────────────────────────────────
   States
   ───────────────────────────────────────────────────────────── */

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          aria-hidden
          className="list-none overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]"
        >
          <div className="aspect-[16/10] w-full animate-pulse bg-card-hover/40" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-card-hover/50" />
            <div className="h-4 w-full animate-pulse rounded bg-card-hover/30" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-card-hover/40" />
          </div>
        </li>
      ))}
    </ul>
  );
}

interface EmptyStateProps {
  hasAnySaved: boolean;
  hasFilter: boolean;
  onClearFilters: () => void;
}

function EmptyState({ hasAnySaved, hasFilter, onClearFilters }: EmptyStateProps) {
  if (hasFilter && hasAnySaved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-white/[0.06]",
          "bg-white/[0.03] px-8 py-12 text-center backdrop-blur-xl",
        )}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-card-hover/40 text-muted">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-foreground">
            No realities match those filters
          </h3>
          <p className="text-sm leading-relaxed text-muted">
            Try another tab or clear the brand name search.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          className={cn(
            "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02]",
            "px-4 py-2 text-sm font-medium text-foreground transition-colors",
            "hover:border-brand-cyan/40 hover:bg-brand-cyan/5 hover:text-brand-cyan",
          )}
        >
          Clear filters
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mx-auto flex max-w-xl flex-col items-center gap-5 rounded-3xl border border-white/[0.06]",
        "bg-white/[0.03] px-8 py-14 text-center backdrop-blur-xl",
      )}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-cyan/15 to-brand-purple/15 text-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xl font-semibold text-foreground">
          No realities created yet
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Generate a brand from an idea or URL — it will appear here when you save.
        </p>
      </div>
      <Link
        href="/generate"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5",
          "bg-gradient-to-r from-brand-cyan to-brand-purple text-sm font-semibold text-white",
          "shadow-md shadow-brand-cyan/20 transition-transform duration-200 hover:scale-[1.02]",
          "focus:outline-none focus:ring-2 focus:ring-brand-cyan/40",
        )}
      >
        Create Your First
      </Link>
    </motion.div>
  );
}

function countByFilter(projects: Project[]): Record<FilterId, number> {
  const out: Record<FilterId, number> = {
    all: 0,
    idea: 0,
    url: 0,
    "3d": 0,
    high_trust: 0,
  };
  for (const f of FILTERS) {
    out[f.id] = projects.filter((p) => f.predicate(p)).length;
  }
  return out;
}
