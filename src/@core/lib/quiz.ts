import type { QuizQuestion } from "@core/types";

export function sortQuizQuestions(questions: QuizQuestion[]) {
  return [...questions].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
  });
}

export function getQuizQuestionNumber(question: QuizQuestion, questions: QuizQuestion[]) {
  if (question.order !== undefined) return question.order;
  const siblings = sortQuizQuestions(questions.filter((item) => item.examId === question.examId));
  return Math.max(1, siblings.findIndex((item) => item.id === question.id) + 1);
}
