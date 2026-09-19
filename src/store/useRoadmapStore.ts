import { create } from "zustand";
import { storage } from "@core/lib/storage";
import { getRoadmapDescendantNodes, moveRoadmapNode, setRoadmapNodeCompletion } from "@core/lib/roadmap";
import type { StudyRoadmap, StudyRoadmapLink, StudyRoadmapNode, StudyRoadmapStatus } from "@core/types/roadmap";

const iso = (date: Date) => date.toISOString();
const makeId = (prefix: string) => prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

type RoadmapInput = {
  title: string;
  description?: string;
  objective?: string;
  status?: StudyRoadmapStatus;
  startDate?: string;
  targetDate?: string;
};

type NodeInput = {
  roadmapId: string;
  parentId?: string;
  kind: StudyRoadmapNode["kind"];
  title: string;
  description?: string;
  notes?: string;
};

interface RoadmapState {
  hydrated: boolean;
  error: string | null;
  roadmaps: StudyRoadmap[];
  nodes: StudyRoadmapNode[];
  links: StudyRoadmapLink[];
  initialize: () => Promise<void>;
  addRoadmap: (input: RoadmapInput) => Promise<StudyRoadmap>;
  updateRoadmap: (id: string, input: RoadmapInput) => Promise<void>;
  deleteRoadmap: (id: string) => Promise<void>;
  addNode: (input: NodeInput) => Promise<StudyRoadmapNode>;
  updateNode: (id: string, input: Omit<NodeInput, "roadmapId">) => Promise<void>;
  toggleNode: (id: string, completed: boolean) => Promise<void>;
  moveNode: (id: string, direction: "up" | "down") => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  addLink: (input: Omit<StudyRoadmapLink, "id" | "createdAt" | "order">) => Promise<StudyRoadmapLink>;
  deleteLink: (id: string) => Promise<void>;
}

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  hydrated: false,
  error: null,
  roadmaps: [],
  nodes: [],
  links: [],

  initialize: async () => {
    if (get().hydrated) return;
    set({ error: null });
    try {
      const [roadmaps, nodes, links] = await Promise.all([
        storage.list<StudyRoadmap>("study_roadmaps"),
        storage.list<StudyRoadmapNode>("roadmap_nodes"),
        storage.list<StudyRoadmapLink>("roadmap_links"),
      ]);
      set({ roadmaps, nodes, links, hydrated: true, error: null });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Não foi possível carregar a trilha de estudos.";
      set({ error: message });
    }
  },

  addRoadmap: async (input) => {
    if (!get().hydrated) await get().initialize();
    const now = iso(new Date());
    const roadmap: StudyRoadmap = {
      id: makeId("roadmap"),
      title: input.title.trim() || "Trilha sem título",
      description: input.description?.trim() || undefined,
      objective: input.objective?.trim() || undefined,
      status: input.status ?? "draft",
      startDate: input.startDate || undefined,
      targetDate: input.targetDate || undefined,
      createdAt: now,
      updatedAt: now,
    };
    await storage.put("study_roadmaps", roadmap);
    set({ roadmaps: [roadmap, ...get().roadmaps] });
    return roadmap;
  },

  updateRoadmap: async (id, input) => {
    const current = get().roadmaps.find((roadmap) => roadmap.id === id);
    if (!current) return;
    const updated: StudyRoadmap = {
      ...current,
      title: input.title.trim() || "Trilha sem título",
      description: input.description?.trim() || undefined,
      objective: input.objective?.trim() || undefined,
      status: input.status ?? current.status,
      startDate: input.startDate || undefined,
      targetDate: input.targetDate || undefined,
      updatedAt: iso(new Date()),
    };
    await storage.put("study_roadmaps", updated);
    set({ roadmaps: get().roadmaps.map((roadmap) => roadmap.id === id ? updated : roadmap) });
  },

  deleteRoadmap: async (id) => {
    const nodeIds = get().nodes.filter((node) => node.roadmapId === id).map((node) => node.id);
    const linkIds = get().links.filter((link) => nodeIds.includes(link.nodeId)).map((link) => link.id);
    await Promise.all([
      storage.remove("study_roadmaps", id),
      storage.removeMany("roadmap_nodes", nodeIds),
      storage.removeMany("roadmap_links", linkIds),
    ]);
    set({
      roadmaps: get().roadmaps.filter((roadmap) => roadmap.id !== id),
      nodes: get().nodes.filter((node) => node.roadmapId !== id),
      links: get().links.filter((link) => !linkIds.includes(link.id)),
    });
  },

  addNode: async (input) => {
    if (!get().hydrated) await get().initialize();
    const now = iso(new Date());
    const siblings = get().nodes.filter((node) => node.roadmapId === input.roadmapId && node.parentId === input.parentId);
    const node: StudyRoadmapNode = {
      id: makeId("roadmap-node"),
      roadmapId: input.roadmapId,
      parentId: input.parentId || undefined,
      kind: input.kind,
      title: input.title.trim() || "Tópico sem título",
      description: input.description?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      order: siblings.length,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    await storage.put("roadmap_nodes", node);
    set({ nodes: [...get().nodes, node] });
    return node;
  },

  updateNode: async (id, input) => {
    const current = get().nodes.find((node) => node.id === id);
    if (!current) return;
    const updated: StudyRoadmapNode = {
      ...current,
      parentId: input.parentId || undefined,
      kind: input.kind,
      title: input.title.trim() || "Tópico sem título",
      description: input.description?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      updatedAt: iso(new Date()),
    };
    await storage.put("roadmap_nodes", updated);
    set({ nodes: get().nodes.map((node) => node.id === id ? updated : node) });
  },

  toggleNode: async (id, completed) => {
    const now = iso(new Date());
    const previous = get().nodes;
    const next = setRoadmapNodeCompletion(id, completed, previous, now);
    const changed = next.filter((node, index) => JSON.stringify(node) !== JSON.stringify(previous[index]));
    await storage.bulkPut("roadmap_nodes", changed);
    set({ nodes: next });
  },

  moveNode: async (id, direction) => {
    const previous = get().nodes;
    const next = moveRoadmapNode(id, direction, previous);
    const changed = next.filter((node) => JSON.stringify(node) !== JSON.stringify(previous.find((item) => item.id === node.id)));
    await storage.bulkPut("roadmap_nodes", changed);
    set({ nodes: next });
  },

  deleteNode: async (id) => {
    const nodeIds = [id, ...getRoadmapDescendantNodes(id, get().nodes).map((node) => node.id)];
    const linkIds = get().links.filter((link) => nodeIds.includes(link.nodeId)).map((link) => link.id);
    await Promise.all([
      storage.removeMany("roadmap_nodes", nodeIds),
      storage.removeMany("roadmap_links", linkIds),
    ]);
    set({
      nodes: get().nodes.filter((node) => !nodeIds.includes(node.id)),
      links: get().links.filter((link) => !linkIds.includes(link.id)),
    });
  },

  addLink: async (input) => {
    const existing = get().links.find((link) => link.nodeId === input.nodeId && link.resourceType === input.resourceType && link.resourceId === input.resourceId);
    if (existing) return existing;
    const siblings = get().links.filter((link) => link.nodeId === input.nodeId);
    const link: StudyRoadmapLink = {
      ...input,
      id: makeId("roadmap-link"),
      order: siblings.length,
      createdAt: iso(new Date()),
    };
    await storage.put("roadmap_links", link);
    set({ links: [...get().links, link] });
    return link;
  },

  deleteLink: async (id) => {
    await storage.remove("roadmap_links", id);
    set({ links: get().links.filter((link) => link.id !== id) });
  },
}));
