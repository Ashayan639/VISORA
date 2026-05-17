"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";

import { TrustScoreRing, scoreTone } from "@/components/project/shared/TrustScoreRing";
import type { TrustScore } from "@/types/visora";
import { cn } from "@/lib/utils";

interface TrustScorePanelProps {
  data: TrustScore | null | undefined;
}

const TONE_BAR: Record<ReturnType<typeof scoreTone>, string> = {
  good: "bg-foreground",
  warn: "bg-hint",
  bad: "bg-[#4F5052]",
};

const TONE_TEXT: Record<ReturnType<typeof scoreTone>, string> = {
  good: "text-foreground",
  warn: "text-hint",
  bad: "text-[#4F5052]",
};

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
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-foreground/90">{name}</span>
        <span className={cn("font-mono font-semibold", TONE_TEXT[tone])}>{safe}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safe}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className={cn("h-full rounded-full", TONE_BAR[tone])}
        />
      </div>
    </li>
  );
}

export function TrustScorePanel({ data }: TrustScorePanelProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(data?.overallScore || 0)));
  const tone = useMemo(() => scoreTone(safeScore), [safeScore]);

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center backdrop-blur-xl">
        <p className="text-sm text-muted">Trust score not available for this project.</p>
      </div>
    );
  }

  const suggestions = (data.suggestions ?? []).slice(0, 5);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#4F5052]/30 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8",
        tone === "good" && "shadow-[0_0_40px_-12px_rgba(255,255,255,0.08)]",
        tone === "warn" && "shadow-[0_0_40px_-12px_rgba(129,130,131,0.12)]",
        tone === "bad" && "shadow-[0_0_40px_-12px_rgba(79,80,82,0.15)]",
      )}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-3 lg:shrink-0">
          <TrustScoreRing score={safeScore} size={160} />
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              tone === "good" && "border-foreground/30 bg-foreground/10 text-foreground",
              tone === "warn" && "border-hint/30 bg-hint/10 text-hint",
              tone === "bad" && "border-disabled/30 bg-disabled/10 text-muted",
            )}
          >
            {data.confidence ?? "Medium"} confidence
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          {data.categories?.length ? (
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-hint">
                Category breakdown
              </h3>
              <ul className="space-y-4">
                {data.categories.map((c, i) => (
                  <CategoryBar
                    key={c.name}
                    name={c.name}
                    score={c.score}
                    delay={0.15 + i * 0.08}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {suggestions.length ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-hint">
                Suggestions
              </h3>
              <ul className="space-y-2 text-[14px] leading-relaxed text-foreground/90">
                {suggestions.map((s, i) => (
                  <li key={`${s}-${i}`} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hint" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link
            href="/generate"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white",
              "bg-foreground text-background",
              "shadow-md shadow-black/25 transition-transform hover:scale-[1.03]",
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Improve Score
          </Link>
        </div>
      </div>
    </div>
  );
}
