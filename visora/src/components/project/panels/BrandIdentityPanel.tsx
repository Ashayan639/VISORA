"use client";

import type { BrandResult } from "@/types/visora";
import { cn } from "@/lib/utils";

function Field({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-hint">
        {label}
      </dt>
      <dd className="text-[15px] leading-relaxed text-foreground/90">{value}</dd>
    </div>
  );
}

interface BrandIdentityPanelProps {
  brand: BrandResult;
}

export function BrandIdentityPanel({ brand }: BrandIdentityPanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#4F5052]/30 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8",
      )}
    >
      <h2 className="mb-6 text-lg font-semibold text-foreground">Brand identity</h2>
      <dl className="grid gap-6 sm:grid-cols-2">
        <Field label="Brand name" value={brand.brandName} />
        <Field label="Tagline" value={brand.tagline} />
        <Field label="Mission" value={brand.mission} />
        <Field label="Target audience" value={brand.targetAudience} />
        <Field label="Tone" value={brand.tone} />
        <Field label="USP" value={brand.usp} />
        <div className="sm:col-span-2">
          <Field label="Story" value={brand.story} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Promise" value={brand.promise} />
        </div>
      </dl>

      {brand.colorPalette?.length ? (
        <div className="mt-8 border-t border-[#4F5052]/30 pt-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-hint">
            Color palette
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {brand.colorPalette.map((hex, i) => (
              <div key={`${hex}-${i}`} className="flex flex-col items-center gap-1.5">
                <span
                  className="h-10 w-10 rounded-full ring-2 ring-white/10"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
                <span className="font-mono text-[11px] text-muted">{hex}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {brand.painPoints?.length ? (
        <div className="mt-8 border-t border-[#4F5052]/30 pt-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-hint">
            Pain points
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[14px] text-muted">
            {brand.painPoints.map((p, i) => (
              <li key={`${p}-${i}`}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
