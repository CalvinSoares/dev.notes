import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Flag, Plus } from "lucide-react";
import { getRoadmapDescendantNodes, getRoadmapNodeProgress, buildRoadmapChildren } from "@core/lib/roadmap";
import type { StudyRoadmapNode } from "@core/types/roadmap";

export function ProgressBar({ value }: { value: number }) {
  return <div className="h-2 rounded-full border border-retro-border bg-retro-bg overflow-hidden"><div className="h-full bg-retro-blue transition-all" style={{ width: String(value) + "%" }} /></div>;
}

export function RoadmapTree({ nodes, selectedId, onSelect, onToggle, onMove, onAddChild }: {
  nodes: StudyRoadmapNode[];
  selectedId: string | null;
  onSelect: (node: StudyRoadmapNode) => void;
  onToggle: (node: StudyRoadmapNode) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onAddChild: (node: StudyRoadmapNode) => void;
}) {
  const children = useMemo(() => buildRoadmapChildren(nodes), [nodes]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(nodes.filter((node) => node.parentId === undefined).map((node) => node.id)));
  const render = (parentId?: string, depth = 0): JSX.Element[] => (children.get(parentId) ?? []).map((node) => {
    const nodeChildren = children.get(node.id) ?? [];
    const isExpanded = expanded.has(node.id);
    const progress = getRoadmapNodeProgress([node, ...getRoadmapDescendantNodes(node.id, nodes)]);
    return <div key={node.id}>
      <div className={"group flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors " + (selectedId === node.id ? "border-retro-blue bg-retro-blue/10" : "border-transparent hover:border-retro-border hover:bg-retro-panelHover")} style={{ marginLeft: String(depth * 20) + "px" }}>
        {nodeChildren.length > 0 ? <button type="button" className="text-retro-comment hover:text-retro-text" onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; })} aria-label={isExpanded ? "Recolher tópico" : "Expandir tópico"}>{isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button> : <span className="w-[15px]" />}
        <input type="checkbox" className="sketch-checkbox shrink-0" checked={node.completed} onChange={() => onToggle(node)} aria-label={"Concluir " + node.title} />
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(node)}><span className={"block truncate text-[14px] " + (node.completed ? "line-through text-retro-comment" : "text-retro-text")}>{node.priority && node.priority !== "none" && <Flag size={13} className={node.priority === "urgent" ? "inline mr-1 text-retro-red" : node.priority === "high" ? "inline mr-1 text-retro-orange" : node.priority === "medium" ? "inline mr-1 text-retro-yellow" : "inline mr-1 text-retro-blue"} fill="currentColor" aria-label={"Prioridade " + node.priority} />} {node.title}</span>{nodeChildren.length > 0 && <span className="block text-[10px] text-retro-comment">{progress.completed}/{progress.total} itens concluídos</span>}</button>
        <span className="text-[10px] uppercase tracking-wider text-retro-comment">{node.kind === "topic" ? "tópico" : "subtópico"}</span>
        <span className="hidden group-hover:flex items-center gap-0.5"><button type="button" className="p-1 text-retro-comment hover:text-retro-blue" onClick={(event) => { event.stopPropagation(); onAddChild(node); }} aria-label={"Adicionar subtópico em " + node.title} title="Adicionar subtópico"><Plus size={12} /></button><button type="button" className="p-1 text-retro-comment hover:text-retro-blue" onClick={(event) => { event.stopPropagation(); onMove(node.id, "up"); }} aria-label="Mover para cima"><ArrowUp size={12} /></button><button type="button" className="p-1 text-retro-comment hover:text-retro-blue" onClick={(event) => { event.stopPropagation(); onMove(node.id, "down"); }} aria-label="Mover para baixo"><ArrowDown size={12} /></button></span>
      </div>
      {isExpanded && render(node.id, depth + 1)}
    </div>;
  });
  return <div className="space-y-1">{render()}</div>;
}
