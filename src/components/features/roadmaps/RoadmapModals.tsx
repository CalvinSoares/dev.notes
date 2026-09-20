import { useState } from "react";
import { BookOpen, GitBranch, Link2, ListChecks, Route } from "lucide-react";
import { getRoadmapDescendantNodes } from "@core/lib/roadmap";
import type { StudyRoadmap, StudyRoadmapNode } from "@core/types/roadmap";
import { useFlashcardStore } from "@/store/useFlashcardStore";
import { useQuizStore } from "@/store/useQuizStore";
import { RetroButton } from "@/components/ui/RetroButton";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { RetroModal } from "@/components/ui/RetroModal";

const ROOT_PARENT_ID = "__root__";

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
            <SearchableDropdown
              items={[
                { id: "draft", label: "rascunho" },
                { id: "active", label: "ativa" },
                { id: "completed", label: "concluída" },
                { id: "archived", label: "arquivada" },
              ]}
              value={form.status}
              onChange={(status) => set({ status: status as RoadmapForm["status"] })}
              placeholder="Selecione o status..."
              searchPlaceholder="Buscar status..."
              charLimit={24}
            />
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
      size="lg"
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
            <SearchableDropdown
              items={[
                { id: "topic", label: "tópico" },
                { id: "subtopic", label: "subtópico" },
              ]}
              value={form.kind}
              onChange={(kind) => set({ kind: kind as NodeForm["kind"] })}
              placeholder="Selecione o tipo..."
              searchPlaceholder="Buscar tipo..."
              charLimit={24}
            />
          </label>
        </div>
        <label className="block text-[12px] text-retro-comment">
          Pertence a
          <SearchableDropdown
            items={[
              { id: ROOT_PARENT_ID, label: "raiz da trilha", description: "Tópico no nível principal" },
              ...nodes
                .filter((node) => !blockedParentIds.has(node.id))
                .sort((left, right) => left.order - right.order)
                .map((node) => ({ id: node.id, label: node.title, description: node.kind === "topic" ? "Tópico" : "Subtópico" })),
            ]}
            value={form.parentId || ROOT_PARENT_ID}
            onChange={(parentId) => set({ parentId: parentId === ROOT_PARENT_ID ? "" : parentId })}
            placeholder="Selecione o tópico pai..."
            searchPlaceholder="Buscar tópico pai..."
            empty="Nenhum tópico disponível."
            charLimit={72}
          />
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

export type SubtopicQuickCreateForm = {
  title: string;
  description: string;
  notes: string;
};

export function SubtopicQuickCreateModal({
  open,
  parent,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  parent: StudyRoadmapNode | null;
  initial: SubtopicQuickCreateForm;
  onClose: () => void;
  onSave: (form: SubtopicQuickCreateForm) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<SubtopicQuickCreateForm>) => setForm((current) => ({ ...current, ...patch }));

  return (
    <RetroModal
      open={open}
      onClose={onClose}
      title="Novo subtópico"
      subtitle={parent ? "Dentro de “" + parent.title + "”" : "Adicione um nível à trilha."}
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
            criar subtópico
          </RetroButton>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <label className="block text-[12px] text-retro-comment">
          Nome *
          <input autoFocus maxLength={160} value={form.title} onChange={(event) => set({ title: event.target.value })} className="retro-input w-full mt-1" placeholder="Ex.: Protocolos de roteamento" />
        </label>
        <label className="block text-[12px] text-retro-comment">
          Descrição
          <textarea maxLength={600} value={form.description} onChange={(event) => set({ description: event.target.value })} className="retro-input w-full mt-1 min-h-20" placeholder="O que entra neste subtópico?" />
        </label>
        <label className="block text-[12px] text-retro-comment">
          Anotação
          <textarea maxLength={2000} value={form.notes} onChange={(event) => set({ notes: event.target.value })} className="retro-input w-full mt-1 min-h-24" placeholder="Resumo, fontes ou lembretes..." />
        </label>
      </div>
    </RetroModal>
  );
}
export function LinkModal({
  open,
  node,
  diagrams,
  onClose,
  onSave,
}: {
  open: boolean;
  node: StudyRoadmapNode | null;
  diagrams: Array<{ id: string; title: string; description?: string }>;
  onClose: () => void;
  onSave: (type: "flashcard" | "quiz-question" | "diagram", resourceId: string) => Promise<void>;
}) {
  const cards = useFlashcardStore((state) => state.cards);
  const questions = useQuizStore((state) => state.questions);
  const [type, setType] = useState<"flashcard" | "quiz-question" | "diagram">("flashcard");
  const [resourceId, setResourceId] = useState("");
  const [saving, setSaving] = useState(false);

  const resourceItems = type === "flashcard"
    ? cards.map((card) => ({ id: card.id, label: card.question, description: card.tags.join(" · ") }))
    : type === "quiz-question"
      ? questions.map((question) => ({ id: question.id, label: "#" + (question.order ?? "?") + " · " + (question.topic || question.subject), description: question.statement }))
      : diagrams.map((diagram) => ({ id: diagram.id, label: diagram.title, description: diagram.description }));

  return (
    <RetroModal
      open={open}
      onClose={onClose}
      title={"Vincular material" + (node ? " · " + node.title : "")}
      icon={<Link2 size={17} />}
      accent="purple"
      size="lg"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button type="button" onClick={() => { setType("flashcard"); setResourceId(""); }} className={"p-3 rounded-lg border text-left " + (type === "flashcard" ? "border-retro-purple bg-retro-purple/10" : "border-retro-border")}>
            <BookOpen size={16} className="text-retro-purple" />
            <span className="block mt-1 text-[12px] text-retro-text">flashcards</span>
          </button>
          <button type="button" onClick={() => { setType("quiz-question"); setResourceId(""); }} className={"p-3 rounded-lg border text-left " + (type === "quiz-question" ? "border-retro-purple bg-retro-purple/10" : "border-retro-border")}>
            <ListChecks size={16} className="text-retro-purple" />
            <span className="block mt-1 text-[12px] text-retro-text">questões</span>
          </button>
          <button type="button" onClick={() => { setType("diagram"); setResourceId(""); }} className={"p-3 rounded-lg border text-left " + (type === "diagram" ? "border-retro-purple bg-retro-purple/10" : "border-retro-border")}>
            <GitBranch size={16} className="text-retro-purple" />
            <span className="block mt-1 text-[12px] text-retro-text">fluxogramas</span>
          </button>
        </div>
        <SearchableDropdown
          items={resourceItems}
          value={resourceId}
          onChange={setResourceId}
          placeholder={type === "flashcard" ? "Selecione um flashcard..." : type === "quiz-question" ? "Selecione uma questão..." : "Selecione um fluxograma..."}
          searchPlaceholder={type === "flashcard" ? "Buscar flashcards..." : type === "quiz-question" ? "Buscar questões..." : "Buscar fluxogramas..."}
          empty={type === "flashcard" ? "Nenhum flashcard disponível." : type === "quiz-question" ? "Nenhuma questão disponível." : "Nenhum fluxograma disponível."}
          charLimit={84}
        />
      </div>
    </RetroModal>
  );
}
