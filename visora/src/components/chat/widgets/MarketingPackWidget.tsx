"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  ChevronDown,
  Copy,
  Mail,
  Megaphone,
  MessageCircle,
  Music2,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MarketingPack } from "@/types/visora";
import { cn } from "@/lib/utils";

interface MarketingPackWidgetProps {
  data: MarketingPack;
}

interface PackSection {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Plain-text body used for the "Copy" button. */
  text: string;
  /** Optional richer rendering for the body. */
  render?: () => React.ReactNode;
}

/* ─────────────────────────────────────────────────────────────
   Copy button with 2-second checkmark
   ───────────────────────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        // Fallback for older browsers / non-secure contexts.
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
      // Silent — clipboard might be blocked. Don't crash the chat.
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      aria-label={copied ? "Copied" : "Copy"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
        "border border-white/[0.06] bg-white/[0.04] backdrop-blur-md",
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
   Single expandable section
   ───────────────────────────────────────────────────────────── */

function Section({
  section,
  open,
  onToggle,
  index,
}: {
  section: PackSection;
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  const Icon = section.icon;
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.05 * index, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
          "hover:bg-white/[0.04]",
        )}
      >
        <span
          className="
            inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md
            bg-white/[0.04] border border-white/[0.06] text-brand-cyan
          "
        >
          <Icon size={14} />
        </span>
        <span className="flex-1 text-[13px] font-semibold text-foreground">
          {section.label}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted"
          aria-hidden
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-white/[0.06] p-3">
              <div className="rounded-md bg-background/40 p-3 text-[12.5px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
                {section.render
                  ? section.render()
                  : section.text || (
                      <span className="text-hint">No content generated yet.</span>
                    )}
              </div>
              <div className="flex justify-end">
                <CopyButton text={section.text} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MarketingPackWidget
   ───────────────────────────────────────────────────────────── */

export function MarketingPackWidget({ data }: MarketingPackWidgetProps) {
  const sections: PackSection[] = [
    {
      id: "instagram",
      label: "Instagram",
      icon: Camera,
      text: data.instagramCaption ?? "",
    },
    {
      id: "tiktok",
      label: "TikTok",
      icon: Music2,
      text: data.tiktokScript ?? "",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      text: data.whatsappMessage ?? "",
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      text: data.emailSubject
        ? `Subject: ${data.emailSubject}`
        : "",
      render: () =>
        data.emailSubject ? (
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-hint">
              Subject
            </div>
            <div className="font-semibold text-foreground">{data.emailSubject}</div>
          </div>
        ) : (
          <span className="text-hint">No email subject generated yet.</span>
        ),
    },
    {
      id: "ads",
      label: "Ads",
      icon: Megaphone,
      text: (data.adHeadlines ?? []).join("\n"),
      render: () =>
        data.adHeadlines && data.adHeadlines.length ? (
          <ol className="space-y-1.5">
            {data.adHeadlines.map((h, i) => (
              <li key={`${h}-${i}`} className="flex gap-2">
                <span className="mt-0.5 font-mono text-[10px] text-hint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
        ) : (
          <span className="text-hint">No ad headlines generated yet.</span>
        ),
    },
  ];

  // First section starts expanded so users see something immediately.
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="
        relative overflow-hidden rounded-2xl p-4
        bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.06]
      "
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-purple">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-purple" />
        Marketing Pack
      </div>

      <div className="space-y-2">
        {sections.map((section, i) => (
          <Section
            key={section.id}
            section={section}
            index={i}
            open={openId === section.id}
            onToggle={() =>
              setOpenId((curr) => (curr === section.id ? null : section.id))
            }
          />
        ))}
      </div>
    </motion.div>
  );
}

export default MarketingPackWidget;
