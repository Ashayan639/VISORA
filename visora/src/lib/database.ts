import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase, supabase } from "./supabase";
import type {
  AssetStatus,
  BrandResult,
  ChatMessage,
  InputType,
  MarketingPack,
  Model3D,
  Model3DType,
  Project,
  TrustScore,
  VisualAsset,
  VisualType,
  WebsiteConcept,
} from "@/types/visora";

/**
 * VISORA — Database helpers.
 *
 * All functions are defensive: if Supabase is not configured, they log a
 * warning and return a safe fallback (`null` / `[]`) instead of throwing.
 *
 * Snake_case ↔ camelCase mapping happens inside this module so callers
 * always speak the domain types from `@/types/visora`.
 */

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

/** Pick the privileged server client when available, otherwise the anon client. */
function getClient(): SupabaseClient | null {
  return getServerSupabase() ?? supabase;
}

function warn(scope: string, message: string, error?: unknown) {
  console.warn(`[visora/database] ${scope}: ${message}`, error ?? "");
}

function unavailable(scope: string): null {
  warn(scope, "Supabase is not configured — operation skipped.");
  return null;
}

// ─────────────────────────────────────────────────────────────
// Row shapes (mirror schema.sql)
// ─────────────────────────────────────────────────────────────

interface ProjectRow {
  id: string;
  created_at: string;
  input_type: string | null;
  startup_idea: string | null;
  website_url: string | null;
  industry: string | null;
  target_audience: string | null;
  location: string | null;
  brand_style: string | null;
  product_type: string | null;
  visual_mood: string | null;
  brand_result: BrandResult | null;
  trust_score: TrustScore | null;
  website_concept: WebsiteConcept | null;
  marketing_pack: MarketingPack | null;
  chat_messages: ChatMessage[] | null;
  session_id: string | null;
}

interface VisualRow {
  id: string;
  project_id: string;
  visual_type: string | null;
  title: string | null;
  prompt: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string;
}

interface Model3DRow {
  id: string;
  project_id: string;
  model_type: string | null;
  prompt: string | null;
  source_image_url: string | null;
  model_url: string | null;
  status: string | null;
  created_at: string;
}

type ProjectRowWithRelations = ProjectRow & {
  visuals?: VisualRow[] | null;
  models_3d?: Model3DRow[] | null;
};

// ─────────────────────────────────────────────────────────────
// Safe default factories (used when DB rows are partial / null)
// ─────────────────────────────────────────────────────────────

const EMPTY_BRAND: BrandResult = {
  brandName: "",
  tagline: "",
  mission: "",
  targetAudience: "",
  tone: "",
  usp: "",
  story: "",
  promise: "",
  colorPalette: [],
  painPoints: [],
};

const EMPTY_TRUST: TrustScore = {
  overallScore: 0,
  categories: [],
  suggestions: [],
  confidence: "Low",
};

const EMPTY_WEBSITE: WebsiteConcept = {
  heroHeadline: "",
  heroSubheadline: "",
  cta: "",
  sections: [],
  faq: [],
  trustSignals: [],
};

const EMPTY_MARKETING: MarketingPack = {
  instagramCaption: "",
  tiktokScript: "",
  whatsappMessage: "",
  emailSubject: "",
  adHeadlines: [],
};

// ─────────────────────────────────────────────────────────────
// Row ⇄ Domain mappers
// ─────────────────────────────────────────────────────────────

function rowToVisual(row: VisualRow): VisualAsset {
  return {
    id: row.id,
    visualType: (row.visual_type as VisualType) ?? "product_mockup",
    title: row.title ?? "",
    prompt: row.prompt ?? "",
    imageUrl: row.image_url ?? "",
    status: (row.status as AssetStatus) ?? "generated",
  };
}

function rowToModel3D(row: Model3DRow): Model3D {
  return {
    id: row.id,
    modelType: (row.model_type as Model3DType) ?? "text_to_3d",
    prompt: row.prompt ?? "",
    sourceImageUrl: row.source_image_url ?? undefined,
    modelUrl: row.model_url ?? "",
    status: (row.status as AssetStatus) ?? "generated",
  };
}

function rowToProject(
  row: ProjectRowWithRelations,
  visuals?: VisualAsset[],
  model3d?: Model3D,
): Project {
  const inputType: InputType = (row.input_type as InputType) ?? "idea";
  const resolvedVisuals =
    visuals ?? (row.visuals ?? []).map(rowToVisual);
  const resolvedModel3d =
    model3d ??
    (row.models_3d && row.models_3d.length > 0
      ? rowToModel3D(row.models_3d[0])
      : undefined);

  return {
    id: row.id,
    createdAt: row.created_at,
    inputType,
    userInput: {
      startupIdea: row.startup_idea ?? "",
      websiteUrl: row.website_url ?? "",
      industry: row.industry ?? "",
      targetAudience: row.target_audience ?? "",
      location: row.location ?? "",
      brandStyle: row.brand_style ?? "",
      productType: row.product_type ?? "",
      visualMood: row.visual_mood ?? "",
      inputType,
    },
    brandResult: row.brand_result ?? EMPTY_BRAND,
    trustScore: row.trust_score ?? EMPTY_TRUST,
    websiteConcept: row.website_concept ?? EMPTY_WEBSITE,
    marketingPack: row.marketing_pack ?? EMPTY_MARKETING,
    visuals: resolvedVisuals,
    model3d: resolvedModel3d,
    chatMessages: Array.isArray(row.chat_messages) ? row.chat_messages : undefined,
    sessionId: row.session_id ?? undefined,
  };
}

function projectToRow(project: Project): Partial<ProjectRow> {
  const { userInput } = project;
  const row: Partial<ProjectRow> = {
    input_type: project.inputType,
    startup_idea: userInput.startupIdea,
    website_url: userInput.websiteUrl,
    industry: userInput.industry,
    target_audience: userInput.targetAudience,
    location: userInput.location,
    brand_style: userInput.brandStyle,
    product_type: userInput.productType,
    visual_mood: userInput.visualMood,
    brand_result: project.brandResult,
    trust_score: project.trustScore,
    website_concept: project.websiteConcept,
    marketing_pack: project.marketingPack,
    chat_messages: project.chatMessages?.length ? project.chatMessages : null,
    session_id: project.sessionId ?? null,
  };
  if (project.id) row.id = project.id;
  if (project.createdAt) row.created_at = project.createdAt;
  return row;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Insert a project (and its visuals / model3d, if any) into Supabase.
 * Returns the persisted Project with DB-assigned ids and timestamps, or
 * `null` if Supabase is unavailable or the insert fails.
 */
export async function saveProject(project: Project): Promise<Project | null> {
  const client = getClient();
  if (!client) return unavailable("saveProject");

  const { data, error } = await client
    .from("projects")
    .insert(projectToRow(project))
    .select()
    .single<ProjectRow>();

  if (error || !data) {
    warn("saveProject", "Failed to insert project row.", error);
    return null;
  }

  const savedVisuals: VisualAsset[] = [];
  for (const visual of project.visuals ?? []) {
    const saved = await saveVisual(visual, data.id);
    savedVisuals.push(saved ?? visual);
  }

  let savedModel3d: Model3D | undefined;
  if (project.model3d) {
    const saved = await saveModel3D(project.model3d, data.id);
    savedModel3d = saved ?? project.model3d;
  }

  return rowToProject(data, savedVisuals, savedModel3d);
}

/**
 * Fetch all projects, newest first. Visuals / model3d are NOT included
 * (use {@link getProjectById} for the full payload).
 */
export async function getProjects(): Promise<Project[]> {
  const client = getClient();
  if (!client) {
    unavailable("getProjects");
    return [];
  }

  const { data, error } = await client
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    warn("getProjects", "Failed to fetch projects.", error);
    return [];
  }

  return (data as ProjectRow[]).map((row) => rowToProject(row));
}

/**
 * Fetch all projects for the gallery grid: each row includes its `visuals`
 * and `models_3d` relations so cards can show a thumbnail and a 3D badge.
 *
 * Falls back with `[]` exactly like {@link getProjects} when Supabase is
 * unavailable or the query fails.
 */
export async function getProjectsForGallery(): Promise<Project[]> {
  const client = getClient();
  if (!client) {
    unavailable("getProjectsForGallery");
    return [];
  }

  const { data, error } = await client
    .from("projects")
    .select("*, visuals(*), models_3d(*)")
    .order("created_at", { ascending: false });

  if (error || !data) {
    warn("getProjectsForGallery", "Failed to fetch projects with relations.", error);
    return [];
  }

  return (data as ProjectRowWithRelations[]).map((row) => rowToProject(row));
}

/**
 * Fetch a single project by id, with its visuals and 3D model joined in.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  if (!id) {
    warn("getProjectById", "Empty id supplied.");
    return null;
  }
  const client = getClient();
  if (!client) return unavailable("getProjectById");

  const { data, error } = await client
    .from("projects")
    .select("*, visuals(*), models_3d(*)")
    .eq("id", id)
    .single<ProjectRowWithRelations>();

  if (error || !data) {
    warn("getProjectById", `Project ${id} not found.`, error);
    return null;
  }

  return rowToProject(data);
}

/** Insert a visual asset under the given project id. */
export async function saveVisual(
  visual: VisualAsset,
  projectId: string,
): Promise<VisualAsset | null> {
  if (!projectId) {
    warn("saveVisual", "Empty projectId supplied.");
    return null;
  }
  const client = getClient();
  if (!client) return unavailable("saveVisual");

  const row: Partial<VisualRow> = {
    project_id: projectId,
    visual_type: visual.visualType,
    title: visual.title,
    prompt: visual.prompt,
    image_url: visual.imageUrl,
    status: visual.status,
  };
  if (visual.id) row.id = visual.id;

  const { data, error } = await client
    .from("visuals")
    .insert(row)
    .select()
    .single<VisualRow>();

  if (error || !data) {
    warn("saveVisual", "Failed to insert visual row.", error);
    return null;
  }
  return rowToVisual(data);
}

/** Insert a 3D model under the given project id. */
export async function saveModel3D(
  model: Model3D,
  projectId: string,
): Promise<Model3D | null> {
  if (!projectId) {
    warn("saveModel3D", "Empty projectId supplied.");
    return null;
  }
  const client = getClient();
  if (!client) return unavailable("saveModel3D");

  const row: Partial<Model3DRow> = {
    project_id: projectId,
    model_type: model.modelType,
    prompt: model.prompt,
    source_image_url: model.sourceImageUrl ?? null,
    model_url: model.modelUrl,
    status: model.status,
  };
  if (model.id) row.id = model.id;

  const { data, error } = await client
    .from("models_3d")
    .insert(row)
    .select()
    .single<Model3DRow>();

  if (error || !data) {
    warn("saveModel3D", "Failed to insert 3D model row.", error);
    return null;
  }
  return rowToModel3D(data);
}

/**
 * Delete a project. The `ON DELETE CASCADE` foreign keys on `visuals` and
 * `models_3d` automatically remove their child rows.
 *
 * Returns `true` on success, `false` otherwise.
 */
export async function deleteProject(id: string): Promise<boolean> {
  if (!id) {
    warn("deleteProject", "Empty id supplied.");
    return false;
  }
  const client = getClient();
  if (!client) {
    unavailable("deleteProject");
    return false;
  }

  const { error } = await client.from("projects").delete().eq("id", id);
  if (error) {
    warn("deleteProject", `Failed to delete project ${id}.`, error);
    return false;
  }
  return true;
}
