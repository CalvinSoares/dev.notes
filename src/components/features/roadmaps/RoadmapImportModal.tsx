import { useMemo, useState } from "react";
import { FilePlus2, FileText, Loader2 } from "lucide-react";
import { parseRoadmapImportText } from "@core/lib/roadmap";
import { readPdfText } from "@core/lib/pdf";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroModal } from "@/components/ui/RetroModal";

export function RoadmapImportModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (text: string, title: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("Trilha importada");
  const [readingPdf, setReadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(() => parseRoadmapImportText(text), [text]);

  const handlePdf = async (file: File | undefined) => {
    if (!file) return;
    setReadingPdf(true);
    setError(null);
    try {
      setText(await readPdfText(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível extrair o texto do PDF.");
    } finally {
      setReadingPdf(false);
    }
  };

  const importText = async () => {
    setSaving(true);
    setError(null);
    try {
      await onImport(text, title.trim() || "Trilha importada");
      setText("");
      setTitle("Trilha importada");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar a trilha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RetroModal
      open={open}
      onClose={onClose}
      title="Importar edital para a trilha"
      subtitle="Use um PDF textual ou cole o conteúdo. Revise o texto e o preview antes de criar os tópicos."
      icon={<FilePlus2 size={17} />}
      accent="blue"
      size="xl"
      footer={
        <>
          <RetroButton onClick={onClose}>cancelar</RetroButton>
          <RetroButton variant="primary" disabled={saving || readingPdf || !preview.length || !title.trim()} onClick={() => void importText()}>
            {saving ? "criando..." : "criar trilha"}
          </RetroButton>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-retro-blue/60 bg-retro-blue/5 cursor-pointer hover:bg-retro-blue/10">
          <FileText size={18} className="text-retro-blue shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] text-retro-text font-semibold">{readingPdf ? "Lendo PDF..." : "Selecionar PDF do edital"}</span>
            <span className="block mt-1 text-[11px] text-retro-comment">O texto extraído aparecerá abaixo para revisão.</span>
          </span>
          {readingPdf ? <Loader2 size={16} className="animate-spin text-retro-blue" /> : <span className="text-[11px] text-retro-blue">abrir</span>}
          <input className="sr-only" type="file" accept="application/pdf,.pdf" disabled={readingPdf} onChange={(event) => void handlePdf(event.target.files?.[0])} />
        </label>

        <label className="block text-[12px] text-retro-comment">
          Nome da trilha
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="retro-input w-full mt-1" placeholder="Ex.: Analista de Sistemas — Infraestrutura" />
        </label>

        <label className="block text-[12px] text-retro-comment">
          Texto do edital
          <textarea
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="retro-input w-full min-h-48 mt-1 font-mono text-[12px]"
            placeholder={"Ex.:\nPARTE 1: Infraestrutura\n1. Redes de computadores\nArquiteturas de rede\nTopologias de rede\n2. Linux\nShell Script"}
          />
        </label>

        <section className="rounded-lg border border-retro-border/70 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-retro-panelHover border-b border-retro-border/60">
            <div>
              <h3 className="text-[12px] text-retro-text font-semibold">Preview da trilha</h3>
              <p className="text-[11px] text-retro-comment">{preview.length + " itens reconhecidos"}</p>
            </div>
            {preview.length > 0 && <span className="text-[11px] text-retro-blue">{preview.filter((item) => item.depth === 0).length + " níveis principais"}</span>}
          </div>
          {preview.length > 0 ? (
            <div className="max-h-56 overflow-y-auto retro-scrollbar p-2 space-y-1">
              {preview.slice(0, 160).map((item, index) => (
                <div key={`${item.depth}-${index}`} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-retro-panelHover" style={{ paddingLeft: `${8 + Math.min(item.depth * 5, 56)}px` }}>
                  <span className={"shrink-0 text-[9px] uppercase tracking-wider " + (item.depth === 0 ? "text-retro-blue" : "text-retro-comment")}>{item.depth === 0 ? "parte" : "sub"}</span>
                  <span className="text-[12px] text-retro-text truncate">{item.title}</span>
                </div>
              ))}
              {preview.length > 160 && <p className="px-2 py-2 text-[11px] text-retro-comment">+ {preview.length - 160} itens não exibidos no preview.</p>}
            </div>
          ) : (
            <div className="p-5 text-center text-[12px] text-retro-comment">Cole o texto ou selecione um PDF para visualizar a estrutura reconhecida.</div>
          )}
        </section>

        <div className="p-3 rounded-lg border border-retro-border/60 bg-retro-panelHover text-[11px] text-retro-comment">
          A lista será adicionada à trilha selecionada. Se nenhuma existir, uma nova trilha será criada. Partes viram níveis principais, seções numeradas viram tópicos e linhas seguintes viram subtópicos. PDFs escaneados podem exigir OCR antes da importação.
        </div>
        {error && <p className="text-[12px] text-retro-red">{error}</p>}
      </div>
    </RetroModal>
  );
}