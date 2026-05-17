/**
 * Build a full `Project` from chat state for gallery persistence.
 */

import type {
  ChatMessage,
  InputType,
  Project,
  UserInput,
} from "@/types/visora";

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `p-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

const EMPTY_USER_INPUT: UserInput = {
  startupIdea: "",
  websiteUrl: "",
  industry: "",
  targetAudience: "",
  location: "",
  brandStyle: "",
  productType: "",
  visualMood: "",
  inputType: "idea",
};

/** Extract best-effort `UserInput` from the conversation. */
export function extractUserInputFromMessages(
  messages: ChatMessage[],
  project?: Partial<Project>,
): UserInput {
  if (project?.userInput && Object.keys(project.userInput).length > 0) {
    return { ...EMPTY_USER_INPUT, ...project.userInput };
  }

  const firstUser = messages.find((m) => m.role === "user" && m.content.trim());
  const text = firstUser?.content.trim() ?? "";

  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  const inputType: InputType = urlMatch ? "website_url" : "idea";

  return {
    startupIdea: inputType === "idea" ? text : "",
    websiteUrl: urlMatch?.[0] ?? "",
    industry: "",
    targetAudience: "",
    location: "",
    brandStyle: "",
    productType: "",
    visualMood: "",
    inputType,
  };
}

export interface BuildProjectOptions {
  currentProject: Partial<Project>;
  chatMessages: ChatMessage[];
  userInput?: UserInput;
  sessionId?: string | null;
  existingId?: string;
}

/** Assemble a gallery-ready `Project` from partial project state + chat. */
export function buildFullProjectFromChat(opts: BuildProjectOptions): Project {
  const { currentProject, chatMessages } = opts;
  const userInput =
    opts.userInput ?? extractUserInputFromMessages(chatMessages, currentProject);

  const brand = currentProject.brandResult;
  if (!brand?.brandName) {
    throw new Error("Nothing to save yet — generate a brand first.");
  }

  return {
    id: opts.existingId ?? currentProject.id ?? `local-${makeId().slice(0, 8)}`,
    createdAt: currentProject.createdAt ?? new Date().toISOString(),
    inputType: currentProject.inputType ?? userInput.inputType ?? "idea",
    userInput,
    brandResult: brand,
    trustScore: currentProject.trustScore ?? {
      overallScore: 0,
      categories: [],
      suggestions: [],
      confidence: "Low",
    },
    visuals: currentProject.visuals ?? [],
    model3d: currentProject.model3d,
    websiteConcept: currentProject.websiteConcept ?? {
      heroHeadline: "",
      heroSubheadline: "",
      cta: "",
      sections: [],
      faq: [],
      trustSignals: [],
    },
    marketingPack: currentProject.marketingPack ?? {
      instagramCaption: "",
      tiktokScript: "",
      whatsappMessage: "",
      emailSubject: "",
      adHeadlines: [],
    },
    chatMessages,
    sessionId: opts.sessionId ?? undefined,
  };
}
