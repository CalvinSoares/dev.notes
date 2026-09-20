import { useMemo, useState } from "react";
import { BookOpen, Flag, GitBranch, Link2, ListChecks, Route } from "lucide-react";
import { getRoadmapDescendantNodes, parseRoadmapImportText, ROADMAP_PRIORITY_OPTIONS } from "@core/lib/roadmap";
import type { StudyRoadmap, StudyRoadmapNode, StudyRoadmapPriority } from "@core/types/roadmap";
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
  priority: StudyRoadmapPriority;
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

export function PriorityPicker({ value, onChange, label = 'Prioridade' }: { value?: StudyRoadmapPriority; onChange: (priority: StudyRoadmapPriority) => void; label?: string }) { const selected = value ?? 'none'; const color = (id: StudyRoadmapPriority) => id === 'urgent' ? 'text-retro-red' : id === 'high' ? 'text-retro-orange' : id === 'medium' ? 'text-retro-yellow' : id === 'low' ? 'text-retro-blue' : 'text-retro-comment'; return <div><span className='block text-[12px] text-retro-comment mb-1'>{label}</span><div className='grid grid-cols-5 gap-2'>{ROADMAP_PRIORITY_OPTIONS.map((option) => <button key={option.id} type='button' title={option.label + ' · ' + option.description} aria-label={option.label} onClick={() => onChange(option.id)} className={'flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] transition-colors ' + (selected === option.id ? 'border-retro-text bg-retro-panelHover' : 'border-retro-border/60 hover:border-retro-border')}><Flag size={16} className={color(option.id)} fill={selected === option.id && option.id !== 'none' ? 'currentColor' : 'none'} /><span className='truncate max-w-full text-retro-comment'>{option.label}</span></button>)}</div></div>; }
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
        <PriorityPicker value={form.priority} onChange={(priority) => set({ priority })} />

      </div>
    </RetroModal>
  );
}

export type SubtopicQuickCreateForm = {
  title: string;
  description: string;
  notes: string;
  priority: StudyRoadmapPriority;
};

export function SubtopicQuickCreateModal({
  open,
  parent,
  initial,
  onClose,
  onSave,
  onSaveBulk,
}: {
  open: boolean;
  parent: StudyRoadmapNode | null;
  initial: SubtopicQuickCreateForm;
  onClose: () => void;
  onSave: (form: SubtopicQuickCreateForm) => Promise<void>;
  onSaveBulk: (text: string, priority: StudyRoadmapPriority) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkText, setBulkText] = useState("");
  const [bulkPriority, setBulkPriority] = useState<StudyRoadmapPriority>("none");
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<SubtopicQuickCreateForm>) => setForm((current) => ({ ...current, ...patch }));
  const bulkPreview = useMemo(() => parseRoadmapImportText(bulkText), [bulkText]);

  return (
    <RetroModal
      open={open}
      onClose={onClose}
      title={mode === "bulk" ? "Criar subtópicos em massa" : "Novo subtópico"}
      subtitle={parent ? "Dentro de “" + parent.title + "”" : "Adicione um nível à trilha."}
      icon={<ListChecks size={17} />}
      accent="orange"
      size={mode === "bulk" ? "lg" : "md"}
      footer={
        <>
          <RetroButton onClick={onClose}>cancelar</RetroButton>
          <RetroButton
            variant="primary"
            disabled={saving || (mode === "single" ? !form.title.trim() : !bulkText.trim() || !bulkPreview.length)}
            onClick={async () => {
              setSaving(true);
              try {
                if (mode === "bulk") await onSaveBulk(bulkText, bulkPriority);
                else await onSave(form);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "criando..." : mode === "bulk" ? "criar subtópicos" : "criar subtópico"}
          </RetroButton>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg border border-retro-border bg-retro-panelHover">
          <button type="button" onClick={() => setMode("single")} className={"rounded px-3 py-2 text-[12px] " + (mode === "single" ? "bg-retro-orange/15 text-retro-orange border border-retro-orange/60" : "text-retro-comment hover:text-retro-text")}>
            um subtópico
          </button>
          <button type="button" onClick={() => setMode("bulk")} className={"rounded px-3 py-2 text-[12px] " + (mode === "bulk" ? "bg-retro-orange/15 text-retro-orange border border-retro-orange/60" : "text-retro-comment hover:text-retro-text")}>
            vários subtópicos
          </button>
        </div>

        {mode === "single" ? (
          <>
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
            <PriorityPicker value={form.priority} onChange={(priority) => set({ priority })} />
          </>
        ) : (
          <>
            <label className="block text-[12px] text-retro-comment">
              Lista de subtópicos *
              <textarea
                autoFocus
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                className="retro-input w-full mt-1 min-h-52 font-mono text-[12px] leading-relaxed"
                placeholder={"- Roteamento estático | Rotas configuradas manualmente\n  - Tabela de rotas | Entradas e métricas\n  - Rota padrão | Saída quando não há correspondência\n- Roteamento dinâmico | Rotas aprendidas por protocolo"}
              />
            </label>
            <PriorityPicker value={bulkPriority} onChange={setBulkPriority} label="Prioridade aplicada a todos" />
            <div className="rounded-lg border border-dashed border-retro-orange/70 bg-retro-orange/10 p-3 text-[11px] text-retro-comment">
              <strong className="text-retro-orange">Formato aceito</strong>
              <p className="mt-1">Uma linha por item usando <code className="text-retro-text">Nome | Descrição</code>. Use dois espaços no começo da linha para criar um filho do item anterior. Linhas sem indentação ficam no mesmo nível. Blocos de código, fórmulas isoladas, setas e barras invertidas usadas como quebra são tratados como formatação.</p>
              <pre className="mt-2 overflow-x-auto rounded border border-retro-border/60 bg-retro-bg p-2 text-[11px] leading-relaxed text-retro-text">{"- Roteamento estático | Rotas manuais\n  - Tabela de rotas | Entradas e métricas\n- Roteamento dinâmico | Rotas aprendidas"}</pre>
            </div>
            <p className="text-[11px] text-retro-comment">{bulkPreview.length} {bulkPreview.length === 1 ? "subtópico reconhecido" : "subtópicos reconhecidos"} · descrições serão preservadas.</p>
          </>
        )}
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
