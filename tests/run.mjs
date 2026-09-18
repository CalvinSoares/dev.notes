import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  configFile: "./vite.config.ts",
  server: { middlewareMode: true },
  logLevel: "error",
});

try {
  const quiz = await server.ssrLoadModule("/src/@core/lib/quiz.ts");
  const pdf = await server.ssrLoadModule("/src/@core/lib/pdf.ts");
  const question = (id, topic = "redes") => ({ id, examId: "exam-1", statement: "enunciado", options: [{ id: "A", text: "sim" }, { id: "B", text: "não" }], correctOption: "A", subject: "TI", topic, createdAt: "2026-01-01", updatedAt: "2026-01-01" });

  assert.equal(quiz.getAttemptStatus({ status: "completed" }), "completed");
  assert.equal(quiz.getAttemptStatus({ finishedAt: "2026-01-01" }), "completed");
  assert.equal(quiz.getAttemptStatus({}), "in-progress");

  const attempt = { questionIds: ["q1", "q2", "q3"], answers: { q1: "A" }, currentQuestionIndex: 2 };
  assert.equal(quiz.getResumeQuestionIndex(attempt), 2);
  assert.equal(quiz.getResumeQuestionIndex({ ...attempt, currentQuestionIndex: undefined }), 1);
  assert.deepEqual(quiz.getAttemptMetrics({ ...attempt, correctCount: 1 }), { total: 3, answered: 1, unanswered: 2, correct: 1, wrong: 0, rate: 33 });
  assert.equal(quiz.calculateAttemptCorrectCount(attempt, [question("q1"), question("q2")]), 1);

  const answerKey = pdf.parseAnswerKey("1 - A\n2 - C");
  assert.equal(answerKey.get(1), "A");
  assert.equal(answerKey.get(2), "C");
  assert.equal(pdf.detectProofVersion("PROVA 6 - ANÁLISE DE SISTEMAS"), 6);

  const parsed = pdf.parseQuestions(`1\nA questão de teste tem alternativas.\n(A) primeira alternativa\n(B) segunda alternativa\n(C) terceira alternativa\n\n2\nOutro enunciado\nA) sim\nB) não`, new Map([[1, "B"], [2, "A"]]));
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].number, 1);
  assert.equal(parsed[0].correctOption, "B");
  assert.equal(parsed[0].options.length, 3);
  assert.equal(parsed[1].options[0].id, "A");

  console.log("quiz tests: ok");
} finally {
  await server.close();
}
