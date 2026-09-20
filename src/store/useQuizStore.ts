import { create } from "zustand";
import { storage } from "@core/lib/storage";
import { calculateAttemptCorrectCount, getAttemptStatus } from "@core/lib/quiz";
import type { QuestionOptionId, QuizAttempt, QuizExam, QuizQuestion, QuizQuestionOption } from "@core/types";

export interface QuizExamInput {
  title: string;
  contestName: string;
  vacancy: string;
  proofVersion?: string;
  board?: string;
  year?: number;
  sourceName?: string;
  answerKeyName?: string;
}

export interface QuizQuestionInput {
  examId: string;
  order?: number;
  statement: string;
  options: QuizQuestionOption[];
  correctOption: QuestionOptionId;
  notes?: string;
  explanation?: string;
  examName?: string;
  subject: string;
  topic: string;
  sourceName?: string;
  sourcePage?: number;
  visualImage?: string;
  visualImages?: string[];
}

const makeId = (prefix: string) => prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
const nowIso = () => new Date().toISOString();

interface QuizState {
  exams: QuizExam[];
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  initialized: boolean;
  addExam: (input: QuizExamInput) => Promise<QuizExam>;
  updateExam: (id: string, input: QuizExamInput) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  duplicateExam: (id: string, title: string) => Promise<QuizExam | undefined>;
  updateQuestion: (id: string, patch: Partial<Omit<QuizQuestion, "id" | "createdAt" | "updatedAt">>) => Promise<void>;
  initialize: () => Promise<void>;
  addQuestion: (input: QuizQuestionInput) => Promise<QuizQuestion>;
  deleteQuestion: (id: string) => Promise<void>;
  deleteQuestions: (ids: string[]) => Promise<void>;
  createAttempt: (title: string, questionIds: string[]) => Promise<QuizAttempt>;
  saveAnswer: (attemptId: string, questionId: string, answer: QuestionOptionId) => Promise<void>;
  saveAttemptProgress: (attemptId: string, currentQuestionIndex: number) => Promise<void>;
  finishAttempt: (attemptId: string) => Promise<QuizAttempt | undefined>;
  resumeAttempt: (attemptId: string) => Promise<QuizAttempt | undefined>;
}


export const useQuizStore = create<QuizState>((set, get) => ({
  exams: [],
  questions: [],
  attempts: [],
  initialized: false,

  initialize: async () => {
    const [exams, questions, attempts] = await Promise.all([
      storage.list<QuizExam>("quiz_exams"),
      storage.list<QuizQuestion>("quiz_questions"),
      storage.list<QuizAttempt>("quiz_attempts"),
    ]);
    set({ exams, questions, attempts, initialized: true });
  },

  addExam: async (input) => {
    const now = nowIso();
    const exam: QuizExam = { id: makeId("exam"), ...input, createdAt: now, updatedAt: now };
    await storage.put("quiz_exams", exam);
    set({ exams: [exam, ...get().exams] });
    return exam;
  },

  updateExam: async (id, input) => {
    const exam = get().exams.find((item) => item.id === id);
    if (!exam) return;
    const updated: QuizExam = { ...exam, ...input, updatedAt: nowIso() };
    await storage.put("quiz_exams", updated);
    set({ exams: get().exams.map((item) => (item.id === id ? updated : item)) });
  },

  deleteExam: async (id) => {
    const questionIds = get().questions.filter((question) => question.examId === id).map((question) => question.id);
    const attemptIds = get().attempts
      .filter((attempt) => getAttemptStatus(attempt) === "in-progress" && attempt.questionIds.some((questionId) => questionIds.includes(questionId)))
      .map((attempt) => attempt.id);
    await storage.remove("quiz_exams", id);
    await storage.removeMany("quiz_questions", questionIds);
    await storage.removeMany("quiz_attempts", attemptIds);
    set({
      exams: get().exams.filter((exam) => exam.id !== id),
      questions: get().questions.filter((question) => question.examId !== id),
      attempts: get().attempts.filter((attempt) => !attemptIds.includes(attempt.id)),
    });
  },

  duplicateExam: async (id, title) => {
    const original = get().exams.find((exam) => exam.id === id);
    if (!original) return undefined;
    const now = nowIso();
    const exam: QuizExam = { ...original, id: makeId("exam"), title: title.trim() || `${original.title} (cópia)`, sourceName: undefined, answerKeyName: undefined, createdAt: now, updatedAt: now };
    const questions = get().questions.filter((question) => question.examId === id).map((question, index) => ({ ...question, id: makeId("question"), examId: exam.id, order: question.order ?? index + 1, createdAt: now, updatedAt: now }));
    await storage.put("quiz_exams", exam);
    await storage.bulkPut("quiz_questions", questions);
    set({ exams: [exam, ...get().exams], questions: [...questions, ...get().questions] });
    return exam;
  },

  updateQuestion: async (id, patch) => {
    const question = get().questions.find((item) => item.id === id);
    if (!question) return;
    const updated = { ...question, ...patch, updatedAt: nowIso() };
    await storage.put("quiz_questions", updated);
    set({ questions: get().questions.map((item) => (item.id === id ? updated : item)) });
  },

  addQuestion: async (input) => {
    if (!input.examId) throw new Error("Uma questão precisa pertencer a uma prova/vaga.");
    const now = nowIso();
    const examQuestions = get().questions.filter((question) => question.examId === input.examId);
    const nextOrder = input.order ?? Math.max(0, ...examQuestions.map((question) => question.order ?? 0)) + 1;
    const question: QuizQuestion = { id: makeId("question"), ...input, order: nextOrder, createdAt: now, updatedAt: now };
    await storage.put("quiz_questions", question);
    set({ questions: [question, ...get().questions] });
    return question;
  },

  deleteQuestions: async (ids) => {
    const questionIds = Array.from(new Set(ids));
    if (!questionIds.length) return;
    const attemptIds = get().attempts
      .filter((attempt) => getAttemptStatus(attempt) === "in-progress" && attempt.questionIds.some((questionId) => questionIds.includes(questionId)))
      .map((attempt) => attempt.id);
    await storage.removeMany("quiz_questions", questionIds);
    await storage.removeMany("quiz_attempts", attemptIds);
    const removed = new Set(questionIds);
    set({
      questions: get().questions.filter((question) => !removed.has(question.id)),
      attempts: get().attempts.filter((attempt) => !attemptIds.includes(attempt.id)),
    });
  },

  deleteQuestion: async (id) => {
    await get().deleteQuestions([id]);
  },

  createAttempt: async (title, questionIds) => {
    const now = nowIso();
    const attempt: QuizAttempt = { id: makeId("attempt"), title, questionIds, answers: {}, startedAt: now, status: "in-progress", currentQuestionIndex: 0, updatedAt: now };
    await storage.put("quiz_attempts", attempt);
    set({ attempts: [attempt, ...get().attempts] });
    return attempt;
  },

  saveAnswer: async (attemptId, questionId, answer) => {
    const attempt = get().attempts.find((item) => item.id === attemptId);
    if (!attempt || getAttemptStatus(attempt) === "completed") return;
    const updated: QuizAttempt = { ...attempt, answers: { ...attempt.answers, [questionId]: answer }, updatedAt: nowIso() };
    await storage.put("quiz_attempts", updated);
    set({ attempts: get().attempts.map((item) => (item.id === attemptId ? updated : item)) });
  },

  saveAttemptProgress: async (attemptId, currentQuestionIndex) => {
    const attempt = get().attempts.find((item) => item.id === attemptId);
    if (!attempt || getAttemptStatus(attempt) === "completed") return;
    const maxIndex = Math.max(attempt.questionIds.length - 1, 0);
    const index = Math.min(Math.max(Math.floor(currentQuestionIndex), 0), maxIndex);
    const updated: QuizAttempt = { ...attempt, currentQuestionIndex: index, updatedAt: nowIso() };
    await storage.put("quiz_attempts", updated);
    set({ attempts: get().attempts.map((item) => (item.id === attemptId ? updated : item)) });
  },

  finishAttempt: async (attemptId) => {
    const attempt = get().attempts.find((item) => item.id === attemptId);
    if (!attempt) return undefined;
    const finishedAt = nowIso();
    const updated: QuizAttempt = { ...attempt, status: "completed", finishedAt, durationSeconds: Math.max(0, Math.round((Date.parse(finishedAt) - Date.parse(attempt.startedAt)) / 1000)), correctCount: calculateAttemptCorrectCount(attempt, get().questions), updatedAt: finishedAt };
    await storage.put("quiz_attempts", updated);
    set({ attempts: get().attempts.map((item) => (item.id === attemptId ? updated : item)) });
    return updated;
  },

  resumeAttempt: async (attemptId) => {
    const attempt = get().attempts.find((item) => item.id === attemptId);
    if (!attempt) return undefined;
    const resumed: QuizAttempt = { ...attempt, status: "in-progress", finishedAt: undefined, durationSeconds: undefined, correctCount: undefined, updatedAt: nowIso() };
    await storage.put("quiz_attempts", resumed);
    set({ attempts: get().attempts.map((item) => (item.id === attemptId ? resumed : item)) });
    return resumed;
  },
}));
