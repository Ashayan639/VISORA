"use client";

import { animate, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type ScoreTone = "good" | "warn" | "bad";

export function scoreTone(score: number): ScoreTone {
  if (score > 70) return "good";
  if (score >= 40) return "warn";
  return "bad";
}

const TONE: Record<
  ScoreTone,
  { ring: string; text: string; chip: string }
> = {
  good: {
    ring: "stroke-foreground",
    text: "text-foreground",
    chip: "bg-foreground/10 text-foreground border-foreground/30",
  },
  warn: {
    ring: "stroke-hint",
    text: "text-hint",
    chip: "bg-hint/10 text-hint border-hint/30",
  },
  bad: {
    ring: "stroke-[#4F5052]",
    text: "text-[#4F5052]",
    chip: "bg-[#4F5052]/10 text-[#4F5052] border-[#4F5052]/30",
  },
};

interface TrustScoreRingProps {
  score: number;
  size?: number;
  className?: string;
}

export function TrustScoreRing({ score, size = 88, className }: TrustScoreRingProps) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const tone = scoreTone(safe);
  const stroke = size < 100 ? 6 : 8;
  const radius = (size - stroke * 2) / 2 - 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - safe / 100);

  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const controls = animate(0, safe, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });
    return () => controls.stop();
  }, [safe]);

  const fontSize = size < 100 ? "text-xl" : "text-4xl";

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Trust score ${safe} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-white/[0.06]"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={TONE[tone].ring}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold leading-none", fontSize, TONE[tone].text)}>
          {displayed}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-hint">
          trust
        </span>
      </div>
    </div>
  );
}
