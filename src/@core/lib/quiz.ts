import type { QuizAttempt, QuizQuestion } from "@core/types";

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
export type QuizAttemptStatus = "in-progress" | "completed";

export function getAttemptStatus(attempt: Pick<QuizAttempt, "status" | "finishedAt">): QuizAttemptStatus {
  return attempt.status ?? (attempt.finishedAt ? "completed" : "in-progress");
}

export function isAttemptCompleted(attempt: Pick<QuizAttempt, "status" | "finishedAt">) {
  return getAttemptStatus(attempt) === "completed";
}

export function getAnsweredCount(attempt: Pick<QuizAttempt, "questionIds" | "answers">) {
  return attempt.questionIds.filter((questionId) => Boolean(attempt.answers[questionId])).length;
}

export function getResumeQuestionIndex(attempt: Pick<QuizAttempt, "questionIds" | "answers" | "currentQuestionIndex">) {
  const lastIndex = Math.max(attempt.questionIds.length - 1, 0);
  if (typeof attempt.currentQuestionIndex === "number" && Number.isFinite(attempt.currentQuestionIndex)) {
    return Math.min(Math.max(Math.floor(attempt.currentQuestionIndex), 0), lastIndex);
  }
  const firstUnanswered = attempt.questionIds.findIndex((questionId) => !attempt.answers[questionId]);
  return firstUnanswered >= 0 ? firstUnanswered : 0;
}

export function calculateAttemptCorrectCount(attempt: Pick<QuizAttempt, "questionIds" | "answers">, questions: QuizQuestion[]) {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  return attempt.questionIds.reduce((count, questionId) => {
    const question = questionMap.get(questionId);
    return count + (question && attempt.answers[questionId] === question.correctOption ? 1 : 0);
  }, 0);
}

export function getAttemptMetrics(attempt: Pick<QuizAttempt, "questionIds" | "answers" | "correctCount">) {
  const total = attempt.questionIds.length;
  const answered = getAnsweredCount(attempt);
  const correct = attempt.correctCount ?? 0;
  return {
    total,
    answered,
    unanswered: Math.max(total - answered, 0),
    correct,
    wrong: Math.max(answered - correct, 0),
    rate: total ? Math.round((correct / total) * 100) : 0,
  };
}

export function getTopicStats(attempts: QuizAttempt[], questions: QuizQuestion[]) {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const stats = new Map<string, { topic: string; correct: number; total: number }>();
  attempts.filter(isAttemptCompleted).forEach((attempt) => {
    attempt.questionIds.forEach((questionId) => {
      const question = questionMap.get(questionId);
      if (!question) return;
      const current = stats.get(question.topic) ?? { topic: question.topic, correct: 0, total: 0 };
      current.total += 1;
      if (attempt.answers[questionId] === question.correctOption) current.correct += 1;
      stats.set(question.topic, current);
    });
  });
  return Array.from(stats.values())
    .map((stat) => ({ ...stat, rate: Math.round((stat.correct / stat.total) * 100) }))
    .sort((first, second) => first.rate - second.rate);
}
