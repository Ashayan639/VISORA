"use client";

import { motion } from "framer-motion";
import { ArrowRight, Maximize2 } from "lucide-react";

import type { WebsiteConcept } from "@/types/visora";

interface WebsitePreviewWidgetProps {
  data: WebsiteConcept;
  /** Optional brand domain to show in the address bar; falls back to "yourbrand.com". */
  domain?: string;
  onOpen?: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Browser chrome
   ───────────────────────────────────────────────────────────── */

function BrowserChrome({ domain }: { domain: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#4F5052]/30 bg-card/60 px-3 py-2">
      {/* Traffic-light dots */}
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-disabled/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-hint/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/80" />
      </div>

      {/* Address bar */}
      <div
        className="
          ml-2 flex flex-1 items-center gap-2 truncate
          rounded-md bg-background/60 px-2.5 py-1
          border border-[#4F5052]/30
          text-[11px] font-mono text-muted
        "
      >
        <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20zm0 2c4.42 0 8 3.58 8 8c0 .76-.1 1.5-.3 2.2c-.5-.2-1.1-.2-1.6 0c-.7.3-1.5.1-2-.4l-.4-.4c-.5-.5-1.2-.7-1.9-.4c-.7.3-1.1 1-1 1.7l.1.6c.1.7.6 1.3 1.3 1.4c.7.2 1.3.6 1.6 1.2c.3.6.2 1.3-.2 1.8c-1.4 1-3.1 1.6-4.9 1.6c-1 0-2-.2-2.9-.5c-.4-1.4 0-2.9 1-3.9c.5-.5.7-1.2.6-1.9c-.1-.7-.5-1.3-1.1-1.5l-1-.4c-.7-.3-1.5-.1-2 .5l-.5.6C4.4 13.5 4 12.8 4 12c0-4.42 3.58-8 8-8z"
            fill="currentColor"
          />
        </svg>
        <span className="truncate">https://{domain}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   WebsitePreviewWidget
   ───────────────────────────────────────────────────────────── */

export function WebsitePreviewWidget({
  data,
  domain,
  onOpen,
}: WebsitePreviewWidgetProps) {
  const url =
    domain ??
    (data.heroHeadline
      ? `${data.heroHeadline.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "yourbrand"}.com`
      : "yourbrand.com");

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="
        relative overflow-hidden rounded-2xl
        bg-white/[0.03] backdrop-blur-xl
        border border-[#4F5052]/30
      "
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
          Website Preview
        </div>
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="
              inline-flex h-7 w-7 items-center justify-center rounded-md
              text-muted transition-colors
              hover:text-foreground hover:bg-white/[0.05]
            "
            aria-label="Open full preview in side panel"
          >
            <Maximize2 size={13} />
          </button>
        ) : null}
      </div>

      {/* Browser frame */}
      <div className="mt-3 overflow-hidden rounded-xl border border-[#4F5052]/30">
        <BrowserChrome domain={url} />

        {/* Hero body */}
        <div
          className="
            relative
            bg-[radial-gradient(60%_50%_at_30%_30%,rgba(255,255,255,0.10),transparent_70%),radial-gradient(60%_50%_at_80%_60%,rgba(129,130,131,0.10),transparent_70%)]
            px-5 py-8 sm:px-7 sm:py-10
          "
        >
          {/* Faux nav */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-tight text-foreground">
              {url.split(".")[0]}
            </span>
            <div className="hidden gap-3 sm:flex">
              <span className="text-[10px] text-hint">Product</span>
              <span className="text-[10px] text-hint">Pricing</span>
              <span className="text-[10px] text-hint">Login</span>
            </div>
          </div>

          <h4
            className="
              max-w-md text-[18px] font-bold leading-tight tracking-tight
              bg-clip-text text-transparent
              bg-gradient-to-b from-neutral-50 to-neutral-400
            "
          >
            {data.heroHeadline || "Your hero headline appears here"}
          </h4>
          {data.heroSubheadline ? (
            <p className="mt-2 max-w-md text-[12px] leading-relaxed text-muted">
              {data.heroSubheadline}
            </p>
          ) : null}

          {data.cta ? (
            <span
              className="
                mt-4 inline-flex items-center gap-1.5 rounded-full
                px-3 py-1.5 text-[11px] font-semibold text-white
                bg-foreground text-background
                shadow-md shadow-black/25
              "
            >
              {data.cta}
              <ArrowRight size={11} />
            </span>
          ) : null}

          {/* Trust signals strip */}
          {data.trustSignals?.length ? (
            <div className="mt-5 flex flex-wrap gap-1.5 border-t border-[#4F5052]/30 pt-3">
              {data.trustSignals.slice(0, 4).map((sig) => (
                <span
                  key={sig}
                  className="
                    rounded-full px-2 py-0.5 text-[10px] text-hint
                    border border-[#4F5052]/30
                  "
                >
                  {sig}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom CTA */}
      {onOpen ? (
        <div className="p-4 pt-3">
          <button
            type="button"
            onClick={onOpen}
            className="
              group/btn inline-flex items-center gap-2 rounded-full
              px-4 py-2 text-[12px] font-semibold text-white
              bg-foreground text-background
              shadow-md shadow-black/25
              transition-all duration-200
              hover:scale-[1.03] hover:shadow-lg hover:shadow-black/35
            "
          >
            View Full Preview
            <ArrowRight
              size={13}
              className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
            />
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}

export default WebsitePreviewWidget;
