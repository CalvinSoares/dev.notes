import type { QuizQuestion } from "@core/types";
export function formatDuration(seconds?: number) {
  if (seconds === undefined) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes} min ${remaining}s` : `${remaining}s`;
}

export function hasStructuredLayout(value: string) {
  return /[{};]|\|\s*[-A-Za-z]|\b(?:SELECT|FROM|WHERE|WITH|UNION|JOIN|public|class|return)\b|[∧∨¬→]/i.test(value);
}
export function structuredKind(value: string) {
  if (/\b(?:SELECT|FROM|WHERE|WITH|UNION|JOIN|INSERT|UPDATE|DELETE)\b/i.test(value)) return "consulta SQL";
  if (/\b(?:public|private|protected|class|static|void|return)\b|[{};]/.test(value)) return "código";
  if (/\|\s*[-A-Za-z]/.test(value)) return "tabela";
  return "expressão lógica";
}

export function QuestionContent({ value, compact = false }: { value: string; compact?: boolean }) {
  if (!hasStructuredLayout(value)) {
    return <p className={compact ? "text-retro-text-dim mt-3 whitespace-pre-wrap" : "text-retro-text text-[18px] leading-relaxed whitespace-pre-wrap"}>{value}</p>;
  }
  return <section className={`mt-3 overflow-hidden rounded-wobbly border border-retro-border bg-retro-bg ${compact ? "" : "shadow-paper"}`}>
    <div className="flex items-center justify-between gap-3 border-b border-retro-border bg-retro-panelHover px-4 py-2 text-[12px]">
      <span className="font-semibold uppercase tracking-wide text-retro-blue">{structuredKind(value)}</span><span className="text-retro-comment">formatação preservada</span>
    </div>
    <pre className={`m-0 max-h-[34rem] overflow-auto p-4 font-mono text-retro-text whitespace-pre ${compact ? "text-[12px] leading-5" : "text-[13px] leading-6"}`}><code>{value}</code></pre>
  </section>;
}

export function OptionContent({ value }: { value: string }) {
  if (!hasStructuredLayout(value)) return <span className="text-retro-text-dim whitespace-pre-wrap">{value}</span>;
  return <span className="mt-2 block overflow-x-auto rounded border border-retro-border bg-retro-bg px-3 py-2 font-mono text-[13px] leading-6 text-retro-text whitespace-pre">{value}</span>;
}
export function VisualReference({ question }: { question: Pick<QuizQuestion, "visualImage" | "visualImages"> }) {
  const images = question.visualImages?.length ? question.visualImages : question.visualImage ? [question.visualImage] : [];
  if (!images.length) return null;
  return <div className="mt-5 space-y-3">{images.map((image, index) => <figure key={`${image.slice(0, 36)}-${index}`} className="border border-retro-border rounded-wobbly bg-white p-2 overflow-auto"><figcaption className="px-2 pb-2 text-[12px] text-retro-comment">{images.length > 1 ? `Página ${index + 1} do diagrama e alternativas originais` : "Diagrama e alternativas originais da prova"}</figcaption><img src={image} alt={`Diagrama da questão e alternativas${images.length > 1 ? `, página ${index + 1}` : ""}`} className="block min-w-[540px] max-w-none mx-auto" /></figure>)}</div>;
}
