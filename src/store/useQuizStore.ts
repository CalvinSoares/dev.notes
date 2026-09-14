import { create } from "zustand";
import { db } from "@core/lib/db";
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

interface QuizState {
  exams: QuizExam[];
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  initialized: boolean;
  addExam: (input: QuizExamInput) => Promise<QuizExam>;
  updateExam: (id: string, input: QuizExamInput) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  duplicateExam: (id: string, title: string) => Promise<QuizExam | undefined>;
  updateQuestion: (id: string, patch: Partial<Pick<QuizQuestion, "notes" | "examId" | "examName" | "order">>) => Promise<void>;
  initialize: () => Promise<void>;
  addQuestion: (input: QuizQuestionInput) => Promise<QuizQuestion>;
  deleteQuestion: (id: string) => Promise<void>;
  deleteQuestions: (ids: string[]) => Promise<void>;
  createAttempt: (title: string, questionIds: string[]) => Promise<QuizAttempt>;
  saveAnswer: (attemptId: string, questionId: string, answer: QuestionOptionId) => Promise<void>;
  finishAttempt: (attemptId: string) => Promise<QuizAttempt | undefined>;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  exams: [],
  questions: [],
  attempts: [],
  initialized: false,

  initialize: async () => {
    const [exams, questions, attempts] = await Promise.all([
      db.quiz_exams.orderBy("updatedAt").reverse().toArray(),
      db.quiz_questions.orderBy("updatedAt").reverse().toArray(),
      db.quiz_attempts.orderBy("startedAt").reverse().toArray(),
    ]);
    set({ exams, questions, attempts, initialized: true });
  },

  addExam: async (input) => {
    const now = new Date().toISOString();
    const exam: QuizExam = { id: makeId("exam"), ...input, createdAt: now, updatedAt: now };
    await db.quiz_exams.add(exam);
    set({ exams: [exam, ...get().exams] });
    return exam;
  },

  updateExam: async (id, input) => {
    const exam = get().exams.find((item) => item.id === id);
    if (!exam) return;
    const updated: QuizExam = { ...exam, ...input, updatedAt: new Date().toISOString() };
    await db.quiz_exams.put(updated);
    set({ exams: get().exams.map((item) => (item.id === id ? updated : item)) });
  },

  deleteExam: async (id) => {
    const questionIds = get().questions.filter((question) => question.examId === id).map((question) => question.id);
    await db.transaction("rw", db.quiz_exams, db.quiz_questions, db.quiz_attempts, async () => {
      await db.quiz_exams.delete(id);
      if (questionIds.length) await db.quiz_questions.bulkDelete(questionIds);
      const attempts = await db.quiz_attempts.toArray();
      await Promise.all(attempts.filter((attempt) => !attempt.finishedAt && attempt.questionIds.some((questionId) => questionIds.includes(questionId))).map((attempt) => db.quiz_attempts.delete(attempt.id)));
    });
    const attempts = await db.quiz_attempts.orderBy("startedAt").reverse().toArray();
    set({ exams: get().exams.filter((exam) => exam.id !== id), questions: get().questions.filter((question) => question.examId !== id), attempts });
  },

  duplicateExam: async (id, title) => {
    const original = get().exams.find((exam) => exam.id === id);
    if (!original) return undefined;
    const now = new Date().toISOString();
    const exam: QuizExam = { ...original, id: makeId("exam"), title: title.trim() || `${original.title} (cópia)`, sourceName: undefined, answerKeyName: undefined, createdAt: now, updatedAt: now };
    const questions = get().questions.filter((question) => question.examId === id).map((question, index) => ({ ...question, id: makeId("question"), examId: exam.id, order: question.order ?? index + 1, createdAt: now, updatedAt: now }));
    await db.transaction("rw", db.quiz_exams, db.quiz_questions, async () => {
      await db.quiz_exams.add(exam);
      if (questions.length) await db.quiz_questions.bulkAdd(questions);
    });
    set({ exams: [exam, ...get().exams], questions: [...questions, ...get().questions] });
    return exam;
  },

  updateQuestion: async (id, patch) => {
    const question = get().questions.find((item) => item.id === id);
    if (!question) return;
    const updated = { ...question, ...patch, updatedAt: new Date().toISOString() };
    await db.quiz_questions.put(updated);
    set({ questions: get().questions.map((item) => (item.id === id ? updated : item)) });
  },
  addQuestion: async (input) => {
    if (!input.examId) throw new Error("Uma questão precisa pertencer a uma prova/vaga.");
    const now = new Date().toISOString();
    const examQuestions = get().questions.filter((question) => question.examId === input.examId);
    const nextOrder = input.order ?? Math.max(0, ...examQuestions.map((question) => question.order ?? 0)) + 1;
    const question: QuizQuestion = { id: makeId("question"), ...input, order: nextOrder, createdAt: now, updatedAt: now };
    await db.quiz_questions.add(question);
    set({ questions: [question, ...get().questions] });
    return question;
  },

  deleteQuestions: async (ids) => {
    const questionIds = Array.from(new Set(ids));
    if (!questionIds.length) return;
    await db.transaction("rw", db.quiz_questions, db.quiz_attempts, async () => {
      await db.quiz_questions.bulkDelete(questionIds);
      const attempts = await db.quiz_attempts.toArray();
      await Promise.all(attempts.filter((attempt) => !attempt.finishedAt && attempt.questionIds.some((questionId) => questionIds.includes(questionId))).map((attempt) => db.quiz_attempts.delete(attempt.id)));
    });
    const removed = new Set(questionIds);
    const attempts = await db.quiz_attempts.orderBy("startedAt").reverse().toArray();
    set({ questions: get().questions.filter((question) => !removed.has(question.id)), attempts });
  },

  deleteQuestion: async (id) => {
    await get().deleteQuestions([id]);
  },

  createAttempt: async (title, questionIds) => {
    const attempt: QuizAttempt = { id: makeId("attempt"), title, questionIds, answers: {}, startedAt: new Date().toISOString() };
    await db.quiz_attempts.add(attempt);
    set({ attempts: [attempt, ...get().attempts] });
    return attempt;
  },

  saveAnswer: async (attemptId, questionId, answer) => {
    const attempt = get().attempts.find((item) => item.id === attemptId);
    if (!attempt || attempt.finishedAt) return;
    const updated: QuizAttempt = { ...attempt, answers: { ...attempt.answers, [questionId]: answer } };
    await db.quiz_attempts.put(updated);
    set({ attempts: get().attempts.map((item) => (item.id === attemptId ? updated : item)) });
  },

  finishAttempt: async (attemptId) => {
    const attempt = get().attempts.find((item) => item.id === attemptId);
    if (!attempt) return undefined;
    const questionMap = new Map(get().questions.map((question) => [question.id, question]));
    const correctCount = attempt.questionIds.reduce((count, questionId) => {
      const question = questionMap.get(questionId);
      return count + (question && attempt.answers[questionId] === question.correctOption ? 1 : 0);
    }, 0);
    const finishedAt = new Date().toISOString();
    const durationSeconds = Math.max(0, Math.round((Date.parse(finishedAt) - Date.parse(attempt.startedAt)) / 1000));
    const updated: QuizAttempt = { ...attempt, finishedAt, durationSeconds, correctCount };
    await db.quiz_attempts.put(updated);
    set({ attempts: get().attempts.map((item) => (item.id === attemptId ? updated : item)) });
    return updated;
  },
}));

