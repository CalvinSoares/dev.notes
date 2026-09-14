import { create } from "zustand";
import type { Flashcard, SrsRating } from "@core/types";
import { storage } from "@core/lib/storage";
import { scheduleSrs, newCardDefaults } from "@core/lib/srs-algorithm";

const iso = (d: Date) => d.toISOString();

export interface FlashcardMutablePatch {
  question?: string;
  answer?: string;
  quizQuestionId?: string;
  codeSnippet?: string;
  language?: string;
  diagramIds?: string[];
  tags?: string[];
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
  lastReviewAt?: string;
  nextReviewAt?: string;
}

interface FlashcardState {
  hydrated: boolean;
  cards: Flashcard[];
  initialize: () => Promise<void>;
  getDueCards: () => Flashcard[];
  getDueCountByRating: () => Record<SrsRating, number>;
  addCard: (patch: {
    question: string;
    answer: string;
    quizQuestionId?: string;
    codeSnippet?: string;
    language?: string;
    diagramIds?: string[];
    tags?: string[];
  }) => Promise<Flashcard>;
  updateCard: (id: string, patch: FlashcardMutablePatch) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  reviewCard: (id: string, rating: SrsRating) => Promise<void>;
  _applySrs: (card: Flashcard, rating: SrsRating) => Flashcard;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  hydrated: false,
  cards: [],

  initialize: async () => {
    if (get().hydrated) return;
    await storage.seedIfEmpty();
    const cards = await storage.list<Flashcard>("flashcards");
    set({ cards, hydrated: true });
  },

  getDueCards: () => {
    const today = new Date();
    return get()
      .cards.filter((c) => new Date(c.nextReviewAt) <= today)
      .sort((a, b) => +new Date(a.nextReviewAt) - +new Date(b.nextReviewAt));
  },

  getDueCountByRating: () => {
    const due = get().getDueCards();
    const result: Record<SrsRating, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
      again: 0,
    };
    due.forEach((c) => {
      if (c.repetitions === 0) {
        result.again += 1;
      } else if (c.interval <= 1) result.hard += 1;
      else if (c.interval <= 4) result.medium += 1;
      else result.easy += 1;
    });
    return result;
  },

  addCard: async (patch) => {
    if (!get().hydrated) await get().initialize();
    const now = new Date();
    const id = `fc-${Date.now()}`;
    const defaults = newCardDefaults(now);
    const card: Flashcard = {
      id,
      question: patch.question,
      answer: patch.answer,
      quizQuestionId: patch.quizQuestionId,
      codeSnippet: patch.codeSnippet,
      language: patch.language,
      diagramIds: patch.diagramIds ?? [],
      tags: patch.tags ?? [],
      ...defaults,
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    await storage.put("flashcards", card);
    set({ cards: [...get().cards, card] });
    return card;
  },

  updateCard: async (id, patch) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return;
    const updated: Flashcard = { ...card, ...patch, updatedAt: iso(new Date()) };
    await storage.put("flashcards", updated);
    set({ cards: get().cards.map((c) => (c.id === id ? updated : c)) });
  },

  deleteCard: async (id) => {
    await storage.remove("flashcards", id);
    set({ cards: get().cards.filter((c) => c.id !== id) });
  },

  reviewCard: async (id, rating) => {
    const card = get().cards.find((c) => c.id === id);
    if (!card) return;
    const updated = get()._applySrs(card, rating);
    await storage.put("flashcards", updated);
    set({ cards: get().cards.map((c) => (c.id === id ? updated : c)) });
  },

  _applySrs: (card, rating) => scheduleSrs(card, rating) as Flashcard,
}));
