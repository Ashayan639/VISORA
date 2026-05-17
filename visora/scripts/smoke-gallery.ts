/**
 * Smoke test for the gallery storage + filter / search predicates used
 * by /gallery/page.tsx.
 *
 * Run:  npx tsx scripts/smoke-gallery.ts
 *
 * Verifies:
 *   • localStorage round-trip: save → read → upsert → delete → clear
 *   • Newest-first ordering by createdAt
 *   • Filter predicates: idea / url / 3d / high_trust
 *   • Search hits brand name, idea, URL, industry; case-insensitive
 *   • Demo backstop array has 3 entries with the expected shapes
 */

// In-memory localStorage shim. Must be installed BEFORE importing the
// galleryStorage module so its `safeLocalStorage()` helper picks it up.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, v);
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
  clear(): void {
    this.store.clear();
  }
  key(i: number): string | null {
    return Array.from(this.store.keys())[i] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = {
  localStorage: new MemoryStorage(),
};

import {
  clearLocalProjects,
  deleteLocalProject,
  getLocalProjects,
  saveLocalProject,
} from "../src/lib/galleryStorage";
import { DEMO_PROJECTS } from "../src/lib/demoData";
import type { Project } from "../src/types/visora";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function expect(cond: unknown, label: string): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    failures.push(label);
    console.log(`  ✗ ${label}`);
  }
}

function makeProject(over: Partial<Project> = {}): Project {
  return {
    id: over.id ?? "p1",
    createdAt: over.createdAt ?? new Date().toISOString(),
    inputType: over.inputType ?? "idea",
    userInput: {
      startupIdea: "Premium artisan coffee for Colombo offices",
      websiteUrl: "",
      industry: "specialty coffee",
      targetAudience: "creative professionals",
      location: "Colombo, Sri Lanka",
      brandStyle: "premium",
      productType: "physical",
      visualMood: "warm",
      inputType: "idea",
      ...over.userInput,
    },
    brandResult: {
      brandName: "Urban Brew Ceylon",
      tagline: "Crafted in Colombo. Brewed for the bold.",
      mission: "",
      targetAudience: "",
      tone: "",
      usp: "",
      story: "",
      promise: "",
      colorPalette: ["#0D0E10", "#F8FAFA"],
      painPoints: [],
      ...over.brandResult,
    },
    trustScore: {
      overallScore: 50,
      categories: [],
      suggestions: [],
      confidence: "Medium",
      ...over.trustScore,
    },
    visuals: over.visuals ?? [],
    model3d: over.model3d,
    websiteConcept: {
      heroHeadline: "",
      heroSubheadline: "",
      cta: "",
      sections: [],
      faq: [],
      trustSignals: [],
      ...over.websiteConcept,
    },
    marketingPack: {
      instagramCaption: "",
      tiktokScript: "",
      whatsappMessage: "",
      emailSubject: "",
      adHeadlines: [],
      ...over.marketingPack,
    },
  };
}

/* ── Filter predicates copied from /gallery page ──────────────── */

const FILTERS = {
  all: () => true,
  idea: (p: Project) => p.inputType === "idea",
  url: (p: Project) => p.inputType === "website_url",
  "3d": (p: Project) => Boolean(p.model3d?.modelUrl || p.model3d?.id),
  high_trust: (p: Project) => (p.trustScore?.overallScore ?? 0) > 70,
} as const;

function search(p: Project, q: string): boolean {
  if (!q) return true;
  const haystack = [
    p.brandResult?.brandName,
    p.brandResult?.tagline,
    p.userInput?.startupIdea,
    p.userInput?.websiteUrl,
    p.userInput?.industry,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.trim().toLowerCase());
}

/* ── Tests ────────────────────────────────────────────────────── */

function run(): void {
  /* 1. Storage round-trip */
  console.log("\nTEST: localStorage round-trip");
  clearLocalProjects();

  expect(getLocalProjects().length === 0, "starts empty");

  const a = saveLocalProject(
    makeProject({ id: "a", createdAt: "2025-01-01T00:00:00.000Z" }),
  );
  expect(a.id === "a", "save returns echoed project with id");

  saveLocalProject(
    makeProject({ id: "b", createdAt: "2025-06-01T00:00:00.000Z" }),
  );
  saveLocalProject(
    makeProject({ id: "c", createdAt: "2025-03-01T00:00:00.000Z" }),
  );

  const all = getLocalProjects();
  expect(all.length === 3, "three projects persisted");
  expect(
    all.map((p) => p.id).join(",") === "b,c,a",
    "newest-first by createdAt",
  );

  /* Upsert (same id) replaces, doesn't duplicate */
  saveLocalProject(
    makeProject({
      id: "a",
      createdAt: "2026-01-01T00:00:00.000Z",
      brandResult: {
        brandName: "Urban Brew Ceylon — Reborn",
        tagline: "",
        mission: "",
        targetAudience: "",
        tone: "",
        usp: "",
        story: "",
        promise: "",
        colorPalette: [],
        painPoints: [],
      },
    }),
  );
  const after = getLocalProjects();
  expect(after.length === 3, "upsert keeps count stable");
  expect(after[0].id === "a", "upserted project moves to newest");
  expect(
    after[0].brandResult.brandName.includes("Reborn"),
    "upsert replaces existing fields",
  );

  /* Delete */
  expect(deleteLocalProject("c") === true, "delete returns true on hit");
  expect(deleteLocalProject("nope") === false, "delete returns false on miss");
  expect(getLocalProjects().length === 2, "delete reduces count");

  clearLocalProjects();
  expect(getLocalProjects().length === 0, "clear empties the store");

  /* 2. Filters */
  console.log("\nTEST: filter predicates");
  const idea = makeProject({
    id: "idea1",
    inputType: "idea",
    trustScore: {
      overallScore: 82,
      categories: [],
      suggestions: [],
      confidence: "High",
    },
  });
  const url = makeProject({
    id: "url1",
    inputType: "website_url",
    userInput: {
      startupIdea: "",
      websiteUrl: "https://example.com",
      industry: "tea",
      targetAudience: "",
      location: "",
      brandStyle: "",
      productType: "",
      visualMood: "",
      inputType: "website_url",
    },
    trustScore: {
      overallScore: 50,
      categories: [],
      suggestions: [],
      confidence: "Medium",
    },
  });
  const has3d = makeProject({
    id: "3d1",
    inputType: "idea",
    model3d: {
      id: "m1",
      modelType: "text_to_3d",
      prompt: "",
      modelUrl: "https://x/m.glb",
      status: "generated",
    },
  });

  const sample = [idea, url, has3d];
  expect(sample.filter(FILTERS.idea).length === 2, "idea filter matches 2");
  expect(sample.filter(FILTERS.url).length === 1, "url filter matches 1");
  expect(sample.filter(FILTERS["3d"]).length === 1, "3d filter matches 1");
  expect(
    sample.filter(FILTERS.high_trust).length === 1,
    "high-trust filter matches >70 only",
  );
  expect(sample.filter(FILTERS.all).length === 3, "'all' matches everything");

  /* 3. Search */
  console.log("\nTEST: search predicates");
  expect(search(idea, "urban brew"), "search matches brand name (case-insens)");
  expect(
    search(idea, "Colombo"),
    "search hits idea startupIdea (case-insens)",
  );
  expect(search(url, "tea"), "search hits industry");
  expect(search(url, "example.com"), "search hits websiteUrl");
  expect(!search(idea, "rocketship"), "no false positives");
  expect(search(idea, ""), "empty query matches");
  expect(search(idea, "   "), "whitespace-only query matches");

  /* 4. Demo backstop sanity */
  console.log("\nTEST: DEMO_PROJECTS shape");
  expect(DEMO_PROJECTS.length === 3, "exactly 3 demo projects");
  expect(
    DEMO_PROJECTS.every((p) => p.brandResult?.brandName?.length > 0),
    "every demo has a brand name",
  );
  expect(
    DEMO_PROJECTS.some((p) => Boolean(p.model3d)),
    "at least one demo has a 3D model",
  );
  expect(
    DEMO_PROJECTS.some((p) => p.inputType === "website_url"),
    "at least one demo is a URL refresh",
  );
  expect(
    DEMO_PROJECTS.some((p) => (p.trustScore?.overallScore ?? 0) > 70),
    "at least one demo qualifies for high-trust filter",
  );

  /* ── Summary ──────────────────────────────────────────── */
  console.log("\n──────────────────────────────────────────");
  console.log(`Pass: ${pass}    Fail: ${fail}`);
  if (fail > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

run();
