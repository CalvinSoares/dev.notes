import { CircleHelp, Plus, Target } from "lucide-react";
import { QuestionForm } from "@/components/features/quiz/QuizModals";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroModal } from "@/components/ui/RetroModal";
import type { QuizExam } from "@core/types";
import type { QuizQuestionInput } from "@/store/useQuizStore";

interface QuizSetupScreenProps {
  exams: QuizExam[];
  subjects: string[];
  topics: string[];
  candidatesCount: number;
  title: string;
  examFilter: string;
  subjectFilter: string;
  topicFilter: string;
  amount: number;
  questionModalOpen: boolean;
  onBack: () => void;
  onTitleChange: (value: string) => void;
  onExamFilterChange: (value: string) => void;
  onSubjectFilterChange: (value: string) => void;
  onTopicFilterChange: (value: string) => void;
  onAmountChange: (value: number) => void;
  onOpenQuestion: () => void;
  onCloseQuestion: () => void;
  onSubmitQuestion: (data: QuizQuestionInput) => Promise<void>;
  onStart: () => void;
}

export function QuizSetupScreen({ exams, subjects, topics, candidatesCount, title, examFilter, subjectFilter, topicFilter, amount, questionModalOpen, onBack, onTitleChange, onExamFilterChange, onSubjectFilterChange, onTopicFilterChange, onAmountChange, onOpenQuestion, onCloseQuestion, onSubmitQuestion, onStart }: QuizSetupScreenProps) {
  return (
    <div className="h-full overflow-y-auto retro-scrollbar paper-page p-5 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-retro-blue text-[14px] hover:underline mb-4">← voltar para simulados</button>
        <h1 className="text-2xl font-bold text-retro-text">Montar um simulado</h1>
        <p className="text-retro-comment mt-1">Escolha o recorte. As questões serão sorteadas da sua biblioteca.</p>
        <RetroCard accent="blue" className="mt-6 space-y-5">
          <label className="block text-[14px] text-retro-text-dim">Nome do simulado
            <input value={title} onChange={(event) => onTitleChange(event.target.value)} className="retro-input mt-1" />
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-[14px] text-retro-text-dim">Prova/vaga
              <select value={examFilter} onChange={(event) => onExamFilterChange(event.target.value)} className="retro-input mt-1"><option value="all">todas as provas</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select>
            </label>
            <label className="text-[14px] text-retro-text-dim">Disciplina
              <select value={subjectFilter} onChange={(event) => onSubjectFilterChange(event.target.value)} className="retro-input mt-1"><option value="all">todas as disciplinas</option>{subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select>
            </label>
            <label className="text-[14px] text-retro-text-dim">Tópico
              <select value={topicFilter} onChange={(event) => onTopicFilterChange(event.target.value)} className="retro-input mt-1"><option value="all">todos os tópicos</option>{topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select>
            </label>
          </div>
          <label className="block text-[14px] text-retro-text-dim">Quantidade de questões
            <input min="1" max={Math.max(candidatesCount, 1)} type="number" value={amount} onChange={(event) => onAmountChange(Math.max(1, Number(event.target.value)))} className="retro-input mt-1 max-w-xs" />
          </label>
          <div className="p-4 border-2 border-dashed border-retro-border rounded-wobbly bg-retro-panelHover text-[14px] text-retro-text-dim"><strong className="text-retro-text">{candidatesCount} questões disponíveis</strong> para esse filtro. O simulado terá {Math.min(amount, candidatesCount)} questão(ões).</div>
          <div className="flex gap-2 flex-wrap justify-end"><RetroButton onClick={onOpenQuestion} icon={<Plus size={15} />}>cadastrar questão</RetroButton><RetroButton variant="primary" disabled={!candidatesCount} onClick={onStart} icon={<Target size={15} />}>começar simulado</RetroButton></div>
        </RetroCard>
      </div>
      <RetroModal open={questionModalOpen} onClose={onCloseQuestion} title="Nova questão" subtitle="Cadastre uma questão e seu gabarito para usá-la nos simulados." size="xl" icon={<CircleHelp size={16} />}><QuestionForm exams={exams} defaultExamId={examFilter === "all" ? undefined : examFilter} onSubmit={onSubmitQuestion} onCancel={onCloseQuestion} /></RetroModal>
    </div>
  );
}
