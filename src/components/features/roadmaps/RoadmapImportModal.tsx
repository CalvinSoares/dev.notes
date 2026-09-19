import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroModal } from "@/components/ui/RetroModal";

export function RoadmapImportModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <RetroModal
      open={open}
      onClose={onClose}
      title="Importar tópicos do edital"
      subtitle="Cole uma lista: linhas sem indentação viram tópicos e linhas indentadas viram subtópicos."
      icon={<FilePlus2 size={17} />}
      accent="blue"
      size="lg"
      footer={
        <>
          <RetroButton onClick={onClose}>cancelar</RetroButton>
          <RetroButton
            variant="primary"
            disabled={saving || !text.trim()}
            onClick={async () => {
              setSaving(true);
              await onImport(text);
              setSaving(false);
              setText("");
            }}
          >
            importar tópicos
          </RetroButton>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <textarea
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="retro-input w-full min-h-64 font-mono text-[12px]"
          placeholder={'Ex.:\nLíngua Portuguesa\n  Interpretação de textos\n  Gramática\nBanco de Dados\n  Modelo relacional'}
        />
        <p className="text-[11px] text-retro-comment">Dica: use dois espaços ou um marcador como “-” para indicar subtópicos.</p>
      </div>
    </RetroModal>
  );
}
