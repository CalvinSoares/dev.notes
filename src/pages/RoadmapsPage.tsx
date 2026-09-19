import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  FilePlus2,
  CheckCircle2,
  Link2,
  ListChecks,
  Loader2,
  Pencil,
  Play,
  Plus,
  Route,
  StickyNote,
  Target,
  Trash2,
} from "lucide-react";
import { ProgressBar, RoadmapTree } from "@/components/features/roadmaps/RoadmapTree";
import { RoadmapImportModal } from "@/components/features/roadmaps/RoadmapImportModal";
import { getRoadmapDescendantNodes, getRoadmapProgress } from "@core/lib/roadmap";
import type { StudyRoadmap, StudyRoadmapLink, StudyRoadmapNode } from "@core/types/roadmap";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { useFlashcardStore } from "@/store/useFlashcardStore";
import { useQuizStore } from "@/store/useQuizStore";
import { useAppStore } from "@/store/useAppStore";
import { RetroButton } from "@/components/ui/RetroButton";
import { ConfirmDialog, RetroModal } from "@/components/ui/RetroModal";

type RoadmapForm = {
  title: string;
  description: string;
  objective: string;
  status: StudyRoadmap["status"];
  startDate: string;
  targetDate: string;
};

type NodeForm = {
  title: string;
  kind: StudyRoadmapNode["kind"];
  parentId: string;
  description: string;
  notes: string;
};

const emptyRoadmapForm: RoadmapForm = {
  title: "",
  description: "",
  objective: "",
  status: "draft",
  startDate: "",
  targetDate: "",
};

const emptyNodeForm: NodeForm = {
  title: "",
  kind: "topic",
  parentId: "",
  description: "",
  notes: "",
};

function RoadmapFormModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: RoadmapForm;
  onClose: () => void;
  onSave: (form: RoadmapForm) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<RoadmapForm>) => setForm((current) => ({ ...current, ...patch }));

  return (
    <RetroModal
      open={open}
      onClose={onClose}
      title={initial.title ? "Editar trilha" : "Nova trilha de estudos"}
      icon={<Route size={17} />}
      accent="blue"
      size="md"
      footer={
        <>
          <RetroButton onClick={onClose}>cancelar</RetroButton>
          <RetroButton
            variant="primary"
            disabled={saving || !form.title.trim()}
            onClick={async () => {
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
          >
            salvar trilha
          </RetroButton>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <label className="block text-[12px] text-retro-comment">
          Nome *
          <input autoFocus value={form.title} onChange={(event) => set({ title: event.target.value })} className="retro-input w-full mt-1" placeholder="Ex.: Analista de Sistemas — Transpetro" />
        </label>
        <label className="block text-[12px] text-retro-comment">
          Descrição
          <textarea value={form.description} onChange={(event) => set({ description: event.target.value })} className="retro-input w-full mt-1 min-h-20" placeholder="O que você quer dominar?" />
        </label>
        <label className="block text-[12px] text-retro-comment">
          Objetivo
          <textarea value={form.objective} onChange={(event) => set({ objective: event.target.value })} className="retro-input w-full mt-1 min-h-16" placeholder="Ex.: fechar o edital até a data da prova." />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block text-[12px] text-retro-comment">
            Status
            <select value={form.status} onChange={(event) => set({ status: event.target.value as RoadmapForm["status"] })} className="retro-input w-full mt-1">
              <option value="draft">rascunho</option>
              <option value="active">ativa</option>
              <option value="completed">concluída</option>
              <option value="archived">arquivada</option>
            </select>
          </label>
          <label className="block text-[12px] text-retro-comment">
            Início
            <input type="date" value={form.startDate} onChange={(event) => set({ startDate: event.target.value })} className="retro-input w-full mt-1" />
          </label>
          <label className="block text-[12px] text-retro-comment">
            Meta
            <input type="date" value={form.targetDate} onChange={(event) => set({ targetDate: event.target.value })} className="retro-input w-full mt-1" />
          </label>
        </div>
      </div>
    </RetroModal>
  );
}

function NodeFormModal({
  open,
  initial,
  nodes,
  editingId,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: NodeForm;
  nodes: StudyRoadmapNode[];
  editingId: string | null;
  onClose: () => void;
  onSave: (form: NodeForm) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const blockedParentIds = new Set(editingId ? [editingId, ...getRoadmapDescendantNodes(editingId, nodes).map((node) => node.id)] : []);
  const set = (patch: Partial<NodeForm>) => setForm((current) => ({ ...current, ...patch }));

  return (
    <RetroModal
      open={open}
      onClose={onClose}
      title={editingId ? "Editar tópico" : "Novo tópico"}
      icon={<ListChecks size={17} />}
      accent="orange"
      size="md"
      footer={
        <>
          <RetroButton onClick={onClose}>cancelar</RetroButton>
          <RetroButton
            variant="primary"
            disabled={saving || !form.title.trim()}
            onClick={async () => {
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
          >
            salvar tópico
          </RetroButton>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-[12px] text-retro-comment">
            Nome *
            <input autoFocus value={form.title} onChange={(event) => set({ title: event.target.value })} className="retro-input w-full mt-1" placeholder="Ex.: Banco de dados" />
          </label>
          <label className="block text-[12px] text-retro-comment">
            Tipo
            <select value={form.kind} onChange={(event) => set({ kind: event.target.value as NodeForm["kind"] })} className="retro-input w-full mt-1">
              <option value="topic">tópico</option>
              <option value="subtopic">subtópico</option>
            </select>
          </label>
        </div>
        <label className="block text-[12px] text-retro-comment">
          Pertence a
          <select value={form.parentId} onChange={(event) => set({ parentId: event.target.value })} className="retro-input w-full mt-1">
            <option value="">raiz da trilha</option>
            {nodes.filter((node) => !blockedParentIds.has(node.id)).sort((left, right) => left.order - right.order).map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
          </select>
        </label>
        <label className="block text-[12px] text-retro-comment">
          Descrição
          <textarea value={form.description} onChange={(event) => set({ description: event.target.value })} className="retro-input w-full mt-1 min-h-16" placeholder="O que entra neste tópico?" />
        </label>
        <label className="block text-[12px] text-retro-comment">
          Anotações
          <textarea value={form.notes} onChange={(event) => set({ notes: event.target.value })} className="retro-input w-full mt-1 min-h-24" placeholder="Resumo, fontes, lembretes..." />
        </label>
      </div>
    </RetroModal>
  );
}

function LinkModal({
  open,
  node,
  onClose,
  onSave,
}: {
  open: boolean;
  node: StudyRoadmapNode | null;
  onClose: () => void;
  onSave: (type: "flashcard" | "quiz-question", resourceId: string) => Promise<void>;
}) {
  const cards = useFlashcardStore((state) => state.cards);
  const questions = useQuizStore((state) => state.questions);
  const [type, setType] = useState<"flashcard" | "quiz-question">("flashcard");
  const [resourceId, setResourceId] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <RetroModal
      open={open}
      onClose={onClose}
      title={"Vincular material" + (node ? " · " + node.title : "")}
      icon={<Link2 size={17} />}
      accent="purple"
      size="md"
      footer={
        <>
          <RetroButton onClick={onClose}>cancelar</RetroButton>
          <RetroButton
            variant="primary"
            disabled={saving || !resourceId}
            onClick={async () => {
              setSaving(true);
              await onSave(type, resourceId);
              setSaving(false);
            }}
          >
            vincular
          </RetroButton>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setType("flashcard"); setResourceId(""); }} className={"p-3 rounded-lg border text-left " + (type === "flashcard" ? "border-retro-purple bg-retro-purple/10" : "border-retro-border")}>
            <BookOpen size={16} className="text-retro-purple" />
            <span className="block mt-1 text-[12px] text-retro-text">flashcards</span>
          </button>
          <button type="button" onClick={() => { setType("quiz-question"); setResourceId(""); }} className={"p-3 rounded-lg border text-left " + (type === "quiz-question" ? "border-retro-purple bg-retro-purple/10" : "border-retro-border")}>
            <ListChecks size={16} className="text-retro-purple" />
            <span className="block mt-1 text-[12px] text-retro-text">questões</span>
          </button>
        </div>
        <label className="block text-[12px] text-retro-comment">
          Material
          <select value={resourceId} onChange={(event) => setResourceId(event.target.value)} className="retro-input w-full mt-1">
            <option value="">selecione...</option>
            {type === "flashcard"
              ? cards.map((card) => <option key={card.id} value={card.id}>{card.question}</option>)
              : questions.map((question) => <option key={question.id} value={question.id}>{"#" + (question.order ?? "?") + " · " + (question.topic || question.subject)}</option>)}
          </select>
        </label>
      </div>
    </RetroModal>
  );
}

export function RoadmapsPage() {
  const hydrated = useRoadmapStore((state) => state.hydrated);
  const roadmapError = useRoadmapStore((state) => state.error);
  const initializeRoadmaps = useRoadmapStore((state) => state.initialize);
  const roadmaps = useRoadmapStore((state) => state.roadmaps);
  const nodes = useRoadmapStore((state) => state.nodes);
  const links = useRoadmapStore((state) => state.links);
  const addRoadmap = useRoadmapStore((state) => state.addRoadmap);
  const updateRoadmap = useRoadmapStore((state) => state.updateRoadmap);
  const deleteRoadmap = useRoadmapStore((state) => state.deleteRoadmap);
  const addNode = useRoadmapStore((state) => state.addNode);
  const updateNode = useRoadmapStore((state) => state.updateNode);
  const toggleNode = useRoadmapStore((state) => state.toggleNode);
  const deleteNode = useRoadmapStore((state) => state.deleteNode);
  const moveNode = useRoadmapStore((state) => state.moveNode);
  const addLink = useRoadmapStore((state) => state.addLink);
  const deleteLink = useRoadmapStore((state) => state.deleteLink);
  const cards = useFlashcardStore((state) => state.cards);
  const questions = useQuizStore((state) => state.questions);
  const openFlashcard = useAppStore((state) => state.openFlashcard);
  const openQuizQuestion = useAppStore((state) => state.openQuizQuestion);
  const startFlashcardStudy = useAppStore((state) => state.startFlashcardStudy);
  const startQuizWithQuestions = useAppStore((state) => state.startQuizWithQuestions);

  const [selectedId, setSelectedId] = useState<string | null>(roadmaps[0]?.id ?? null);
  const [roadmapModal, setRoadmapModal] = useState<{ open: boolean; editing: StudyRoadmap | null }>({ open: false, editing: null });
  const [nodeModal, setNodeModal] = useState<{ open: boolean; editing: StudyRoadmapNode | null }>({ open: false, editing: null });
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<StudyRoadmapNode | null>(null);
  const [roadmapToDelete, setRoadmapToDelete] = useState<StudyRoadmap | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedRoadmap = roadmaps.find((roadmap) => roadmap.id === selectedId) ?? roadmaps[0] ?? null;
  const roadmapNodes = useMemo(() => selectedRoadmap ? nodes.filter((node) => node.roadmapId === selectedRoadmap.id) : [], [nodes, selectedRoadmap]);
  const selectedNode = roadmapNodes.find((node) => node.id === selectedNodeId) ?? roadmapNodes[0] ?? null;
  const selectedLinks = selectedNode ? links.filter((link) => link.nodeId === selectedNode.id).sort((left, right) => left.order - right.order) : [];
  const selectedFlashcardIds = selectedLinks.filter((link) => link.resourceType === "flashcard").map((link) => link.resourceId);
  const selectedQuestionIds = selectedLinks.filter((link) => link.resourceType === "quiz-question").map((link) => link.resourceId);
  const progress = selectedRoadmap ? getRoadmapProgress(selectedRoadmap.id, roadmapNodes) : { total: 0, completed: 0, percentage: 0 };
  const roadmapForm = roadmapModal.editing
    ? { title: roadmapModal.editing.title, description: roadmapModal.editing.description ?? "", objective: roadmapModal.editing.objective ?? "", status: roadmapModal.editing.status, startDate: roadmapModal.editing.startDate ?? "", targetDate: roadmapModal.editing.targetDate ?? "" }
    : emptyRoadmapForm;
  const nodeForm = nodeModal.editing
    ? { title: nodeModal.editing.title, kind: nodeModal.editing.kind, parentId: nodeModal.editing.parentId ?? "", description: nodeModal.editing.description ?? "", notes: nodeModal.editing.notes ?? "" }
    : { ...emptyNodeForm, parentId: selectedNode?.kind === "topic" ? selectedNode.id : "" };

  const linkedTitle = (link: StudyRoadmapLink) => {
    if (link.resourceType === "flashcard") return cards.find((card) => card.id === link.resourceId)?.question ?? "Flashcard removido";
    const question = questions.find((item) => item.id === link.resourceId);
    return question ? "Questão " + (question.order ?? "?") + " · " + (question.topic || question.subject) : "Questão removida";
  };

  const saveRoadmap = async (form: RoadmapForm) => {
    if (roadmapModal.editing) await updateRoadmap(roadmapModal.editing.id, form);
    else {
      const created = await addRoadmap(form);
      setSelectedId(created.id);
    }
    setRoadmapModal({ open: false, editing: null });
  };

  const saveNode = async (form: NodeForm) => {
    if (!selectedRoadmap) return;
    if (nodeModal.editing) {
      await updateNode(nodeModal.editing.id, form);
      setSelectedNodeId(nodeModal.editing.id);
    } else {
      const created = await addNode({ ...form, roadmapId: selectedRoadmap.id, parentId: form.parentId || undefined });
      setSelectedNodeId(created.id);
    }
    setNodeModal({ open: false, editing: null });
  };

  const importRoadmapTopics = async (text: string) => {
    if (!selectedRoadmap) return;
    const stack: Array<{ indent: number; id: string }> = [];
    const lines = text.split(/\r?\n/).map((line) => ({ raw: line, title: line.replace(/^\s*[-*•]\s*/, "").replace(/^#+\s*/, "").trim() })).filter((line) => line.title);
    for (const line of lines) {
      const indent = line.raw.match(/^\s*/)?.[0].length ?? 0;
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop();
      const parentId = stack[stack.length - 1]?.id;
      const created = await addNode({ roadmapId: selectedRoadmap.id, parentId, kind: parentId ? "subtopic" : "topic", title: line.title });
      stack.push({ indent, id: created.id });
    }
    setImportModalOpen(false);
  };

  if (!hydrated) {
    return <div className="h-full flex items-center justify-center paper-page"><div className="text-center text-retro-comment"><Loader2 size={28} className="mx-auto mb-3 animate-spin text-retro-blue" /><p>Carregando suas trilhas...</p></div></div>;
  }

  if (roadmapError) {
    return <div className="h-full flex items-center justify-center paper-page p-6"><div className="max-w-md text-center"><AlertTriangle size={32} className="mx-auto mb-3 text-retro-orange" /><h2 className="text-retro-text font-semibold">Não foi possível carregar as trilhas</h2><p className="mt-2 text-[12px] text-retro-comment">{roadmapError}</p><RetroButton className="mt-4" onClick={() => void initializeRoadmaps()}>tentar novamente</RetroButton></div></div>;
  }

  return (
    <div className="h-full flex flex-col paper-page">
      <div className="paper-toolbar flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-retro-blue text-[15px] font-semibold flex items-center gap-2"><Route size={16} /> Roadmaps de estudos</h1>
          <p className="text-retro-comment text-[12px] mt-0.5">Organize o edital em uma trilha com progresso, anotações e material vinculado.</p>
        </div>
        <RetroButton variant="primary" icon={<Plus size={14} />} onClick={() => setRoadmapModal({ open: true, editing: null })}>nova trilha</RetroButton>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="border-r border-retro-border/60 bg-retro-bgDark overflow-y-auto retro-scrollbar p-3">
          <div className="text-[11px] uppercase tracking-widest text-retro-comment mb-2">suas trilhas ({roadmaps.length})</div>
          <div className="space-y-2">
            {roadmaps.map((roadmap) => {
              const roadmapProgress = getRoadmapProgress(roadmap.id, nodes.filter((node) => node.roadmapId === roadmap.id));
              return <button key={roadmap.id} type="button" onClick={() => { setSelectedId(roadmap.id); setSelectedNodeId(null); }} className={"w-full text-left p-3 rounded-lg border " + (selectedRoadmap?.id === roadmap.id ? "border-retro-blue bg-retro-blue/10" : "border-transparent hover:border-retro-border hover:bg-retro-panelHover")}><span className="block text-[13px] font-semibold text-retro-text truncate">{roadmap.title}</span><span className="block mt-1 text-[11px] text-retro-comment">{roadmapProgress.completed}/{roadmapProgress.total} concluídos · {roadmapProgress.percentage}%</span><ProgressBar value={roadmapProgress.percentage} /></button>;
            })}
          </div>
          {roadmaps.length === 0 && <div className="p-4 text-center text-[12px] text-retro-comment"><Route size={28} className="mx-auto mb-2 text-retro-blue" />Crie uma trilha para começar.</div>}
        </aside>

        <section className="min-h-[560px] overflow-y-auto retro-scrollbar bg-retro-bg p-4 md:p-6">
          {!selectedRoadmap ? <div className="h-full flex items-center justify-center text-center"><div className="max-w-md"><Target size={44} className="mx-auto text-retro-blue mb-4" /><h2 className="text-retro-text text-xl font-semibold">Sua trilha começa aqui</h2><p className="mt-2 text-[13px] text-retro-comment">Crie uma roadmap e transforme o edital em passos pequenos.</p><div className="mt-5"><RetroButton variant="primary" icon={<Plus size={14} />} onClick={() => setRoadmapModal({ open: true, editing: null })}>criar primeira trilha</RetroButton></div></div></div> : <>
            <div className="flex items-start justify-between gap-3 flex-wrap border-b border-retro-border/60 pb-4">
              <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="text-retro-text text-xl font-semibold truncate">{selectedRoadmap.title}</h2><span className="retro-badge">{selectedRoadmap.status}</span></div><p className="text-[13px] text-retro-comment mt-1">{selectedRoadmap.description || "Sem descrição."}</p>{selectedRoadmap.objective && <p className="text-[12px] text-retro-text-dim mt-2"><strong>objetivo:</strong> {selectedRoadmap.objective}</p>}</div>
              <div className="flex gap-2"><RetroButton variant="ghost" icon={<Pencil size={13} />} onClick={() => setRoadmapModal({ open: true, editing: selectedRoadmap })}>editar</RetroButton><RetroButton variant="ghost" icon={<Trash2 size={13} />} onClick={() => setRoadmapToDelete(selectedRoadmap)}>excluir</RetroButton></div>
            </div>
            <div className="my-5 p-4 rounded-xl border border-retro-border bg-retro-panelHover"><div className="flex items-center justify-between text-[12px] mb-2"><span className="text-retro-text flex items-center gap-2"><CheckCircle2 size={15} className="text-retro-green" /> progresso dos itens</span><strong className="text-retro-blue">{progress.completed}/{progress.total} · {progress.percentage}%</strong></div><ProgressBar value={progress.percentage} /></div>
            <div className="flex items-center justify-between gap-2 mb-3"><div><h3 className="text-retro-text font-semibold">Conteúdo da trilha</h3><p className="text-[12px] text-retro-comment">Marque os nós concluídos ou abra um item para editar.</p></div><div className="flex gap-2"><RetroButton variant="ghost" icon={<FilePlus2 size={13} />} onClick={() => setImportModalOpen(true)}>importar edital</RetroButton><RetroButton icon={<Plus size={13} />} onClick={() => setNodeModal({ open: true, editing: null })}>novo tópico</RetroButton></div></div>
            {roadmapNodes.length > 0 ? <RoadmapTree nodes={roadmapNodes} selectedId={selectedNode?.id ?? null} onSelect={(node) => setSelectedNodeId(node.id)} onToggle={(node) => void toggleNode(node.id, !node.completed)} onMove={(id, direction) => void moveNode(id, direction)} /> : <div className="p-8 border border-dashed border-retro-border rounded-xl text-center text-[12px] text-retro-comment"><ListChecks size={32} className="mx-auto mb-2 text-retro-orange" />Adicione o primeiro tópico da trilha.</div>}
          </>}
        </section>

        <aside className="border-l border-retro-border/60 bg-retro-bgDark overflow-y-auto retro-scrollbar p-4">
          {selectedNode ? <div className="space-y-5">
            <div className="flex items-start justify-between gap-2"><div><span className="text-[10px] uppercase tracking-widest text-retro-comment">{selectedNode.kind}</span><h3 className="text-retro-text font-semibold mt-1">{selectedNode.title}</h3></div><input type="checkbox" className="sketch-checkbox mt-1" checked={selectedNode.completed} onChange={() => void toggleNode(selectedNode.id, !selectedNode.completed)} /></div>
            {selectedNode.description && <p className="text-[12px] text-retro-text-dim">{selectedNode.description}</p>}
            <div className="border-t border-retro-border/60 pt-4"><h4 className="text-[12px] text-retro-text font-semibold flex items-center gap-2"><StickyNote size={14} className="text-retro-yellow" /> anotações</h4><p className="mt-2 text-[12px] text-retro-text-dim whitespace-pre-wrap">{selectedNode.notes || "Nenhuma anotação neste tópico."}</p></div>
            <div className="border-t border-retro-border/60 pt-4"><div className="flex items-center justify-between gap-2"><h4 className="text-[12px] text-retro-text font-semibold flex items-center gap-2"><Link2 size={14} className="text-retro-purple" /> materiais ({selectedLinks.length})</h4><RetroButton variant="ghost" className="!px-2 !py-1" onClick={() => setLinkModalOpen(true)}><Plus size={13} /></RetroButton></div><div className="mt-2 space-y-2">{selectedLinks.map((link) => <div key={link.id} className="flex items-start gap-2 p-2 rounded border border-retro-border/60"><button type="button" className="text-[11px] text-retro-text flex-1 text-left hover:text-retro-blue" onClick={() => link.resourceType === "flashcard" ? openFlashcard(link.resourceId) : openQuizQuestion(link.resourceId)}>{linkedTitle(link)}</button><button type="button" className="text-retro-red" onClick={() => void deleteLink(link.id)} aria-label="Remover vínculo"><Trash2 size={13} /></button></div>)}{selectedLinks.length === 0 && <p className="text-[12px] text-retro-comment">Vincule um flashcard ou uma questão para revisar esse item.</p>}</div></div>
            <div className="border-t border-retro-border/60 pt-4"><p className="text-[11px] text-retro-comment mb-2">Comece uma sessão com o material deste tópico.</p><div className="flex flex-wrap gap-2"><RetroButton variant="primary" disabled={!selectedFlashcardIds.length} icon={<Play size={13} />} onClick={() => startFlashcardStudy(selectedFlashcardIds)}>estudar cartões</RetroButton><RetroButton variant="ghost" disabled={!selectedQuestionIds.length} icon={<ListChecks size={13} />} onClick={() => startQuizWithQuestions(selectedQuestionIds)}>simular questões</RetroButton></div></div>
            <div className="flex gap-2 pt-2"><RetroButton variant="ghost" icon={<Pencil size={13} />} onClick={() => setNodeModal({ open: true, editing: selectedNode })}>editar</RetroButton><RetroButton variant="ghost" icon={<Trash2 size={13} />} onClick={() => setNodeToDelete(selectedNode)}>excluir</RetroButton></div>
          </div> : <div className="h-full flex items-center justify-center text-center text-[12px] text-retro-comment"><Target size={32} className="mx-auto mb-2 text-retro-blue" />Selecione um tópico para ver detalhes.</div>}
        </aside>
      </div>

      <RoadmapImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)} onImport={importRoadmapTopics} />
      <RoadmapFormModal key={roadmapModal.editing?.id ?? (roadmapModal.open ? "new-open" : "new-closed")} open={roadmapModal.open} initial={roadmapForm} onClose={() => setRoadmapModal({ open: false, editing: null })} onSave={saveRoadmap} />
      {selectedRoadmap && <NodeFormModal key={nodeModal.editing?.id ?? (nodeModal.open ? "new-open" : "new-closed")} open={nodeModal.open} initial={nodeForm} nodes={roadmapNodes} editingId={nodeModal.editing?.id ?? null} onClose={() => setNodeModal({ open: false, editing: null })} onSave={saveNode} />}
      <LinkModal open={linkModalOpen} node={selectedNode} onClose={() => setLinkModalOpen(false)} onSave={async (resourceType, resourceId) => { if (selectedNode) await addLink({ nodeId: selectedNode.id, resourceType, resourceId }); setLinkModalOpen(false); }} />
      <ConfirmDialog open={Boolean(roadmapToDelete)} title="Excluir trilha?" message={"A trilha “" + (roadmapToDelete?.title ?? "") + "” e todos os seus tópicos e vínculos serão removidos."} tone="danger" onCancel={() => setRoadmapToDelete(null)} onConfirm={async () => { if (roadmapToDelete) { await deleteRoadmap(roadmapToDelete.id); setSelectedId(null); setSelectedNodeId(null); } setRoadmapToDelete(null); }} />
      <ConfirmDialog open={Boolean(nodeToDelete)} title="Excluir tópico?" message={"“" + (nodeToDelete?.title ?? "") + "” e seus subtópicos serão removidos."} tone="danger" onCancel={() => setNodeToDelete(null)} onConfirm={async () => { if (nodeToDelete) { await deleteNode(nodeToDelete.id); setSelectedNodeId(null); } setNodeToDelete(null); }} />
    </div>
  );
}
