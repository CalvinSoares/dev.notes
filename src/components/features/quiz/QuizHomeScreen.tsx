import { BarChart3, BookOpenCheck, Clock3, FileText, ListChecks, Pencil, Plus, Target, Trash2, Upload } from "lucide-react";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { formatDuration } from "@/components/features/quiz/QuizContent";
import { scoreTone } from "@/components/features/quiz/QuizModals";
import { getAttemptMetrics } from "@core/lib/quiz";
import type { QuizAttempt, QuizExam, QuizQuestion } from "@core/types";
import type { QuizExamInput, QuizQuestionInput } from "@/store/useQuizStore";

type DeleteTarget =
  | { kind: "exam"; exam: QuizExam; questionCount: number }
  | { kind: "question"; question: QuizQuestion }
  | { kind: "legacy"; questionIds: string[] };


interface QuizHomeScreenProps {
  exams: QuizExam[];
  questions: QuizQuestion[];
  completedAttempts: QuizAttempt[];
  inProgressAttempts: QuizAttempt[];
  topicStats: Array<{ topic: string; correct: number; total: number; rate: number }>;
  overallRate: number;
  totalAnswered: number;
  examFilter: string;
  questionModalOpen: boolean;
  examModalOpen: boolean;
  exportModalOpen: boolean;
  exportExamId: string | null;
  duplicateExamId: string | null;
  editingExamId: string | null;
  editingQuestionId: string | null;
  pdfModalOpen: boolean;
  exportExam?: QuizExam;
  editingExam?: QuizExam;
  duplicateExamRecord?: QuizExam;
  editingQuestion?: QuizQuestion;
  deleteTarget: DeleteTarget | null;
  setScreen: (screen: "setup") => void;
  setQuestionModalOpen: (open: boolean) => void;
  setQuickQuestionModalOpen: (open: boolean) => void;
  setExamModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setExportExamId: (id: string | null) => void;
  setDuplicateExamId: (id: string | null) => void;
  setEditingExamId: (id: string | null) => void;
  setEditingQuestionId: (id: string | null) => void;
  setDeleteTarget: (target: DeleteTarget | null) => void;
  setPdfModalOpen: (open: boolean) => void;
  setExamFilter: (value: string) => void;
  setSubjectFilter: (value: string) => void;
  setTopicFilter: (value: string) => void;
  addNewExam: (data: QuizExamInput) => Promise<void>;
  saveExamEdits: (data: QuizExamInput) => Promise<void>;
  duplicateSelectedExam: (examId: string, title: string) => Promise<void>;
  addNewQuestion: (data: QuizQuestionInput) => Promise<void>;
  importPdfQuestions: (items: QuizQuestionInput[]) => Promise<void>;
  saveQuestionPlacement: (questionId: string, examId: string, order?: number) => Promise<void>;
  requestExamRemoval: (exam: QuizExam) => void;
  confirmDeletion: () => Promise<void>;
  continueAttempt: (attemptId: string) => Promise<void>;
  viewResult: (attemptId: string) => void;
}

export function QuizHomeScreen(props: QuizHomeScreenProps) {
  const { exams, questions, completedAttempts, inProgressAttempts, topicStats, overallRate, totalAnswered, setScreen, setQuestionModalOpen, setQuickQuestionModalOpen, setExamModalOpen, setExportModalOpen, setExportExamId, setDuplicateExamId, setEditingExamId, setEditingQuestionId, setDeleteTarget, setPdfModalOpen, setExamFilter, setSubjectFilter, setTopicFilter, requestExamRemoval, continueAttempt, viewResult } = props;  return (
    <div className="h-full overflow-y-auto retro-scrollbar paper-page p-5 md:p-8"><div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap"><div><p className="text-retro-blue text-[13px] font-semibold">BANCO DE QUESTÕES</p><h1 className="text-3xl font-bold text-retro-text">Provas e simulados</h1><p className="text-retro-comment mt-1">Crie simulados com suas provas, acompanhe erros e encontre os tópicos que pedem revisão.</p></div><div className="flex gap-2 flex-wrap"><RetroButton onClick={() => setExamModalOpen(true)} icon={<Plus size={15} />}>nova prova/vaga</RetroButton><RetroButton onClick={() => setPdfModalOpen(true)} disabled={!exams.length} icon={<Upload size={15} />}>importar PDFs</RetroButton><RetroButton disabled={!exams.length} onClick={() => setQuestionModalOpen(true)} icon={<Plus size={15} />}>nova questão</RetroButton><RetroButton disabled={!exams.length} onClick={() => setQuickQuestionModalOpen(true)} icon={<Plus size={15} />}>cadastro rápido</RetroButton><RetroButton variant="primary" disabled={!exams.length} onClick={() => setScreen("setup")} icon={<Target size={15} />}>novo simulado</RetroButton></div></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7"><RetroCard accent="blue"><ListChecks size={20} className="text-retro-blue" /><p className="text-3xl font-bold text-retro-text mt-2">{questions.length}</p><p className="text-retro-comment text-[13px]">questões cadastradas</p></RetroCard><RetroCard accent="green"><BarChart3 size={20} className="text-retro-green" /><p className="text-3xl font-bold text-retro-text mt-2">{overallRate}%</p><p className="text-retro-comment text-[13px]">acerto geral</p></RetroCard><RetroCard accent="orange"><BookOpenCheck size={20} className="text-retro-orange" /><p className="text-3xl font-bold text-retro-text mt-2">{completedAttempts.length}</p><p className="text-retro-comment text-[13px]">simulados concluídos</p></RetroCard><RetroCard accent="purple"><Clock3 size={20} className="text-retro-purple" /><p className="text-3xl font-bold text-retro-text mt-2">{totalAnswered}</p><p className="text-retro-comment text-[13px]">questões respondidas</p></RetroCard></div>
      {questions.length === 0 ? <RetroCard accent="orange" className="mt-6 text-center !py-10"><FileText size={42} className="text-retro-orange mx-auto" /><h2 className="font-bold text-retro-text text-lg mt-3">Sua biblioteca está vazia</h2><p className="text-retro-comment max-w-md mx-auto mt-1">Importe uma prova em PDF com o gabarito ou cadastre as questões manualmente. Depois, use a biblioteca para montar seus simulados.</p><div className="mt-5 flex gap-2 justify-center flex-wrap"><RetroButton onClick={() => setExamModalOpen(true)} icon={<Plus size={15} />}>nova prova/vaga</RetroButton><RetroButton onClick={() => setPdfModalOpen(true)} disabled={!exams.length} icon={<Upload size={15} />}>importar PDFs</RetroButton><RetroButton variant="primary" disabled={!exams.length} onClick={() => setQuestionModalOpen(true)} icon={<Plus size={15} />}>cadastrar questão</RetroButton><RetroButton disabled={!exams.length} onClick={() => setQuickQuestionModalOpen(true)} icon={<Plus size={15} />}>cadastro rápido</RetroButton></div></RetroCard> : <div className="grid lg:grid-cols-[1.25fr_.75fr] gap-6 mt-7"><section><div className="flex items-center justify-between gap-3 mb-3"><h2 className="font-bold text-retro-text">Provas e vagas</h2><span className="text-[12px] text-retro-comment">{exams.length} agrupador(es)</span></div><div className="space-y-3">{exams.map((exam) => { const examQuestions = questions.filter((question) => question.examId === exam.id); return <RetroCard key={exam.id} accent="blue" className="!p-4"><div className="flex justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-retro-text">{exam.title}</p><p className="text-retro-comment text-[13px] mt-1">{exam.contestName} · {exam.vacancy}{exam.proofVersion ? ` · ${exam.proofVersion}` : ""}</p><div className="flex gap-2 flex-wrap mt-2"><RetroBadge tone="blue">{examQuestions.length} questões</RetroBadge>{exam.board && <RetroBadge tone="default">{exam.board}</RetroBadge>}</div></div><div className="flex gap-1 shrink-0"><button onClick={() => { setExportExamId(exam.id); setExportModalOpen(true); }} className="px-2 text-retro-blue hover:bg-retro-blue/10 rounded" title="Exportar prova">PDF</button><button onClick={() => setEditingExamId(exam.id)} className="p-2 text-retro-comment hover:text-retro-blue rounded" title="Editar prova/vaga" aria-label="Editar prova/vaga"><Pencil size={15} /></button><button onClick={() => setDuplicateExamId(exam.id)} className="px-2 text-retro-comment hover:text-retro-blue rounded" title="Duplicar prova">duplicar</button><button onClick={() => requestExamRemoval(exam)} className="p-2 text-retro-orange hover:bg-retro-orange/10 rounded" title="Excluir prova/vaga" aria-label="Excluir prova/vaga"><Trash2 size={15} /></button></div></div><div className="flex justify-end gap-2 mt-3"><RetroButton onClick={() => { setExamFilter(exam.id); setSubjectFilter("all"); setTopicFilter("all"); setScreen("setup"); }} icon={<Target size={14} />}>montar simulado</RetroButton><RetroButton onClick={() => { setExamFilter(exam.id); setQuestionModalOpen(true); }} icon={<Plus size={14} />}>cadastrar questão</RetroButton></div>{examQuestions.length > 0 && <details className="mt-3 border-t border-retro-border pt-3"><summary className="cursor-pointer text-[12px] font-semibold text-retro-blue">ver e editar questões</summary><div className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">{examQuestions.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).map((question) => <button key={question.id} type="button" onClick={() => setEditingQuestionId(question.id)} className="flex w-full items-start gap-2 rounded border border-retro-border bg-retro-panelHover p-2 text-left hover:border-retro-blue"><span className="shrink-0 text-[11px] font-semibold text-retro-blue">#{question.order ?? "—"}</span><span className="min-w-0"><span className="block truncate text-[12px] font-semibold text-retro-text">{question.topic}</span><span className="mt-0.5 block line-clamp-2 text-[11px] text-retro-comment">{question.statement}</span></span><Pencil size={13} className="ml-auto mt-0.5 shrink-0 text-retro-comment" /></button>)}</div></details>}</RetroCard>; })}</div>{questions.some((question) => !question.examId) && (() => { const legacyQuestions = questions.filter((question) => !question.examId); return <RetroCard accent="orange" className="!p-4 mt-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-retro-text">Questões antigas sem prova</p><p className="text-[13px] text-retro-comment mt-1">Vincule cada questão a uma prova/vaga para ela entrar nos simulados e na exportação.</p></div><div className="flex items-center gap-2"><RetroBadge tone="default">{legacyQuestions.length}</RetroBadge><button onClick={() => setDeleteTarget({ kind: "legacy", questionIds: legacyQuestions.map((question) => question.id) })} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] text-retro-orange hover:bg-retro-orange/10" title="Excluir todas as questões antigas"><Trash2 size={13} /> excluir todas</button></div></div><div className="mt-3 space-y-2">{legacyQuestions.slice(0, 20).map((question) => <div key={question.id} className="flex items-start justify-between gap-3 rounded-wobbly border border-retro-border bg-retro-panelHover p-3"><div className="min-w-0"><p className="text-[12px] text-retro-orange font-semibold">Questão {question.order ?? "—"} · {question.topic}</p><p className="text-[13px] text-retro-text line-clamp-2 mt-1">{question.statement}</p></div><div className="flex gap-1 shrink-0"><button onClick={() => setEditingQuestionId(question.id)} className="p-2 text-retro-blue hover:bg-retro-blue/10 rounded" title="Editar e vincular questão" aria-label="Editar e vincular questão"><Pencil size={15} /></button><button onClick={() => setDeleteTarget({ kind: "question", question })} className="p-2 text-retro-orange hover:bg-retro-orange/10 rounded" title="Excluir questão" aria-label="Excluir questão"><Trash2 size={15} /></button></div></div>)}</div>{legacyQuestions.length > 20 && <p className="text-[12px] text-retro-comment mt-3">Mostrando 20 de {legacyQuestions.length}. Vincule ou exclua algumas para continuar.</p>}</RetroCard>; })()}</section><section><h2 className="font-bold text-retro-text mb-3">Tópicos que merecem revisão</h2>{topicStats.length ? <div className="space-y-3">{topicStats.slice(0, 5).map((stat) => <RetroCard key={stat.topic} accent={scoreTone(stat.rate)} className="!p-4"><div className="flex justify-between gap-3"><span className="text-retro-text font-medium">{stat.topic}</span><strong className={stat.rate >= 70 ? "text-retro-green" : "text-retro-orange"}>{stat.rate}%</strong></div><div className="mt-2 h-2 bg-retro-panelHover border border-retro-border rounded overflow-hidden"><div className={stat.rate >= 70 ? "h-full bg-retro-green" : "h-full bg-retro-orange"} style={{ width: `${stat.rate}%` }} /></div><p className="text-retro-comment text-[12px] mt-1">{stat.correct}/{stat.total} acertos</p></RetroCard>)}</div> : <RetroCard accent="purple" className="!p-5"><p className="text-retro-comment text-[14px]">Finalize seu primeiro simulado para ver o desempenho por tópico.</p></RetroCard>}</section></div>}
      {inProgressAttempts.length > 0 && <section className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-bold text-retro-text">Simulados em andamento</h2>
            <p className="text-[13px] text-retro-comment mt-1">Suas respostas ficam salvas automaticamente para você continuar depois.</p>
          </div>
          <RetroBadge tone="orange">{inProgressAttempts.length} pendente{inProgressAttempts.length === 1 ? "" : "s"}</RetroBadge>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {inProgressAttempts.map((attempt) => {
            const answered = getAttemptMetrics(attempt).answered;
            const total = attempt.questionIds.length;
            const progress = total ? Math.round((answered / total) * 100) : 0;
            return (
              <RetroCard key={attempt.id} accent="orange" className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-retro-text truncate">{attempt.title}</p>
                    <p className="text-retro-comment text-[13px] mt-1">{answered} de {total} questões respondidas · {progress}%</p>
                  </div>
                  <RetroButton variant="primary" onClick={() => void continueAttempt(attempt.id)} icon={<Target size={14} />}>retomar</RetroButton>
                </div>
                <div className="mt-3 h-2 rounded overflow-hidden border border-retro-border bg-retro-panelHover">
                  <div className="h-full bg-retro-orange transition-all" style={{ width: progress + "%" }} />
                </div>
              </RetroCard>
            );
          })}
        </div>
      </section>}
      {completedAttempts.length > 0 && <section className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold text-retro-text">Histórico recente</h2>
          <span className="text-[12px] text-retro-comment">{completedAttempts.length} concluído{completedAttempts.length === 1 ? "" : "s"}</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {completedAttempts.slice(0, 4).map((attempt) => {
            const total = attempt.questionIds.length;
            const answered = getAttemptMetrics(attempt).answered;
            const unanswered = getAttemptMetrics(attempt).unanswered;
            const rate = total ? Math.round(((attempt.correctCount ?? 0) / total) * 100) : 0;
            return (
              <RetroCard key={attempt.id} accent={scoreTone(rate)} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-retro-text truncate">{attempt.title}</p>
                    <p className="text-retro-comment text-[13px] mt-1">{answered} de {total} questões respondidas · {formatDuration(attempt.durationSeconds)}</p>
                  </div>
                  <strong className="text-retro-blue text-xl">{rate}%</strong>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  {unanswered > 0 && <RetroButton onClick={() => void continueAttempt(attempt.id)} icon={<Target size={14} />}>continuar</RetroButton>}
                  <RetroButton variant="ghost" onClick={() => viewResult(attempt.id)}>ver resultado</RetroButton>
                </div>
              </RetroCard>
            );
          })}
        </div>
      </section>}
      </div></div>
  );
}


