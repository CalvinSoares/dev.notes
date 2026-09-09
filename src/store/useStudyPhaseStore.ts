import { create } from "zustand";
import type { StudyPhase } from "@core/types";
import { storage } from "@core/lib/storage";

const iso = (date: Date) => date.toISOString();

type PhaseInput = {
  title: string;
  description?: string;
  flashcardIds: string[];
  problemIds: string[];
};

interface StudyPhaseState {
  hydrated: boolean;
  phases: StudyPhase[];
  initialize: () => Promise<void>;
  addPhase: (input: PhaseInput) => Promise<StudyPhase>;
  updatePhase: (id: string, input: PhaseInput) => Promise<void>;
  deletePhase: (id: string) => Promise<void>;
}

export const useStudyPhaseStore = create<StudyPhaseState>((set, get) => ({
  hydrated: false,
  phases: [],

  initialize: async () => {
    if (get().hydrated) return;
    const phases = await storage.list<StudyPhase>("study_phases");
    set({ phases, hydrated: true });
  },

  addPhase: async (input) => {
    if (!get().hydrated) await get().initialize();
    const now = new Date();
    const phase: StudyPhase = {
      id: `phase-${Date.now()}`,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      flashcardIds: input.flashcardIds,
      problemIds: input.problemIds,
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    await storage.put("study_phases", phase);
    set({ phases: [phase, ...get().phases] });
    return phase;
  },

  updatePhase: async (id, input) => {
    const current = get().phases.find((phase) => phase.id === id);
    if (!current) return;
    const updated: StudyPhase = {
      ...current,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      flashcardIds: input.flashcardIds,
      problemIds: input.problemIds,
      updatedAt: iso(new Date()),
    };
    await storage.put("study_phases", updated);
    set({ phases: get().phases.map((phase) => (phase.id === id ? updated : phase)) });
  },

  deletePhase: async (id) => {
    await storage.remove("study_phases", id);
    set({ phases: get().phases.filter((phase) => phase.id !== id) });
  },
}));
