import { create } from "zustand";
import type { LeetCodeProblem, Difficulty, SrsRating } from "@core/types";
import { storage } from "@core/lib/storage";
import { scheduleSrs, newCardDefaults } from "@core/lib/srs-algorithm";

const iso = (d: Date) => d.toISOString();

export interface LeetCodeMutablePatch {
  problemId?: string;
  title?: string;
  variantName?: string;
  strategy?: string;
  url?: string;
  difficulty?: Difficulty;
  tags?: string[];
  complexity?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  tradeoffs?: string;
  diagramIds?: string[];
  solution?: string;
  notes?: string;
  solvedAt?: string;
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
  nextReviewAt?: string;
}

interface LeetCodeState {
  hydrated: boolean;
  problems: LeetCodeProblem[];
  initialize: () => Promise<void>;
  getDueProblems: () => LeetCodeProblem[];
  addProblem: (patch: {
    title: string;
    difficulty: Difficulty;
    url?: string;
    tags?: string[];
    variantName?: string;
    strategy?: string;
    complexity?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    tradeoffs?: string;
    diagramIds?: string[];
    solution?: string;
    notes?: string;
    solvedAt?: string;
  }) => Promise<LeetCodeProblem>;
  addVariant: (problem: LeetCodeProblem, patch: {
    variantName: string;
    strategy?: string;
    complexity?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    tradeoffs?: string;
    diagramIds?: string[];
    solution?: string;
  }) => Promise<LeetCodeProblem>;
  updateProblem: (id: string, patch: LeetCodeMutablePatch) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;
  reviewProblem: (id: string, rating: SrsRating) => Promise<void>;
}

export const useLeetCodeStore = create<LeetCodeState>((set, get) => ({
  hydrated: false,
  problems: [],

  initialize: async () => {
    if (get().hydrated) return;
    await storage.seedIfEmpty();
    const problems = await storage.list<LeetCodeProblem>("leetcode_problems");
    set({ problems, hydrated: true });
  },

  getDueProblems: () => {
    const today = new Date();
    return get()
      .problems.filter((p) => new Date(p.nextReviewAt) <= today)
      .sort((a, b) => +new Date(a.nextReviewAt) - +new Date(b.nextReviewAt));
  },

  addProblem: async (patch) => {
    if (!get().hydrated) await get().initialize();
    const now = new Date();
    const id = `lc-${Date.now()}`;
    let defaults = { ...newCardDefaults(now) };
    if (patch.solvedAt) {
      defaults = { ...defaults, interval: 1, repetitions: 1 };
    }
    const p: LeetCodeProblem = {
      id,
      problemId: id,
      title: patch.title,
      variantName: patch.variantName ?? "Solução principal",
      strategy: patch.strategy,
      url: patch.url ?? "",
      difficulty: patch.difficulty,
      tags: patch.tags ?? [],
      complexity: patch.complexity,
      timeComplexity: patch.timeComplexity,
      spaceComplexity: patch.spaceComplexity,
      tradeoffs: patch.tradeoffs,
      diagramIds: patch.diagramIds ?? [],
      solution: patch.solution,
      notes: patch.notes,
      solvedAt: patch.solvedAt,
      ...defaults,
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    await storage.put("leetcode_problems", p);
    set({ problems: [...get().problems, p] });
    return p;
  },

  addVariant: async (problem, patch) => {
    if (!get().hydrated) await get().initialize();
    const now = new Date();
    const id = `lc-${Date.now()}`;
    const variant: LeetCodeProblem = {
      ...newCardDefaults(now),
      id,
      problemId: problem.problemId ?? problem.id,
      title: problem.title,
      variantName: patch.variantName.trim() || "Nova abordagem",
      strategy: patch.strategy?.trim() || undefined,
      url: problem.url,
      difficulty: problem.difficulty,
      tags: [...problem.tags],
      complexity: patch.complexity?.trim() || undefined,
      timeComplexity: patch.timeComplexity?.trim() || undefined,
      spaceComplexity: patch.spaceComplexity?.trim() || undefined,
      tradeoffs: patch.tradeoffs?.trim() || undefined,
      diagramIds: patch.diagramIds ?? [],
      solution: patch.solution?.trim() || undefined,
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    await storage.put("leetcode_problems", variant);
    set({ problems: [...get().problems, variant] });
    return variant;
  },

  updateProblem: async (id, patch) => {
    const p = get().problems.find((x) => x.id === id);
    if (!p) return;
    const updated: LeetCodeProblem = {
      ...p,
      ...patch,
      updatedAt: iso(new Date()),
    };
    await storage.put("leetcode_problems", updated);
    set({ problems: get().problems.map((x) => (x.id === id ? updated : x)) });
  },

  deleteProblem: async (id) => {
    await storage.remove("leetcode_problems", id);
    set({ problems: get().problems.filter((p) => p.id !== id) });
  },

  reviewProblem: async (id, rating) => {
    const p = get().problems.find((x) => x.id === id);
    if (!p) return;
    const updated = scheduleSrs(p, rating) as LeetCodeProblem;
    await storage.put("leetcode_problems", updated);
    set({ problems: get().problems.map((x) => (x.id === id ? updated : x)) });
  },
}));
