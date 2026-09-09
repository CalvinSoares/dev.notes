import { useEffect, useMemo, useState } from "react";
import type { Flashcard, LeetCodeProblem, StudyPhase } from "@core/types";
import { BookOpenCheck, Code2 } from "lucide-react";

type PhaseInput = {
  title: string;
  description?: string;
  flashcardIds: string[];
  problemIds: string[];
};

interface StudyPhaseFormProps {
  formId: string;
  cards: Flashcard[];
  problems: LeetCodeProblem[];
  initial?: StudyPhase;
  onSubmit: (input: PhaseInput) => void;
}

export function StudyPhaseForm({
  formId,
  cards,
  problems,
  initial,
  onSubmit,
}: StudyPhaseFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [flashcardIds, setFlashcardIds] = useState<string[]>(initial?.flashcardIds ?? []);
  const [problemIds, setProblemIds] = useState<string[]>(initial?.problemIds ?? []);

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setFlashcardIds(initial?.flashcardIds ?? []);
    setProblemIds(initial?.problemIds ?? []);
  }, [initial]);

  const valid = title.trim().length > 0;
  const selectedTotal = flashcardIds.length + problemIds.length;
  const cardsByTopic = useMemo(
    () => [...cards].sort((a, b) => a.question.localeCompare(b.question, "pt-BR")),
    [cards],
  );

  const toggle = (id: string, selected: string[], setSelected: (ids: string[]) => void) => {
    setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      flashcardIds,
      problemIds,
    });
  };

  return (
    <form id={formId} onSubmit={submit}>
      <div className="p-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Field label="Nome da fase" required>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Fundamentos de JavaScript"
              className="retro-input"
              autoFocus
            />
          </Field>
          <Field label="Objetivo ou observação">
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: revisar callbacks antes da entrevista"
              className="retro-input"
            />
          </Field>
        </div>

        <p className="text-[13px] text-retro-text-dim">
          Escolha o que faz parte desta fase. Você pode editar a seleção depois.
          <span className="ml-2 font-semibold text-retro-blue">{selectedTotal} itens selecionados</span>
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <SelectionList
            title="Flashcards"
            icon={<BookOpenCheck size={16} />}
            count={flashcardIds.length}
            empty="Nenhum flashcard criado ainda."
          >
            {cardsByTopic.map((card) => (
              <label key={card.id} className="phase-choice">
                <input
                  type="checkbox"
                  checked={flashcardIds.includes(card.id)}
                  onChange={() => toggle(card.id, flashcardIds, setFlashcardIds)}
                  className="sketch-checkbox"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] text-retro-text leading-snug">{card.question}</span>
                  {card.tags.length > 0 && (
                    <span className="block mt-1 text-[12px] text-retro-comment">{card.tags.join(" · ")}</span>
                  )}
                </span>
              </label>
            ))}
          </SelectionList>

          <SelectionList
            title="Desafios"
            icon={<Code2 size={16} />}
            count={problemIds.length}
            empty="Nenhum desafio criado ainda."
          >
            {problems.map((problem) => (
              <label key={problem.id} className="phase-choice">
                <input
                  type="checkbox"
                  checked={problemIds.includes(problem.id)}
                  onChange={() => toggle(problem.id, problemIds, setProblemIds)}
                  className="sketch-checkbox"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] text-retro-text leading-snug">{problem.title}</span>
                  <span className="block mt-1 text-[12px] text-retro-comment">
                    {problem.difficulty}{problem.tags.length ? ` · ${problem.tags.join(" · ")}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </SelectionList>
        </div>
      </div>
      <button type="submit" className="hidden" aria-hidden />
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[13px] font-semibold text-retro-text">
        {label}{required && <span className="ml-1 text-retro-red">*</span>}
      </span>
      {children}
    </label>
  );
}

function SelectionList({
  title,
  icon,
  count,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section className="border border-retro-border/60 rounded-xl overflow-hidden bg-retro-bgDark">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-retro-border/60">
        <h3 className="inline-flex items-center gap-2 text-[14px] font-semibold text-retro-text">
          <span className="text-retro-blue">{icon}</span>{title}
        </h3>
        <span className="text-[12px] text-retro-text-dim">{count} selecionados</span>
      </div>
      <div className="max-h-64 overflow-y-auto retro-scrollbar p-2 space-y-1">
        {children.length > 0 ? children : <p className="p-3 text-[13px] text-retro-comment">{empty}</p>}
      </div>
    </section>
  );
}
