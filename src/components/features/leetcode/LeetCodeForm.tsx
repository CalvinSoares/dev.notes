import { useEffect, useState } from "react";
import type { Difficulty, LeetCodeProblem } from "@core/types";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { DiagramLinkPicker } from "@/components/features/diagrams/DiagramLinkPicker";

interface LeetCodeFormProps {
  formId?: string;
  initial?: Partial<LeetCodeProblem>;
  variantMode?: boolean;
  onSubmit: (value: {
    title: string;
    url: string;
    difficulty: Difficulty;
    tags: string[];
    variantName?: string;
    strategy?: string;
    complexity?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    tradeoffs?: string;
    diagramIds?: string[];
    solution?: string;
    notes?: string;
    solvedAt?: string;
  }) => void;
}

export function LeetCodeForm({
  formId = "leetcode-form",
  initial,
  variantMode = false,
  onSubmit,
}: LeetCodeFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [variantName, setVariantName] = useState(variantMode ? "" : (initial?.variantName ?? "Solução principal"));
  const [strategy, setStrategy] = useState(variantMode ? "" : (initial?.strategy ?? ""));
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initial?.difficulty ?? "easy",
  );
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [complexity, setComplexity] = useState(variantMode ? "" : (initial?.complexity ?? ""));
  const [timeComplexity, setTimeComplexity] = useState(variantMode ? "" : (initial?.timeComplexity ?? ""));
  const [spaceComplexity, setSpaceComplexity] = useState(variantMode ? "" : (initial?.spaceComplexity ?? ""));
  const [tradeoffs, setTradeoffs] = useState(variantMode ? "" : (initial?.tradeoffs ?? ""));
  const [solution, setSolution] = useState(variantMode ? "" : (initial?.solution ?? ""));
  const [markSolved, setMarkSolved] = useState(variantMode ? false : Boolean(initial?.solvedAt));
  const [diagramIds, setDiagramIds] = useState<string[]>(initial?.diagramIds ?? []);

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setUrl(initial?.url ?? "");
    setVariantName(variantMode ? "" : (initial?.variantName ?? "Solução principal"));
    setStrategy(variantMode ? "" : (initial?.strategy ?? ""));
    setDifficulty(initial?.difficulty ?? "easy");
    setTagsInput((initial?.tags ?? []).join(", "));
    setComplexity(variantMode ? "" : (initial?.complexity ?? ""));
    setTimeComplexity(variantMode ? "" : (initial?.timeComplexity ?? ""));
    setSpaceComplexity(variantMode ? "" : (initial?.spaceComplexity ?? ""));
    setTradeoffs(variantMode ? "" : (initial?.tradeoffs ?? ""));
    setSolution(variantMode ? "" : (initial?.solution ?? ""));
    setMarkSolved(variantMode ? false : Boolean(initial?.solvedAt));
    setDiagramIds(initial?.diagramIds ?? []);
  }, [initial, variantMode]);

  const valid = title.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      title: title.trim(),
      variantName: variantName.trim() || "Solução principal",
      strategy: strategy.trim() || undefined,
      url: url.trim(),
      difficulty,
      tags,
      complexity: complexity.trim() || undefined,
      timeComplexity: timeComplexity.trim() || undefined,
      spaceComplexity: spaceComplexity.trim() || undefined,
      tradeoffs: tradeoffs.trim() || undefined,
      diagramIds,
      solution: solution.trim() || undefined,
      solvedAt: markSolved
        ? (initial?.solvedAt ?? new Date().toISOString())
        : undefined,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div className="p-5 space-y-4">
        <Field label="Título" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Two Sum"
            className="retro-input w-full"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="URL (LeetCode)">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://leetcode.com/problems/..."
              className="retro-input w-full"
            />
          </Field>

          <Field label="Dificuldade">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="retro-input w-full"
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome da abordagem" required>
            <input value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="ex: Hash map" className="retro-input w-full" />
          </Field>
          <Field label="Estratégia">
            <input value={strategy} onChange={(e) => setStrategy(e.target.value)} placeholder="ex: guardar complementos em um mapa" className="retro-input w-full" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Complexidade">
            <input
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
              placeholder="ex: O(n log n) time / O(n) space"
              className="retro-input w-full"
            />
          </Field>

          <Field label="Tópicos" hint="Separe os tópicos por vírgula.">
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="array, hash table, two pointers"
              className="retro-input w-full"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tempo">
            <input value={timeComplexity} onChange={(e) => setTimeComplexity(e.target.value)} placeholder="ex: O(n)" className="retro-input w-full" />
          </Field>
          <Field label="Espaço">
            <input value={spaceComplexity} onChange={(e) => setSpaceComplexity(e.target.value)} placeholder="ex: O(n)" className="retro-input w-full" />
          </Field>
        </div>

        <Field label="Trade-offs">
          <textarea value={tradeoffs} onChange={(e) => setTradeoffs(e.target.value)} placeholder="O que esta abordagem ganha e perde?" className="retro-input w-full min-h-[72px]" />
        </Field>

        <DiagramLinkPicker selectedIds={diagramIds} onChange={setDiagramIds} />

        <label className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-retro-text cursor-pointer select-none">
          <input
            type="checkbox"
            checked={markSolved}
            onChange={(e) => setMarkSolved(e.target.checked)}
            className="sketch-checkbox"
          />
          <span>Marcar como resolvido</span>
          <span className="text-retro-comment text-[11.5px] basis-full sm:basis-auto ml-7 sm:ml-0">
            (habilita SRS com intervalo inicial)
          </span>
        </label>

        <Field label="Solução (código)">
          <div className="border-2 border-retro-border h-[260px]">
            <CodeEditor
              value={solution}
              language="typescript"
              readOnly={false}
              onChange={setSolution}
              filename="solution.ts"
            />
          </div>
        </Field>

        <div className="text-[11.5px] text-retro-comment italic pt-1 border-t border-dashed border-retro-border/60">
          * {variantMode ? "a abordagem será salva como uma nova versão deste problema" : "título e nome da abordagem são obrigatórios"}
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
