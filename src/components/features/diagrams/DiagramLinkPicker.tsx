import { useState } from "react";
import { Link2 } from "lucide-react";
import { useDiagramStore } from "@/store/useDiagramStore";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroModal } from "@/components/ui/RetroModal";

export function DiagramLinkPicker({ selectedIds, onChange }: { selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const diagrams = useDiagramStore((state) => state.diagrams);
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  return <>
    <div className="flex items-center justify-between gap-2 border-t border-dashed border-retro-border/60 pt-3">
      <div><div className="text-[13px] font-semibold text-retro-text">Fluxogramas</div><div className="text-[11px] text-retro-comment">{selectedIds.length ? `${selectedIds.length} vinculado(s)` : "nenhum vinculado"}</div></div>
      <RetroButton type="button" variant="ghost" icon={<Link2 size={13} />} onClick={() => setOpen(true)}>vincular</RetroButton>
    </div>
    <RetroModal open={open} onClose={() => setOpen(false)} title="Vincular fluxogramas" subtitle="Escolha os desenhos relacionados a este conteúdo." accent="blue" size="md" footer={<RetroButton type="button" variant="primary" onClick={() => setOpen(false)}>concluir</RetroButton>}>
      <div className="p-5 space-y-2">
        {diagrams.map((diagram) => <label key={diagram.id} className="flex items-start gap-2 p-2 rounded border border-transparent hover:border-retro-border hover:bg-retro-panelHover cursor-pointer text-[13px] text-retro-text"><input type="checkbox" checked={selectedIds.includes(diagram.id)} onChange={() => toggle(diagram.id)} className="sketch-checkbox mt-0.5" /><span><span className="block font-semibold">{diagram.title}</span>{diagram.description && <span className="block text-[11px] text-retro-comment mt-0.5">{diagram.description}</span>}</span></label>)}
        {diagrams.length === 0 && <p className="text-[12px] text-retro-comment">Crie um fluxograma primeiro para poder vinculá-lo.</p>}
      </div>
    </RetroModal>
  </>;
}
