/**
 * VISORA — Visual Business Reality Engine
 * Core domain types shared across the app, API routes, and UI widgets.
 */

// ─────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────

export type InputType = "idea" | "website_url";

export interface UserInput {
  /** Raw startup / business idea text. Used when `inputType === "idea"`. */
  startupIdea: string;
  /** Website URL to analyze. Used when `inputType === "website_url"`. */
  websiteUrl: string;
  industry: string;
  targetAudience: string;
  location: string;
  /** Visual brand direction, e.g. "minimal", "luxury", "playful". */
  brandStyle: string;
  /** Physical good, digital good, service, etc. */
  productType: string;
  /** Emotional mood for imagery, e.g. "warm", "futuristic", "earthy". */
  visualMood: string;
  inputType: InputType;
}

// ─────────────────────────────────────────────────────────────
// Brand
// ─────────────────────────────────────────────────────────────

export interface BrandResult {
  brandName: string;
  tagline: string;
  mission: string;
  targetAudience: string;
  tone: string;
  /** Unique selling proposition. */
  usp: string;
  story: string;
  promise: string;
  /** Hex color strings, e.g. ["#020617", "#F8FAFA"]. */
  colorPalette: string[];
  painPoints: string[];
}

// ─────────────────────────────────────────────────────────────
// Trust Score
// ─────────────────────────────────────────────────────────────

export type TrustConfidence = "Low" | "Medium" | "High";

export interface TrustScoreCategory {
  name: string;
  /** 0–100. */
  score: number;
}

export interface TrustScore {
  /** 0–100. */
  overallScore: number;
  categories: TrustScoreCategory[];
  suggestions: string[];
  confidence: TrustConfidence;
}

// ─────────────────────────────────────────────────────────────
// Visual Assets (2D)
// ─────────────────────────────────────────────────────────────

export type VisualType =
  | "product_mockup"
  | "hero_image"
  | "instagram_ad"
  | "lifestyle_scene";

export type AssetStatus = "loading" | "generated" | "fallback" | "error";

export interface VisualAsset {
  id: string;
  visualType: VisualType;
  title: string;
  prompt: string;
  imageUrl: string;
  status: AssetStatus;
}

// ─────────────────────────────────────────────────────────────
// 3D Models
// ─────────────────────────────────────────────────────────────

export type Model3DType = "text_to_3d" | "image_to_3d";

export interface Model3D {
  id: string;
  modelType: Model3DType;
  prompt: string;
  /** Source image used for image-to-3D pipelines. */
  sourceImageUrl?: string;
  /** GLB / USDZ / mesh URL. */
  modelUrl: string;
  status: AssetStatus;
}

// ─────────────────────────────────────────────────────────────
// Website Concept
// ─────────────────────────────────────────────────────────────

export interface WebsiteSection {
  title: string;
  content: string;
}

export interface WebsiteFAQ {
  q: string;
  a: string;
}

export interface WebsiteConcept {
  heroHeadline: string;
  heroSubheadline: string;
  /** Call-to-action button label. */
  cta: string;
  sections: WebsiteSection[];
  faq: WebsiteFAQ[];
  trustSignals: string[];
}

// ─────────────────────────────────────────────────────────────
// Marketing Pack
// ─────────────────────────────────────────────────────────────

export interface MarketingPack {
  instagramCaption: string;
  tiktokScript: string;
  whatsappMessage: string;
  emailSubject: string;
  adHeadlines: string[];
}

// ─────────────────────────────────────────────────────────────
// Project (the full generated artifact)
// ─────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  inputType: InputType;
  userInput: UserInput;
  brandResult: BrandResult;
  trustScore: TrustScore;
  visuals: VisualAsset[];
  model3d?: Model3D;
  websiteConcept: WebsiteConcept;
  marketingPack: MarketingPack;
  /** Full chat transcript when saved from the workspace. */
  chatMessages?: ChatMessage[];
  /** Originating local session id (for resume). */
  sessionId?: string;
}

// ─────────────────────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export interface ChatAttachment {
  /** "image", "file", "url", etc. */
  kind: string;
  name?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  attachments?: ChatAttachment[];
  widgets?: Widget[];
  /**
   * Out-of-band hints for the renderer. Designed to be additive so the
   * field survives JSON round-trips via `localStorage` without schema
   * migrations.
   *
   * Currently used keys:
   *   - `isDemo` : message was emitted by the chat engine's demo flow.
   *                Renderers (e.g. MessageBubble) use this to badge the
   *                bubble with a "Demo Mode" pill so judges know the
   *                content is canned and not from a live OpenAI / fal.ai
   *                round trip.
   */
  meta?: {
    isDemo?: boolean;
    [key: string]: unknown;
  };
}

// ─────────────────────────────────────────────────────────────
// Widgets (rich, structured assistant outputs)
// ─────────────────────────────────────────────────────────────

export type WidgetType =
  | "brand_card"
  | "trust_score"
  | "image_grid"
  | "model_3d"
  | "website_preview"
  | "marketing_pack"
  | "action_buttons";

/**
 * Discriminated map of widget payloads. The default `Widget` type is the
 * loose union (`data: any`) per spec, but consumers can narrow with
 * `WidgetByType<"brand_card">` to get strongly-typed payloads.
 */
export interface WidgetPayloadMap {
  brand_card: BrandResult;
  trust_score: TrustScore;
  image_grid: { assets: VisualAsset[] };
  model_3d: Model3D;
  website_preview: WebsiteConcept;
  marketing_pack: MarketingPack;
  action_buttons: {
    actions: Array<{
      id: string;
      label: string;
      /** Optional intent the client should dispatch when clicked. */
      intent?: string;
      payload?: Record<string, unknown>;
    }>;
  };
}

export type WidgetByType<T extends WidgetType> = {
  type: T;
  data: WidgetPayloadMap[T];
};

export interface Widget {
  type: WidgetType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  /** Character offset in `ChatMessage.content` where this widget renders inline. */
  position?: number;
  /**
   * Monotonic version for this widget type in the session (1 = first).
   * Shown as "v2", "v3" in the UI when &gt; 1.
   */
  version?: number;
}
