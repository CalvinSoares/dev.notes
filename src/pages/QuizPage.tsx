import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CircleHelp, Pencil } from "lucide-react";
import { RetroModal } from "@/components/ui/RetroModal";
import { useQuizStore } from "@/store/useQuizStore";
import { useAppStore } from "@/store/useAppStore";
import { DeleteConfirmModal, DuplicateExamModal, ExamForm, ExportModal, PdfImportModal, QuestionForm, QuickQuestionForm } from "@/components/features/quiz/QuizModals";

import { QuizTakingScreen } from "@/components/features/quiz/QuizTakingScreen";
import { QuizResultScreen } from "@/components/features/quiz/QuizResultScreen";
import { QuizSetupScreen } from "@/components/features/quiz/QuizSetupScreen";
import { QuizHomeScreen } from "@/components/features/quiz/QuizHomeScreen";
import { getAttemptMetrics, getAttemptStatus, getResumeQuestionIndex, getTopicStats, isAttemptCompleted } from "@core/lib/quiz";
import type { QuizExam, QuizQuestion } from "@core/types";
import type { QuizExamInput, QuizQuestionInput } from "@/store/useQuizStore";

type Screen = "home" | "setup" | "taking" | "result";

type DeleteTarget =
  | { kind: "exam"; exam: QuizExam; questionCount: number }
  | { kind: "question"; question: QuizQuestion }
  | { kind: "legacy"; questionIds: string[] };

export function QuizPage() {
  const exams = useQuizStore((state) => state.exams);
  const questions = useQuizStore((state) => state.questions);
  const attempts = useQuizStore((state) => state.attempts);
  const addExam = useQuizStore((state) => state.addExam);
  const updateExam = useQuizStore((state) => state.updateExam);
  const deleteExam = useQuizStore((state) => state.deleteExam);
  const duplicateExam = useQuizStore((state) => state.duplicateExam);
  const deleteQuestion = useQuizStore((state) => state.deleteQuestion);
  const deleteQuestions = useQuizStore((state) => state.deleteQuestions);
  const updateQuestion = useQuizStore((state) => state.updateQuestion);
  const addQuestion = useQuizStore((state) => state.addQuestion);
  const quizQuestionFocusId = useAppStore((state) => state.quizQuestionFocusId);
  const clearQuizQuestionFocus = useAppStore((state) => state.clearQuizQuestionFocus);
  const quizStudyQuestionIds = useAppStore((state) => state.quizStudyQuestionIds);
  const clearQuizStudy = useAppStore((state) => state.clearQuizStudy);

  const createAttempt = useQuizStore((state) => state.createAttempt);
  const saveAnswer = useQuizStore((state) => state.saveAnswer);
  const finishAttempt = useQuizStore((state) => state.finishAttempt);
  const resumeAttempt = useQuizStore((state) => state.resumeAttempt);
  const saveAttemptProgress = useQuizStore((state) => state.saveAttemptProgress);

  const [screen, setScreen] = useState<Screen>("home");
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [quickQuestionModalOpen, setQuickQuestionModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportExamId, setExportExamId] = useState<string | null>(null);
  const [duplicateExamId, setDuplicateExamId] = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [title, setTitle] = useState("Simulado personalizado");
  const [examFilter, setExamFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [amount, setAmount] = useState(10);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultAttemptId, setResultAttemptId] = useState<string | null>(null);
  const [questionPreviewId, setQuestionPreviewId] = useState<string | null>(null);

  useEffect(() => {
    if (!quizQuestionFocusId || !questions.some((question) => question.id === quizQuestionFocusId)) return;
    setQuestionPreviewId(quizQuestionFocusId);
    clearQuizQuestionFocus();
  }, [clearQuizQuestionFocus, questions, quizQuestionFocusId]);

  useEffect(() => {
    if (!quizStudyQuestionIds?.length) return;
    const selectedIds = quizStudyQuestionIds.filter((id) => questions.some((question) => question.id === id));
    clearQuizStudy();
    if (!selectedIds.length) return;
    void (async () => {
      const attempt = await createAttempt("Estudo da trilha", selectedIds);
      setActiveAttemptId(attempt.id);
      setCurrentIndex(0);
      setScreen("taking");
    })();
  }, [clearQuizStudy, createAttempt, questions, quizStudyQuestionIds]);

  const questionById = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const scopedQuestions = useMemo(() => questions.filter((question) => question.examId && (examFilter === "all" || question.examId === examFilter)), [questions, examFilter]);
  const subjects = useMemo(() => Array.from(new Set(scopedQuestions.map((question) => question.subject))).sort(), [scopedQuestions]);
  const topics = useMemo(() => Array.from(new Set(scopedQuestions.filter((question) => subjectFilter === "all" || question.subject === subjectFilter).map((question) => question.topic))).sort(), [scopedQuestions, subjectFilter]);
  const candidates = useMemo(() => scopedQuestions.filter((question) => (subjectFilter === "all" || question.subject === subjectFilter) && (topicFilter === "all" || question.topic === topicFilter)), [scopedQuestions, subjectFilter, topicFilter]);
  const completedAttempts = useMemo(() => attempts.filter(isAttemptCompleted), [attempts]);
  const inProgressAttempts = useMemo(() => attempts.filter((attempt) => getAttemptStatus(attempt) === "in-progress"), [attempts]);
  const totalQuestions = completedAttempts.reduce((total, attempt) => total + attempt.questionIds.length, 0);
  const totalAnswered = completedAttempts.reduce((total, attempt) => total + getAttemptMetrics(attempt).answered, 0);
  const totalCorrect = completedAttempts.reduce((total, attempt) => total + (attempt.correctCount ?? 0), 0);
  const overallRate = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const activeAttempt = attempts.find((attempt) => attempt.id === activeAttemptId);
  const resultAttempt = attempts.find((attempt) => attempt.id === resultAttemptId);
  const activeQuestions = activeAttempt?.questionIds.map((id) => questionById.get(id)).filter((question): question is QuizQuestion => Boolean(question)) ?? [];
  const currentQuestion = activeQuestions[currentIndex];
  const exportExam = exams.find((exam) => exam.id === exportExamId);
  const editingQuestion = questions.find((question) => question.id === editingQuestionId);
  const duplicateExamRecord = exams.find((exam) => exam.id === duplicateExamId);
  const editingExam = exams.find((exam) => exam.id === editingExamId);
  const questionPreview = questions.find((question) => question.id === questionPreviewId) ?? null;

  const topicStats = useMemo(() => getTopicStats(completedAttempts, questions), [completedAttempts, questions]);

  const startSimulation = async () => {
    if (!candidates.length) return;
    const selected = [...candidates].sort(() => Math.random() - 0.5).slice(0, Math.min(amount, candidates.length));
    const attempt = await createAttempt(title.trim() || "Simulado personalizado", selected.map((question) => question.id));
    setActiveAttemptId(attempt.id);
    setCurrentIndex(0);
    setScreen("taking");
  };

  const finishCurrent = async () => {
    if (!activeAttempt) return;
    const finished = await finishAttempt(activeAttempt.id);
    if (!finished) return;
    setResultAttemptId(finished.id);
    setScreen("result");
  };

  const continueAttempt = async (attemptId: string) => {
    let attempt = attempts.find((item) => item.id === attemptId);
    if (!attempt) return;
    if (getAttemptStatus(attempt) === "completed") {
      const reopened = await resumeAttempt(attempt.id);
      if (!reopened) return;
      attempt = reopened;
    }
    setActiveAttemptId(attempt.id);
    setResultAttemptId(null);
    setCurrentIndex(getResumeQuestionIndex(attempt));
    setScreen("taking");
  };

  const goToQuestion = (index: number) => {
    if (!activeAttempt) return;
    const nextIndex = Math.min(Math.max(index, 0), Math.max(activeQuestions.length - 1, 0));
    setCurrentIndex(nextIndex);
    void saveAttemptProgress(activeAttempt.id, nextIndex);
  };

  const saveAndExit = async () => {
    if (activeAttempt) await saveAttemptProgress(activeAttempt.id, currentIndex);
    setActiveAttemptId(null);
    setCurrentIndex(0);
    setScreen("home");
  };


  const viewResult = (attemptId: string) => {
    setResultAttemptId(attemptId);
    setActiveAttemptId(null);
    setScreen("result");
  };
  const addNewExam = async (data: QuizExamInput) => {
    const exam = await addExam(data);
    setExamModalOpen(false);
    setExamFilter(exam.id);
  };
  const saveExamEdits = async (data: QuizExamInput) => {
    if (!editingExamId) return;
    await updateExam(editingExamId, data);
    setEditingExamId(null);
  };
  const duplicateSelectedExam = async (examId: string, title: string) => {
    const duplicate = await duplicateExam(examId, title);
    if (duplicate) {
      setDuplicateExamId(null);
      setExamFilter(duplicate.id);
    }
  };
  const requestExamRemoval = (exam: QuizExam) => {
    const questionCount = questions.filter((question) => question.examId === exam.id).length;
    setDeleteTarget({ kind: "exam", exam, questionCount });
  };
  const confirmDeletion = async () => {
    const target = deleteTarget;
    if (!target) return;
    if (target.kind === "exam") {
      await deleteExam(target.exam.id);
      if (examFilter === target.exam.id) setExamFilter("all");
      if (exportExamId === target.exam.id) {
        setExportExamId(null);
        setExportModalOpen(false);
      }
      return;
    }
    if (target.kind === "question") {
      await deleteQuestion(target.question.id);
      return;
    }
    await deleteQuestions(target.questionIds);
  };
  const saveQuestionPlacement = async (questionId: string, examId: string, order?: number) => {
    const current = questions.find((question) => question.id === questionId);
    await updateQuestion(questionId, { examId, order: order ?? current?.order, examName: exams.find((exam) => exam.id === examId)?.title });
    setEditingQuestionId(null);
  };
  const addNewQuestion = async (data: QuizQuestionInput) => {
    await addQuestion(data);
    setQuestionModalOpen(false);
  };
  const saveQuestionEdits = async (data: QuizQuestionInput) => {
    if (!editingQuestionId) return;
    await updateQuestion(editingQuestionId, data);
    setEditingQuestionId(null);
  };
  const addQuickQuestion = async (data: QuizQuestionInput) => {
    await addQuestion(data);
    setQuickQuestionModalOpen(false);
  };
  const importPdfQuestions = async (items: QuizQuestionInput[]) => {
    for (const item of items) await addQuestion(item);
    setPdfModalOpen(false);
  };

  if (screen === "setup") {
    return <QuizSetupScreen
      exams={exams}
      subjects={subjects}
      topics={topics}
      candidatesCount={candidates.length}
      title={title}
      examFilter={examFilter}
      subjectFilter={subjectFilter}
      topicFilter={topicFilter}
      amount={amount}
      questionModalOpen={questionModalOpen}
      onBack={() => setScreen("home")}
      onTitleChange={setTitle}
      onExamFilterChange={(value) => { setExamFilter(value); setSubjectFilter("all"); setTopicFilter("all"); }}
      onSubjectFilterChange={(value) => { setSubjectFilter(value); setTopicFilter("all"); }}
      onTopicFilterChange={setTopicFilter}
      onAmountChange={setAmount}
      onOpenQuestion={() => setQuestionModalOpen(true)}
      onCloseQuestion={() => setQuestionModalOpen(false)}
      onSubmitQuestion={addNewQuestion}
      onStart={() => void startSimulation()}
    />;
  }
  if (screen === "taking" && activeAttempt && currentQuestion) {
    return <QuizTakingScreen
      activeAttempt={activeAttempt}
      currentQuestion={currentQuestion}
      currentIndex={currentIndex}
      activeQuestionCount={activeQuestions.length}
      onSaveAndExit={() => void saveAndExit()}
      onFinish={() => void finishCurrent()}
      onGoToQuestion={goToQuestion}
      onSaveAnswer={(questionId, answer) => void saveAnswer(activeAttempt.id, questionId, answer)}
      onSaveNotes={(questionId, notes) => updateQuestion(questionId, { notes })}
    />;
  }
  if (screen === "result" && resultAttempt) {
    const resultQuestions = resultAttempt.questionIds.map((id) => questionById.get(id)).filter((question): question is QuizQuestion => Boolean(question));
    return <QuizResultScreen
      resultAttempt={resultAttempt}
      resultQuestions={resultQuestions}
      onContinue={() => void continueAttempt(resultAttempt.id)}
      onHome={() => setScreen("home")}
      onSaveNotes={(questionId, notes) => updateQuestion(questionId, { notes })}
    />;
  }
  return <>
    <QuizHomeScreen
      exams={exams}
      questions={questions}
      completedAttempts={completedAttempts}
      inProgressAttempts={inProgressAttempts}
      topicStats={topicStats}
      overallRate={overallRate}
      totalAnswered={totalAnswered}
      examFilter={examFilter}
      questionModalOpen={questionModalOpen}
      examModalOpen={examModalOpen}
      exportModalOpen={exportModalOpen}
      exportExamId={exportExamId}
      duplicateExamId={duplicateExamId}
      editingExamId={editingExamId}
      editingQuestionId={editingQuestionId}
      pdfModalOpen={pdfModalOpen}
      exportExam={exportExam}
      editingExam={editingExam}
      duplicateExamRecord={duplicateExamRecord}
      editingQuestion={editingQuestion}
      deleteTarget={deleteTarget}
      setScreen={setScreen}
      setQuestionModalOpen={setQuestionModalOpen}
      setQuickQuestionModalOpen={setQuickQuestionModalOpen}
      setExamModalOpen={setExamModalOpen}
      setExportModalOpen={setExportModalOpen}
      setExportExamId={setExportExamId}
      setDuplicateExamId={setDuplicateExamId}
      setEditingExamId={setEditingExamId}
      setEditingQuestionId={setEditingQuestionId}
      setDeleteTarget={setDeleteTarget}
      setPdfModalOpen={setPdfModalOpen}
      setExamFilter={setExamFilter}
      setSubjectFilter={setSubjectFilter}
      setTopicFilter={setTopicFilter}
      addNewExam={addNewExam}
      saveExamEdits={saveExamEdits}
      duplicateSelectedExam={duplicateSelectedExam}
      addNewQuestion={addNewQuestion}
      importPdfQuestions={importPdfQuestions}
      saveQuestionPlacement={saveQuestionPlacement}
      requestExamRemoval={requestExamRemoval}
      confirmDeletion={confirmDeletion}
      continueAttempt={continueAttempt}
      viewResult={viewResult}
    />      <RetroModal open={Boolean(questionPreview)} onClose={() => setQuestionPreviewId(null)} title={questionPreview ? "Questão " + (questionPreview.order ?? "") : "Visualizar questão"} subtitle={questionPreview?.topic || questionPreview?.subject} size="lg" icon={<CircleHelp size={16} />}>
        {questionPreview && <div className="p-5 space-y-4"><p className="text-[15px] leading-relaxed text-retro-text whitespace-pre-wrap">{questionPreview.statement}</p><div className="space-y-2">{questionPreview.options.map((option) => <div key={option.id} className="rounded-lg border border-retro-border p-3 text-[13px] text-retro-text"><strong className="text-retro-blue mr-2">{option.id}.</strong>{option.text}</div>)}</div>{questionPreview.explanation && <div className="border-t border-retro-border/60 pt-4 text-[13px] text-retro-text-dim whitespace-pre-wrap"><strong className="text-retro-text">Explicação:</strong>{" " + questionPreview.explanation}</div>}</div>}

      </RetroModal><RetroModal open={questionModalOpen} onClose={() => setQuestionModalOpen(false)} title="Nova questão" subtitle="Cadastre uma questão e seu gabarito para usá-la nos simulados." size="xl" icon={<CircleHelp size={16} />}><QuestionForm key="new-question" exams={exams} defaultExamId={examFilter === "all" ? undefined : examFilter} onSubmit={addNewQuestion} onCancel={() => setQuestionModalOpen(false)} /></RetroModal>
      <RetroModal open={quickQuestionModalOpen} onClose={() => setQuickQuestionModalOpen(false)} title="Cadastro rápido de questão" subtitle="Cole o enunciado com as alternativas e revise a prévia antes de cadastrar." size="xl" icon={<CircleHelp size={16} />}><QuickQuestionForm exams={exams} defaultExamId={examFilter === "all" ? undefined : examFilter} onSubmit={addQuickQuestion} onCancel={() => setQuickQuestionModalOpen(false)} /></RetroModal>
      <RetroModal open={examModalOpen} onClose={() => setExamModalOpen(false)} title="Nova prova/vaga" subtitle="Crie o pai que receberá as questões." size="lg" icon={<BookOpenCheck size={16} />}><ExamForm onSubmit={addNewExam} onCancel={() => setExamModalOpen(false)} /></RetroModal>
      <RetroModal open={Boolean(editingExam)} onClose={() => setEditingExamId(null)} title="Editar prova/vaga" subtitle="Atualize os dados do agrupador sem mexer nas questões." size="lg" icon={<Pencil size={16} />}><ExamForm key={editingExamId ?? "none"} exam={editingExam} onSubmit={saveExamEdits} onCancel={() => setEditingExamId(null)} /></RetroModal>
      <DuplicateExamModal key={duplicateExamId ?? "none"} open={Boolean(duplicateExamRecord)} exam={duplicateExamRecord} onClose={() => setDuplicateExamId(null)} onSave={duplicateSelectedExam} />
      <PdfImportModal exams={exams} open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} onImport={importPdfQuestions} />
      <ExportModal open={exportModalOpen} exam={exportExam} questions={questions.filter((question) => question.examId === exportExamId).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))} onClose={() => setExportModalOpen(false)} />
      <RetroModal open={Boolean(editingQuestion)} onClose={() => setEditingQuestionId(null)} title="Editar questão" subtitle="Atualize o enunciado, alternativas, gabarito, contexto ou vínculo da questão." size="xl" icon={<Pencil size={16} />}><QuestionForm key={editingQuestionId ?? "none"} question={editingQuestion} exams={exams} onSubmit={saveQuestionEdits} onCancel={() => setEditingQuestionId(null)} /></RetroModal>
      <DeleteConfirmModal key={deleteTarget ? `${deleteTarget.kind}-${deleteTarget.kind === "exam" ? deleteTarget.exam.id : deleteTarget.kind === "question" ? deleteTarget.question.id : deleteTarget.questionIds.join("-")}` : "none"} open={Boolean(deleteTarget)} title={deleteTarget?.kind === "exam" ? "Excluir prova/vaga" : deleteTarget?.kind === "legacy" ? "Excluir questões antigas" : "Excluir questão"} message={deleteTarget?.kind === "exam" ? `Excluir "${deleteTarget.exam.title}"?` : deleteTarget?.kind === "legacy" ? "Excluir todas as questões antigas sem prova?" : "Excluir esta questão antiga?"} detail={deleteTarget?.kind === "exam" ? `${deleteTarget.questionCount} questão(ões) vinculada(s) também serão removidas. Essa ação não pode ser desfeita.` : deleteTarget?.kind === "legacy" ? `${deleteTarget.questionIds.length} questão(ões) serão removidas. Essa ação não pode ser desfeita.` : "A questão será removida da biblioteca. Essa ação não pode ser desfeita."} onClose={() => setDeleteTarget(null)} onConfirm={confirmDeletion} />

  </>;

}
