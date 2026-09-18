import { CheckCircle2, RotateCcw, Target, XCircle } from "lucide-react";
import { QuestionContent, VisualReference, formatDuration } from "@/components/features/quiz/QuizContent";
import { QuestionNotes, scoreTone } from "@/components/features/quiz/QuizModals";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { getAttemptMetrics } from "@core/lib/quiz";
import type { QuizAttempt, QuizQuestion } from "@core/types";

interface QuizResultScreenProps {
  resultAttempt: QuizAttempt;
  resultQuestions: QuizQuestion[];
  onContinue: () => void;
  onHome: () => void;
  onSaveNotes: (questionId: string, notes: string) => Promise<void>;
}

export function QuizResultScreen({ resultAttempt, resultQuestions, onContinue, onHome, onSaveNotes }: QuizResultScreenProps) {
  const metrics = getAttemptMetrics(resultAttempt);
  const topicStats = Array.from(resultQuestions.reduce((map, question) => {
    const current = map.get(question.topic) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (resultAttempt.answers[question.id] === question.correctOption) current.correct += 1;
    map.set(question.topic, current);
    return map;
  }, new Map<string, { total: number; correct: number }>()).entries()).map(([topic, stat]) => ({ topic, ...stat, rate: Math.round((stat.correct / stat.total) * 100) }));

  return (
    <div className="h-full overflow-y-auto retro-scrollbar paper-page p-5 md:p-8"><div className="max-w-4xl mx-auto">
      <div className="flex justify-between gap-3 flex-wrap"><div><p className="text-retro-comment text-[13px]">resultado · {resultAttempt.title}</p><h1 className="text-2xl font-bold text-retro-text">Simulado corrigido</h1></div><div className="flex items-center gap-2">{metrics.unanswered > 0 && <RetroButton onClick={onContinue} icon={<Target size={15} />}>continuar simulado</RetroButton>}<RetroButton variant="primary" onClick={onHome} icon={<RotateCcw size={15} />}>voltar aos simulados</RetroButton></div></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"><RetroCard accent="green"><p className="text-retro-comment text-[13px]">aproveitamento</p><p className="text-3xl font-bold text-retro-green">{metrics.rate}%</p></RetroCard><RetroCard accent="blue"><p className="text-retro-comment text-[13px]">acertos</p><p className="text-3xl font-bold text-retro-blue">{metrics.correct}</p></RetroCard><RetroCard accent="orange"><p className="text-retro-comment text-[13px]">erros</p><p className="text-3xl font-bold text-retro-orange">{metrics.wrong}</p></RetroCard><RetroCard accent="purple"><p className="text-retro-comment text-[13px]">não respondidas</p><p className="text-3xl font-bold text-retro-purple">{metrics.unanswered}</p><p className="text-retro-comment text-[12px] mt-1">tempo: {formatDuration(resultAttempt.durationSeconds)}</p></RetroCard></div>
      {topicStats.length > 0 && <section className="mt-7"><h2 className="font-bold text-retro-text mb-3">Desempenho por tópico</h2><div className="grid sm:grid-cols-2 gap-3">{topicStats.map((stat) => <RetroCard key={stat.topic} accent={scoreTone(stat.rate)} className="!p-4"><div className="flex justify-between gap-3"><span className="text-retro-text">{stat.topic}</span><strong className="text-retro-blue">{stat.rate}%</strong></div><p className="text-retro-comment text-[12px] mt-1">{stat.correct}/{stat.total} acertos</p></RetroCard>)}</div></section>}
      <h2 className="font-bold text-retro-text mt-8 mb-3">Correção comentada</h2>
      <div className="space-y-4">{resultQuestions.map((question, index) => { const answer = resultAttempt.answers[question.id]; const correct = answer === question.correctOption; return <RetroCard key={question.id} accent={correct ? "green" : "orange"} className="!p-5"><div className="flex justify-between gap-3"><span className="font-semibold text-retro-text">{question.order ?? index + 1}. {question.topic}</span>{correct ? <span className="text-retro-green inline-flex gap-1"><CheckCircle2 size={16} /> acertou</span> : <span className="text-retro-red inline-flex gap-1"><XCircle size={16} /> errou</span>}</div><QuestionContent value={question.statement} compact /><VisualReference question={question} /><QuestionNotes question={question} onSave={(notes) => onSaveNotes(question.id, notes)} /><div className="mt-3 text-[14px]"><span className="text-retro-comment">Sua resposta: </span><strong className={correct ? "text-retro-green" : "text-retro-red"}>{answer ?? "não respondida"}</strong><span className="text-retro-comment ml-4">Gabarito: </span><strong className="text-retro-green">{question.correctOption}</strong></div>{question.explanation && <div className="mt-4 p-3 bg-retro-panelHover border-l-4 border-retro-blue text-retro-text-dim text-[14px]"><strong className="text-retro-text">Explicação: </strong>{question.explanation}</div>}{question.sourceName && <p className="mt-3 text-[12px] text-retro-comment">Fonte: {question.sourceName}{question.sourcePage ? ` · pág. ${question.sourcePage}` : ""}</p>}</RetroCard>; })}</div>
    </div></div>
  );
}
