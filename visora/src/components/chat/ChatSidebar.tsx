"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Settings, SquarePen, Trash2 } from "lucide-react";

import type { SessionMeta } from "@/lib/sessions";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Date formatting (relative, compact)
   ───────────────────────────────────────────────────────────── */

function relativeDate(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(then).toLocaleDateString();
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────────── */

function SidebarLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className="
          flex h-7 w-7 items-center justify-center rounded-lg
          bg-gradient-to-br from-brand-cyan to-brand-purple
          text-[12px] font-bold text-white shadow-md shadow-brand-cyan/20
        "
      >
        V
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        VISORA
      </span>
    </Link>
  );
}

function NewRealityButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group inline-flex w-full items-center justify-center gap-2 rounded-lg
        bg-gradient-to-r from-brand-cyan to-brand-purple
        px-3 py-2.5 text-[13px] font-semibold text-white
        shadow-md shadow-brand-cyan/20
        transition-all duration-200
        hover:shadow-lg hover:shadow-brand-purple/30
      "
    >
      <SquarePen size={15} strokeWidth={2} />
      New Reality
    </button>
  );
}

function SessionRow({
  session,
  active,
  onClick,
  onDelete,
}: {
  session: SessionMeta;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group/row relative flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left",
          "transition-colors duration-150",
          active
            ? "bg-card-hover"
            : "hover:bg-card-hover/60",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-1 text-[13px] font-semibold text-foreground">
            {session.title}
          </span>
          <span
            className="
              shrink-0 text-[10px] uppercase tracking-wide text-hint
            "
          >
            {relativeDate(session.updatedAt)}
          </span>
        </div>
        <span className="line-clamp-1 text-[12px] text-muted">
          {session.preview || "—"}
        </span>

        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }
          }}
          aria-label="Delete session"
          className="
            absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md
            opacity-0 transition-opacity duration-150
            text-hint hover:text-state-danger hover:bg-state-danger/10
            group-hover/row:opacity-100 focus:opacity-100
            cursor-pointer
          "
        >
          <Trash2 size={12} />
        </span>
      </button>
    </li>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sidebar shell (used by both desktop and mobile)
   ───────────────────────────────────────────────────────────── */

interface SidebarContentProps {
  sessions: SessionMeta[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

function SidebarContent({
  sessions,
  activeSessionId,
  onNewSession,
  onSwitchSession,
  onDeleteSession,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Top */}
      <div className="space-y-3 p-3">
        <SidebarLogo />
        <NewRealityButton onClick={onNewSession} />
      </div>

      <div className="mx-3 h-px bg-white/[0.06]" />

      {/* Recents */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-hint">
          Recent
        </div>

        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-[12px] leading-relaxed text-hint">
            No sessions yet. Hit{" "}
            <span className="text-foreground">New Reality</span> to start one.
          </p>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.03 } },
            }}
            className="flex flex-col gap-0.5"
          >
            {sessions.map((s) => (
              <motion.div
                key={s.id}
                variants={{
                  hidden: { x: -8, opacity: 0 },
                  show: { x: 0, opacity: 1 },
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <SessionRow
                  session={s}
                  active={s.id === activeSessionId}
                  onClick={() => onSwitchSession(s.id)}
                  onDelete={() => onDeleteSession(s.id)}
                />
              </motion.div>
            ))}
          </motion.ul>
        )}
      </div>

      {/* Bottom: settings + theme */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center justify-between gap-2 text-muted">
          <button
            type="button"
            className="
              inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px]
              transition-colors hover:bg-white/[0.04] hover:text-foreground
            "
            title="Settings (coming soon)"
          >
            <Settings size={14} />
            Settings
          </button>
          <span
            className="
              inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] text-hint
              ring-1 ring-white/[0.06]
            "
            title="Dark mode"
          >
            <Moon size={12} />
            Dark
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Public — ChatSidebar (desktop dock + mobile drawer)
   ───────────────────────────────────────────────────────────── */

export interface ChatSidebarProps extends SidebarContentProps {
  /** Mobile drawer state. */
  mobileOpen: boolean;
  /** Close the mobile drawer (and dim the overlay). */
  onMobileClose: () => void;
}

export function ChatSidebar(props: ChatSidebarProps) {
  const { mobileOpen, onMobileClose, ...content } = props;

  return (
    <>
      {/* Desktop dock */}
      <aside
        className="
          hidden md:flex md:w-[240px] md:shrink-0 md:flex-col
          border-r border-white/[0.06] bg-card/40
        "
        aria-label="Sessions sidebar"
      >
        <SidebarContent {...content} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="
                fixed inset-y-0 left-0 z-50 w-[280px] md:hidden
                bg-card/95 backdrop-blur-xl
                border-r border-white/[0.06]
                shadow-2xl
              "
              aria-label="Sessions sidebar"
            >
              <SidebarContent {...content} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default ChatSidebar;
