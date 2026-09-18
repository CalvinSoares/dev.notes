import { CheckCircle2 } from "lucide-react";
import { QuestionContent, OptionContent, VisualReference } from "@/components/features/quiz/QuizContent";
import { QuestionNotes } from "@/components/features/quiz/QuizModals";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import type { QuestionOptionId, QuizAttempt, QuizQuestion } from "@core/types";

interface QuizTakingScreenProps {
  activeAttempt: QuizAttempt;
  currentQuestion: QuizQuestion;
  currentIndex: number;
  activeQuestionCount: number;
  onSaveAndExit: () => void;
  onFinish: () => void;
  onGoToQuestion: (index: number) => void;
  onSaveAnswer: (questionId: string, answer: QuestionOptionId) => void;
  onSaveNotes: (questionId: string, notes: string) => Promise<void>;
}

export function QuizTakingScreen({ activeAttempt, currentQuestion, currentIndex, activeQuestionCount, onSaveAndExit, onFinish, onGoToQuestion, onSaveAnswer, onSaveNotes }: QuizTakingScreenProps) {
  const answered = activeAttempt.answers[currentQuestion.id];
  return (
    <div className="h-full overflow-y-auto retro-scrollbar paper-page p-5 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between gap-3 flex-wrap items-start mb-5">
          <div><p className="text-retro-comment text-[13px]">{activeAttempt.title}</p><h1 className="text-xl font-bold text-retro-text">Questão {currentQuestion.order ?? currentIndex + 1} · {currentIndex + 1} de {activeQuestionCount}</h1></div>
          <div className="flex items-center gap-2"><RetroButton variant="ghost" onClick={onSaveAndExit}>salvar e sair</RetroButton><RetroButton variant="primary" onClick={onFinish} icon={<CheckCircle2 size={15} />}>finalizar e corrigir</RetroButton></div>
        </div>
        <div className="h-2.5 bg-retro-panel border border-retro-border rounded overflow-hidden mb-6"><div className="h-full bg-retro-blue transition-all" style={{ width: `${((currentIndex + 1) / activeQuestionCount) * 100}%` }} /></div>
        <RetroCard accent="blue" className="!p-6 md:!p-8">
          <div className="flex gap-2 flex-wrap mb-4"><RetroBadge tone="blue">{currentQuestion.subject}</RetroBadge><RetroBadge tone="default">{currentQuestion.topic}</RetroBadge>{currentQuestion.examName && <RetroBadge tone="purple">{currentQuestion.examName}</RetroBadge>}</div>
          <QuestionContent value={currentQuestion.statement} />
          <VisualReference question={currentQuestion} />
          <div className="mt-7 space-y-3">
            {currentQuestion.options.map((option) => (
              <button key={option.id} onClick={() => onSaveAnswer(currentQuestion.id, option.id)} className={`w-full text-left p-4 border-2 rounded-wobbly transition-colors ${answered === option.id ? "border-retro-blue bg-retro-blue/10" : "border-retro-border bg-retro-panel hover:bg-retro-panelHover"}`}>
                <span className="font-bold text-retro-blue mr-3">{option.id}.</span><OptionContent value={option.text} />
              </button>
            ))}
          </div>
          <QuestionNotes key={currentQuestion.id} question={currentQuestion} onSave={(notes) => onSaveNotes(currentQuestion.id, notes)} />
        </RetroCard>
        <div className="flex justify-between mt-5"><RetroButton disabled={currentIndex === 0} onClick={() => onGoToQuestion(currentIndex - 1)}>← anterior</RetroButton><RetroButton disabled={currentIndex === activeQuestionCount - 1} onClick={() => onGoToQuestion(currentIndex + 1)}>próxima →</RetroButton></div>
      </div>
    </div>
  );
}
