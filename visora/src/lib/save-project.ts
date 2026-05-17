/**
 * Shared save-project logic for API route and tests.
 */

import { buildFullProjectFromChat } from "@/lib/buildProjectFromChat";
import { saveProject as saveToSupabase } from "@/lib/database";
import { saveLocalProjectWithChat } from "@/lib/galleryStorage";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ChatMessage, Project, UserInput } from "@/types/visora";

export interface SaveProjectPayload {
  currentProject: Partial<Project>;
  userInput?: UserInput;
  chatMessages: ChatMessage[];
  sessionId?: string | null;
}

export interface SaveProjectResult {
  project: Project;
  storage: "supabase" | "local";
}

export async function persistProjectToGallery(
  payload: SaveProjectPayload,
): Promise<SaveProjectResult> {
  const full = buildFullProjectFromChat({
    currentProject: payload.currentProject,
    chatMessages: payload.chatMessages,
    userInput: payload.userInput,
    sessionId: payload.sessionId,
    existingId: payload.currentProject.id,
  });

  if (isSupabaseConfigured()) {
    const saved = await saveToSupabase(full);
    if (saved) {
      return { project: saved, storage: "supabase" };
    }
  }

  const local = saveLocalProjectWithChat(full, payload.chatMessages);
  return { project: local, storage: "local" };
}
