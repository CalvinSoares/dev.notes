export type PageId =
  | "dashboard"
  | "leetcode"
  | "flashcards"
  | "articles"
  | "snippets"
  | "diagrams"
  | "quizzes"
  | "roadmaps"
  | "sync";

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
  /** Questão de prova opcional vinculada a este flashcard. */
  quizQuestionId?: string;
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

export type QuestionOptionId = "A" | "B" | "C" | "D" | "E";

export interface QuizQuestionOption {
  id: QuestionOptionId;
  text: string;
}

export interface QuizExam {
  id: string;
  title: string;
  contestName: string;
  vacancy: string;
  proofVersion?: string;
  board?: string;
  year?: number;
  sourceName?: string;
  answerKeyName?: string;
  createdAt: string;
  updatedAt: string;
}
/** Uma questão de prova ou questão criada manualmente para os simulados. */
export interface QuizQuestion {
  id: string;
  /** Prova/vaga à qual a questão pertence; ausente apenas em registros legados. */
  examId?: string;
  order?: number;
  statement: string;
  options: QuizQuestionOption[];
  correctOption: QuestionOptionId;
  explanation?: string;
  notes?: string;
  examName?: string;
  subject: string;
  topic: string;
  sourceName?: string;
  sourcePage?: number;
  /** Compatibilidade com questões importadas antes do suporte a múltiplas páginas. */
  visualImage?: string;
  visualImages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  title: string;
  questionIds: string[];
  answers: Record<string, QuestionOptionId>;
  startedAt: string;
  /** Estado explícito para não depender da presença de finishedAt. */
  status?: "in-progress" | "completed";
  /** Índice da questão que estava aberta quando o estudante saiu. */
  currentQuestionIndex?: number;
  finishedAt?: string;
  durationSeconds?: number;
  correctCount?: number;
  updatedAt?: string;
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
