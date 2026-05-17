/**
 * Parse [WIDGET:TYPE]...[/WIDGET] blocks from assistant responses.
 */

import type {
  BrandResult,
  MarketingPack,
  TrustScore,
  VisualType,
  WebsiteConcept,
  Widget,
} from "@/types/visora";

const WIDGET_RE =
  /\[WIDGET:([A-Z_]+)\]\s*([\s\S]*?)\s*\[\/WIDGET\]/gi;

export interface VisualPromptItem {
  type: VisualType;
  title: string;
  prompt: string;
}

export interface ParsedAssistantResponse {
  /** Plain text with widget blocks removed. */
  text: string;
  widgets: Widget[];
  visualPrompts: VisualPromptItem[];
}

function stripWidgetBlocks(raw: string): string {
  return raw.replace(WIDGET_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * For streaming UI — hide incomplete widget tags at the end of the buffer.
 */
export function stripWidgetTagsForDisplay(buffer: string): string {
  const withoutComplete = stripWidgetBlocks(buffer);
  const openIdx = buffer.lastIndexOf("[WIDGET:");
  if (openIdx === -1) return withoutComplete;
  const afterOpen = buffer.slice(openIdx);
  if (afterOpen.includes("[/WIDGET]")) return withoutComplete;
  return buffer.slice(0, openIdx).replace(WIDGET_RE, "").trim();
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw.trim()) as T;
  } catch {
    return fallback;
  }
}

function mapWidgetType(tag: string): Widget["type"] | null {
  switch (tag.toUpperCase()) {
    case "BRAND_CARD":
      return "brand_card";
    case "TRUST_SCORE":
      return "trust_score";
    case "WEBSITE_PREVIEW":
      return "website_preview";
    case "MARKETING_PACK":
      return "marketing_pack";
    default:
      return null;
  }
}

function coerceBrand(data: unknown): BrandResult {
  const fb: BrandResult = {
    brandName: "Your Brand",
    tagline: "Built with VISORA",
    mission: "",
    targetAudience: "",
    tone: "",
    usp: "",
    story: "",
    promise: "",
    colorPalette: ["#0D0E10", "#282728", "#F8FAFA", "#C5C6C8", "#818283"],
    painPoints: [],
  };
  if (!data || typeof data !== "object") return fb;
  const r = data as Record<string, unknown>;
  return {
    brandName: typeof r.brandName === "string" ? r.brandName : fb.brandName,
    tagline: typeof r.tagline === "string" ? r.tagline : fb.tagline,
    mission: typeof r.mission === "string" ? r.mission : fb.mission,
    targetAudience:
      typeof r.targetAudience === "string" ? r.targetAudience : fb.targetAudience,
    tone: typeof r.tone === "string" ? r.tone : fb.tone,
    usp: typeof r.usp === "string" ? r.usp : fb.usp,
    story: typeof r.story === "string" ? r.story : fb.story,
    promise: typeof r.promise === "string" ? r.promise : fb.promise,
    colorPalette: Array.isArray(r.colorPalette)
      ? (r.colorPalette as string[]).filter((c) => typeof c === "string").slice(0, 8)
      : fb.colorPalette,
    painPoints: Array.isArray(r.painPoints)
      ? (r.painPoints as string[]).filter((p) => typeof p === "string")
      : fb.painPoints,
  };
}

function coerceTrust(data: unknown): TrustScore {
  const fb: TrustScore = {
    overallScore: 65,
    categories: [
      { name: "Brand clarity", score: 70 },
      { name: "Visual identity", score: 60 },
    ],
    suggestions: ["Sharpen your value proposition on the homepage."],
    confidence: "Medium",
  };
  if (!data || typeof data !== "object") return fb;
  const r = data as Record<string, unknown>;
  return {
    overallScore:
      typeof r.overallScore === "number" ? Math.round(r.overallScore) : fb.overallScore,
    categories: Array.isArray(r.categories)
      ? (r.categories as { name?: string; score?: number }[])
          .filter((c) => c && typeof c.name === "string")
          .map((c) => ({
            name: c.name!,
            score: typeof c.score === "number" ? Math.round(c.score) : 50,
          }))
      : fb.categories,
    suggestions: Array.isArray(r.suggestions)
      ? (r.suggestions as string[]).filter((s) => typeof s === "string")
      : fb.suggestions,
    confidence:
      r.confidence === "Low" || r.confidence === "Medium" || r.confidence === "High"
        ? r.confidence
        : fb.confidence,
  };
}

function coerceWebsite(data: unknown): WebsiteConcept {
  const fb: WebsiteConcept = {
    heroHeadline: "Welcome",
    heroSubheadline: "",
    cta: "Get started",
    sections: [],
    faq: [],
    trustSignals: [],
  };
  if (!data || typeof data !== "object") return fb;
  const r = data as Record<string, unknown>;
  return {
    heroHeadline:
      typeof r.heroHeadline === "string" ? r.heroHeadline : fb.heroHeadline,
    heroSubheadline:
      typeof r.heroSubheadline === "string" ? r.heroSubheadline : fb.heroSubheadline,
    cta: typeof r.cta === "string" ? r.cta : fb.cta,
    sections: Array.isArray(r.sections) ? (r.sections as WebsiteConcept["sections"]) : [],
    faq: Array.isArray(r.faq) ? (r.faq as WebsiteConcept["faq"]) : [],
    trustSignals: Array.isArray(r.trustSignals)
      ? (r.trustSignals as string[]).filter((s) => typeof s === "string")
      : fb.trustSignals,
  };
}

function coerceMarketing(data: unknown): MarketingPack {
  const fb: MarketingPack = {
    instagramCaption: "",
    tiktokScript: "",
    whatsappMessage: "",
    emailSubject: "",
    adHeadlines: [],
  };
  if (!data || typeof data !== "object") return fb;
  const r = data as Record<string, unknown>;
  return {
    instagramCaption:
      typeof r.instagramCaption === "string" ? r.instagramCaption : fb.instagramCaption,
    tiktokScript: typeof r.tiktokScript === "string" ? r.tiktokScript : fb.tiktokScript,
    whatsappMessage:
      typeof r.whatsappMessage === "string" ? r.whatsappMessage : fb.whatsappMessage,
    emailSubject: typeof r.emailSubject === "string" ? r.emailSubject : fb.emailSubject,
    adHeadlines: Array.isArray(r.adHeadlines)
      ? (r.adHeadlines as string[]).filter((h) => typeof h === "string")
      : fb.adHeadlines,
  };
}

function parseVisualPrompts(json: string): VisualPromptItem[] {
  const data = parseJson<{ prompts?: unknown }>(json, {});
  if (!Array.isArray(data.prompts)) return [];
  const validTypes = new Set<VisualType>([
    "product_mockup",
    "hero_image",
    "instagram_ad",
    "lifestyle_scene",
  ]);
  return data.prompts
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const type = typeof o.type === "string" ? o.type : "";
      if (!validTypes.has(type as VisualType)) return null;
      return {
        type: type as VisualType,
        title: typeof o.title === "string" ? o.title : type,
        prompt: typeof o.prompt === "string" ? o.prompt : "",
      };
    })
    .filter((x): x is VisualPromptItem => x !== null && x.prompt.length > 0);
}

export function parseAssistantResponse(raw: string): ParsedAssistantResponse {
  const widgets: Widget[] = [];
  const visualPrompts: VisualPromptItem[] = [];

  let match: RegExpExecArray | null;
  const re = new RegExp(WIDGET_RE.source, WIDGET_RE.flags);
  while ((match = re.exec(raw)) !== null) {
    const tag = match[1]!.toUpperCase();
    const body = match[2]!;
    const position = stripWidgetBlocks(raw.slice(0, match.index)).length;

    if (tag === "VISUAL_PROMPTS") {
      visualPrompts.push(...parseVisualPrompts(body));
      continue;
    }

    const mapped = mapWidgetType(tag);
    if (!mapped) continue;

    switch (mapped) {
      case "brand_card":
        widgets.push({
          type: "brand_card",
          data: coerceBrand(parseJson(body, {})),
          position,
        });
        break;
      case "trust_score":
        widgets.push({
          type: "trust_score",
          data: coerceTrust(parseJson(body, {})),
          position,
        });
        break;
      case "website_preview":
        widgets.push({
          type: "website_preview",
          data: coerceWebsite(parseJson(body, {})),
          position,
        });
        break;
      case "marketing_pack":
        widgets.push({
          type: "marketing_pack",
          data: coerceMarketing(parseJson(body, {})),
          position,
        });
        break;
    }
  }

  return {
    text: stripWidgetBlocks(raw),
    widgets,
    visualPrompts,
  };
}
