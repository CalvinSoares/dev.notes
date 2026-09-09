import { useEffect, useState } from "react";
import type { Snippet } from "@core/types";
import { CodeEditor } from "@/components/editor/CodeEditor";

const LANG_OPTIONS = [
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
  "json",
  "yaml",
];

interface SnippetFormProps {
  formId?: string;
  initial?: Partial<Snippet>;
  onSubmit: (value: {
    title: string;
    language: string;
    code: string;
    description?: string;
    tags?: string[];
  }) => void;
}

export function SnippetForm({
  formId = "snippet-form",
  initial,
  onSubmit,
}: SnippetFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "typescript");
  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setLanguage(initial?.language ?? "typescript");
    setCode(initial?.code ?? "");
    setDescription(initial?.description ?? "");
    setTagsInput((initial?.tags ?? []).join(", "));
  }, [initial]);

  const valid = title.trim().length > 0 && code.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      title: title.trim(),
      language,
      code,
      description: description.trim() || undefined,
      tags: tags.length ? tags : undefined,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Título" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Debounce util (TS)"
              className="retro-input w-full"
            />
          </Field>

          <Field label="Linguagem do código" required>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="retro-input w-full"
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Descrição (opcional)">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="o que este snippet faz?"
            className="retro-input w-full"
          />
        </Field>

        <Field label="Tópicos" hint="Separe os tópicos por vírgula.">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="javascript, utilitários, desempenho"
            className="retro-input w-full"
          />
        </Field>

        <Field label="Código" required>
          <div className="border-2 border-retro-border h-[280px]">
            <CodeEditor
              value={code}
              language={language as any}
              readOnly={false}
              onChange={setCode}
              filename={`snippet.${language}`}
            />
          </div>
        </Field>

        <div className="text-[11.5px] text-retro-comment italic pt-1 border-t border-dashed border-retro-border/60">
          * título e código são obrigatórios
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
