"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import type { BrandResult } from "@/types/visora";

interface BrandCardProps {
  data: BrandResult;
  /** Click handler for "View Full Brand Board" — opens the right panel. */
  onOpen?: () => void;
  /** Sends a chat message to refine the brand identity. */
  onEdit?: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Brand attribute row
   ───────────────────────────────────────────────────────────── */

function Attr({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-hint">
        {label}
      </div>
      <div className="mt-0.5 text-[14px] leading-relaxed text-foreground/85">
        {value}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BrandCard widget
   ───────────────────────────────────────────────────────────── */

export function BrandCard({ data, onOpen, onEdit }: BrandCardProps) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="visora-card visora-card-interactive relative overflow-hidden p-5"
    >
      {/* Eyebrow */}
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-hint">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-hint" />
        Brand Brain
      </div>

      {/* Headline */}
      <h3 className="text-[24px] font-bold tracking-tight text-foreground">
        {data.brandName || "Unnamed brand"}
      </h3>
      {data.tagline ? (
        <p className="mt-1 text-[16px] leading-relaxed text-muted">{data.tagline}</p>
      ) : null}

      {/* Attribute grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Attr label="Mission" value={data.mission} />
        <Attr label="Audience" value={data.targetAudience} />
        <Attr label="Tone" value={data.tone} />
        <Attr label="USP" value={data.usp} />
      </div>

      {/* Color palette */}
      {data.colorPalette?.length ? (
        <div className="mt-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-hint">
            Palette
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {data.colorPalette.map((hex, i) => (
              <motion.div
                key={`${hex}-${i}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.35,
                  delay: 0.2 + i * 0.05,
                  ease: "easeOut",
                }}
                className="
                  group flex items-center gap-1.5 rounded-full
                  border border-[#4F5052]/30 bg-white/[0.02] px-2 py-1
                "
                title={hex}
              >
                <span
                  className="h-4 w-4 rounded-full ring-1 ring-white/10"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-[11px] font-mono text-muted">{hex}</span>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}

      {/* CTAs */}
      {onOpen || onEdit ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-6 flex flex-wrap items-center gap-2"
        >
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="
                group/btn inline-flex items-center gap-2 rounded-full
                px-4 py-2 text-[13px] font-semibold
                bg-[#F8FAFA] text-[#282728]
                shadow-md shadow-black/25
                transition-all duration-200
                hover:scale-[1.03] hover:opacity-90
              "
            >
              View Full
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
              />
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="
                inline-flex items-center gap-2 rounded-full border border-[#4F5052]/30
                bg-[#282728] px-4 py-2 text-[13px] font-semibold text-[#F8FAFA]
                transition-all duration-200 hover:border-[#4F5052]/50 hover:bg-[#282728]/90
              "
            >
              Edit
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export default BrandCard;
