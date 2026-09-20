import { useState, type FormEvent } from "react";
import { CheckCircle2, CircleHelp, FileText, Pencil, Plus, Save, Trash2, Upload } from "lucide-react";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroModal } from "@/components/ui/RetroModal";
import { detectProofVersion, parseQuestions, readAnswerKeyVariants, readPdfText, renderPdfPage, type ParsedPdfQuestion } from "@core/lib/pdf";
import type { QuestionOptionId, QuizExam, QuizQuestion, QuizQuestionOption } from "@core/types";

const optionIds: QuestionOptionId[] = ["A", "B", "C", "D", "E"];
import type { QuizExamInput, QuizQuestionInput } from "@/store/useQuizStore";
export function QuestionPlacementModal({ open, question, exams, onClose, onSave }: { open: boolean; question?: QuizQuestion; exams: QuizExam[]; onClose: () => void; onSave: (questionId: string, examId: string, order?: number) => Promise<void> }) {
  const [examId, setExamId] = useState(question?.examId ?? exams[0]?.id ?? "");
  const [order, setOrder] = useState(question?.order ? String(question.order) : "");
  if (!question) return null;
  return <RetroModal open={open} onClose={onClose} title="Vincular questão a uma prova" subtitle="Escolha o pai desta questão antiga." size="md" icon={<Pencil size={16} />}><div className="p-5 md:p-6 space-y-4"><div className="p-3 rounded-wobbly border border-retro-border bg-retro-panelHover text-[13px] text-retro-text-dim line-clamp-4">{question.statement}</div><label className="block text-[13px] text-retro-text-dim">Prova/vaga *<select required value={examId} onChange={(event) => setExamId(event.target.value)} className="retro-input mt-1"><option value="">selecione a prova/vaga</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label><label className="block text-[13px] text-retro-text-dim">Número/ordem da questão <input min="1" type="number" value={order} onChange={(event) => setOrder(event.target.value)} className="retro-input mt-1" placeholder="Ex.: 21" /></label><div className="flex justify-end gap-2 border-t border-retro-border pt-4"><RetroButton onClick={onClose}>cancelar</RetroButton><RetroButton variant="primary" disabled={!examId} onClick={() => void onSave(question.id, examId, order ? Number(order) : undefined)} icon={<Pencil size={14} />}>vincular questão</RetroButton></div></div></RetroModal>;
}
export function DeleteConfirmModal({ open, title, message, detail, onClose, onConfirm }: { open: boolean; title: string; message: string; detail?: string; onClose: () => void; onConfirm: () => Promise<void> }) {
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
export function QuestionNotes({ question, onSave }: { question: QuizQuestion; onSave: (notes: string) => Promise<void> }) {
  const [value, setValue] = useState(question.notes ?? "");
  const dirty = value !== (question.notes ?? "");
  return <details className="mt-5 border border-retro-border rounded-wobbly bg-retro-panel overflow-hidden" open={Boolean(question.notes)}><summary className="cursor-pointer px-4 py-3 text-[13px] font-medium text-retro-text hover:bg-retro-panelHover">Anotação desta questão <span className="font-normal text-retro-comment">(privada)</span></summary><div className="p-4 border-t border-retro-border"><textarea value={value} onChange={(event) => setValue(event.target.value)} className="retro-input min-h-24" placeholder="Escreva uma dúvida, macete ou ponto para revisar..." /><div className="flex justify-end mt-2"><RetroButton disabled={!dirty} onClick={() => void onSave(value.trim())} icon={<Save size={14} />}>salvar anotação</RetroButton></div></div></details>;
}
export function scoreTone(score: number): "green" | "yellow" | "red" {
  return score >= 70 ? "green" : score >= 50 ? "yellow" : "red";
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function exportExamPdf(exam: QuizExam, questions: QuizQuestion[], includeAnswerKey: boolean, includeExplanations: boolean, includeNotes: boolean) {
  const popup = window.open("", "_blank", "width=960,height=760");
  if (!popup) return;
  const body = questions.map((question, index) => `<article class="question"><h2>${question.order ?? index + 1}. ${escapeHtml(question.topic)}</h2><div class="statement">${escapeHtml(question.statement)}</div>${question.visualImages?.length || question.visualImage ? (question.visualImages ?? (question.visualImage ? [question.visualImage] : [])).map((image) => `<img class="visual" src="${image}" alt="Diagrama da questão" />`).join("") : ""}<ol type="A">${question.options.map((option) => `<li>${escapeHtml(option.text)}</li>`).join("")}</ol>${includeAnswerKey ? `<p class="answer"><strong>Gabarito:</strong> ${question.correctOption}</p>` : ""}${includeExplanations && question.explanation ? `<p class="explanation"><strong>Explicação:</strong> ${escapeHtml(question.explanation)}</p>` : ""}${includeNotes && question.notes ? `<p class="notes"><strong>Anotação:</strong> ${escapeHtml(question.notes)}</p>` : ""}</article>`).join("");
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(exam.title)}</title><style>@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;color:#17202a;line-height:1.45}h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:20px 0 8px;border-bottom:1px solid #cbd5e1;padding-bottom:4px}.meta{color:#475569;margin-bottom:22px}.question{break-inside:avoid}.statement{white-space:pre-wrap;font-size:14px}.question ol{padding-left:28px}.question li{margin:7px 0;white-space:pre-wrap}.visual{display:block;max-width:100%;max-height:420px;margin:12px auto;object-fit:contain}.answer{color:#047857}.explanation{background:#f1f5f9;padding:9px}.notes{background:#fff7ed;padding:9px}@media print{button{display:none}}</style></head><body><h1>${escapeHtml(exam.title)}</h1><p class="meta">${escapeHtml(exam.contestName)} · ${escapeHtml(exam.vacancy)}${exam.proofVersion ? ` · ${escapeHtml(exam.proofVersion)}` : ""}<br>${questions.length} questões</p>${body}</body></html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 350);
}

export function ExportModal({ open, exam, questions, onClose }: { open: boolean; exam?: QuizExam; questions: QuizQuestion[]; onClose: () => void }) {
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [includeExplanations, setIncludeExplanations] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);
  if (!exam) return null;
  return <RetroModal open={open} onClose={onClose} title="Exportar prova em PDF" subtitle="O navegador abrirá a impressão para você salvar como PDF." size="md" icon={<FileText size={16} />}><div className="p-5 md:p-6 space-y-4"><div className="p-3 rounded-wobbly border border-retro-border bg-retro-panelHover text-[13px] text-retro-text-dim"><strong className="text-retro-text">{exam.title}</strong><br />{questions.length} questões serão exportadas na ordem da prova.</div><label className="flex items-center gap-3 text-[14px] text-retro-text-dim"><input type="checkbox" checked={includeAnswerKey} onChange={(event) => setIncludeAnswerKey(event.target.checked)} /> incluir gabarito</label><label className="flex items-center gap-3 text-[14px] text-retro-text-dim"><input type="checkbox" checked={includeExplanations} onChange={(event) => setIncludeExplanations(event.target.checked)} /> incluir explicações</label><label className="flex items-center gap-3 text-[14px] text-retro-text-dim"><input type="checkbox" checked={includeNotes} onChange={(event) => setIncludeNotes(event.target.checked)} /> incluir anotações</label><div className="flex justify-end gap-2 border-t border-retro-border pt-4"><RetroButton onClick={onClose}>cancelar</RetroButton><RetroButton variant="primary" disabled={!questions.length} onClick={() => { exportExamPdf(exam, questions, includeAnswerKey, includeExplanations, includeNotes); onClose(); }} icon={<Upload size={15} />}>abrir impressão</RetroButton></div></div></RetroModal>;
}
export function DuplicateExamModal({ open, exam, onClose, onSave }: { open: boolean; exam?: QuizExam; onClose: () => void; onSave: (examId: string, title: string) => Promise<void> }) {
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
export function ExamForm({ exam, onSubmit, onCancel }: { exam?: QuizExam; onSubmit: (data: QuizExamInput) => Promise<void>; onCancel: () => void }) {
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
export function QuestionForm({ onSubmit, onCancel, exams, defaultExamId, question }: { onSubmit: (data: QuizQuestionInput) => Promise<void>; onCancel: () => void; exams: QuizExam[]; defaultExamId?: string; question?: QuizQuestion }) {
  const [statement, setStatement] = useState(question?.statement ?? "");
  const [examId, setExamId] = useState(question?.examId ?? defaultExamId ?? exams[0]?.id ?? "");
  const [subject, setSubject] = useState(question?.subject ?? "");
  const [topic, setTopic] = useState(question?.topic ?? "");
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [notes, setNotes] = useState(question?.notes ?? "");
  const [sourceName, setSourceName] = useState(question?.sourceName ?? "");
  const [sourcePage, setSourcePage] = useState(question?.sourcePage ? String(question.sourcePage) : "");
  const [order, setOrder] = useState(question?.order ? String(question.order) : "");
  const [correctOption, setCorrectOption] = useState<QuestionOptionId>(question?.correctOption ?? "A");
  const [options, setOptions] = useState<Record<QuestionOptionId, string>>(() => Object.fromEntries(optionIds.map((id) => [id, question?.options.find((option) => option.id === id)?.text ?? ""])) as Record<QuestionOptionId, string>);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(question);

  const updateOption = (id: QuestionOptionId, value: string) => setOptions((current) => ({ ...current, [id]: value }));
  const filledOptions = optionIds.filter((id) => options[id].trim());
  const canSave = Boolean(examId && statement.trim() && subject.trim() && topic.trim() && filledOptions.length >= 2 && options[correctOption].trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    const cleanOptions = optionIds.map((id) => ({ id, text: options[id].trim() })).filter((option) => option.text);
    setSaving(true);
    try {
      await onSubmit({
        statement: statement.trim(),
        options: cleanOptions,
        correctOption,
        notes: notes.trim() || undefined,
        explanation: explanation.trim() || undefined,
        examId,
        order: order ? Number(order) : undefined,
        examName: exams.find((exam) => exam.id === examId)?.title,
        subject: subject.trim(),
        topic: topic.trim(),
        sourceName: sourceName.trim() || undefined,
        sourcePage: sourcePage ? Number(sourcePage) : undefined,
        visualImage: question?.visualImage,
        visualImages: question?.visualImages,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id="quiz-question-form" onSubmit={submit} className="p-5 md:p-6 space-y-6">
      <div className="flex gap-3 items-start p-4 bg-retro-panelHover border border-retro-border rounded-wobbly text-[13px] text-retro-text-dim">
        <CircleHelp size={18} className="text-retro-blue shrink-0 mt-0.5" />
        <p>{editing ? "Atualize qualquer parte da questão, inclusive a prova, o gabarito e a ordem em que ela aparece." : "Preencha o contexto, o enunciado e pelo menos duas alternativas. Escolha a resposta correta clicando na letra da alternativa."}</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-retro-text">Contexto da questão</h3><span className="text-[12px] text-retro-comment">campos com * são obrigatórios</span></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] text-retro-text-dim sm:col-span-2">Prova/vaga *<select required value={examId} onChange={(event) => setExamId(event.target.value)} className="retro-input mt-1"><option value="">selecione a prova/vaga</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label>
          <label className="text-[13px] text-retro-text-dim">Disciplina *<input required value={subject} onChange={(event) => setSubject(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Conhecimentos específicos" /></label>
          <label className="text-[13px] text-retro-text-dim">Tópico *<input required value={topic} onChange={(event) => setTopic(event.target.value)} className="retro-input mt-1" placeholder="Ex.: Redes TCP/IP" /></label>
          <label className="text-[13px] text-retro-text-dim">Arquivo de origem<input value={sourceName} onChange={(event) => setSourceName(event.target.value)} className="retro-input mt-1" placeholder="Ex.: prova-ufrrj.pdf" /></label>
          <label className="text-[13px] text-retro-text-dim">Página do PDF<input min="1" type="number" value={sourcePage} onChange={(event) => setSourcePage(event.target.value)} className="retro-input mt-1" placeholder="Ex.: 12" /></label>
          <label className="text-[13px] text-retro-text-dim">Número da questão<input min="1" type="number" value={order} onChange={(event) => setOrder(event.target.value)} className="retro-input mt-1" placeholder="Ex.: 39" /></label>
        </div>
      </section>

      <label className="block text-[13px] text-retro-text-dim">Enunciado *<textarea required value={statement} onChange={(event) => setStatement(event.target.value)} className="retro-input mt-1 min-h-36 leading-relaxed" placeholder="Cole ou escreva a questão aqui." /></label>

      <fieldset className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><legend className="font-semibold text-retro-text">Alternativas *</legend><span className="text-[12px] text-retro-comment">{filledOptions.length}/5 preenchidas · selecione o gabarito</span></div>
        <div className="space-y-2.5">
          {optionIds.map((id) => {
            const isCorrect = correctOption === id;
            return <div key={id} className={"flex min-w-0 items-stretch gap-2 overflow-hidden rounded-wobbly border-2 p-2 transition-colors " + (isCorrect ? "border-retro-green bg-retro-green/10" : "border-retro-border bg-retro-panel")}>
              <label className={"flex w-11 shrink-0 cursor-pointer items-center justify-center rounded font-bold transition-colors " + (isCorrect ? "bg-retro-green text-retro-bgDark" : "bg-retro-panelHover text-retro-blue hover:bg-retro-blue/15")} title={"Marcar " + id + " como correta"}>
                <input type="radio" name="correct-option" value={id} checked={isCorrect} onChange={() => setCorrectOption(id)} className="sr-only" />
                {id}
              </label>
              <input value={options[id]} onChange={(event) => updateOption(id, event.target.value)} className="retro-input min-w-0 w-0 flex-1 !border-0 !bg-transparent focus:!ring-0" placeholder={"Texto da alternativa " + id} />
              <span className="hidden w-16 shrink-0 items-center justify-center px-1 text-center text-[12px] font-semibold text-retro-green sm:flex">{isCorrect ? "gabarito" : ""}</span>
            </div>;
          })}
        </div>
      </fieldset>

      <details className="group border border-retro-border rounded-wobbly bg-retro-panel overflow-hidden">
        <summary className="cursor-pointer px-4 py-3 text-[13px] font-medium text-retro-text hover:bg-retro-panelHover">Adicionar explicação do gabarito <span className="font-normal text-retro-comment">(opcional)</span></summary>
        <div className="px-4 pb-4"><textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} className="retro-input min-h-24" placeholder="Explique por que a alternativa correta é a resposta." /></div>
      </details>

      <details className="group border border-retro-border rounded-wobbly bg-retro-panel overflow-hidden" open={Boolean(notes)}>
        <summary className="cursor-pointer px-4 py-3 text-[13px] font-medium text-retro-text hover:bg-retro-panelHover">Anotação privada <span className="font-normal text-retro-comment">(opcional)</span></summary>
        <div className="px-4 pb-4"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="retro-input min-h-24" placeholder="Macete, dúvida ou ponto para revisar." /></div>
      </details>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-retro-border pt-4">
        <p className="text-[12px] text-retro-comment">{canSave ? (editing ? "Tudo certo para salvar as alterações." : "Tudo certo para salvar esta questão.") : "Inclua o enunciado, disciplina, tópico e duas alternativas."}</p>
        <div className="flex justify-end gap-2"><RetroButton type="button" onClick={onCancel}>cancelar</RetroButton><RetroButton type="submit" variant="primary" icon={editing ? <Save size={15} /> : <Plus size={15} />} disabled={saving || !canSave}>{saving ? "salvando..." : (editing ? "salvar alterações" : "salvar questão")}</RetroButton></div>
      </div>
    </form>
  );
}

export function parseQuickQuestionText(raw: string): { statement: string; options: QuizQuestionOption[] } {
  const normalized = raw.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").replace(/\\\s*/g, "\n").trim();
  const marker = /(?:^|\n|\s+)(?:\(([A-E])\)|([A-E])[.)])(?=\s|$)\s*/g;
  const matches = Array.from(normalized.matchAll(marker));
  if (!matches.length) return { statement: normalized, options: [] };
  const firstIndex = matches[0].index ?? 0;
  const statement = normalized.slice(0, firstIndex).trim();
  const options = matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? normalized.length) : normalized.length;
    const optionId = (match[1] ?? match[2]).toUpperCase() as QuestionOptionId;
    return { id: optionId, text: normalized.slice(start, end).trim() };
  }).filter((option) => option.text);
  return { statement, options };
}

export function QuickQuestionForm({ onSubmit, onCancel, exams, defaultExamId }: { onSubmit: (data: QuizQuestionInput) => Promise<void>; onCancel: () => void; exams: QuizExam[]; defaultExamId?: string }) {
  const [rawText, setRawText] = useState("");
  const [examId, setExamId] = useState(defaultExamId ?? exams[0]?.id ?? "");
  const [subject, setSubject] = useState("Conhecimentos específicos");
  const [topic, setTopic] = useState("Revisão rápida");
  const [correctOption, setCorrectOption] = useState<QuestionOptionId>("A");
  const [saving, setSaving] = useState(false);
  const parsed = parseQuickQuestionText(rawText);
  const validCorrectOption = parsed.options.some((option) => option.id === correctOption);
  const canSave = Boolean(examId && subject.trim() && topic.trim() && parsed.statement && parsed.options.length >= 2 && validCorrectOption);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await onSubmit({
        examId,
        statement: parsed.statement,
        options: parsed.options,
        correctOption,
        subject: subject.trim(),
        topic: topic.trim(),
        examName: exams.find((exam) => exam.id === examId)?.title,
      });
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={submit} className="p-5 md:p-6 space-y-5">
    <div className="flex gap-3 items-start rounded-wobbly border border-retro-blue/40 bg-retro-blue/10 p-4 text-[13px] text-retro-text-dim">
      <CircleHelp size={18} className="mt-0.5 shrink-0 text-retro-blue" />
      <p>Cole o enunciado completo com as alternativas no formato <strong className="text-retro-text">(A) texto</strong>, <strong className="text-retro-text">A) texto</strong> ou <strong className="text-retro-text">A. texto</strong>. O sistema separa as partes e mostra uma prévia antes de salvar.</p>
    </div>
    <label className="block text-[13px] text-retro-text-dim">Texto da questão *<textarea autoFocus required value={rawText} onChange={(event) => setRawText(event.target.value)} className="retro-input mt-1 min-h-48 leading-relaxed" placeholder={"Enunciado...\n\n(A) Primeira alternativa\n(B) Segunda alternativa\n(C) Terceira alternativa\n(D) Quarta alternativa\n(E) Quinta alternativa"} /></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-[13px] text-retro-text-dim sm:col-span-2">Prova/vaga *<select required value={examId} onChange={(event) => setExamId(event.target.value)} className="retro-input mt-1"><option value="">selecione a prova/vaga</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label>
      <label className="text-[13px] text-retro-text-dim">Disciplina<input value={subject} onChange={(event) => setSubject(event.target.value)} className="retro-input mt-1" /></label>
      <label className="text-[13px] text-retro-text-dim">Tópico<input value={topic} onChange={(event) => setTopic(event.target.value)} className="retro-input mt-1" /></label>
    </div>
    <section className="rounded-wobbly border border-retro-border bg-retro-panel p-4">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-retro-text">Prévia reconhecida</h3><span className="text-[12px] text-retro-comment">{parsed.options.length} alternativa(s)</span></div>
      {parsed.statement ? <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-retro-text">{parsed.statement}</p> : <p className="mt-3 text-[13px] text-retro-comment">Cole um texto para visualizar o enunciado.</p>}
      {parsed.options.length > 0 && <div className="mt-3 space-y-2">{parsed.options.map((option) => <label key={option.id} className={"flex cursor-pointer items-start gap-2 rounded border p-2 text-[13px] " + (correctOption === option.id ? "border-retro-green bg-retro-green/10" : "border-retro-border")}><input type="radio" name="quick-correct-option" checked={correctOption === option.id} onChange={() => setCorrectOption(option.id)} className="mt-1" /><span><strong className="text-retro-blue">{option.id}.</strong> {option.text}</span></label>)}</div>}
    </section>
    <div className="flex flex-col-reverse gap-3 border-t border-retro-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[12px] text-retro-comment">{canSave ? "Tudo certo para cadastrar." : "Cole um enunciado com pelo menos duas alternativas e escolha o gabarito."}</p><div className="flex justify-end gap-2"><RetroButton type="button" onClick={onCancel}>cancelar</RetroButton><RetroButton type="submit" variant="primary" disabled={!canSave || saving} icon={<Plus size={15} />}>{saving ? "cadastrando..." : "cadastrar questão"}</RetroButton></div></div>
  </form>;
}
export function PdfImportModal({ open, onClose, onImport, exams }: { open: boolean; onClose: () => void; onImport: (questions: QuizQuestionInput[]) => Promise<void>; exams: QuizExam[] }) {
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
