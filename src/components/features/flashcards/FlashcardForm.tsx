import { useEffect, useMemo, useState } from "react";
import type { Flashcard, QuizQuestion } from "@core/types";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { DiagramLinkPicker } from "@/components/features/diagrams/DiagramLinkPicker";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroModal } from "@/components/ui/RetroModal";
import { getQuizQuestionNumber, sortQuizQuestions } from "@core/lib/quiz";
import { FileQuestion, Link2, Search, Unlink2 } from "lucide-react";

const LANGUAGE_OPTIONS = [
  "typescript",
  "javascript",
  "python",
  "java",
  "cpp",
  "csharp",
  "go",
  "rust",
  "ruby",
  "php",
  "sql",
  "bash",
  "markdown",
  "html",
  "css",
];

interface FlashcardFormProps {
  formId?: string;
  initial?: Partial<Flashcard>;
  questions?: QuizQuestion[];
  onSubmit: (value: {
    question: string;
    answer: string;
    quizQuestionId?: string;
    codeSnippet?: string;
    language?: string;
    tags?: string[];
    diagramIds?: string[];
  }) => void;
}

export function FlashcardForm({
  formId = "flashcard-form",
  initial,
  questions = [],
  onSubmit,
}: FlashcardFormProps) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [codeSnippet, setCodeSnippet] = useState(initial?.codeSnippet ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "typescript");
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [diagramIds, setDiagramIds] = useState<string[]>(initial?.diagramIds ?? []);
  const [quizQuestionId, setQuizQuestionId] = useState(initial?.quizQuestionId);

  useEffect(() => {
    setQuestion(initial?.question ?? "");
    setAnswer(initial?.answer ?? "");
    setCodeSnippet(initial?.codeSnippet ?? "");
    setLanguage(initial?.language ?? "typescript");
    setTagsInput((initial?.tags ?? []).join(", "));
    setDiagramIds(initial?.diagramIds ?? []);
    setQuizQuestionId(initial?.quizQuestionId);
  }, [initial]);

  const valid = question.trim().length > 0 && answer.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      question: question.trim(),
      answer: answer.trim(),
      quizQuestionId: quizQuestionId || undefined,
      codeSnippet: codeSnippet.trim() || undefined,
      language: codeSnippet.trim() ? language : undefined,
      tags: tags.length ? tags : undefined,
      diagramIds,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div className="p-5 space-y-4">
        <Field label="Pergunta" required>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="ex: Qual a diferença entre call(), apply() e bind()?"
            rows={4}
            className="retro-input w-full resize-y"
          />
        </Field>

        <Field label="Resposta" required>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="explicação textual da resposta..."
            rows={6}
            className="retro-input w-full resize-y"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Linguagem do código">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="retro-input w-full"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tópicos" hint="Separe os tópicos por vírgula.">
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="JavaScript, fundamentos, entrevista"
              className="retro-input w-full"
            />
          </Field>
        </div>

        <Field label="Snippet de código (opcional)">
          <div className="border-2 border-retro-border h-[240px]">
            <CodeEditor
              value={codeSnippet}
              language={language as any}
              readOnly={false}
              onChange={setCodeSnippet}
              filename={`snippet.${language}`}
            />
          </div>
        </Field>

        <DiagramLinkPicker selectedIds={diagramIds} onChange={setDiagramIds} />

        <QuestionLinkPicker
          questions={questions}
          selectedId={quizQuestionId}
          onChange={setQuizQuestionId}
        />

        <div className="text-[11.5px] text-retro-comment italic pt-1 border-t border-dashed border-retro-border/60">
          * pergunta e resposta são obrigatórios
        </div>

        <button type="submit" className="hidden" aria-hidden />
      </div>
    </form>
  );
}

function QuestionLinkPicker({
  questions,
  selectedId,
  onChange,
}: {
  questions: QuizQuestion[];
  selectedId?: string;
  onChange: (id?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = questions.find((question) => question.id === selectedId);
  const visibleQuestions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return sortQuizQuestions(questions).filter((question) =>
      !query ||
      [question.statement, question.subject, question.topic, question.examName]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(query)),
    );
  }, [questions, search]);

  return (
    <>
      <section className="rounded-lg border border-retro-border/60 bg-retro-bgDark/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[13px] font-semibold text-retro-text">
              <FileQuestion size={15} className="text-retro-blue" aria-hidden />
              Questão de prova vinculada
              <span className="font-normal text-retro-comment">(opcional)</span>
            </h3>
            <p className="mt-1 text-[12px] text-retro-comment">
              Abra esta questão como contexto durante a revisão do flashcard.
            </p>
          </div>
          {selected && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[12px] text-retro-comment hover:text-retro-red"
              onClick={() => onChange(undefined)}
            >
              <Unlink2 size={13} aria-hidden /> desvincular
            </button>
          )}
        </div>

        {selected ? (
          <div className="mt-3 rounded-md border border-retro-blue/50 bg-retro-blue/5 p-3">
            <p className="text-[12px] font-semibold text-retro-blue">
              Q{getQuizQuestionNumber(selected, questions)} · {selected.examName || "prova"} · {selected.topic}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-retro-text line-clamp-3">{selected.statement}</p>
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-retro-comment">Nenhuma questão vinculada.</p>
        )}

        <RetroButton
          type="button"
          variant="default"
          className="mt-3"
          icon={<Link2 size={14} />}
          disabled={questions.length === 0}
          onClick={() => setOpen(true)}
        >
          {selected ? "trocar questão" : "vincular questão"}
        </RetroButton>
        {questions.length === 0 && (
          <p className="mt-2 text-[11px] text-retro-comment">Importe ou cadastre uma questão antes de criar o vínculo.</p>
        )}
      </section>

      <RetroModal
        open={open}
        onClose={() => setOpen(false)}
        title="Vincular questão ao flashcard"
        subtitle="Escolha uma questão da sua biblioteca de provas."
        accent="blue"
        size="lg"
        icon={<FileQuestion size={16} />}
      >
        <div className="p-5">
          <label className="relative block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-retro-comment" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por prova, assunto ou enunciado"
              className="retro-input w-full pl-9"
              autoFocus
            />
          </label>
          <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto retro-scrollbar pr-1">
            {visibleQuestions.length > 0 ? visibleQuestions.map((question) => (
              <button
                key={question.id}
                type="button"
                className={question.id === selectedId
                  ? "w-full rounded-lg border border-retro-blue bg-retro-blue/10 p-3 text-left transition-colors"
                  : "w-full rounded-lg border border-retro-border/60 p-3 text-left transition-colors hover:border-retro-blue/60 hover:bg-retro-panelHover"}
                onClick={() => {
                  onChange(question.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span className="block text-[12px] font-semibold text-retro-blue">
                  Q{getQuizQuestionNumber(question, questions)} · {question.examName || "prova"} · {question.topic}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-retro-text line-clamp-3">
                  {question.statement}
                </span>
              </button>
            )) : (
              <p className="p-6 text-center text-[13px] text-retro-comment">Nenhuma questão corresponde à busca.</p>
            )}
          </div>
        </div>
      </RetroModal>
    </>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[13px] text-retro-text font-semibold mb-1.5">
        {label}
        {required && <span className="text-retro-red ml-0.5">*</span>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-retro-comment">{hint}</p>}
    </label>
  );
}
