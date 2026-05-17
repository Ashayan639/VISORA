"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Database,
  GalleryHorizontalEnd,
  Pencil,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

interface FlowNode {
  icon: LucideIcon;
  label: string;
  sub: string;
}

const NODES: FlowNode[] = [
  { icon: Pencil, label: "User Input", sub: "Idea or URL" },
  { icon: Brain, label: "OpenAI API", sub: "Brand brain" },
  { icon: Sparkles, label: "fal.ai API", sub: "Visuals + 3D" },
  { icon: Database, label: "Supabase", sub: "Brand memory" },
  { icon: GalleryHorizontalEnd, label: "Gallery", sub: "Saved realities" },
];

function FlowCard({
  node,
  index,
}: {
  node: FlowNode;
  index: number;
}) {
  const { icon: Icon, label, sub } = node;
  const isFal = label.includes("fal");

  return (
    <motion.li
      variants={{
        hidden: { y: 20, opacity: 0, scale: 0.94 },
        show: { y: 0, opacity: 1, scale: 1 },
      }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      <div
        className={cn(
          "relative w-full rounded-2xl border p-4 backdrop-blur-xl sm:p-5",
          "bg-white/[0.03] border-[#4F5052]/30",
          "transition-shadow duration-300",
          isFal &&
            "border-[#4F5052]/30 shadow-[0_0_32px_-8px_rgba(255,255,255,0.35)]",
        )}
      >
        {isFal ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.03] blur-xl"
          />
        ) : null}
        <div className="relative flex flex-col items-center gap-2">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl ring-1",
              isFal
                ? "bg-white/[0.06] text-foreground ring-[#4F5052]/30"
                : "bg-white/[0.04] text-foreground ring-white/10",
            )}
          >
            <Icon size={22} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">{label}</p>
            <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
          </div>
          <span className="text-[10px] font-mono text-hint">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
    </motion.li>
  );
}

export function ArchitectureFlow() {
  return (
    <section className="relative w-full py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <SectionHeading
          eyebrow="Pipeline"
          title="Architecture Flow"
          subtitle="One intake fans out across three APIs, then lands as a persistent brand reality you can reopen from the gallery."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.22, delayChildren: 0.15 },
            },
          }}
          className="relative mt-16"
        >
          {/* Desktop connecting line */}
          <div className="relative mb-10 hidden lg:block">
            <div className="absolute left-[10%] right-[10%] top-1/2 h-px -translate-y-1/2 bg-white/[0.06]" />
            <motion.div
              variants={{
                hidden: { scaleX: 0 },
                show: { scaleX: 1 },
              }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              style={{ transformOrigin: "left" }}
              className={cn(
                "absolute left-[10%] right-[10%] top-1/2 h-0.5 -translate-y-1/2",
                "bg-gradient-to-r from-[#4F5052] via-[#818283] to-[#4F5052]",
                "shadow-[0_0_20px_-2px_rgba(255,255,255,0.55)]",
              )}
            />
          </div>

          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
            {NODES.map((node, i) => (
              <FlowCard key={node.label} node={node} index={i} />
            ))}
          </ol>

          {/* Mobile vertical connector */}
          <div className="relative mt-2 lg:hidden">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/[0.06]" />
            <motion.div
              variants={{
                hidden: { scaleY: 0 },
                show: { scaleY: 1 },
              }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
              className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#4F5052] via-[#818283] to-[#4F5052]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
