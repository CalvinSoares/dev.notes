import { useState } from "react";
import { FilePlus2, FileText, Loader2 } from "lucide-react";
import { readPdfText } from "@core/lib/pdf";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroModal } from "@/components/ui/RetroModal";

export function RoadmapImportModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (text: string, title: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("Trilha importada");
  const [readingPdf, setReadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      subtitle="Use um PDF textual ou cole o conteúdo. Revise o texto antes de criar os tópicos."
      icon={<FilePlus2 size={17} />}
      accent="blue"
      size="lg"
      footer={
        <>
          <RetroButton onClick={onClose}>cancelar</RetroButton>
          <RetroButton variant="primary" disabled={saving || readingPdf || !text.trim() || !title.trim()} onClick={() => void importText()}>
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
          Texto do edital
          <textarea
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="retro-input w-full min-h-64 mt-1 font-mono text-[12px]"
            placeholder={"Ex.:\nPARTE 1: Infraestrutura\n1. Redes de computadores\nArquiteturas de rede\nTopologias de rede\n2. Linux\nShell Script"}
          />
        </label>

        <div className="p-3 rounded-lg border border-retro-border/60 bg-retro-panelHover text-[11px] text-retro-comment">
          A lista será adicionada à trilha selecionada. Se nenhuma existir, uma nova trilha será criada. Partes viram níveis principais, seções numeradas viram tópicos e linhas seguintes viram subtópicos. PDFs escaneados podem exigir OCR antes da importação.
        </div>
        {error && <p className="text-[12px] text-retro-red">{error}</p>}
      </div>
    </RetroModal>
  );
}