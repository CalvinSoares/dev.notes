import { useEffect, useState } from "react";
import type { Flashcard } from "@core/types";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { DiagramLinkPicker } from "@/components/features/diagrams/DiagramLinkPicker";

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
  onSubmit: (value: {
    question: string;
    answer: string;
    codeSnippet?: string;
    language?: string;
    tags?: string[];
    diagramIds?: string[];
  }) => void;
}

export function FlashcardForm({
  formId = "flashcard-form",
  initial,
  onSubmit,
}: FlashcardFormProps) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [codeSnippet, setCodeSnippet] = useState(initial?.codeSnippet ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "typescript");
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [diagramIds, setDiagramIds] = useState<string[]>(initial?.diagramIds ?? []);

  useEffect(() => {
    setQuestion(initial?.question ?? "");
    setAnswer(initial?.answer ?? "");
    setCodeSnippet(initial?.codeSnippet ?? "");
    setLanguage(initial?.language ?? "typescript");
    setTagsInput((initial?.tags ?? []).join(", "));
    setDiagramIds(initial?.diagramIds ?? []);
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

        <div className="text-[11.5px] text-retro-comment italic pt-1 border-t border-dashed border-retro-border/60">
          * pergunta e resposta são obrigatórios
        </div>

        <button type="submit" className="hidden" aria-hidden />
      </div>
    </form>
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
