import { create } from 'zustand';
import type { Tab, PageId } from '@core/types';

interface AppState {
  tabs: Tab[];
  activeTabId: string | null;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  openTab: (pageId: PageId) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  toggleTheme: () => void;
  flashcardFocusId: string | null;
  quizQuestionFocusId: string | null;
  flashcardStudyIds: string[] | null;
  quizStudyQuestionIds: string[] | null;
  openFlashcard: (id: string) => void;
  openQuizQuestion: (id: string) => void;
  startFlashcardStudy: (ids: string[]) => void;
  startQuizWithQuestions: (ids: string[]) => void;
  clearFlashcardFocus: () => void;
  clearQuizQuestionFocus: () => void;
  clearFlashcardStudy: () => void;
  clearQuizStudy: () => void;
}

const savedTheme =
  typeof window !== 'undefined' && window.localStorage.getItem('devnotes-theme') === 'dark'
    ? 'dark'
    : 'light';
const savedSidebarCollapsed =
  typeof window !== 'undefined' && window.localStorage.getItem('devnotes-sidebar-collapsed') === 'true';

const PAGE_META: Record<PageId, { title: string; iconName: string }> = {
  dashboard: { title: 'dashboard.review', iconName: 'LayoutDashboard' },
  leetcode: { title: 'leetcode.problems', iconName: 'Code2' },
  flashcards: { title: 'flashcards.deck', iconName: 'Layers' },
  articles: { title: 'articles.notes', iconName: 'FileText' },
  snippets: { title: 'snippets.lib', iconName: 'FileCode' },
  diagrams: { title: 'diagrams.flow', iconName: 'GitBranch' },
  quizzes: { title: 'simulados.provas', iconName: 'ClipboardCheck' },
  roadmaps: { title: 'roadmaps.estudos', iconName: 'Route' },
};

export const useAppStore = create<AppState>((set, get) => ({
  tabs: [
    {
      id: 'tab-dashboard',
      pageId: 'dashboard',
      title: PAGE_META.dashboard.title,
      iconName: PAGE_META.dashboard.iconName,
    },
  ],
  activeTabId: 'tab-dashboard',
  sidebarOpen: false,
  sidebarCollapsed: savedSidebarCollapsed,
  theme: savedTheme,
  flashcardFocusId: null,
  quizQuestionFocusId: null,
  flashcardStudyIds: null,
  quizStudyQuestionIds: null,

  openTab: (pageId) => {
    const existing = get().tabs.find((t) => t.pageId === pageId);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const meta = PAGE_META[pageId];
    const newTab: Tab = {
      id: `tab-${pageId}-${Date.now()}`,
      pageId,
      title: meta.title,
      iconName: meta.iconName,
    };
    set({ tabs: [...get().tabs, newTab], activeTabId: newTab.id });
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;
    const next = tabs.filter((t) => t.id !== tabId);
    let nextActive = activeTabId === tabId ? null : activeTabId;
    if (!nextActive && next.length > 0) {
      const fallbackIdx = Math.max(0, idx - 1);
      nextActive = next[fallbackIdx]?.id ?? null;
    }
    if (next.length === 0) {
      const meta = PAGE_META.dashboard;
      const fallback: Tab = {
        id: 'tab-dashboard-fallback',
        pageId: 'dashboard',
        title: meta.title,
        iconName: meta.iconName,
      };
      set({ tabs: [fallback], activeTabId: fallback.id });
      return;
    }
    set({ tabs: next, activeTabId: nextActive });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapsed: () => {
    const collapsed = !get().sidebarCollapsed;
    window.localStorage.setItem('devnotes-sidebar-collapsed', String(collapsed));
    set({ sidebarCollapsed: collapsed });
  },
  openFlashcard: (id) => { get().openTab("flashcards"); set({ flashcardFocusId: id, flashcardStudyIds: null }); },
  openQuizQuestion: (id) => { get().openTab("quizzes"); set({ quizQuestionFocusId: id, quizStudyQuestionIds: null }); },
  startFlashcardStudy: (ids) => { get().openTab("flashcards"); set({ flashcardStudyIds: ids, flashcardFocusId: null }); },
  startQuizWithQuestions: (ids) => { get().openTab("quizzes"); set({ quizStudyQuestionIds: ids, quizQuestionFocusId: null }); },
  clearFlashcardFocus: () => set({ flashcardFocusId: null }),
  clearQuizQuestionFocus: () => set({ quizQuestionFocusId: null }),
  clearFlashcardStudy: () => set({ flashcardStudyIds: null }),
  clearQuizStudy: () => set({ quizStudyQuestionIds: null }),

  toggleTheme: () => {
    const theme = get().theme === 'light' ? 'dark' : 'light';
    window.localStorage.setItem('devnotes-theme', theme);
    set({ theme });
  },
}));
