import { create } from "zustand";
import type { StudyDiagram } from "@core/types";
import { storage } from "@core/lib/storage";

const iso = (date: Date) => date.toISOString();

type DiagramInput = Omit<StudyDiagram, "id" | "createdAt" | "updatedAt">;

interface DiagramState {
  hydrated: boolean;
  diagrams: StudyDiagram[];
  initialize: () => Promise<void>;
  addDiagram: (input: DiagramInput) => Promise<StudyDiagram>;
  updateDiagram: (id: string, input: Partial<DiagramInput>) => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  hydrated: false,
  diagrams: [],

  initialize: async () => {
    if (get().hydrated) return;
    const diagrams = await storage.list<StudyDiagram>("diagrams");
    set({ diagrams, hydrated: true });
  },

  addDiagram: async (input) => {
    if (!get().hydrated) await get().initialize();
    const now = new Date();
    const diagram: StudyDiagram = {
      ...input,
      id: `diagram-${Date.now()}`,
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    await storage.put("diagrams", diagram);
    set({ diagrams: [diagram, ...get().diagrams] });
    return diagram;
  },

  updateDiagram: async (id, input) => {
    const current = get().diagrams.find((diagram) => diagram.id === id);
    if (!current) return;
    const updated = { ...current, ...input, updatedAt: iso(new Date()) };
    await storage.put("diagrams", updated);
    set({ diagrams: get().diagrams.map((diagram) => diagram.id === id ? updated : diagram) });
  },

  deleteDiagram: async (id) => {
    await storage.remove("diagrams", id);
    set({ diagrams: get().diagrams.filter((diagram) => diagram.id !== id) });
  },
}));
