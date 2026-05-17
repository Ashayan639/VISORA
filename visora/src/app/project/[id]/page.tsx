"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  animate as animateValue,
  motion,
} from "framer-motion";
import {
  ArrowLeft,
  Box,
  Camera,
  Check,
  Copy,
  Edit3,
  ImageIcon,
  Loader2,
  Mail,
  Maximize2,
  Megaphone,
  MessageCircle,
  Music2,
  RefreshCw,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { ModelViewer } from "@/components/studio/ModelViewer";
import { TrustScoreWidget } from "@/components/chat/widgets/TrustScoreWidget";
import { ProjectTabs, type ProjectTabDef } from "@/components/project/ProjectTabs";
import { DEMO_PROJECTS, resolveProjectIdParam } from "@/lib/demoData";
import { getLocalProjects, saveLocalProject } from "@/lib/galleryStorage";
import { cn } from "@/lib/utils";
import type {
  AssetStatus,
  BrandResult,
  MarketingPack,
  Model3D,
  Project,
  VisualAsset,
  WebsiteConcept,
} from "@/types/visora";

/* ─────────────────────────────────────────────────────────────
   /project/[id]

   Rich, tabbed brand detail view. Loads a Project from:
     1. Supabase           (getProjectById)
     2. localStorage       (trustforge_projects)
     3. DEMO_PROJECTS      (so demo cards always resolve)

   The page is composed of:
     • Hero  — dark gradient, brand name 48px, tagline, mini trust ring
              on the left; rounded hero image (or gradient placeholder)
              on the right.
     • Tabs  — sticky horizontal nav (ProjectTabs) under the hero.
     • Body  — AnimatePresence-driven slide between the six tab panels:
               Brand Identity · Visuals · 3D Model · Website · Marketing
               · Trust Score.
   ───────────────────────────────────────────────────────────── */

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

type LoadStatus = "loading" | "ready" | "missing";
type TabId =
  | "brand"
  | "visuals"
  | "model"
  | "website"
  | "marketing"
  | "trust";

const TABS: ProjectTabDef[] = [
  { id: "brand", label: "Brand Identity" },
  { id: "visuals", label: "Visuals" },
  { id: "model", label: "3D Model" },
  { id: "website", label: "Website" },
  { id: "marketing", label: "Marketing" },
  { id: "trust", label: "Trust Score" },
];

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id: rawId } = use(params);
  const id = resolveProjectIdParam(rawId);

  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  /** Source we loaded from — local edits should only be persisted back to local. */
  const sourceRef = useRef<"supabase" | "local" | "demo" | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("brand");
  const [direction, setDirection] = useState<1 | -1>(1);

  const [lightboxAsset, setLightboxAsset] = useState<VisualAsset | null>(null);
  const [generating3D, setGenerating3D] = useState(false);

  /* ── Load project ─────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");

      try {
        const { getProjectById } = await import("@/lib/database");
        const remote = await getProjectById(id);
        if (!cancelled && remote) {
          sourceRef.current = "supabase";
          setProject(remote);
          setStatus("ready");
          return;
        }
      } catch (err) {
        console.warn("[project] Supabase fetch failed:", err);
      }

      const local = getLocalProjects().find((p) => p.id === id);
      if (!cancelled && local) {
        sourceRef.current = "local";
        setProject(local);
        setStatus("ready");
        return;
      }

      const demo = DEMO_PROJECTS.find((p) => p.id === id);
      if (!cancelled && demo) {
        sourceRef.current = "demo";
        setProject(demo);
        setStatus("ready");
        return;
      }

      if (!cancelled) {
        sourceRef.current = null;
        setProject(null);
        setStatus("missing");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ── Lightbox keyboard ────────────────────────────────────── */

  useEffect(() => {
    if (!lightboxAsset) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxAsset(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxAsset]);

  /* ── Persistence helper (local-only; cloud edits would need an API) ── */

  const persistIfLocal = useCallback((next: Project) => {
    if (sourceRef.current === "local") {
      try {
        saveLocalProject(next);
      } catch {
        /* quota — ignore */
      }
    }
  }, []);

  /* ── Tab nav ──────────────────────────────────────────────── */

  const handleTabChange = useCallback((next: string, dir: 1 | -1) => {
    setDirection(dir);
    setActiveTab(next as TabId);
  }, []);

  /* ── Regenerate a single visual ───────────────────────────── */

  const handleRegenerateAsset = useCallback(
    async (asset: VisualAsset) => {
      if (!project) return;

      const markStatus = (next: AssetStatus, imageUrl?: string) =>
        setProject((prev) => {
          if (!prev) return prev;
          const updated: Project = {
            ...prev,
            visuals: prev.visuals.map((v) =>
              v.id === asset.id
                ? { ...v, status: next, ...(imageUrl ? { imageUrl } : {}) }
                : v,
            ),
          };
          persistIfLocal(updated);
          return updated;
        });

      markStatus("loading");

      try {
        const res = await fetch("/api/generate-visual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: asset.prompt,
            visualType: asset.visualType,
            title: asset.title,
          }),
        });
        const data = (await res.json()) as {
          imageUrl?: string;
          status?: AssetStatus;
          error?: string;
        };
        const nextStatus: AssetStatus = data.status ?? "fallback";
        markStatus(nextStatus, data.imageUrl ?? asset.imageUrl);
      } catch (err) {
        console.warn("[project] regenerate failed:", err);
        markStatus("error", asset.imageUrl);
      }
    },
    [persistIfLocal, project],
  );

  /* ── Generate a fresh 3D model ────────────────────────────── */

  const handleGenerate3D = useCallback(async () => {
    if (!project || generating3D) return;
    setGenerating3D(true);

    const seedVisual =
      project.visuals.find(
        (v) =>
          v.visualType === "product_mockup" &&
          v.imageUrl &&
          !v.imageUrl.startsWith("/placeholder"),
      ) ??
      project.visuals.find(
        (v) => v.imageUrl && !v.imageUrl.startsWith("/placeholder"),
      );

    const seedPrompt =
      [
        project.brandResult.brandName,
        project.brandResult.usp,
        project.userInput.productType,
      ]
        .filter(Boolean)
        .join(" — ") || "Product hero mockup";

    const body = seedVisual
      ? { mode: "image_to_3d" as const, imageUrl: seedVisual.imageUrl }
      : { mode: "text_to_3d" as const, prompt: seedPrompt };

    // Optimistic loading model so the viewer shows the spinner state.
    setProject((prev) =>
      prev
        ? {
            ...prev,
            model3d: {
              id: `m3d-${Date.now().toString(36)}`,
              modelType: body.mode,
              prompt: body.mode === "text_to_3d" ? body.prompt : seedPrompt,
              sourceImageUrl:
                body.mode === "image_to_3d" ? body.imageUrl : undefined,
              modelUrl: "",
              status: "loading",
            },
          }
        : prev,
    );

    try {
      const res = await fetch("/api/generate-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        modelUrl?: string;
        status?: AssetStatus;
        sourceImageUrl?: string;
        intermediateImageUrl?: string;
        prompt?: string;
      };

      setProject((prev) => {
        if (!prev) return prev;
        const next: Project = {
          ...prev,
          model3d: {
            id: prev.model3d?.id ?? `m3d-${Date.now().toString(36)}`,
            modelType: body.mode,
            prompt: data.prompt ?? seedPrompt,
            sourceImageUrl:
              data.sourceImageUrl ??
              data.intermediateImageUrl ??
              (body.mode === "image_to_3d" ? body.imageUrl : undefined),
            modelUrl: data.modelUrl ?? "",
            status: data.status ?? "fallback",
          },
        };
        persistIfLocal(next);
        return next;
      });
    } catch (err) {
      console.warn("[project] 3D generation failed:", err);
      setProject((prev) =>
        prev && prev.model3d
          ? {
              ...prev,
              model3d: { ...prev.model3d, status: "error" },
            }
          : prev,
      );
    } finally {
      setGenerating3D(false);
    }
  }, [generating3D, persistIfLocal, project]);

  /* ── Render ───────────────────────────────────────────────── */

  if (status === "loading") return <PageSkeleton />;
  if (status === "missing" || !project) return <PageMissing id={id} />;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden bg-background">
      <Hero project={project} />

      {/* ── Sticky tab bar ──────────────────────────────────── */}
      <div
        className={cn(
          "sticky top-16 z-30 border-y border-white/[0.06]",
          "bg-background/85 backdrop-blur-xl",
        )}
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 lg:px-12">
          <ProjectTabs
            tabs={TABS}
            activeId={activeTab}
            onChange={handleTabChange}
          />
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-8 sm:pt-10 lg:px-12">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={activeTab}
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -48 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="min-h-[40vh]"
          >
            {activeTab === "brand" ? (
              <BrandIdentityTab brand={project.brandResult} />
            ) : null}
            {activeTab === "visuals" ? (
              <VisualsTab
                assets={project.visuals}
                onOpenLightbox={setLightboxAsset}
                onRegenerate={handleRegenerateAsset}
              />
            ) : null}
            {activeTab === "model" ? (
              <ModelTab
                model={project.model3d ?? null}
                generating={generating3D}
                onGenerate={handleGenerate3D}
              />
            ) : null}
            {activeTab === "website" ? (
              <WebsiteTab
                concept={project.websiteConcept}
                brand={project.brandResult}
              />
            ) : null}
            {activeTab === "marketing" ? (
              <MarketingTab pack={project.marketingPack} />
            ) : null}
            {activeTab === "trust" ? (
              <TrustScoreWidget data={project.trustScore} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── Lightbox ────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxAsset ? (
          <Lightbox
            asset={lightboxAsset}
            onClose={() => setLightboxAsset(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────────────────────── */

function Hero({ project }: { project: Project }) {
  const { brandResult, trustScore, visuals } = project;
  const heroVisual = useMemo(
    () =>
      visuals.find(
        (v) =>
          v.visualType === "hero_image" &&
          v.imageUrl &&
          !v.imageUrl.startsWith("/placeholder"),
      ) ??
      visuals.find(
        (v) => v.imageUrl && !v.imageUrl.startsWith("/placeholder"),
      ) ??
      visuals[0],
    [visuals],
  );

  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
      {/* Dark gradient background */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10",
          "bg-[radial-gradient(80%_60%_at_15%_10%,rgba(56,189,248,0.16),transparent_60%),radial-gradient(70%_60%_at_85%_30%,rgba(168,85,247,0.16),transparent_60%),linear-gradient(180deg,#020617_0%,#0a0f1e_60%,#020617_100%)]",
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-12 -z-10 h-[420px] w-[420px] rounded-full bg-brand-cyan/[0.05] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-[360px] w-[360px] rounded-full bg-brand-purple/[0.06] blur-3xl"
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-8 sm:pb-16 sm:pt-8 lg:px-12">
        {/* Top utility row */}
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
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white",
              "bg-gradient-to-br from-brand-cyan to-brand-purple",
              "transition-transform duration-200 hover:scale-[1.02]",
            )}
          >
            <Edit3 className="h-4 w-4" />
            Continue in chat
          </Link>
        </div>

        {/* Hero grid */}
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          {/* Left — copy + trust ring */}
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-[40px] font-bold leading-[1.05] tracking-tight text-foreground sm:text-[48px]"
            >
              {brandResult.brandName || "Untitled brand"}
            </motion.h1>

            {brandResult.tagline ? (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[18px]"
              >
                {brandResult.tagline}
              </motion.p>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-6 flex flex-wrap items-center gap-4"
            >
              <MiniTrustRing score={trustScore?.overallScore ?? 0} />
              <div className="text-[12px] leading-snug text-hint">
                Trust Score
                <div className="text-foreground/80">
                  {trustScore?.confidence ?? "Medium"} confidence ·{" "}
                  {trustScore?.categories?.length ?? 0} signals
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right — hero image card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              "relative aspect-[4/3] w-full overflow-hidden rounded-3xl",
              "border border-white/[0.08] bg-card/40 backdrop-blur-xl",
              "shadow-[0_24px_60px_-24px_rgba(56,189,248,0.35)]",
            )}
          >
            {heroVisual?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroVisual.imageUrl}
                alt={heroVisual.title || brandResult.brandName}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <HeroGradientPlaceholder palette={brandResult.colorPalette} />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroGradientPlaceholder({ palette }: { palette: string[] }) {
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
        background: `radial-gradient(120% 120% at 0% 0%, ${a} 0%, transparent 60%), radial-gradient(120% 120% at 100% 0%, ${b}40 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, ${c}40 0%, transparent 55%), #0a0f1e`,
      }}
      aria-hidden
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   MiniTrustRing — compact animated count-up ring for the hero.
   ───────────────────────────────────────────────────────────── */

function MiniTrustRing({ score }: { score: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const tone = safe >= 70 ? "good" : safe >= 40 ? "warn" : "bad";

  const RADIUS = 26;
  const STROKE = 5;
  const SIZE = (RADIUS + STROKE) * 2;
  const CIRC = 2 * Math.PI * RADIUS;
  const target = CIRC * (1 - safe / 100);

  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const c = animateValue(0, safe, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });
    return () => c.stop();
  }, [safe]);

  const stroke =
    tone === "good"
      ? "stroke-state-success"
      : tone === "warn"
        ? "stroke-state-warning"
        : "stroke-state-danger";
  const textTone =
    tone === "good"
      ? "text-state-success"
      : tone === "warn"
        ? "text-state-warning"
        : "text-state-danger";

  return (
    <div
      className="relative"
      style={{ width: SIZE, height: SIZE }}
      aria-label={`Trust score ${safe} of 100`}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-white/[0.08]"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: target }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          className={stroke}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-[15px] font-bold tabular-nums", textTone)}>
          {displayed}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tab 1 — Brand Identity
   ───────────────────────────────────────────────────────────── */

function BrandIdentityTab({ brand }: { brand: BrandResult }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Headline block */}
      <SectionCard>
        <Eyebrow tone="cyan">Brand Brain</Eyebrow>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {brand.brandName || "Untitled brand"}
        </h2>
        {brand.tagline ? (
          <p className="mt-1.5 text-[15px] text-muted">{brand.tagline}</p>
        ) : null}
      </SectionCard>

      {/* Attribute grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <BrandAttr title="Mission" value={brand.mission} />
        <BrandAttr title="Audience" value={brand.targetAudience} />
        <BrandAttr title="Tone" value={brand.tone} />
        <BrandAttr title="USP" value={brand.usp} />
        <BrandAttr title="Promise" value={brand.promise} />
        <BrandAttr title="Story" value={brand.story} multiline />
      </div>

      {/* Color palette */}
      {brand.colorPalette?.length ? (
        <SectionCard>
          <Eyebrow tone="purple">Color Palette</Eyebrow>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            {brand.colorPalette.map((hex, i) => (
              <motion.div
                key={`${hex}-${i}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.05 * i, ease: "easeOut" }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="h-16 w-16 rounded-full ring-2 ring-white/10 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.6)]"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
                <span className="font-mono text-[11px] text-muted">{hex}</span>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {brand.painPoints?.length ? (
        <SectionCard>
          <Eyebrow tone="cyan">Pain Points We Solve</Eyebrow>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground/85">
            {brand.painPoints.map((p, i) => (
              <li key={`${p}-${i}`} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </motion.div>
  );
}

function BrandAttr({
  title,
  value,
  multiline,
}: {
  title: string;
  value: string;
  multiline?: boolean;
}) {
  if (!value) return null;
  return (
    <SectionCard className={multiline ? "md:col-span-2" : undefined}>
      <Eyebrow tone="muted">{title}</Eyebrow>
      <p
        className={cn(
          "mt-2 text-[14.5px] leading-relaxed text-foreground/85",
          multiline ? "" : "line-clamp-none",
        )}
      >
        {value}
      </p>
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tab 2 — Visuals (2x2 grid + regenerate + lightbox)
   ───────────────────────────────────────────────────────────── */

function VisualsTab({
  assets,
  onOpenLightbox,
  onRegenerate,
}: {
  assets: VisualAsset[];
  onOpenLightbox: (asset: VisualAsset) => void;
  onRegenerate: (asset: VisualAsset) => void;
}) {
  if (!assets?.length) {
    return (
      <SectionCard className="text-center">
        <ImageIcon className="mx-auto h-7 w-7 text-hint" />
        <h3 className="mt-3 text-base font-semibold text-foreground">
          No visuals yet
        </h3>
        <p className="mt-1.5 text-sm text-muted">
          Generate this brand from /generate to see fal.ai visuals here.
        </p>
      </SectionCard>
    );
  }

  // Pad to 4 so we always render a 2x2 grid even if fewer assets exist.
  const tiles = [...assets].slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {tiles.map((asset, i) => (
        <VisualTile
          key={asset.id}
          asset={asset}
          delay={i * 0.05}
          onOpen={() => onOpenLightbox(asset)}
          onRegenerate={() => onRegenerate(asset)}
        />
      ))}
    </div>
  );
}

function VisualTile({
  asset,
  delay,
  onOpen,
  onRegenerate,
}: {
  asset: VisualAsset;
  delay: number;
  onOpen: () => void;
  onRegenerate: () => void;
}) {
  const isLoading = asset.status === "loading";
  return (
    <motion.figure
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.06]",
        "bg-card/40 backdrop-blur-xl",
        "transition-colors hover:border-brand-cyan/25",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${asset.title} in lightbox`}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-card-deep">
          {asset.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.imageUrl}
              alt={asset.title}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 ease-out",
                "group-hover:scale-[1.04]",
                isLoading && "opacity-50",
              )}
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-cyan/10 via-card-hover/30 to-brand-purple/10">
              <span className="px-3 text-center text-[11px] uppercase tracking-wider text-hint">
                {asset.title}
              </span>
            </div>
          )}
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <Loader2 className="h-7 w-7 animate-spin text-brand-cyan" />
            </div>
          ) : null}
          <div
            aria-hidden
            className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-background/70 px-2 py-1 text-[11px] text-foreground/85 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
          >
            <Maximize2 className="h-3 w-3" />
            View
          </div>
        </div>
      </button>

      <figcaption className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold text-foreground">
            {asset.title}
          </div>
          <div className="truncate text-[11px] text-hint">
            {asset.visualType.replace(/_/g, " ")}
          </div>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
            "border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-foreground/85",
            "transition-colors hover:border-brand-cyan/30 hover:text-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
          />
          Regenerate
        </button>
      </figcaption>
    </motion.figure>
  );
}

function Lightbox({
  asset,
  onClose,
}: {
  asset: VisualAsset;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 p-4 backdrop-blur-xl sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${asset.title} preview`}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative max-h-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className={cn(
            "absolute -right-2 -top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full",
            "border border-white/15 bg-card/80 text-foreground/90 backdrop-blur-md",
            "transition-colors hover:border-brand-cyan/40 hover:text-foreground",
            "sm:-right-4 sm:-top-4",
          )}
        >
          <X className="h-4 w-4" />
        </button>
        {asset.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.imageUrl}
            alt={asset.title}
            className="max-h-[85vh] max-w-full rounded-2xl border border-white/10 shadow-2xl"
          />
        ) : (
          <div className="grid h-[60vh] w-[80vw] max-w-3xl place-items-center rounded-2xl border border-white/10 bg-card text-sm text-muted">
            No image to preview
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-3 text-foreground">
          <div>
            <div className="text-sm font-semibold">{asset.title}</div>
            <div className="line-clamp-1 text-[12px] text-hint">
              {asset.prompt}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tab 3 — 3D Model
   ───────────────────────────────────────────────────────────── */

function ModelTab({
  model,
  generating,
  onGenerate,
}: {
  model: Model3D | null;
  generating: boolean;
  onGenerate: () => void;
}) {
  const hasModel = !!model;

  if (!hasModel) {
    return (
      <SectionCard className="flex flex-col items-center gap-5 px-8 py-16 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-cyan/15 to-brand-purple/15">
          <Box className="h-7 w-7 text-foreground/85" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            No 3D model yet
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
            Forge a 3D mesh from your hero product image using fal.ai TRELLIS.
            Typical run time is 30–90 seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white",
            "bg-gradient-to-r from-brand-cyan to-brand-purple shadow-md shadow-brand-cyan/20",
            "transition-transform duration-200 hover:scale-[1.03]",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
          )}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Forging mesh…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate 3D Model
            </>
          )}
        </button>
      </SectionCard>
    );
  }

  return (
    <div
      className={cn(
        "h-[640px] w-full overflow-hidden rounded-2xl border border-white/[0.06]",
        "bg-card/40 backdrop-blur-xl",
      )}
    >
      <ModelViewer model={model} title={model.prompt ? "3D Mesh" : "3D Model"} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tab 4 — Website (browser mockup)
   ───────────────────────────────────────────────────────────── */

function WebsiteTab({
  concept,
  brand,
}: {
  concept: WebsiteConcept;
  brand: BrandResult;
}) {
  const domain = useMemo(() => {
    const stub = (brand.brandName || concept.heroHeadline || "yourbrand")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 18);
    return `${stub || "yourbrand"}.com`;
  }, [brand.brandName, concept.heroHeadline]);

  const accent = brand.colorPalette?.[2] ?? "#38BDF8";

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-white/[0.08]",
          "bg-white/[0.03] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)] backdrop-blur-xl",
        )}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-card/60 px-4 py-2.5">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-state-danger/80" />
            <span className="h-3 w-3 rounded-full bg-state-warning/80" />
            <span className="h-3 w-3 rounded-full bg-state-success/80" />
          </div>
          <div
            className={cn(
              "ml-2 flex flex-1 items-center gap-2 truncate rounded-md",
              "border border-white/[0.06] bg-background/60 px-3 py-1.5",
              "font-mono text-[11.5px] text-muted",
            )}
          >
            <span className="text-state-success">●</span>
            <span className="truncate">https://{domain}</span>
          </div>
        </div>

        {/* Hero */}
        <div
          className="relative isolate overflow-hidden px-6 py-12 sm:px-12 sm:py-16"
          style={{
            background: `radial-gradient(60% 50% at 25% 25%, ${accent}22, transparent 70%), radial-gradient(50% 50% at 80% 60%, rgba(168,85,247,0.18), transparent 70%), #07101e`,
          }}
        >
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold tracking-tight text-foreground">
              {(brand.brandName || domain.split(".")[0]).slice(0, 28)}
            </span>
            <div className="hidden items-center gap-5 text-hint sm:flex">
              <span>Product</span>
              <span>Pricing</span>
              <span>About</span>
              <span
                className="rounded-md border border-white/15 px-2 py-0.5 text-foreground/85"
                style={{ borderColor: `${accent}55` }}
              >
                Sign in
              </span>
            </div>
          </div>

          <h2 className="mt-10 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {concept.heroHeadline || "Your hero headline appears here"}
          </h2>
          {concept.heroSubheadline ? (
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
              {concept.heroSubheadline}
            </p>
          ) : null}

          {concept.cta ? (
            <button
              type="button"
              className={cn(
                "mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white",
                "bg-gradient-to-r from-brand-cyan to-brand-purple shadow-md shadow-brand-cyan/30",
                "transition-transform duration-200 hover:scale-[1.03]",
              )}
            >
              {concept.cta}
            </button>
          ) : null}

          {concept.trustSignals?.length ? (
            <div className="mt-8 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
              {concept.trustSignals.map((sig) => (
                <span
                  key={sig}
                  className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-muted"
                >
                  {sig}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Sections */}
        {concept.sections?.length ? (
          <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] bg-white/[0.04] sm:grid-cols-2">
            {concept.sections.map((s, i) => (
              <div
                key={`${s.title}-${i}`}
                className="flex flex-col gap-2 bg-card/50 p-5"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                  {String(i + 1).padStart(2, "0")} · {s.title}
                </div>
                <p className="text-[13.5px] leading-relaxed text-foreground/85">
                  {s.content}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {/* FAQ */}
        {concept.faq?.length ? (
          <div className="border-t border-white/[0.06] bg-card/40 p-6 sm:p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-purple">
              Frequently asked
            </div>
            <div className="mt-4 space-y-3">
              {concept.faq.map((f, i) => (
                <details
                  key={`${f.q}-${i}`}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 open:bg-white/[0.04]"
                >
                  <summary
                    className={cn(
                      "flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground",
                      "marker:hidden [&::-webkit-details-marker]:hidden",
                    )}
                  >
                    <span>{f.q}</span>
                    <span className="text-hint transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tab 5 — Marketing
   ───────────────────────────────────────────────────────────── */

interface MarketingChannel {
  id: keyof MarketingPack | "ads";
  label: string;
  icon: LucideIcon;
  /** Plain-text body for copy. */
  text: string;
  /** Optional rich rendering when the plain text is awkward. */
  render?: () => React.ReactNode;
}

function MarketingTab({ pack }: { pack: MarketingPack }) {
  const channels: MarketingChannel[] = [
    {
      id: "instagramCaption",
      label: "Instagram",
      icon: Camera,
      text: pack.instagramCaption ?? "",
    },
    {
      id: "tiktokScript",
      label: "TikTok",
      icon: Music2,
      text: pack.tiktokScript ?? "",
    },
    {
      id: "whatsappMessage",
      label: "WhatsApp",
      icon: MessageCircle,
      text: pack.whatsappMessage ?? "",
    },
    {
      id: "emailSubject",
      label: "Email",
      icon: Mail,
      text: pack.emailSubject ? `Subject: ${pack.emailSubject}` : "",
      render: () =>
        pack.emailSubject ? (
          <div className="space-y-1.5">
            <div className="text-[10.5px] uppercase tracking-wider text-hint">
              Subject
            </div>
            <div className="text-foreground/95">{pack.emailSubject}</div>
          </div>
        ) : (
          <EmptyChannel />
        ),
    },
    {
      id: "ads",
      label: "Ads",
      icon: Megaphone,
      text: (pack.adHeadlines ?? []).join("\n"),
      render: () =>
        pack.adHeadlines?.length ? (
          <ol className="space-y-2">
            {pack.adHeadlines.map((h, i) => (
              <li key={`${h}-${i}`} className="flex gap-2.5">
                <span className="mt-0.5 font-mono text-[10px] text-hint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyChannel />
        ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {channels.map((ch, i) => (
        <MarketingChannelCard key={ch.id} channel={ch} delay={i * 0.05} />
      ))}
    </div>
  );
}

function MarketingChannelCard({
  channel,
  delay,
}: {
  channel: MarketingChannel;
  delay: number;
}) {
  const Icon = channel.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border border-white/[0.06]",
        "bg-white/[0.03] p-5 backdrop-blur-xl",
        "transition-colors hover:border-brand-cyan/20",
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-card/60 text-brand-cyan">
            <Icon size={16} />
          </span>
          <h3 className="text-[14.5px] font-semibold text-foreground">
            {channel.label}
          </h3>
        </div>
        <CopyButton text={channel.text} />
      </header>

      <div className="flex-1 rounded-xl bg-background/30 p-4 text-[13.5px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
        {channel.render
          ? channel.render()
          : channel.text || <EmptyChannel />}
      </div>
    </motion.article>
  );
}

function EmptyChannel() {
  return <span className="text-hint">No content generated yet.</span>;
}

/* ─────────────────────────────────────────────────────────────
   Shared bits
   ───────────────────────────────────────────────────────────── */

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Eyebrow({
  tone = "cyan",
  children,
}: {
  tone?: "cyan" | "purple" | "muted";
  children: React.ReactNode;
}) {
  const dot =
    tone === "purple"
      ? "bg-brand-purple"
      : tone === "muted"
        ? "bg-hint"
        : "bg-brand-cyan";
  const text =
    tone === "purple"
      ? "text-brand-purple"
      : tone === "muted"
        ? "text-hint"
        : "text-brand-cyan";
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
        text,
      )}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)} />
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — silent */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      aria-label={copied ? "Copied" : "Copy"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold",
        "border border-white/[0.08] bg-white/[0.04] backdrop-blur-md",
        copied
          ? "text-state-success border-state-success/30"
          : "text-foreground/85 hover:text-foreground hover:border-brand-cyan/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page-level states
   ───────────────────────────────────────────────────────────── */

function PageSkeleton() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden bg-background">
      <div className="border-b border-white/[0.06] bg-card-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 lg:px-12">
          <div className="h-10 w-1/3 animate-pulse rounded-xl bg-card-hover/40" />
          <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-card-hover/30" />
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div className="h-24 animate-pulse rounded-2xl bg-card-hover/20" />
            <div className="aspect-[4/3] animate-pulse rounded-3xl bg-card-hover/30" />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-12">
        <div className="h-12 animate-pulse rounded-xl bg-card-hover/30" />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-card-hover/20"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PageMissing({ id }: { id: string }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 py-24 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-col items-center gap-4 rounded-2xl",
            "border border-white/[0.06] bg-card/60 px-8 py-14 text-center backdrop-blur-xl",
          )}
        >
          <h2 className="text-xl font-semibold text-foreground">
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
              "text-sm font-medium text-foreground hover:border-brand-cyan/40 hover:text-brand-cyan",
            )}
          >
            Back to gallery
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
