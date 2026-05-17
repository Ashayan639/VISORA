/**
 * Session-wide widget version counters for modification UX (v2, v3 badges).
 */

import type {
  ChatMessage,
  Project,
  VisualAsset,
  Widget,
  WidgetType,
} from "@/types/visora";

/** Widget types that participate in version tracking. */
export const VERSIONED_WIDGET_TYPES = new Set<WidgetType>([
  "brand_card",
  "trust_score",
  "image_grid",
  "website_preview",
  "marketing_pack",
  "model_3d",
]);

export type WidgetVersionCounters = Partial<Record<WidgetType, number>>;

/** Rebuild counters from persisted messages (e.g. after loadSession). */
export function rebuildWidgetVersionCounters(
  messages: ChatMessage[],
): WidgetVersionCounters {
  const counters: WidgetVersionCounters = {};
  for (const m of messages) {
    for (const w of m.widgets ?? []) {
      if (!VERSIONED_WIDGET_TYPES.has(w.type)) continue;
      const v = w.version ?? 1;
      counters[w.type] = Math.max(counters[w.type] ?? 0, v);
    }
  }
  return counters;
}

/**
 * Assign version numbers to widgets in a new assistant turn.
 * Increments per type; first occurrence is v1 (no badge in UI).
 */
export function assignWidgetVersions(
  widgets: Widget[],
  counters: WidgetVersionCounters,
): Widget[] {
  return widgets.map((w) => {
    if (!VERSIONED_WIDGET_TYPES.has(w.type)) return w;
    const next = (counters[w.type] ?? 0) + 1;
    counters[w.type] = next;
    return { ...w, version: next };
  });
}

/** Latest project fields from the most recent versioned widget per type. */
export function projectPatchFromLatestWidgets(
  messages: ChatMessage[],
): Partial<Project> {
  const latest = new Map<WidgetType, Widget>();

  for (const m of messages) {
    if (m.role !== "assistant") continue;
    for (const w of m.widgets ?? []) {
      if (!VERSIONED_WIDGET_TYPES.has(w.type)) continue;
      const prev = latest.get(w.type);
      if (!prev || (w.version ?? 1) >= (prev.version ?? 1)) {
        latest.set(w.type, w);
      }
    }
  }

  const patch: Partial<Project> = {};
  for (const w of latest.values()) {
    switch (w.type) {
      case "brand_card":
        patch.brandResult = w.data;
        break;
      case "trust_score":
        patch.trustScore = w.data;
        break;
      case "image_grid": {
        const assets = (w.data as { assets?: VisualAsset[] })?.assets;
        if (assets?.length) patch.visuals = assets;
        break;
      }
      case "website_preview":
        patch.websiteConcept = w.data;
        break;
      case "marketing_pack":
        patch.marketingPack = w.data;
        break;
      case "model_3d":
        patch.model3d = w.data;
        break;
    }
  }
  return patch;
}
