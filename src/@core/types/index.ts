export type PageId =
  | "dashboard"
  | "leetcode"
  | "flashcards"
  | "articles"
  | "snippets"
  | "diagrams";

export interface Tab {
  id: string;
  pageId: PageId;
  title: string;
  iconName: string;
  dirty?: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";
export type SrsRating = "easy" | "medium" | "hard" | "again";

export interface LeetCodeProblem {
  id: string;
  /** ID do problema-base; registros antigos usam o próprio id como fallback. */
  problemId?: string;
  title: string;
  variantName?: string;
  strategy?: string;
  url: string;
  difficulty: Difficulty;
  tags: string[];
  complexity?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  tradeoffs?: string;
  diagramIds?: string[];
  solution?: string;
  notes?: string;
  solvedAt?: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  codeSnippet?: string;
  language?: string;
  diagramIds?: string[];
  tags: string[];
  interval: number;
  easeFactor: number;
  repetitions: number;
  lastReviewAt?: string;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPhase {
  id: string;
  title: string;
  description?: string;
  flashcardIds: string[];
  problemIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyDiagram {
  id: string;
  title: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  phaseIds: string[];
  flashcardIds: string[];
  problemIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  url?: string;
  summary: string;
  content?: string;
  tags: string[];
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewItem {
  id: string;
  kind: "leetcode" | "flashcard" | "article";
  title: string;
  priority: SrsRating | Difficulty;
  nextReviewAt: string;
  targetId: string;
}

export type Brand<K, T> = K & { __brand: T };
