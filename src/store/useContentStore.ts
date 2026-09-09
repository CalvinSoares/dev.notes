import { create } from "zustand";
import type { Article, Snippet, SrsRating } from "@core/types";
import { storage } from "@core/lib/storage";
import { scheduleSrs, newCardDefaults } from "@core/lib/srs-algorithm";

const iso = (d: Date) => d.toISOString();

export interface ArticleMutablePatch {
  title?: string;
  url?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
  nextReviewAt?: string;
}

export interface SnippetMutablePatch {
  title?: string;
  language?: string;
  code?: string;
  description?: string;
  tags?: string[];
}

interface ContentState {
  hydrated: boolean;
  articles: Article[];
  snippets: Snippet[];
  initialize: () => Promise<void>;
  getDueArticles: () => Article[];

  addArticle: (patch: {
    title: string;
    summary: string;
    content?: string;
    url?: string;
    tags?: string[];
  }) => Promise<Article>;
  updateArticle: (id: string, patch: ArticleMutablePatch) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  reviewArticle: (id: string, rating: SrsRating) => Promise<void>;

  addSnippet: (patch: {
    title: string;
    language: string;
    code: string;
    description?: string;
    tags?: string[];
  }) => Promise<Snippet>;
  updateSnippet: (id: string, patch: SnippetMutablePatch) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
}

export const useContentStore = create<ContentState>((set, get) => ({
  hydrated: false,
  articles: [],
  snippets: [],

  initialize: async () => {
    if (get().hydrated) return;
    await storage.seedIfEmpty();
    const [articles, snippets] = await Promise.all([
      storage.list<Article>("articles"),
      storage.list<Snippet>("snippets"),
    ]);
    set({ articles, snippets, hydrated: true });
  },

  getDueArticles: () => {
    const today = new Date();
    return get()
      .articles.filter((a) => new Date(a.nextReviewAt) <= today)
      .sort((a, b) => +new Date(a.nextReviewAt) - +new Date(b.nextReviewAt));
  },

  addArticle: async (patch) => {
    if (!get().hydrated) await get().initialize();
    const now = new Date();
    const id = `art-${Date.now()}`;
    const art: Article = {
      id,
      title: patch.title,
      url: patch.url,
      summary: patch.summary,
      content: patch.content ?? "",
      tags: patch.tags ?? [],
      ...newCardDefaults(now),
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    await storage.put("articles", art);
    set({ articles: [...get().articles, art] });
    return art;
  },

  updateArticle: async (id, patch) => {
    const art = get().articles.find((x) => x.id === id);
    if (!art) return;
    const updated: Article = { ...art, ...patch, updatedAt: iso(new Date()) };
    await storage.put("articles", updated);
    set({ articles: get().articles.map((x) => (x.id === id ? updated : x)) });
  },

  deleteArticle: async (id) => {
    await storage.remove("articles", id);
    set({ articles: get().articles.filter((x) => x.id !== id) });
  },

  reviewArticle: async (id, rating) => {
    const art = get().articles.find((x) => x.id === id);
    if (!art) return;
    const updated = scheduleSrs(art, rating) as Article;
    await storage.put("articles", updated);
    set({ articles: get().articles.map((x) => (x.id === id ? updated : x)) });
  },

  addSnippet: async (patch) => {
    if (!get().hydrated) await get().initialize();
    const now = new Date();
    const id = `sn-${Date.now()}`;
    const sn: Snippet = {
      id,
      title: patch.title,
      language: patch.language,
      code: patch.code,
      description: patch.description,
      tags: patch.tags ?? [],
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    await storage.put("snippets", sn);
    set({ snippets: [...get().snippets, sn] });
    return sn;
  },

  updateSnippet: async (id, patch) => {
    const sn = get().snippets.find((x) => x.id === id);
    if (!sn) return;
    const updated: Snippet = { ...sn, ...patch, updatedAt: iso(new Date()) };
    await storage.put("snippets", updated);
    set({ snippets: get().snippets.map((x) => (x.id === id ? updated : x)) });
  },

  deleteSnippet: async (id) => {
    await storage.remove("snippets", id);
    set({ snippets: get().snippets.filter((x) => x.id !== id) });
  },
}));
