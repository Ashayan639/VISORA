"use client";

import { animate, motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { TrustScore } from "@/types/visora";
import { cn } from "@/lib/utils";

interface TrustScoreWidgetProps {
  data: TrustScore;
  onImprove?: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Color & tone helpers
   ───────────────────────────────────────────────────────────── */

function scoreTone(score: number): "good" | "warn" | "bad" {
  if (score > 70) return "good";
  if (score >= 40) return "warn";
  return "bad";
}

const TONE_CLASSES: Record<
  "good" | "warn" | "bad",
  {
    ring: string;
    text: string;
    bar: string;
    glow: string;
    chip: string;
  }
> = {
  good: {
    ring: "stroke-state-success",
    text: "text-state-success",
    bar: "bg-state-success",
    glow: "shadow-[0_0_30px_-8px_rgba(34,197,94,0.45)]",
    chip: "bg-state-success/10 text-state-success border-state-success/30",
  },
  warn: {
    ring: "stroke-state-warning",
    text: "text-state-warning",
    bar: "bg-state-warning",
    glow: "shadow-[0_0_30px_-8px_rgba(245,158,11,0.45)]",
    chip: "bg-state-warning/10 text-state-warning border-state-warning/30",
  },
  bad: {
    ring: "stroke-state-danger",
    text: "text-state-danger",
    bar: "bg-state-danger",
    glow: "shadow-[0_0_30px_-8px_rgba(239,68,68,0.45)]",
    chip: "bg-state-danger/10 text-state-danger border-state-danger/30",
  },
};

/* ─────────────────────────────────────────────────────────────
   Circular score ring (SVG)
   ───────────────────────────────────────────────────────────── */

function ScoreRing({
  score,
  tone,
}: {
  score: number;
  tone: "good" | "warn" | "bad";
}) {
  const RADIUS = 42;
  const STROKE = 8;
  const SIZE = (RADIUS + STROKE) * 2; // 100
  const CIRC = 2 * Math.PI * RADIUS;
  const targetOffset = CIRC * (1 - score / 100);

  // Imperative count-up for the displayed number.
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });
    return () => controls.stop();
  }, [score]);

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-white/[0.06]"
        />
        {/* Progress */}
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          className={cn(TONE_CLASSES[tone].ring, "drop-shadow")}
        />
      </svg>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-live="polite"
      >
        <span className={cn("text-3xl font-bold leading-none", TONE_CLASSES[tone].text)}>
          {displayed}
        </span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-hint">
          / 100
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Category bar (animated width)
   ───────────────────────────────────────────────────────────── */

function CategoryBar({
  name,
  score,
  delay,
}: {
  name: string;
  score: number;
  delay: number;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const tone = scoreTone(safe);
  return (
    <li>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-foreground/85">{name}</span>
        <span className={cn("font-mono font-semibold", TONE_CLASSES[tone].text)}>
          {safe}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safe}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className={cn("h-full rounded-full", TONE_CLASSES[tone].bar)}
        />
      </div>
    </li>
  );
}

/* ─────────────────────────────────────────────────────────────
   TrustScoreWidget
   ───────────────────────────────────────────────────────────── */

export function TrustScoreWidget({ data, onImprove }: TrustScoreWidgetProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(data.overallScore || 0)));
  const tone = useMemo(() => scoreTone(safeScore), [safeScore]);
  const topSuggestions = (data.suggestions ?? []).slice(0, 3);

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5",
        "bg-white/[0.03] backdrop-blur-xl",
        "border border-white/[0.06]",
        TONE_CLASSES[tone].glow,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-purple">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-purple" />
        Trust Score
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ScoreRing score={safeScore} tone={tone} />

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                TONE_CLASSES[tone].chip,
              )}
            >
              {data.confidence ?? "Medium"} confidence
            </span>
          </div>

          {data.categories?.length ? (
            <ul className="space-y-2.5">
              {data.categories.slice(0, 5).map((c, i) => (
                <CategoryBar
                  key={c.name}
                  name={c.name}
                  score={c.score}
                  delay={0.2 + i * 0.08}
                />
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {topSuggestions.length ? (
        <div className="mt-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-hint">
            Top suggestions
          </div>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-foreground/85">
            {topSuggestions.map((s, i) => (
              <li key={`${s}-${i}`} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-purple" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {onImprove ? (
        <button
          type="button"
          onClick={onImprove}
          className="
            group/btn mt-5 inline-flex items-center gap-2 rounded-full
            px-4 py-2 text-[13px] font-semibold text-white
            bg-gradient-to-r from-brand-cyan to-brand-purple
            shadow-md shadow-brand-cyan/20
            transition-all duration-200
            hover:scale-[1.03] hover:shadow-lg hover:shadow-brand-purple/30
          "
        >
          <TrendingUp size={14} />
          Improve Score
        </button>
      ) : null}
    </motion.div>
  );
}

export default TrustScoreWidget;
