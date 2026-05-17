"use client";

import { Check, Copy, Camera, Mail, Megaphone, MessageCircle, Music2, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MarketingPack } from "@/types/visora";
import { cn } from "@/lib/utils";

interface MarketingPanelProps {
  pack: MarketingPack | null | undefined;
}

interface Channel {
  id: string;
  label: string;
  icon: LucideIcon;
  text: string;
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
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={!text}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
        copied
          ? "border-foreground/30 text-foreground"
          : "border-white/[0.08] bg-white/[0.04] text-foreground hover:border-[#4F5052]/30",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ChannelCard({ channel }: { channel: Channel }) {
  const Icon = channel.icon;
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-[#4F5052]/30 bg-white/[0.03] p-5 backdrop-blur-xl",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#4F5052]/30 bg-white/[0.04] text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-[15px] font-semibold text-foreground">{channel.label}</h3>
      </div>
      <p className="min-h-[4.5rem] flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
        {channel.text || "No content generated yet."}
      </p>
      <CopyButton text={channel.text} />
    </article>
  );
}

export function MarketingPanel({ pack }: MarketingPanelProps) {
  if (!pack) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center backdrop-blur-xl">
        <p className="text-sm text-muted">No marketing pack for this project.</p>
      </div>
    );
  }

  const channels: Channel[] = [
    { id: "ig", label: "Instagram", icon: Camera, text: pack.instagramCaption ?? "" },
    { id: "tiktok", label: "TikTok", icon: Music2, text: pack.tiktokScript ?? "" },
    { id: "wa", label: "WhatsApp", icon: MessageCircle, text: pack.whatsappMessage ?? "" },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      text: pack.emailSubject ? `Subject: ${pack.emailSubject}` : "",
    },
    {
      id: "ads",
      label: "Ads",
      icon: Megaphone,
      text: (pack.adHeadlines ?? []).join("\n"),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map((ch) => (
        <ChannelCard key={ch.id} channel={ch} />
      ))}
    </div>
  );
}
