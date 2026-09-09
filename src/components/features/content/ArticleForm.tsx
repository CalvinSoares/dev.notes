import { useEffect, useState } from "react";
import type { Article } from "@core/types";
import { ArticleEditor } from "./ArticleEditor";

interface ArticleFormProps {
  formId?: string;
  initial?: Partial<Article>;
  onSubmit: (value: {
    title: string;
    summary: string;
    content?: string;
    url?: string;
    tags?: string[];
  }) => void;
}

export function ArticleForm({
  formId = "article-form",
  initial,
  onSubmit,
}: ArticleFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setSummary(initial?.summary ?? "");
    setContent(initial?.content ?? "");
    setUrl(initial?.url ?? "");
    setTagsInput((initial?.tags ?? []).join(", "));
  }, [initial]);

  const valid = title.trim().length > 0 && summary.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim().length > 0 ? content.trim() : undefined,
      url: url.trim() || undefined,
      tags: tags.length ? tags : undefined,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div className="p-5 space-y-4">
        <Field label="Título" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Designing Data-Intensive Applications, parte 1"
            className="retro-input w-full"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="URL (fonte opcional)">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="retro-input w-full"
            />
          </Field>
          <Field label="Tópicos" hint="Separe os tópicos por vírgula.">
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="sistemas, livros, arquitetura"
              className="retro-input w-full"
            />
          </Field>
        </div>

        <Field label="Resumo / Summary" required>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="uma descrição curta sobre o conteúdo deste artigo..."
            rows={2}
            className="retro-input w-full resize-y"
          />
        </Field>

        <Field label="Conteúdo Markdown (editor + preview)">
          <div className="border-2 border-retro-border h-[420px]">
            <ArticleEditor
              value={content}
              onChange={setContent}
              filename="article.md"
            />
          </div>
        </Field>

        <div className="text-[11.5px] text-retro-comment italic pt-1 border-t border-dashed border-retro-border/60">
          * título e resumo são obrigatórios
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
