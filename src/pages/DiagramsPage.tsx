import { useEffect, useMemo, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  Handle,
  NodeResizer,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLayoutEffect } from "react";
import { Plus, Save, Trash2, GitBranch, Link2, Pencil, ArrowLeft } from "lucide-react";
import { useDiagramStore } from "@/store/useDiagramStore";
import { useStudyPhaseStore } from "@/store/useStudyPhaseStore";
import { useFlashcardStore } from "@/store/useFlashcardStore";
import { useLeetCodeStore } from "@/store/useLeetCodeStore";
import { useAppStore } from "@/store/useAppStore";
import { RetroButton } from "@/components/ui/RetroButton";
import { ConfirmDialog, RetroModal } from "@/components/ui/RetroModal";
import type { StudyDiagram } from "@core/types";

type DiagramNodeData = {
  label: string;
  kind?: "block" | "text";
  shape?: "rectangle" | "rounded" | "circle" | "diamond" | "note";
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
};

function BuilderNode({ id, data, selected }: { id: string; data: DiagramNodeData; selected?: boolean }) {
  const shape = data.shape ?? (data.kind === "text" ? "text" : "rectangle");
  const isText = data.kind === "text";
  const { updateNode, getNode } = useReactFlow();
  useLayoutEffect(() => {
    const label = data.label || "Texto";
    const fontSize = data.fontSize ?? (isText ? 16 : 14);
    const minWidth = isText ? 100 : 150;
    const minHeight = isText ? 42 : 64;
    const longestLine = Math.max(...label.split("\n").map((line) => line.length), 1);
    const width = Math.min(360, Math.max(minWidth, Math.ceil(longestLine * fontSize * 0.56 + 38)));
    const charsPerLine = Math.max(12, Math.floor((width - 38) / (fontSize * 0.56)));
    const lineCount = label.split("\n").reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
    const height = Math.max(minHeight, Math.ceil(lineCount * fontSize * 1.35 + 30));
    const current = getNode(id);
    if (!current || (current.width === width && current.height === height)) return;
    updateNode(id, { width, height });
  }, [data.label, data.fontSize, id, isText, getNode, updateNode]);
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    minWidth: isText ? 100 : 150,
    minHeight: isText ? 42 : 64,
    padding: isText ? "8px 12px" : "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    overflow: "hidden",
    color: data.textColor ?? "#202020",
    background: isText ? "transparent" : (data.backgroundColor ?? "#fff8e8"),
    fontSize: `${data.fontSize ?? (isText ? 16 : 14)}px`,
    fontWeight: isText ? 700 : 500,
    border: isText ? "0" : `2px solid ${data.textColor ?? "#202020"}`,
    borderRadius: shape === "rounded" ? 18 : shape === "circle" ? 999 : shape === "note" ? 2 : 4,
    clipPath: shape === "diamond" ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : undefined,
    transform: shape === "diamond" ? "scale(1.08)" : undefined,
    boxShadow: selected ? "0 0 0 3px rgba(75, 140, 255, .45)" : undefined,
  };
  return <>
    <NodeResizer
      isVisible={Boolean(selected)}
      minWidth={isText ? 100 : 150}
      minHeight={isText ? 42 : 64}
      lineStyle={{ borderColor: "var(--action-secondary)" }}
      handleStyle={{ width: 8, height: 8, borderRadius: 2, background: "var(--action-secondary)", border: "2px solid var(--surface-panel)" }}
    />
    <Handle type="target" position={Position.Top} className="!bg-retro-blue" />
    <div style={style}>{data.label || "Texto"}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-retro-orange" />
  </>;
}

const nodeTypes = { builder: BuilderNode };

const starterNodes: Node[] = [
  { id: "start", position: { x: 80, y: 120 }, width: 160, height: 70, data: { label: "Começo", kind: "block", shape: "rounded", backgroundColor: "#d9f2df", textColor: "#1d5131" }, type: "builder" },
  { id: "step", position: { x: 330, y: 120 }, width: 190, height: 78, data: { label: "Adicionar explicação", kind: "block", shape: "rectangle", backgroundColor: "#fff8e8", textColor: "#513d1d" }, type: "builder" },
  { id: "end", position: { x: 620, y: 120 }, width: 160, height: 70, data: { label: "Conclusão", kind: "block", shape: "circle", backgroundColor: "#dcecff", textColor: "#1f4677" }, type: "builder" },
];
const starterEdges: Edge[] = [
  { id: "start-step", source: "start", target: "step", animated: true },
  { id: "step-end", source: "step", target: "end" },
];

function normalizeNodes(raw: unknown[]): Node[] {
  return (raw as Node[]).map((node) => ({
    ...node,
    type: "builder",
    width: node.width ?? 180,
    height: node.height ?? 76,
    data: {
      label: String((node.data as Partial<DiagramNodeData> | undefined)?.label ?? "Novo bloco"),
      kind: ((node.data as Partial<DiagramNodeData> | undefined)?.kind ?? "block") as DiagramNodeData["kind"],
      shape: ((node.data as Partial<DiagramNodeData> | undefined)?.shape ?? "rectangle") as DiagramNodeData["shape"],
      backgroundColor: (node.data as Partial<DiagramNodeData> | undefined)?.backgroundColor ?? "#fff8e8",
      textColor: (node.data as Partial<DiagramNodeData> | undefined)?.textColor ?? "#202020",
      fontSize: (node.data as Partial<DiagramNodeData> | undefined)?.fontSize ?? 14,
    },
  }));
}

export function DiagramsPage() {
  const diagrams = useDiagramStore((state) => state.diagrams);
  const addDiagram = useDiagramStore((state) => state.addDiagram);
  const updateDiagram = useDiagramStore((state) => state.updateDiagram);
  const deleteDiagram = useDiagramStore((state) => state.deleteDiagram);
  const phases = useStudyPhaseStore((state) => state.phases);
  const cards = useFlashcardStore((state) => state.cards);
  const updateCard = useFlashcardStore((state) => state.updateCard);
  const problems = useLeetCodeStore((state) => state.problems);
  const updateProblem = useLeetCodeStore((state) => state.updateProblem);
  const theme = useAppStore((state) => state.theme);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => diagrams.find((diagram) => diagram.id === selectedId) ?? null, [diagrams, selectedId]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(starterEdges);
  const [phaseIds, setPhaseIds] = useState<string[]>([]);
  const [flashcardIds, setFlashcardIds] = useState<string[]>([]);
  const [problemIds, setProblemIds] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StudyDiagram | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [metadataMode, setMetadataMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    setDescription(selected.description ?? "");
    setNodes(normalizeNodes(selected.nodes));
    setEdges(selected.edges as Edge[]);
    setPhaseIds(selected.phaseIds);
    setFlashcardIds(selected.flashcardIds);
    setProblemIds(selected.problemIds);
  }, [selected, setEdges, setNodes]);

  const resetEditor = () => {
    setSelectedId(null);
    setTitle("Novo fluxograma");
    setDescription("");
    setNodes(starterNodes);
    setEdges(starterEdges);
    setPhaseIds([]);
    setFlashcardIds([]);
    setProblemIds([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const startNewDiagram = () => {
    resetEditor();
    setMetadataMode("create");
    setMetadataOpen(true);
  };

  const openExistingDiagram = (diagram: StudyDiagram) => {
    setSelectedId(diagram.id);
    setEditorOpen(true);
  };

  const saveMetadata = async () => {
    if (metadataMode === "edit" && selected) {
      await updateDiagram(selected.id, { title: title.trim() || "Fluxograma sem título", description: description.trim() || undefined });
    } else {
      const created = await addDiagram({ title: title.trim() || "Fluxograma sem título", description: description.trim() || undefined, nodes, edges, phaseIds, flashcardIds, problemIds });
      setSelectedId(created.id);
      await syncBacklinks(created.id, flashcardIds, problemIds);
    }
    setMetadataOpen(false);
    setEditorOpen(true);
  };

  const syncBacklinks = async (diagramId: string, nextCardIds: string[], nextProblemIds: string[]) => {
    await Promise.all(cards.map((card) => {
      const ids = card.diagramIds ?? [];
      const next = nextCardIds.includes(card.id) ? Array.from(new Set([...ids, diagramId])) : ids.filter((id) => id !== diagramId);
      return JSON.stringify(ids) === JSON.stringify(next) ? Promise.resolve() : updateCard(card.id, { diagramIds: next });
    }));
    await Promise.all(problems.map((problem) => {
      const ids = problem.diagramIds ?? [];
      const next = nextProblemIds.includes(problem.id) ? Array.from(new Set([...ids, diagramId])) : ids.filter((id) => id !== diagramId);
      return JSON.stringify(ids) === JSON.stringify(next) ? Promise.resolve() : updateProblem(problem.id, { diagramIds: next });
    }));
  };

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);
  const updateSelectedNode = (patch: Partial<DiagramNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((current) => current.map((node) => node.id === selectedNodeId ? { ...node, data: { ...node.data, ...patch } } : node));
  };

  const addBuilderNode = (kind: "block" | "text") => {
    const id = `node-${Date.now()}`;
    const next: Node = {
      id,
      type: "builder",
      position: { x: 160 + (nodes.length % 3) * 230, y: 270 + Math.floor(nodes.length / 3) * 130 },
      width: kind === "text" ? 180 : 190,
      height: kind === "text" ? 52 : 78,
      data: kind === "text"
        ? { label: "Novo texto", kind, shape: "text", textColor: "#f5f0e7", fontSize: 18 }
        : { label: "Novo bloco", kind, shape: "rectangle", backgroundColor: "#fff8e8", textColor: "#202020", fontSize: 14 },
    };
    setNodes((current) => [...current, next]);
    setSelectedNodeId(id);
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) => current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const updateSelectedEdge = (patch: Partial<Edge>) => {
    if (!selectedEdgeId) return;
    setEdges((current) => current.map((edge) => edge.id === selectedEdgeId ? { ...edge, ...patch } : edge));
  };

  const save = async () => {
    const input = {
      title: title.trim() || "Fluxograma sem título",
      description: description.trim() || undefined,
      nodes,
      edges,
      phaseIds,
      flashcardIds,
      problemIds,
    };
    if (selected) await updateDiagram(selected.id, input);
    else {
      const created = await addDiagram(input);
      setSelectedId(created.id);
      await syncBacklinks(created.id, flashcardIds, problemIds);
    }
    if (selected) await syncBacklinks(selected.id, flashcardIds, problemIds);
  };

  const toggle = (values: string[], value: string, setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const remove = async () => {
    if (!confirmDelete) return;
    await deleteDiagram(confirmDelete.id);
    if (selectedId === confirmDelete.id) resetEditor();
    setConfirmDelete(null);
  };

  return (
    <div className="h-full flex flex-col paper-page">
      <div className="paper-toolbar flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-retro-blue text-[15px] font-semibold flex items-center gap-2"><GitBranch size={16} /> Fluxogramas de estudo</h1>
          <p className="text-retro-comment text-[12px] mt-0.5">Desenhe o raciocínio e vincule a qualquer parte do seu estudo.</p>
        </div>
        <div className="flex gap-2">
          <RetroButton variant="default" icon={<Plus size={14} />} onClick={startNewDiagram}>novo fluxograma</RetroButton>
          {editorOpen && <RetroButton variant="primary" icon={<Save size={14} />} onClick={save}>salvar</RetroButton>}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="border-r border-retro-border/60 bg-retro-bgDark overflow-y-auto retro-scrollbar p-3">
          <div className="text-[11px] uppercase tracking-widest text-retro-comment mb-2">seus fluxogramas ({diagrams.length})</div>
          {diagrams.map((diagram) => (
            <button key={diagram.id} type="button" onClick={() => openExistingDiagram(diagram)} className={`w-full text-left p-3 mb-1 rounded-lg border ${selectedId === diagram.id ? "bg-retro-blue/10 border-retro-blue" : "border-transparent hover:bg-retro-panelHover"}`}>
              <span className="block text-[13px] font-semibold text-retro-text truncate">{diagram.title}</span>
              <span className="block mt-1 text-[11px] text-retro-comment">{diagram.nodes.length} nós · {diagram.phaseIds.length + diagram.flashcardIds.length + diagram.problemIds.length} vínculos</span>
            </button>
          ))}
          {diagrams.length === 0 && <p className="p-2 text-[12px] text-retro-comment">Crie o primeiro desenho para explicar um conceito.</p>}
        </aside>

        <section className="min-h-[520px] flex flex-col bg-retro-bg">
          {editorOpen ? <>
          <div className="p-3 border-b border-retro-border/60 flex gap-2 flex-wrap items-center">
            <RetroButton variant="ghost" icon={<ArrowLeft size={13} />} onClick={() => setEditorOpen(false)}>voltar</RetroButton>
            <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-retro-text truncate">{title}</div><div className="text-[11px] text-retro-comment truncate">{description || "sem descrição"}</div></div>
            <RetroButton variant="ghost" icon={<Pencil size={13} />} onClick={() => { setMetadataMode("edit"); setMetadataOpen(true); }}>detalhes</RetroButton>
            <RetroButton variant="ghost" icon={<Link2 size={13} />} onClick={() => setLinkOpen(true)}>vincular</RetroButton>
            <button type="button" className="retro-btn retro-btn--default" onClick={() => addBuilderNode("block")}>+ bloco</button>
            <button type="button" className="retro-btn retro-btn--default" onClick={() => addBuilderNode("text")}>+ texto</button>
            <button type="button" className="retro-btn retro-btn--ghost" disabled={!selectedNodeId} onClick={deleteSelectedNode}>apagar selecionado</button>
          </div>
          <div className="flex-1 min-h-[480px]">
            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={nodes}
              edges={edges}
              colorMode={theme === "dark" ? "dark" : "light"}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={(connection: Connection) => setEdges((current) => addEdge(connection, current))}
              onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }}
              onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
              onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
              onNodesDelete={(deleted) => {
                if (deleted.some((node) => node.id === selectedNodeId)) setSelectedNodeId(null);
              }}
              onEdgesDelete={(deleted) => {
                if (deleted.some((edge) => edge.id === selectedEdgeId)) setSelectedEdgeId(null);
              }}
              deleteKeyCode={["Backspace", "Delete"]}
              fitView
              className="bg-retro-bgDark"
            >
              <MiniMap className="study-flow-minimap" />
              <Controls className="study-flow-controls" />
              <Background gap={18} size={1} />
            </ReactFlow>
          </div></> : <div className="flex-1 flex items-center justify-center p-8 text-center"><div className="max-w-md"><GitBranch size={48} className="mx-auto text-retro-blue mb-4" /><h2 className="text-retro-text text-xl font-semibold">Escolha um fluxograma</h2><p className="mt-2 text-[13px] text-retro-comment">Crie um novo desenho ou clique em um item da lista para abrir o editor.</p><div className="mt-5"><RetroButton variant="primary" icon={<Plus size={14} />} onClick={startNewDiagram}>novo fluxograma</RetroButton></div></div></div>}
        </section>

        <aside className="border-l border-retro-border/60 bg-retro-bgDark overflow-y-auto retro-scrollbar p-4 space-y-5">
          {editorOpen && <>
          <div className="border-b border-retro-border/60 pb-4">
            <h2 className="text-[14px] font-semibold text-retro-text">Editor do elemento</h2>
            {selectedNode ? <div className="mt-3 space-y-2">
              <textarea value={(selectedNode.data as DiagramNodeData).label ?? ""} onChange={(event) => updateSelectedNode({ label: event.target.value })} className="retro-input w-full min-h-[62px]" placeholder="Texto do bloco" />
              <label className="block text-[11px] text-retro-comment">Formato<select value={(selectedNode.data as DiagramNodeData).shape ?? "rectangle"} onChange={(event) => updateSelectedNode({ shape: event.target.value as DiagramNodeData["shape"] })} className="retro-input w-full mt-1"><option value="rectangle">retângulo</option><option value="rounded">arredondado</option><option value="circle">círculo</option><option value="diamond">losango</option><option value="note">nota</option><option value="text">texto</option></select></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-retro-comment">Cor do bloco<input type="color" value={(selectedNode.data as DiagramNodeData).backgroundColor ?? "#fff8e8"} onChange={(event) => updateSelectedNode({ backgroundColor: event.target.value })} className="mt-1 h-8 w-full cursor-pointer bg-transparent" /></label>
                <label className="text-[11px] text-retro-comment">Cor do texto<input type="color" value={(selectedNode.data as DiagramNodeData).textColor ?? "#202020"} onChange={(event) => updateSelectedNode({ textColor: event.target.value })} className="mt-1 h-8 w-full cursor-pointer bg-transparent" /></label>
              </div>
              <label className="block text-[11px] text-retro-comment">Tamanho da fonte<input type="range" min="10" max="32" value={(selectedNode.data as DiagramNodeData).fontSize ?? 14} onChange={(event) => updateSelectedNode({ fontSize: Number(event.target.value) })} className="w-full mt-2" /></label>
            </div> : selectedEdge ? <div className="mt-3 space-y-3">
              <label className="block text-[11px] text-retro-comment">Estilo da linha<select value={selectedEdge.style?.strokeDasharray === "8 5" ? "dashed" : selectedEdge.style?.strokeDasharray === "2 5" ? "dotted" : "solid"} onChange={(event) => updateSelectedEdge({ style: { ...selectedEdge.style, strokeDasharray: event.target.value === "dashed" ? "8 5" : event.target.value === "dotted" ? "2 5" : "none" } })} className="retro-input w-full mt-1"><option value="solid">sólida</option><option value="dashed">tracejada</option><option value="dotted">pontilhada</option></select></label>
              <label className="block text-[11px] text-retro-comment">Cor<input type="color" value={String(selectedEdge.style?.stroke ?? "#8aa7c7")} onChange={(event) => updateSelectedEdge({ style: { ...selectedEdge.style, stroke: event.target.value } })} className="mt-1 h-8 w-full cursor-pointer bg-transparent" /></label>
              <label className="block text-[11px] text-retro-comment">Espessura<input type="range" min="1" max="6" value={Number(selectedEdge.style?.strokeWidth ?? 2)} onChange={(event) => updateSelectedEdge({ style: { ...selectedEdge.style, strokeWidth: Number(event.target.value) } })} className="w-full mt-2" /></label>
              <label className="flex items-center gap-2 text-[12px] text-retro-text"><input type="checkbox" checked={Boolean(selectedEdge.animated)} onChange={(event) => updateSelectedEdge({ animated: event.target.checked })} className="sketch-checkbox" /> movimento animado</label>
            </div> : <p className="mt-2 text-[12px] text-retro-comment">Selecione um bloco ou uma linha para editar.</p>}
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-retro-text">Vínculos</h2>
            <p className="text-[11px] text-retro-comment mt-1">Edite as relações deste desenho em um modal dedicado.</p>
            <RetroButton variant="default" icon={<Link2 size={13} />} onClick={() => setLinkOpen(true)} className="mt-3">vincular conteúdo</RetroButton>
          </div>
          {selected && <RetroButton variant="ghost" icon={<Trash2 size={13} />} onClick={() => setConfirmDelete(selected)} className="!text-retro-red">excluir fluxograma</RetroButton>}
          </>}
          {!editorOpen && <p className="text-[12px] text-retro-comment">Abra um fluxograma para editar seus blocos e vínculos.</p>}
        </aside>
      </div>

      <RetroModal open={metadataOpen} onClose={() => setMetadataOpen(false)} title={metadataMode === "create" ? "Novo fluxograma" : "Editar detalhes"} subtitle="Defina o nome e o contexto do desenho." accent="blue" size="md" footer={<><RetroButton variant="default" onClick={() => setMetadataOpen(false)}>cancelar</RetroButton><RetroButton variant="primary" onClick={saveMetadata}>{metadataMode === "create" ? "criar e abrir editor" : "salvar detalhes"}</RetroButton></>}>
        <div className="p-5 space-y-4"><label className="block text-[13px] font-semibold text-retro-text">Nome<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="ex: Fluxo do Two Sum" className="retro-input w-full mt-1" autoFocus /></label><label className="block text-[13px] font-semibold text-retro-text">Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="O que este desenho explica?" className="retro-input w-full mt-1 min-h-[100px]" /></label></div>
      </RetroModal>

      <RetroModal open={linkOpen} onClose={() => setLinkOpen(false)} title="Vincular conteúdo" subtitle="O mesmo fluxograma pode ser usado em vários contextos." accent="purple" size="lg" footer={<RetroButton variant="primary" onClick={() => setLinkOpen(false)}>concluir</RetroButton>}>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5"><LinkGroup title="Fases / sessões" items={phases.map((item) => ({ id: item.id, label: item.title }))} values={phaseIds} onToggle={(id) => toggle(phaseIds, id, setPhaseIds)} /><LinkGroup title="Flashcards" items={cards.map((item) => ({ id: item.id, label: item.question }))} values={flashcardIds} onToggle={(id) => toggle(flashcardIds, id, setFlashcardIds)} /><LinkGroup title="Desafios" items={problems.map((item) => ({ id: item.id, label: `${item.title} · ${item.variantName ?? "solução"}` }))} values={problemIds} onToggle={(id) => toggle(problemIds, id, setProblemIds)} /></div>
      </RetroModal>

      <ConfirmDialog open={confirmDelete !== null} title="Excluir fluxograma?" tone="danger" message={`Você realmente quer excluir “${confirmDelete?.title}”?`} confirmLabel="excluir" onConfirm={remove} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

function LinkGroup({ title, items, values, onToggle }: { title: string; items: { id: string; label: string }[]; values: string[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <h3 className="text-[12px] uppercase tracking-wider text-retro-comment mb-2">{title}</h3>
      <div className="space-y-1 max-h-[150px] overflow-y-auto retro-scrollbar">
        {items.map((item) => <label key={item.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-retro-panelHover cursor-pointer text-[12px] text-retro-text-dim"><input type="checkbox" checked={values.includes(item.id)} onChange={() => onToggle(item.id)} className="sketch-checkbox mt-0.5" /><span className="line-clamp-2">{item.label}</span></label>)}
        {items.length === 0 && <p className="text-[11px] text-retro-comment">Nenhum item disponível.</p>}
      </div>
    </div>
  );
}
