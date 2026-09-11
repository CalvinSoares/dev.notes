import { useMemo, useState, type FormEvent } from "react";
import { BarChart3, BookOpenCheck, CheckCircle2, CircleHelp, Clock3, FileText, ListChecks, Plus, Pencil, RotateCcw, Save, Target, Trash2, Upload, XCircle } from "lucide-react";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroModal } from "@/components/ui/RetroModal";
import { useQuizStore, type QuizExamInput, type QuizQuestionInput } from "@/store/useQuizStore";
import { detectProofVersion, parseQuestions, readAnswerKeyVariants, readPdfText, renderPdfPage, type ParsedPdfQuestion } from "@core/lib/pdf";
import type { QuestionOptionId, QuizExam, QuizQuestion } from "@core/types";

type Screen = "home" | "setup" | "taking" | "result";

type DeleteTarget =
  | { kind: "exam"; exam: QuizExam; questionCount: number }
  | { kind: "question"; question: QuizQuestion }
  | { kind: "legacy"; questionIds: string[] };
const optionIds: QuestionOptionId[] = ["A", "B", "C", "D", "E"];

function formatDuration(seconds?: number) {
  if (seconds === undefined) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes} min ${remaining}s` : `${remaining}s`;
}

function hasStructuredLayout(value: string) {
  return /[{};]|\|\s*[-A-Za-z]|\b(?:SELECT|FROM|WHERE|WITH|UNION|JOIN|public|class|return)\b|[∧∨¬→]/i.test(value);
}
function structuredKind(value: string) {
  if (/\b(?:SELECT|FROM|WHERE|WITH|UNION|JOIN|INSERT|UPDATE|DELETE)\b/i.test(value)) return "consulta SQL";
  if (/\b(?:public|private|protected|class|static|void|return)\b|[{};]/.test(value)) return "código";
  if (/\|\s*[-A-Za-z]/.test(value)) return "tabela";
  return "expressão lógica";
}

function QuestionContent({ value, compact = false }: { value: string; compact?: boolean }) {
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

function OptionContent({ value }: { value: string }) {
  if (!hasStructuredLayout(value)) return <span className="text-retro-text-dim whitespace-pre-wrap">{value}</span>;
  return <span className="mt-2 block overflow-x-auto rounded border border-retro-border bg-retro-bg px-3 py-2 font-mono text-[13px] leading-6 text-retro-text whitespace-pre">{value}</span>;
}
function VisualReference({ question }: { question: Pick<QuizQuestion, "visualImage" | "visualImages"> }) {
  const images = question.visualImages?.length ? question.visualImages : question.visualImage ? [question.visualImage] : [];
  if (!images.length) return null;
  return <div className="mt-5 space-y-3">{images.map((image, index) => <figure key={`${image.slice(0, 36)}-${index}`} className="border border-retro-border rounded-wobbly bg-white p-2 overflow-auto"><figcaption className="px-2 pb-2 text-[12px] text-retro-comment">{images.length > 1 ? `Página ${index + 1} do diagrama e alternativas originais` : "Diagrama e alternativas originais da prova"}</figcaption><img src={image} alt={`Diagrama da questão e alternativas${images.length > 1 ? `, página ${index + 1}` : ""}`} className="block min-w-[540px] max-w-none mx-auto" /></figure>)}</div>;
}
function QuestionPlacementModal({ open, question, exams, onClose, onSave }: { open: boolean; question?: QuizQuestion; exams: QuizExam[]; onClose: () => void; onSave: (questionId: string, examId: string, order?: number) => Promise<void> }) {
  const [examId, setExamId] = useState(question?.examId ?? exams[0]?.id ?? "");
  const [order, setOrder] = useState(question?.order ? String(question.order) : "");
  if (!question) return null;
  return <RetroModal open={open} onClose={onClose} title="Vincular questão a uma prova" subtitle="Escolha o pai desta questão antiga." size="md" icon={<Pencil size={16} />}><div className="p-5 md:p-6 space-y-4"><div className="p-3 rounded-wobbly border border-retro-border bg-retro-panelHover text-[13px] text-retro-text-dim line-clamp-4">{question.statement}</div><label className="block text-[13px] text-retro-text-dim">Prova/vaga *<select required value={examId} onChange={(event) => setExamId(event.target.value)} className="retro-input mt-1"><option value="">selecione a prova/vaga</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label><label className="block text-[13px] text-retro-text-dim">Número/ordem da questão <input min="1" type="number" value={order} onChange={(event) => setOrder(event.target.value)} className="retro-input mt-1" placeholder="Ex.: 21" /></label><div className="flex justify-end gap-2 border-t border-retro-border pt-4"><RetroButton onClick={onClose}>cancelar</RetroButton><RetroButton variant="primary" disabled={!examId} onClick={() => void onSave(question.id, examId, order ? Number(order) : undefined)} icon={<Pencil size={14} />}>vincular questão</RetroButton></div></div></RetroModal>;
}
function DeleteConfirmModal({ open, title, message, detail, onClose, onConfirm }: { open: boolean; title: string; message: string; detail?: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  if (!open) return null;
  const confirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  };
  return <RetroModal open={open} onClose={deleting ? () => undefined : onClose} title={title} subtitle="Revise esta ação antes de confirmar." size="md" icon={<Trash2 size={16} />}>
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex gap-3 rounded-wobbly border border-retro-orange/50 bg-retro-orange/10 p-4"><Trash2 size={20} className="text-retro-orange shrink-0 mt-0.5" /><div><p className="font-semibold text-retro-text">{message}</p>{detail && <p className="text-[13px] text-retro-text-dim mt-1">{detail}</p>}</div></div>
      <div className="flex justify-end gap-2 border-t border-retro-border pt-4"><RetroButton type="button" disabled={deleting} onClick={onClose}>cancelar</RetroButton><RetroButton type="button" variant="primary" disabled={deleting} onClick={() => void confirm()} icon={<Trash2 size={14} />}>{deleting ? "excluindo..." : "confirmar exclusão"}</RetroButton></div>
    </div>
  </RetroModal>;
}
function QuestionNotes({ question, onSave }: { question: QuizQuestion; onSave: (notes: string) => Promise<void> }) {
  const [value, setValue] = useState(question.notes ?? "");
  const dirty = value !== (question.notes ?? "");
  return <details className="mt-5 border border-retro-border rounded-wobbly bg-retro-panel overflow-hidden" open={Boolean(question.notes)}><summary className="cursor-pointer px-4 py-3 text-[13px] font-medium text-retro-text hover:bg-retro-panelHover">Anotação desta questão <span className="font-normal text-retro-comment">(privada)</span></summary><div className="p-4 border-t border-retro-border"><textarea value={value} onChange={(event) => setValue(event.target.value)} className="retro-input min-h-24" placeholder="Escreva uma dúvida, macete ou ponto para revisar..." /><div className="flex justify-end mt-2"><RetroButton disabled={!dirty} onClick={() => void onSave(value.trim())} icon={<Save size={14} />}>salvar anotação</RetroButton></div></div></details>;
}
function scoreTone(score: number): "green" | "yellow" | "red" {
  return score >= 70 ? "green" : score >= 50 ? "yellow" : "red";
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function exportExamPdf(exam: QuizExam, questions: QuizQuestion[], includeAnswerKey: boolean, includeExplanations: boolean, includeNotes: boolean) {
  const popup = window.open("", "_blank", "width=960,height=760");
  if (!popup) return;
  const body = questions.map((question, index) => `<article class="question"><h2>${index + 1}. ${escapeHtml(question.topic)}</h2><div class="statement">${escapeHtml(question.statement)}</div>${question.visualImages?.length || question.visualImage ? (question.visualImages ?? (question.visualImage ? [question.visualImage] : [])).map((image) => `<img class="visual" src="${image}" alt="Diagrama da questão" />`).join("") : ""}<ol type="A">${question.options.map((option) => `<li>${escapeHtml(option.text)}</li>`).join("")}</ol>${includeAnswerKey ? `<p class="answer"><strong>Gabarito:</strong> ${question.correctOption}</p>` : ""}${includeExplanations && question.explanation ? `<p class="explanation"><strong>Explicação:</strong> ${escapeHtml(question.explanation)}</p>` : ""}${includeNotes && question.notes ? `<p class="notes"><strong>Anotação:</strong> ${escapeHtml(question.notes)}</p>` : ""}</article>`).join("");
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(exam.title)}</title><style>@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;color:#17202a;line-height:1.45}h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:20px 0 8px;border-bottom:1px solid #cbd5e1;padding-bottom:4px}.meta{color:#475569;margin-bottom:22px}.question{break-inside:avoid}.statement{white-space:pre-wrap;font-size:14px}.question ol{padding-left:28px}.question li{margin:7px 0;white-space:pre-wrap}.visual{display:block;max-width:100%;max-height:420px;margin:12px auto;object-fit:contain}.answer{color:#047857}.explanation{background:#f1f5f9;padding:9px}.notes{background:#fff7ed;padding:9px}@media print{button{display:none}}</style></head><body><h1>${escapeHtml(exam.title)}</h1><p class="meta">${escapeHtml(exam.contestName)} · ${escapeHtml(exam.vacancy)}${exam.proofVersion ? ` · ${escapeHtml(exam.proofVersion)}` : ""}<br>${questions.length} questões</p>${body}</body></html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 350);
}

function ExportModal({ open, exam, questions, onClose }: { open: boolean; exam?: QuizExam; questions: QuizQuestion[]; onClose: () => void }) {
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [includeExplanations, setIncludeExplanations] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);
  if (!exam) return null;
  return <RetroModal open={open} onClose={onClose} title="Exportar prova em PDF" subtitle="O navegador abrirá a impressão para você salvar como PDF." size="md" icon={<FileText size={16} />}><div className="p-5 md:p-6 space-y-4"><div className="p-3 rounded-wobbly border border-retro-border bg-retro-panelHover text-[13px] text-retro-text-dim"><strong className="text-retro-text">{exam.title}</strong><br />{questions.length} questões serão exportadas na ordem da prova.</div><label className="flex items-center gap-3 text-[14px] text-retro-text-dim"><input type="checkbox" checked={includeAnswerKey} onChange={(event) => setIncludeAnswerKey(event.target.checked)} /> incluir gabarito</label><label className="flex items-center gap-3 text-[14px] text-retro-text-dim"><input type="checkbox" checked={includeExplanations} onChange={(event) => setIncludeExplanations(event.target.checked)} /> incluir explicações</label><label className="flex items-center gap-3 text-[14px] text-retro-text-dim"><input type="checkbox" checked={includeNotes} onChange={(event) => setIncludeNotes(event.target.checked)} /> incluir anotações</label><div className="flex justify-end gap-2 border-t border-retro-border pt-4"><RetroButton onClick={onClose}>cancelar</RetroButton><RetroButton variant="primary" disabled={!questions.length} onClick={() => { exportExamPdf(exam, questions, includeAnswerKey, includeExplanations, includeNotes); onClose(); }} icon={<Upload size={15} />}>abrir impressão</RetroButton></div></div></RetroModal>;
}
function DuplicateExamModal({ open, exam, onClose, onSave }: { open: boolean; exam?: QuizExam; onClose: () => void; onSave: (examId: string, title: string) => Promise<void> }) {
  const [title, setTitle] = useState(exam ? `${exam.title} (cópia)` : "");
  const [saving, setSaving] = useState(false);
  if (!exam) return null;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(exam.id, title.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };
  return <RetroModal open={open} onClose={onClose} title="Duplicar prova/vaga" subtitle="Escolha um nome para a nova cópia e mantenha a original intacta." size="md" icon={<Plus size={16} />}>
    <form onSubmit={submit} className="p-5 md:p-6 space-y-5">
      <div className="p-4 rounded-wobbly border border-retro-blue/40 bg-retro-blue/10 text-[13px] text-retro-text-dim">A duplicata receberá uma cópia de todas as questões desta prova. Os arquivos PDF não serão reutilizados.</div>
      <label className="block text-[13px] text-retro-text-dim">Nome da duplicata *<input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Transpetro 2026 · revisão" /></label>
      <div className="flex justify-end gap-2 border-t border-retro-border pt-4"><RetroButton type="button" onClick={onClose}>cancelar</RetroButton><RetroButton type="submit" variant="primary" disabled={!title.trim() || saving} icon={<Plus size={15} />}>{saving ? "duplicando..." : "criar duplicata"}</RetroButton></div>
    </form>
  </RetroModal>;
}
function ExamForm({ exam, onSubmit, onCancel }: { exam?: QuizExam; onSubmit: (data: QuizExamInput) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState(exam?.title ?? "");
  const [contestName, setContestName] = useState(exam?.contestName ?? "");
  const [vacancy, setVacancy] = useState(exam?.vacancy ?? "");
  const [proofVersion, setProofVersion] = useState(exam?.proofVersion ?? "");
  const [board, setBoard] = useState(exam?.board ?? "");
  const [year, setYear] = useState(exam?.year ? String(exam.year) : "");
  const [saving, setSaving] = useState(false);
  const editing = Boolean(exam);
  const canSave = Boolean(title.trim() && contestName.trim() && vacancy.trim());
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), contestName: contestName.trim(), vacancy: vacancy.trim(), proofVersion: proofVersion.trim() || undefined, board: board.trim() || undefined, year: year ? Number(year) : undefined });
    } finally {
      setSaving(false);
    }
  };
  return <form onSubmit={submit} className="p-5 md:p-6 space-y-5">
    <div className="p-4 rounded-wobbly border border-retro-blue/40 bg-retro-blue/10 text-[13px] text-retro-text-dim">A prova/vaga é o agrupador principal. Todas as questões importadas ou cadastradas ficarão vinculadas a ela.</div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-[13px] text-retro-text-dim sm:col-span-2">Nome exibido *<input required value={title} onChange={(event) => setTitle(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Transpetro 2026 · Análise de Sistemas" /></label>
      <label className="text-[13px] text-retro-text-dim">Concurso *<input required value={contestName} onChange={(event) => setContestName(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Transpetro 2026" /></label>
      <label className="text-[13px] text-retro-text-dim">Vaga/cargo *<input required value={vacancy} onChange={(event) => setVacancy(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Análise de Sistemas - Infraestrutura" /></label>
      <label className="text-[13px] text-retro-text-dim">Versão da prova<input value={proofVersion} onChange={(event) => setProofVersion(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Prova 4" /></label>
      <label className="text-[13px] text-retro-text-dim">Banca<input value={board} onChange={(event) => setBoard(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Cesgranrio" /></label>
      <label className="text-[13px] text-retro-text-dim">Ano<input min="1900" max="2100" type="number" value={year} onChange={(event) => setYear(event.target.value)} className="retro-input mt-1" placeholder="2026" /></label>
    </div>
    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 border-t border-retro-border pt-4"><span className="text-[12px] text-retro-comment">{canSave ? (editing ? "Pronto para salvar." : "Pronto para criar a prova.") : "Informe nome, concurso e vaga/cargo."}</span><div className="flex justify-end gap-2"><RetroButton type="button" onClick={onCancel}>cancelar</RetroButton><RetroButton type="submit" variant="primary" disabled={!canSave || saving} icon={editing ? <Save size={15} /> : <Plus size={15} />}>{saving ? (editing ? "salvando..." : "criando...") : (editing ? "salvar alterações" : "criar prova/vaga")}</RetroButton></div></div>
  </form>;
}
function QuestionForm({ onSubmit, onCancel, exams, defaultExamId }: { onSubmit: (data: QuizQuestionInput) => Promise<void>; onCancel: () => void; exams: QuizExam[]; defaultExamId?: string }) {
  const [statement, setStatement] = useState("");
  const [examId, setExamId] = useState(defaultExamId ?? exams[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourcePage, setSourcePage] = useState("");
  const [correctOption, setCorrectOption] = useState<QuestionOptionId>("A");
  const [options, setOptions] = useState<Record<QuestionOptionId, string>>({ A: "", B: "", C: "", D: "", E: "" });
  const [saving, setSaving] = useState(false);

  const updateOption = (id: QuestionOptionId, value: string) => setOptions((current) => ({ ...current, [id]: value }));
  const filledOptions = optionIds.filter((id) => options[id].trim());
  const canSave = Boolean(examId && statement.trim() && subject.trim() && topic.trim() && filledOptions.length >= 2 && options[correctOption].trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    const cleanOptions = optionIds.map((id) => ({ id, text: options[id].trim() })).filter((option) => option.text);
    setSaving(true);
    await onSubmit({
      statement: statement.trim(),
      options: cleanOptions,
      correctOption,
      explanation: explanation.trim() || undefined,
      examId,
      examName: exams.find((exam) => exam.id === examId)?.title,
      subject: subject.trim(),
      topic: topic.trim(),
      sourceName: sourceName.trim() || undefined,
      sourcePage: sourcePage ? Number(sourcePage) : undefined,
    });
    setSaving(false);
  };

  return (
    <form id="quiz-question-form" onSubmit={submit} className="p-5 md:p-6 space-y-6">
      <div className="flex gap-3 items-start p-4 bg-retro-panelHover border border-retro-border rounded-wobbly text-[13px] text-retro-text-dim">
        <CircleHelp size={18} className="text-retro-blue shrink-0 mt-0.5" />
        <p>Preencha o contexto, o enunciado e pelo menos duas alternativas. Escolha a resposta correta clicando na letra da alternativa.</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-retro-text">Contexto da questão</h3><span className="text-[12px] text-retro-comment">campos com * são obrigatórios</span></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] text-retro-text-dim sm:col-span-2">Prova/vaga *<select required value={examId} onChange={(event) => setExamId(event.target.value)} className="retro-input mt-1"><option value="">selecione a prova/vaga</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label><label className="text-[13px] text-retro-text-dim">Disciplina *
            <input required value={subject} onChange={(event) => setSubject(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Conhecimentos específicos" />
          </label>
          <label className="text-[13px] text-retro-text-dim">Tópico *
            <input required value={topic} onChange={(event) => setTopic(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Redes TCP/IP" />
          </label>
          <label className="text-[13px] text-retro-text-dim">Arquivo de origem
            <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} className="retro-input mt-1" placeholder="Ex.: prova-ufrrj.pdf" />
          </label>
          <label className="text-[13px] text-retro-text-dim">Página do PDF
            <input min="1" type="number" value={sourcePage} onChange={(event) => setSourcePage(event.target.value)} className="retro-input mt-1" placeholder="Ex.: 12" />
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-[13px] text-retro-text-dim">Enunciado *
          <textarea required value={statement} onChange={(event) => setStatement(event.target.value)} className="retro-input mt-1 min-h-36 leading-relaxed" placeholder="Cole ou escreva a questão aqui." />
        </label>
      </section>

      <fieldset className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><legend className="font-semibold text-retro-text">Alternativas *</legend><span className="text-[12px] text-retro-comment">{filledOptions.length}/5 preenchidas · selecione o gabarito</span></div>
        <div className="space-y-2.5">
          {optionIds.map((id) => {
            const isCorrect = correctOption === id;
            return <div key={id} className={`flex items-stretch gap-2 rounded-wobbly border-2 p-2 transition-colors ${isCorrect ? "border-retro-green bg-retro-green/10" : "border-retro-border bg-retro-panel"}`}>
              <label className={`flex w-11 cursor-pointer items-center justify-center rounded font-bold transition-colors ${isCorrect ? "bg-retro-green text-retro-bgDark" : "bg-retro-panelHover text-retro-blue hover:bg-retro-blue/15"}`} title={`Marcar ${id} como correta`}>
                <input type="radio" name="correct-option" value={id} checked={isCorrect} onChange={() => setCorrectOption(id)} className="sr-only" />
                {id}
              </label>
              <input value={options[id]} onChange={(event) => updateOption(id, event.target.value)} className="retro-input flex-1 !border-0 !bg-transparent focus:!ring-0" placeholder={`Texto da alternativa ${id}`} />
              {isCorrect && <span className="hidden sm:flex items-center px-2 text-[12px] font-semibold text-retro-green">gabarito</span>}
            </div>;
          })}
        </div>
      </fieldset>

      <details className="group border border-retro-border rounded-wobbly bg-retro-panel overflow-hidden">
        <summary className="cursor-pointer px-4 py-3 text-[13px] font-medium text-retro-text hover:bg-retro-panelHover">Adicionar explicação do gabarito <span className="font-normal text-retro-comment">(opcional)</span></summary>
        <div className="px-4 pb-4"><textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} className="retro-input min-h-24" placeholder="Explique por que a alternativa correta é a resposta." /></div>
      </details>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-retro-border pt-4">
        <p className="text-[12px] text-retro-comment">{canSave ? "Tudo certo para salvar esta questão." : "Inclua o enunciado, disciplina, tópico e duas alternativas."}</p>
        <div className="flex justify-end gap-2"><RetroButton type="button" onClick={onCancel}>cancelar</RetroButton><RetroButton type="submit" variant="primary" icon={<Plus size={15} />} disabled={saving || !canSave}>{saving ? "salvando..." : "salvar questão"}</RetroButton></div>
      </div>
    </form>
  );
}

function PdfImportModal({ open, onClose, onImport, exams }: { open: boolean; onClose: () => void; onImport: (questions: QuizQuestionInput[]) => Promise<void>; exams: QuizExam[] }) {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const [proofVersion, setProofVersion] = useState("");
  const selectedExamId = examId || exams[0]?.id || "";
  const [parsed, setParsed] = useState<ParsedPdfQuestion[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const selectProof = (file: File | null) => {
    setProofFile(file);
    setParsed([]);
    setStatus("");
  };
  const selectAnswerKey = (file: File | null) => {
    setAnswerKeyFile(file);
    setParsed([]);
    setStatus("");
  };

  const analyze = async () => {
    if (!proofFile) return;
    setLoading(true);
    setStatus("Lendo a prova e identificando questões...");
    try {
      const [proofText, variants] = await Promise.all([
        readPdfText(proofFile),
        answerKeyFile ? readAnswerKeyVariants(answerKeyFile) : Promise.resolve([]),
      ]);
      const selectedVersion = Number(proofVersion) || detectProofVersion(proofText);
      const selectedKey = selectedVersion ? variants.find((variant) => variant.version === selectedVersion)?.answers : undefined;
      const extracted = parseQuestions(proofText, selectedKey ?? new Map());
      const questions = await Promise.all(extracted.map(async (question) => {
        if (!question.visualReference || !question.visualPageNumbers?.length) return question;
        try {
          return { ...question, visualImages: await Promise.all(question.visualPageNumbers.map((pageNumber) => renderPdfPage(proofFile, pageNumber))) };
        } catch {
          return question;
        }
      }));
      setParsed(questions);
      const ready = questions.filter((question) => question.correctOption).length;
      const visualCount = questions.filter((question) => question.visualImages?.length).length;
      setStatus(questions.length
        ? `${questions.length} questões reconhecidas. ${ready ? `${ready} já têm gabarito${selectedVersion ? ` da Prova ${selectedVersion}` : ""}.` : answerKeyFile ? "Escolha a versão correta da prova para associar o gabarito." : "Adicione o PDF do gabarito para liberar a importação."}${visualCount ? ` ${visualCount} questão(ões) com diagrama foram preservadas em imagem.` : ""}`
        : "Não reconheci questões neste formato. Selecione outro PDF ou use o cadastro manual.");
    } catch {
      setParsed([]);
      setStatus("Não foi possível ler este PDF. Tente um arquivo com texto selecionável; PDFs escaneados vão precisar de OCR.");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    const ready = parsed.filter((question) => question.correctOption);
    if (!selectedExamId || !subject.trim() || !topic.trim() || !ready.length) return;
    setLoading(true);
    await onImport(ready.map((question) => ({
      statement: question.statement,
      options: question.options,
      correctOption: question.correctOption!,
      examId: selectedExamId,
      order: question.number,
      examName: exams.find((exam) => exam.id === selectedExamId)?.title,
      subject: subject.trim(),
      topic: topic.trim(),
      sourceName: proofFile?.name,
      sourcePage: question.pageNumber,
      visualImages: question.visualImages,
    })));
    setLoading(false);
    setParsed([]);
    setStatus("");
  };

  const readyCount = parsed.filter((question) => question.correctOption).length;

  return (
    <RetroModal open={open} onClose={onClose} title="Importar prova e gabarito" subtitle="Os arquivos são lidos apenas no seu computador." size="lg" icon={<Upload size={16} />}>
      <div className="p-5 md:p-6 space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <input id="quiz-proof-file" type="file" accept="application/pdf" className="sr-only" onChange={(event) => selectProof(event.target.files?.[0] ?? null)} />
          <label htmlFor="quiz-proof-file" className={`block cursor-pointer p-4 border-2 rounded-wobbly transition-colors ${proofFile ? "border-retro-blue bg-retro-blue/10" : "border-dashed border-retro-border hover:bg-retro-panelHover"}`}>
            <div className="flex items-center gap-3"><span className="p-2 rounded bg-retro-panel"><FileText size={20} className="text-retro-blue" /></span><span className="min-w-0"><span className="block font-semibold text-retro-text">PDF da prova</span><span className="block text-[13px] text-retro-comment truncate">{proofFile?.name ?? "Clique para selecionar"}</span></span></div>
          </label>
          <input id="quiz-answer-file" type="file" accept="application/pdf" className="sr-only" onChange={(event) => selectAnswerKey(event.target.files?.[0] ?? null)} />
          <label htmlFor="quiz-answer-file" className={`block cursor-pointer p-4 border-2 rounded-wobbly transition-colors ${answerKeyFile ? "border-retro-green bg-retro-green/10" : "border-dashed border-retro-border hover:bg-retro-panelHover"}`}>
            <div className="flex items-center gap-3"><span className="p-2 rounded bg-retro-panel"><CheckCircle2 size={20} className="text-retro-green" /></span><span className="min-w-0"><span className="block font-semibold text-retro-text">PDF do gabarito</span><span className="block text-[13px] text-retro-comment truncate">{answerKeyFile?.name ?? "Opcional, mas necessário para importar"}</span></span></div>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-[13px] text-retro-text-dim sm:col-span-2">Prova/vaga *<select required value={examId} onChange={(event) => setExamId(event.target.value)} className="retro-input mt-1"><option value="">selecione a prova/vaga</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label>
          <label className="text-[13px] text-retro-text-dim">Versão da prova
            <input min="1" type="number" value={proofVersion} onChange={(event) => setProofVersion(event.target.value)} className="retro-input mt-1" placeholder="Ex.: 6" />
          </label><label className="text-[13px] text-retro-text-dim">Disciplina *
            <input value={subject} onChange={(event) => setSubject(event.target.value)} className="retro-input mt-1" placeholder="Conhecimentos específicos" />
          </label>
          <label className="text-[13px] text-retro-text-dim">Tópico *
            <input value={topic} onChange={(event) => setTopic(event.target.value)} className="retro-input mt-1" placeholder="Infraestrutura" />
          </label>
        </div>

        <div className="flex gap-3 items-start p-4 bg-retro-panelHover border border-retro-border rounded-wobbly text-[13px] text-retro-text-dim">
          <CircleHelp size={18} className="text-retro-orange shrink-0 mt-0.5" />
          <p>Reconhece questões numeradas, inclusive no padrão Cesgranrio: número sozinho na linha e alternativas como “(A)”. Se o gabarito tiver várias versões, informe a versão (por exemplo, Prova 6); se deixar vazio, tentamos identificar pelo título da prova.</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-retro-border pt-4">
          <span className="text-[13px] text-retro-comment min-h-5">{status}</span>
          <RetroButton disabled={!proofFile || loading} onClick={analyze} icon={<FileText size={14} />}>{loading ? "analisando..." : "analisar PDFs"}</RetroButton>
        </div>

        {parsed.length > 0 && <div className="border-2 border-retro-border rounded-wobbly overflow-hidden"><div className="p-3 bg-retro-panelHover flex justify-between gap-3 text-[13px]"><span className="text-retro-text"><strong>{parsed.length}</strong> questões identificadas</span><span className={readyCount ? "text-retro-green" : "text-retro-orange"}><strong>{readyCount}</strong> prontas para importar</span></div><div className="max-h-56 overflow-y-auto retro-scrollbar divide-y divide-retro-border">{parsed.slice(0, 12).map((question) => <div key={question.number} className="p-3 text-[13px] flex gap-2"><span className="font-bold text-retro-blue shrink-0">{question.number}.</span><span className="text-retro-text-dim min-w-0 flex-1">{question.statement.slice(0, 145)}{question.statement.length > 145 ? "…" : ""}</span>{question.correctOption && <RetroBadge tone="green">{question.correctOption}</RetroBadge>}</div>)}</div>{parsed.length > 12 && <p className="p-3 border-t border-retro-border text-[12px] text-retro-comment">+ {parsed.length - 12} questões na importação</p>}</div>}

        <div className="flex justify-end gap-2 pt-1"><RetroButton onClick={onClose}>cancelar</RetroButton><RetroButton variant="primary" disabled={loading || !selectedExamId || !subject.trim() || !topic.trim() || !readyCount} onClick={save} icon={<Upload size={14} />}>importar {readyCount || ""} questões</RetroButton></div>
      </div>
    </RetroModal>
  );
}
export function QuizPage() {
  const exams = useQuizStore((state) => state.exams);
  const questions = useQuizStore((state) => state.questions);
  const attempts = useQuizStore((state) => state.attempts);
  const addExam = useQuizStore((state) => state.addExam);
  const updateExam = useQuizStore((state) => state.updateExam);
  const deleteExam = useQuizStore((state) => state.deleteExam);
  const duplicateExam = useQuizStore((state) => state.duplicateExam);
  const deleteQuestion = useQuizStore((state) => state.deleteQuestion);
  const deleteQuestions = useQuizStore((state) => state.deleteQuestions);
  const updateQuestion = useQuizStore((state) => state.updateQuestion);
  const addQuestion = useQuizStore((state) => state.addQuestion);

  const createAttempt = useQuizStore((state) => state.createAttempt);
  const saveAnswer = useQuizStore((state) => state.saveAnswer);
  const finishAttempt = useQuizStore((state) => state.finishAttempt);

  const [screen, setScreen] = useState<Screen>("home");
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportExamId, setExportExamId] = useState<string | null>(null);
  const [duplicateExamId, setDuplicateExamId] = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [title, setTitle] = useState("Simulado personalizado");
  const [examFilter, setExamFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [amount, setAmount] = useState(10);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultAttemptId, setResultAttemptId] = useState<string | null>(null);

  const questionById = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const scopedQuestions = useMemo(() => questions.filter((question) => question.examId && (examFilter === "all" || question.examId === examFilter)), [questions, examFilter]);
  const subjects = useMemo(() => Array.from(new Set(scopedQuestions.map((question) => question.subject))).sort(), [scopedQuestions]);
  const topics = useMemo(() => Array.from(new Set(scopedQuestions.filter((question) => subjectFilter === "all" || question.subject === subjectFilter).map((question) => question.topic))).sort(), [scopedQuestions, subjectFilter]);
  const candidates = useMemo(() => scopedQuestions.filter((question) => (subjectFilter === "all" || question.subject === subjectFilter) && (topicFilter === "all" || question.topic === topicFilter)), [scopedQuestions, subjectFilter, topicFilter]);
  const completedAttempts = useMemo(() => attempts.filter((attempt) => attempt.finishedAt), [attempts]);
  const totalAnswered = completedAttempts.reduce((total, attempt) => total + attempt.questionIds.length, 0);
  const totalCorrect = completedAttempts.reduce((total, attempt) => total + (attempt.correctCount ?? 0), 0);
  const overallRate = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const activeAttempt = attempts.find((attempt) => attempt.id === activeAttemptId);
  const resultAttempt = attempts.find((attempt) => attempt.id === resultAttemptId);
  const activeQuestions = activeAttempt?.questionIds.map((id) => questionById.get(id)).filter((question): question is QuizQuestion => Boolean(question)) ?? [];
  const currentQuestion = activeQuestions[currentIndex];
  const exportExam = exams.find((exam) => exam.id === exportExamId);
  const editingQuestion = questions.find((question) => question.id === editingQuestionId);
  const duplicateExamRecord = exams.find((exam) => exam.id === duplicateExamId);
  const editingExam = exams.find((exam) => exam.id === editingExamId);

  const topicStats = useMemo(() => {
    const statMap = new Map<string, { correct: number; total: number }>();
    completedAttempts.forEach((attempt) => attempt.questionIds.forEach((id) => {
      const question = questionById.get(id);
      if (!question) return;
      const current = statMap.get(question.topic) ?? { correct: 0, total: 0 };
      current.total += 1;
      if (attempt.answers[id] === question.correctOption) current.correct += 1;
      statMap.set(question.topic, current);
    }));
    return Array.from(statMap.entries()).map(([topic, stat]) => ({ topic, ...stat, rate: Math.round((stat.correct / stat.total) * 100) })).sort((a, b) => a.rate - b.rate);
  }, [completedAttempts, questionById]);

  const startSimulation = async () => {
    if (!candidates.length) return;
    const selected = [...candidates].sort(() => Math.random() - 0.5).slice(0, Math.min(amount, candidates.length));
    const attempt = await createAttempt(title.trim() || "Simulado personalizado", selected.map((question) => question.id));
    setActiveAttemptId(attempt.id);
    setCurrentIndex(0);
    setScreen("taking");
  };

  const finishCurrent = async () => {
    if (!activeAttempt) return;
    const finished = await finishAttempt(activeAttempt.id);
    if (!finished) return;
    setResultAttemptId(finished.id);
    setScreen("result");
  };

  const addNewExam = async (data: QuizExamInput) => {
    const exam = await addExam(data);
    setExamModalOpen(false);
    setExamFilter(exam.id);
  };
  const saveExamEdits = async (data: QuizExamInput) => {
    if (!editingExamId) return;
    await updateExam(editingExamId, data);
    setEditingExamId(null);
  };
  const duplicateSelectedExam = async (examId: string, title: string) => {
    const duplicate = await duplicateExam(examId, title);
    if (duplicate) {
      setDuplicateExamId(null);
      setExamFilter(duplicate.id);
    }
  };
  const requestExamRemoval = (exam: QuizExam) => {
    const questionCount = questions.filter((question) => question.examId === exam.id).length;
    setDeleteTarget({ kind: "exam", exam, questionCount });
  };
  const confirmDeletion = async () => {
    const target = deleteTarget;
    if (!target) return;
    if (target.kind === "exam") {
      await deleteExam(target.exam.id);
      if (examFilter === target.exam.id) setExamFilter("all");
      if (exportExamId === target.exam.id) {
        setExportExamId(null);
        setExportModalOpen(false);
      }
      return;
    }
    if (target.kind === "question") {
      await deleteQuestion(target.question.id);
      return;
    }
    await deleteQuestions(target.questionIds);
  };
  const saveQuestionPlacement = async (questionId: string, examId: string, order?: number) => {
    await updateQuestion(questionId, { examId, order, examName: exams.find((exam) => exam.id === examId)?.title });
    setEditingQuestionId(null);
  };
  const addNewQuestion = async (data: QuizQuestionInput) => {
    await addQuestion(data);
    setQuestionModalOpen(false);
  };
  const importPdfQuestions = async (items: QuizQuestionInput[]) => {
    for (const item of items) await addQuestion(item);
    setPdfModalOpen(false);
  };

  if (screen === "setup") {
    return (
      <div className="h-full overflow-y-auto retro-scrollbar paper-page p-5 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setScreen("home")} className="text-retro-blue text-[14px] hover:underline mb-4">← voltar para simulados</button>
          <h1 className="text-2xl font-bold text-retro-text">Montar um simulado</h1>
          <p className="text-retro-comment mt-1">Escolha o recorte. As questões serão sorteadas da sua biblioteca.</p>
          <RetroCard accent="blue" className="mt-6 space-y-5">
            <label className="block text-[14px] text-retro-text-dim">Nome do simulado
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="retro-input mt-1" />
            </label>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="text-[14px] text-retro-text-dim">Prova/vaga
                <select value={examFilter} onChange={(event) => { setExamFilter(event.target.value); setSubjectFilter("all"); setTopicFilter("all"); }} className="retro-input mt-1">
                  <option value="all">todas as provas</option>
                  {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                </select>
              </label>
              <label className="text-[14px] text-retro-text-dim">Disciplina
                <select value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setTopicFilter("all"); }} className="retro-input mt-1">
                  <option value="all">todas as disciplinas</option>
                  {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                </select>
              </label>
              <label className="text-[14px] text-retro-text-dim">Tópico
                <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="retro-input mt-1">
                  <option value="all">todos os tópicos</option>
                  {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-[14px] text-retro-text-dim">Quantidade de questões
              <input min="1" max={Math.max(candidates.length, 1)} type="number" value={amount} onChange={(event) => setAmount(Math.max(1, Number(event.target.value)))} className="retro-input mt-1 max-w-xs" />
            </label>
            <div className="p-4 border-2 border-dashed border-retro-border rounded-wobbly bg-retro-panelHover text-[14px] text-retro-text-dim">
              <strong className="text-retro-text">{candidates.length} questões disponíveis</strong> para esse filtro. O simulado terá {Math.min(amount, candidates.length)} questão(ões).
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <RetroButton onClick={() => setQuestionModalOpen(true)} icon={<Plus size={15} />}>cadastrar questão</RetroButton>
              <RetroButton variant="primary" disabled={!candidates.length} onClick={startSimulation} icon={<Target size={15} />}>começar simulado</RetroButton>
            </div>
          </RetroCard>
        </div>
        <RetroModal open={questionModalOpen} onClose={() => setQuestionModalOpen(false)} title="Nova questão" subtitle="Cadastre uma questão e seu gabarito para usá-la nos simulados." size="xl" icon={<CircleHelp size={16} />}><QuestionForm exams={exams} defaultExamId={examFilter === "all" ? undefined : examFilter} onSubmit={addNewQuestion} onCancel={() => setQuestionModalOpen(false)} /></RetroModal>
      <RetroModal open={examModalOpen} onClose={() => setExamModalOpen(false)} title="Nova prova/vaga" subtitle="Crie o pai que receberá as questões." size="lg" icon={<BookOpenCheck size={16} />}><ExamForm onSubmit={addNewExam} onCancel={() => setExamModalOpen(false)} /></RetroModal>
      <RetroModal open={Boolean(editingExam)} onClose={() => setEditingExamId(null)} title="Editar prova/vaga" subtitle="Atualize os dados do agrupador sem mexer nas questões." size="lg" icon={<Pencil size={16} />}><ExamForm key={editingExamId ?? "none"} exam={editingExam} onSubmit={saveExamEdits} onCancel={() => setEditingExamId(null)} /></RetroModal>
      <DuplicateExamModal key={duplicateExamId ?? "none"} open={Boolean(duplicateExamRecord)} exam={duplicateExamRecord} onClose={() => setDuplicateExamId(null)} onSave={duplicateSelectedExam} />
      <PdfImportModal exams={exams} open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} onImport={importPdfQuestions} />
      <ExportModal open={exportModalOpen} exam={exportExam} questions={questions.filter((question) => question.examId === exportExamId).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))} onClose={() => setExportModalOpen(false)} />
      <QuestionPlacementModal key={editingQuestionId ?? "none"} open={Boolean(editingQuestion)} question={editingQuestion} exams={exams} onClose={() => setEditingQuestionId(null)} onSave={saveQuestionPlacement} />
      <DeleteConfirmModal key={deleteTarget ? `${deleteTarget.kind}-${deleteTarget.kind === "exam" ? deleteTarget.exam.id : deleteTarget.kind === "question" ? deleteTarget.question.id : deleteTarget.questionIds.join("-")}` : "none"} open={Boolean(deleteTarget)} title={deleteTarget?.kind === "exam" ? "Excluir prova/vaga" : deleteTarget?.kind === "legacy" ? "Excluir questões antigas" : "Excluir questão"} message={deleteTarget?.kind === "exam" ? `Excluir "${deleteTarget.exam.title}"?` : deleteTarget?.kind === "legacy" ? "Excluir todas as questões antigas sem prova?" : "Excluir esta questão antiga?"} detail={deleteTarget?.kind === "exam" ? `${deleteTarget.questionCount} questão(ões) vinculada(s) também serão removidas. Essa ação não pode ser desfeita.` : deleteTarget?.kind === "legacy" ? `${deleteTarget.questionIds.length} questão(ões) serão removidas. Essa ação não pode ser desfeita.` : "A questão será removida da biblioteca. Essa ação não pode ser desfeita."} onClose={() => setDeleteTarget(null)} onConfirm={confirmDeletion} />
      </div>
    );
  }

  if (screen === "taking" && activeAttempt && currentQuestion) {
    const answered = activeAttempt.answers[currentQuestion.id];
    return (
      <div className="h-full overflow-y-auto retro-scrollbar paper-page p-5 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between gap-3 flex-wrap items-start mb-5">
            <div><p className="text-retro-comment text-[13px]">{activeAttempt.title}</p><h1 className="text-xl font-bold text-retro-text">Questão {currentIndex + 1} de {activeQuestions.length}</h1></div>
            <RetroButton variant="primary" onClick={finishCurrent} icon={<CheckCircle2 size={15} />}>finalizar e corrigir</RetroButton>
          </div>
          <div className="h-2.5 bg-retro-panel border border-retro-border rounded overflow-hidden mb-6"><div className="h-full bg-retro-blue transition-all" style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }} /></div>
          <RetroCard accent="blue" className="!p-6 md:!p-8">
            <div className="flex gap-2 flex-wrap mb-4"><RetroBadge tone="blue">{currentQuestion.subject}</RetroBadge><RetroBadge tone="default">{currentQuestion.topic}</RetroBadge>{currentQuestion.examName && <RetroBadge tone="purple">{currentQuestion.examName}</RetroBadge>}</div>
            <QuestionContent value={currentQuestion.statement} />
            <VisualReference question={currentQuestion} />
            <div className="mt-7 space-y-3">
              {currentQuestion.options.map((option) => (
                <button key={option.id} onClick={() => saveAnswer(activeAttempt.id, currentQuestion.id, option.id)} className={`w-full text-left p-4 border-2 rounded-wobbly transition-colors ${answered === option.id ? "border-retro-blue bg-retro-blue/10" : "border-retro-border bg-retro-panel hover:bg-retro-panelHover"}`}>
                  <span className="font-bold text-retro-blue mr-3">{option.id}.</span><OptionContent value={option.text} />
                </button>
              ))}
            </div>
            <QuestionNotes key={currentQuestion.id} question={currentQuestion} onSave={(notes) => updateQuestion(currentQuestion.id, { notes })} />
          </RetroCard>
          <div className="flex justify-between mt-5"><RetroButton disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>← anterior</RetroButton><RetroButton disabled={currentIndex === activeQuestions.length - 1} onClick={() => setCurrentIndex((index) => index + 1)}>próxima →</RetroButton></div>
        </div>
      </div>
    );
  }

  if (screen === "result" && resultAttempt) {
    const resultQuestions = resultAttempt.questionIds.map((id) => questionById.get(id)).filter((question): question is QuizQuestion => Boolean(question));
    const score = resultQuestions.length ? Math.round(((resultAttempt.correctCount ?? 0) / resultQuestions.length) * 100) : 0;
    const unanswered = resultQuestions.filter((question) => !resultAttempt.answers[question.id]).length;
    const wrong = resultQuestions.length - (resultAttempt.correctCount ?? 0) - unanswered;
    const resultTopicStats = Array.from(resultQuestions.reduce((map, question) => { const current = map.get(question.topic) ?? { total: 0, correct: 0 }; current.total += 1; if (resultAttempt.answers[question.id] === question.correctOption) current.correct += 1; map.set(question.topic, current); return map; }, new Map<string, { total: number; correct: number }>()).entries()).map(([topic, stat]) => ({ topic, ...stat, rate: Math.round((stat.correct / stat.total) * 100) }));
    return (
      <div className="h-full overflow-y-auto retro-scrollbar paper-page p-5 md:p-8"><div className="max-w-4xl mx-auto">
        <div className="flex justify-between gap-3 flex-wrap"><div><p className="text-retro-comment text-[13px]">resultado · {resultAttempt.title}</p><h1 className="text-2xl font-bold text-retro-text">Simulado corrigido</h1></div><RetroButton variant="primary" onClick={() => setScreen("home")} icon={<RotateCcw size={15} />}>voltar aos simulados</RetroButton></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"><RetroCard accent="green"><p className="text-retro-comment text-[13px]">aproveitamento</p><p className="text-3xl font-bold text-retro-green">{score}%</p></RetroCard><RetroCard accent="blue"><p className="text-retro-comment text-[13px]">acertos</p><p className="text-3xl font-bold text-retro-blue">{resultAttempt.correctCount ?? 0}</p></RetroCard><RetroCard accent="orange"><p className="text-retro-comment text-[13px]">erros</p><p className="text-3xl font-bold text-retro-orange">{wrong}</p></RetroCard><RetroCard accent="purple"><p className="text-retro-comment text-[13px]">não respondidas</p><p className="text-3xl font-bold text-retro-purple">{unanswered}</p><p className="text-retro-comment text-[12px] mt-1">tempo: {formatDuration(resultAttempt.durationSeconds)}</p></RetroCard></div>
        {resultTopicStats.length > 0 && <section className="mt-7"><h2 className="font-bold text-retro-text mb-3">Desempenho por tópico</h2><div className="grid sm:grid-cols-2 gap-3">{resultTopicStats.map((stat) => <RetroCard key={stat.topic} accent={scoreTone(stat.rate)} className="!p-4"><div className="flex justify-between gap-3"><span className="text-retro-text">{stat.topic}</span><strong className="text-retro-blue">{stat.rate}%</strong></div><p className="text-retro-comment text-[12px] mt-1">{stat.correct}/{stat.total} acertos</p></RetroCard>)}</div></section>}
        <h2 className="font-bold text-retro-text mt-8 mb-3">Correção comentada</h2>
        <div className="space-y-4">{resultQuestions.map((question, index) => { const answer = resultAttempt.answers[question.id]; const correct = answer === question.correctOption; return <RetroCard key={question.id} accent={correct ? "green" : "orange"} className="!p-5"><div className="flex justify-between gap-3"><span className="font-semibold text-retro-text">{index + 1}. {question.topic}</span>{correct ? <span className="text-retro-green inline-flex gap-1"><CheckCircle2 size={16} /> acertou</span> : <span className="text-retro-red inline-flex gap-1"><XCircle size={16} /> errou</span>}</div><QuestionContent value={question.statement} compact /><VisualReference question={question} /><QuestionNotes question={question} onSave={(notes) => updateQuestion(question.id, { notes })} /><div className="mt-3 text-[14px]"><span className="text-retro-comment">Sua resposta: </span><strong className={correct ? "text-retro-green" : "text-retro-red"}>{answer ?? "não respondida"}</strong><span className="text-retro-comment ml-4">Gabarito: </span><strong className="text-retro-green">{question.correctOption}</strong></div>{question.explanation && <div className="mt-4 p-3 bg-retro-panelHover border-l-4 border-retro-blue text-retro-text-dim text-[14px]"><strong className="text-retro-text">Explicação: </strong>{question.explanation}</div>}{question.sourceName && <p className="mt-3 text-[12px] text-retro-comment">Fonte: {question.sourceName}{question.sourcePage ? ` · pág. ${question.sourcePage}` : ""}</p>}</RetroCard>; })}</div>
      </div></div>
    );
  }

  return (
    <div className="h-full overflow-y-auto retro-scrollbar paper-page p-5 md:p-8"><div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap"><div><p className="text-retro-blue text-[13px] font-semibold">BANCO DE QUESTÕES</p><h1 className="text-3xl font-bold text-retro-text">Provas e simulados</h1><p className="text-retro-comment mt-1">Crie simulados com suas provas, acompanhe erros e encontre os tópicos que pedem revisão.</p></div><div className="flex gap-2 flex-wrap"><RetroButton onClick={() => setExamModalOpen(true)} icon={<Plus size={15} />}>nova prova/vaga</RetroButton><RetroButton onClick={() => setPdfModalOpen(true)} disabled={!exams.length} icon={<Upload size={15} />}>importar PDFs</RetroButton><RetroButton disabled={!exams.length} onClick={() => setQuestionModalOpen(true)} icon={<Plus size={15} />}>nova questão</RetroButton><RetroButton variant="primary" disabled={!exams.length} onClick={() => setScreen("setup")} icon={<Target size={15} />}>novo simulado</RetroButton></div></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7"><RetroCard accent="blue"><ListChecks size={20} className="text-retro-blue" /><p className="text-3xl font-bold text-retro-text mt-2">{questions.length}</p><p className="text-retro-comment text-[13px]">questões cadastradas</p></RetroCard><RetroCard accent="green"><BarChart3 size={20} className="text-retro-green" /><p className="text-3xl font-bold text-retro-text mt-2">{overallRate}%</p><p className="text-retro-comment text-[13px]">acerto geral</p></RetroCard><RetroCard accent="orange"><BookOpenCheck size={20} className="text-retro-orange" /><p className="text-3xl font-bold text-retro-text mt-2">{completedAttempts.length}</p><p className="text-retro-comment text-[13px]">simulados concluídos</p></RetroCard><RetroCard accent="purple"><Clock3 size={20} className="text-retro-purple" /><p className="text-3xl font-bold text-retro-text mt-2">{totalAnswered}</p><p className="text-retro-comment text-[13px]">questões respondidas</p></RetroCard></div>
      {questions.length === 0 ? <RetroCard accent="orange" className="mt-6 text-center !py-10"><FileText size={42} className="text-retro-orange mx-auto" /><h2 className="font-bold text-retro-text text-lg mt-3">Sua biblioteca está vazia</h2><p className="text-retro-comment max-w-md mx-auto mt-1">Importe uma prova em PDF com o gabarito ou cadastre as questões manualmente. Depois, use a biblioteca para montar seus simulados.</p><div className="mt-5 flex gap-2 justify-center flex-wrap"><RetroButton onClick={() => setExamModalOpen(true)} icon={<Plus size={15} />}>nova prova/vaga</RetroButton><RetroButton onClick={() => setPdfModalOpen(true)} disabled={!exams.length} icon={<Upload size={15} />}>importar PDFs</RetroButton><RetroButton variant="primary" disabled={!exams.length} onClick={() => setQuestionModalOpen(true)} icon={<Plus size={15} />}>cadastrar questão</RetroButton></div></RetroCard> : <div className="grid lg:grid-cols-[1.25fr_.75fr] gap-6 mt-7"><section><div className="flex items-center justify-between gap-3 mb-3"><h2 className="font-bold text-retro-text">Provas e vagas</h2><span className="text-[12px] text-retro-comment">{exams.length} agrupador(es)</span></div><div className="space-y-3">{exams.map((exam) => { const examQuestions = questions.filter((question) => question.examId === exam.id); return <RetroCard key={exam.id} accent="blue" className="!p-4"><div className="flex justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-retro-text">{exam.title}</p><p className="text-retro-comment text-[13px] mt-1">{exam.contestName} · {exam.vacancy}{exam.proofVersion ? ` · ${exam.proofVersion}` : ""}</p><div className="flex gap-2 flex-wrap mt-2"><RetroBadge tone="blue">{examQuestions.length} questões</RetroBadge>{exam.board && <RetroBadge tone="default">{exam.board}</RetroBadge>}</div></div><div className="flex gap-1 shrink-0"><button onClick={() => { setExportExamId(exam.id); setExportModalOpen(true); }} className="px-2 text-retro-blue hover:bg-retro-blue/10 rounded" title="Exportar prova">PDF</button><button onClick={() => setEditingExamId(exam.id)} className="p-2 text-retro-comment hover:text-retro-blue rounded" title="Editar prova/vaga" aria-label="Editar prova/vaga"><Pencil size={15} /></button><button onClick={() => setDuplicateExamId(exam.id)} className="px-2 text-retro-comment hover:text-retro-blue rounded" title="Duplicar prova">duplicar</button><button onClick={() => requestExamRemoval(exam)} className="p-2 text-retro-orange hover:bg-retro-orange/10 rounded" title="Excluir prova/vaga" aria-label="Excluir prova/vaga"><Trash2 size={15} /></button></div></div><div className="flex justify-end gap-2 mt-3"><RetroButton onClick={() => { setExamFilter(exam.id); setSubjectFilter("all"); setTopicFilter("all"); setScreen("setup"); }} icon={<Target size={14} />}>montar simulado</RetroButton><RetroButton onClick={() => { setExamFilter(exam.id); setQuestionModalOpen(true); }} icon={<Plus size={14} />}>cadastrar questão</RetroButton></div></RetroCard>; })}</div>{questions.some((question) => !question.examId) && (() => { const legacyQuestions = questions.filter((question) => !question.examId); return <RetroCard accent="orange" className="!p-4 mt-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-retro-text">Questões antigas sem prova</p><p className="text-[13px] text-retro-comment mt-1">Vincule cada questão a uma prova/vaga para ela entrar nos simulados e na exportação.</p></div><div className="flex items-center gap-2"><RetroBadge tone="default">{legacyQuestions.length}</RetroBadge><button onClick={() => setDeleteTarget({ kind: "legacy", questionIds: legacyQuestions.map((question) => question.id) })} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] text-retro-orange hover:bg-retro-orange/10" title="Excluir todas as questões antigas"><Trash2 size={13} /> excluir todas</button></div></div><div className="mt-3 space-y-2">{legacyQuestions.slice(0, 20).map((question) => <div key={question.id} className="flex items-start justify-between gap-3 rounded-wobbly border border-retro-border bg-retro-panelHover p-3"><div className="min-w-0"><p className="text-[12px] text-retro-orange font-semibold">Questão {question.order ?? "—"} · {question.topic}</p><p className="text-[13px] text-retro-text line-clamp-2 mt-1">{question.statement}</p></div><div className="flex gap-1 shrink-0"><button onClick={() => setEditingQuestionId(question.id)} className="p-2 text-retro-blue hover:bg-retro-blue/10 rounded" title="Editar e vincular questão" aria-label="Editar e vincular questão"><Pencil size={15} /></button><button onClick={() => setDeleteTarget({ kind: "question", question })} className="p-2 text-retro-orange hover:bg-retro-orange/10 rounded" title="Excluir questão" aria-label="Excluir questão"><Trash2 size={15} /></button></div></div>)}</div>{legacyQuestions.length > 20 && <p className="text-[12px] text-retro-comment mt-3">Mostrando 20 de {legacyQuestions.length}. Vincule ou exclua algumas para continuar.</p>}</RetroCard>; })()}</section><section><h2 className="font-bold text-retro-text mb-3">Tópicos que merecem revisão</h2>{topicStats.length ? <div className="space-y-3">{topicStats.slice(0, 5).map((stat) => <RetroCard key={stat.topic} accent={scoreTone(stat.rate)} className="!p-4"><div className="flex justify-between gap-3"><span className="text-retro-text font-medium">{stat.topic}</span><strong className={stat.rate >= 70 ? "text-retro-green" : "text-retro-orange"}>{stat.rate}%</strong></div><div className="mt-2 h-2 bg-retro-panelHover border border-retro-border rounded overflow-hidden"><div className={stat.rate >= 70 ? "h-full bg-retro-green" : "h-full bg-retro-orange"} style={{ width: `${stat.rate}%` }} /></div><p className="text-retro-comment text-[12px] mt-1">{stat.correct}/{stat.total} acertos</p></RetroCard>)}</div> : <RetroCard accent="purple" className="!p-5"><p className="text-retro-comment text-[14px]">Finalize seu primeiro simulado para ver o desempenho por tópico.</p></RetroCard>}</section></div>}
      {completedAttempts.length > 0 && <section className="mt-8"><h2 className="font-bold text-retro-text mb-3">Histórico recente</h2><div className="grid md:grid-cols-2 gap-3">{completedAttempts.slice(0, 4).map((attempt) => { const rate = attempt.questionIds.length ? Math.round(((attempt.correctCount ?? 0) / attempt.questionIds.length) * 100) : 0; return <RetroCard key={attempt.id} accent={scoreTone(rate)} className="!p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold text-retro-text">{attempt.title}</p><p className="text-retro-comment text-[13px]">{attempt.questionIds.length} questões · {formatDuration(attempt.durationSeconds)}</p></div><strong className="text-retro-blue text-xl">{rate}%</strong></div></RetroCard>; })}</div></section>}
      <RetroModal open={questionModalOpen} onClose={() => setQuestionModalOpen(false)} title="Nova questão" subtitle="Cadastre uma questão e seu gabarito para usá-la nos simulados." size="xl" icon={<CircleHelp size={16} />}><QuestionForm exams={exams} defaultExamId={examFilter === "all" ? undefined : examFilter} onSubmit={addNewQuestion} onCancel={() => setQuestionModalOpen(false)} /></RetroModal>
      <RetroModal open={examModalOpen} onClose={() => setExamModalOpen(false)} title="Nova prova/vaga" subtitle="Crie o pai que receberá as questões." size="lg" icon={<BookOpenCheck size={16} />}><ExamForm onSubmit={addNewExam} onCancel={() => setExamModalOpen(false)} /></RetroModal>
      <RetroModal open={Boolean(editingExam)} onClose={() => setEditingExamId(null)} title="Editar prova/vaga" subtitle="Atualize os dados do agrupador sem mexer nas questões." size="lg" icon={<Pencil size={16} />}><ExamForm key={editingExamId ?? "none"} exam={editingExam} onSubmit={saveExamEdits} onCancel={() => setEditingExamId(null)} /></RetroModal>
      <DuplicateExamModal key={duplicateExamId ?? "none"} open={Boolean(duplicateExamRecord)} exam={duplicateExamRecord} onClose={() => setDuplicateExamId(null)} onSave={duplicateSelectedExam} />
      <PdfImportModal exams={exams} open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} onImport={importPdfQuestions} />
      <ExportModal open={exportModalOpen} exam={exportExam} questions={questions.filter((question) => question.examId === exportExamId).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))} onClose={() => setExportModalOpen(false)} />
      <QuestionPlacementModal key={editingQuestionId ?? "none"} open={Boolean(editingQuestion)} question={editingQuestion} exams={exams} onClose={() => setEditingQuestionId(null)} onSave={saveQuestionPlacement} />
      <DeleteConfirmModal key={deleteTarget ? `${deleteTarget.kind}-${deleteTarget.kind === "exam" ? deleteTarget.exam.id : deleteTarget.kind === "question" ? deleteTarget.question.id : deleteTarget.questionIds.join("-")}` : "none"} open={Boolean(deleteTarget)} title={deleteTarget?.kind === "exam" ? "Excluir prova/vaga" : deleteTarget?.kind === "legacy" ? "Excluir questões antigas" : "Excluir questão"} message={deleteTarget?.kind === "exam" ? `Excluir "${deleteTarget.exam.title}"?` : deleteTarget?.kind === "legacy" ? "Excluir todas as questões antigas sem prova?" : "Excluir esta questão antiga?"} detail={deleteTarget?.kind === "exam" ? `${deleteTarget.questionCount} questão(ões) vinculada(s) também serão removidas. Essa ação não pode ser desfeita.` : deleteTarget?.kind === "legacy" ? `${deleteTarget.questionIds.length} questão(ões) serão removidas. Essa ação não pode ser desfeita.` : "A questão será removida da biblioteca. Essa ação não pode ser desfeita."} onClose={() => setDeleteTarget(null)} onConfirm={confirmDeletion} />
    </div></div>
  );
}














































