/**
 * VISORA — Local gallery storage.
 *
 * Browser-side fallback for when Supabase isn't configured (or its save
 * round-trip fails). The key is `trustforge_projects` per the original
 * VISORA spec; the value is a JSON-serialised `Project[]` newest-first.
 *
 * All functions are SSR-safe — they return empty results / no-op when
 * called on the server (no `window`).
 */

import type { Project } from "@/types/visora";

const PROJECTS_KEY = "trustforge_projects";

/* ─────────────────────────────────────────────────────────────
   Low-level storage helpers
   ───────────────────────────────────────────────────────────── */

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJSON<T>(key: string, fallback: T): T {
  const ls = safeLocalStorage();
  if (!ls) return fallback;
  try {
    const raw = ls.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or serialization failure — silently drop */
  }
}

/* ─────────────────────────────────────────────────────────────
   Public API
   ───────────────────────────────────────────────────────────── */

/**
 * Read every locally-saved project, newest first.
 * Returns `[]` on the server or when nothing has been saved.
 */
export function getLocalProjects(): Project[] {
  const all = readJSON<Project[]>(PROJECTS_KEY, []);
  if (!Array.isArray(all)) return [];
  return [...all].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

/**
 * Upsert a project locally. If an entry with the same id exists it's
 * replaced; otherwise the project is prepended (so it sorts newest first
 * on the next read). Returns the (potentially id-stamped) project.
 */
export function saveLocalProject(project: Project): Project {
  const safe: Project = {
    ...project,
    id: project.id || `local-${Date.now().toString(36)}`,
    createdAt: project.createdAt || new Date().toISOString(),
  };

  const all = readJSON<Project[]>(PROJECTS_KEY, []);
  const next = Array.isArray(all) ? all.filter((p) => p.id !== safe.id) : [];
  next.unshift(safe);

  // Cap at 50 so we don't blow up localStorage on power users.
  if (next.length > 50) next.length = 50;

  writeJSON(PROJECTS_KEY, next);
  return safe;
}

/** Remove a locally-saved project by id. Returns `true` if it existed. */
export function deleteLocalProject(id: string): boolean {
  if (!id) return false;
  const all = readJSON<Project[]>(PROJECTS_KEY, []);
  if (!Array.isArray(all)) return false;
  const filtered = all.filter((p) => p.id !== id);
  if (filtered.length === all.length) return false;
  writeJSON(PROJECTS_KEY, filtered);
  return true;
}

/** Wipe all locally-saved projects. Used by tests / "reset" flows. */
export function clearLocalProjects(): void {
  writeJSON(PROJECTS_KEY, []);
}

/* ─────────────────────────────────────────────────────────────
   Internals exposed for testing
   ───────────────────────────────────────────────────────────── */

export const __TEST__ = { PROJECTS_KEY };
