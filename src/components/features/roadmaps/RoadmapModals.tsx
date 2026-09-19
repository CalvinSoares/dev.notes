import { useState } from "react";
import { BookOpen, Link2, ListChecks, Route } from "lucide-react";
import { getRoadmapDescendantNodes } from "@core/lib/roadmap";
import type { StudyRoadmap, StudyRoadmapNode } from "@core/types/roadmap";
import { useFlashcardStore } from "@/store/useFlashcardStore";
import { useQuizStore } from "@/store/useQuizStore";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroModal } from "@/components/ui/RetroModal";

export type RoadmapForm = {
  title: string;
  description: string;
  objective: string;
  status: StudyRoadmap["status"];
  startDate: string;
  targetDate: string;
};

export type NodeForm = {
  title: string;
  kind: StudyRoadmapNode["kind"];
  parentId: string;
  description: string;
  notes: string;
};
export function RoadmapFormModal({
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

export function NodeFormModal({
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

export function LinkModal({
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

