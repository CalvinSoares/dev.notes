import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroModal, ConfirmDialog } from "@/components/ui/RetroModal";
import { LeetCodeForm } from "@/components/features/leetcode/LeetCodeForm";
import { useLeetCodeStore } from "@/store/useLeetCodeStore";
import type { Difficulty, LeetCodeProblem } from "@core/types";
import { humanDueLabel } from "@core/lib/srs-algorithm";
import {
  Plus,
  ExternalLink,
  Search,
  Filter,
  Pencil,
  Trash2,
  Save,
  FileQuestion,
  Calendar,
  Tag,
  Gauge,
} from "lucide-react";

function difficultyBadge(d: string): "green" | "yellow" | "red" | "default" {
  const map: Record<string, "green" | "yellow" | "red"> = {
    easy: "green",
    medium: "yellow",
    hard: "red",
  };
  return map[d] ?? "default";
}

export function LeetCodePage() {
  const problems = useLeetCodeStore((s) => s.problems);
  const dueCount = useLeetCodeStore((s) => s.getDueProblems().length);
  const addProblem = useLeetCodeStore((s) => s.addProblem);
  const addVariant = useLeetCodeStore((s) => s.addVariant);
  const updateProblem = useLeetCodeStore((s) => s.updateProblem);
  const deleteProblem = useLeetCodeStore((s) => s.deleteProblem);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<Difficulty | "all">("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<LeetCodeProblem | null>(
    null,
  );

  const [editSolution, setEditSolution] = useState("");
  const [editComplexity, setEditComplexity] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [dirty, setDirty] = useState(false);

  const selected = useMemo(
    () => problems.find((p) => p.id === selectedId) ?? null,
    [problems, selectedId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return problems.filter((p) => {
      if (diffFilter !== "all" && p.difficulty !== diffFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [problems, search, diffFilter]);

  const handleSelect = (p: LeetCodeProblem) => {
    setSelectedId(p.id);
    setEditSolution(p.solution ?? "");
    setEditComplexity(p.complexity ?? "");
    setEditNotes(p.notes ?? "");
    setDirty(false);
  };

  const handleCreate = async (data: Parameters<typeof addProblem>[0]) => {
    const created = await addProblem(data);
    setCreateOpen(false);
    handleSelect(created);
  };

  const handleEditSave = async (data: any) => {
    if (!selected) return;
    await updateProblem(selected.id, data);
    setEditOpen(false);
  };

  const handleVariantCreate = async (data: Parameters<typeof addProblem>[0]) => {
    if (!selected) return;
    const created = await addVariant(selected, {
      ...data,
      variantName: data.variantName ?? "Nova abordagem",
    });
    setVariantOpen(false);
    handleSelect(created);
  };

  const handleInlineSave = async () => {
    if (!selected || !dirty) return;
    await updateProblem(selected.id, {
      solution: editSolution,
      complexity: editComplexity,
      notes: editNotes,
    });
    setDirty(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteProblem(confirmDelete.id);
    if (selectedId === confirmDelete.id) setSelectedId(null);
    setConfirmDelete(null);
  };

  return (
    <div className="h-full flex flex-col paper-page">
      <div className="paper-toolbar flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-retro-green text-[15px] font-semibold flex items-center gap-2">
            Desafios para revisar
          </h1>
          <p className="text-retro-comment text-[12px] mt-0.5">
            {problems.length} problemas cadastrados ·{" "}
            <span className="text-retro-orange">
              {dueCount} para revisar hoje
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-retro-comment"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="buscar..."
              className="retro-input pl-8 w-[200px]"
            />
          </div>
          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value as any)}
            className="retro-input w-[200px]"
          >
            <option value="all">todas dificuldades</option>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
          <RetroButton icon={<Filter size={14} />} variant="ghost">
            mais
          </RetroButton>
          <RetroButton
            icon={<Plus size={14} />}
            variant="primary"
            onClick={() => setCreateOpen(true)}
          >
            novo problema
          </RetroButton>
        </div>
      </div>

      <div className="paper-split flex-1 flex min-h-0">
        <aside className="paper-list w-[340px] shrink-0 overflow-y-auto retro-scrollbar">
          <div className="p-2 text-[11px] uppercase tracking-widest text-retro-comment border-b border-retro-border flex items-center justify-between">
            <span>▸ problemas ({filtered.length})</span>
          </div>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-[12px] text-retro-comment">
              nenhum problema encontrado.
            </div>
          )}
          {filtered.map((p) => {
            const active = p.id === selectedId;
            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`px-3 py-2.5 border-b border-retro-border/60 cursor-pointer transition-colors group ${
                  active
                    ? "bg-retro-blue/10 border-l-2 border-l-retro-blue"
                    : "hover:bg-retro-panelHover"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-retro-blue text-[11.5px] font-mono">
                        {p.id.replace("lc-", "#")}
                      </span>
                      <span className="text-retro-text font-medium text-[13px] truncate">
                        {p.title}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-retro-blue truncate">
                      {p.variantName ?? "Solução principal"}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <RetroBadge tone={difficultyBadge(p.difficulty)}>
                        {p.difficulty}
                      </RetroBadge>
                      {p.tags.slice(0, 2).map((t) => (
                        <RetroBadge key={t} tone="default">
                          {t}
                        </RetroBadge>
                      ))}
                      {p.tags.length > 2 && (
                        <span className="text-[10px] text-retro-comment">
                          +{p.tags.length - 2}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-[10.5px] text-retro-comment flex items-center gap-2 flex-wrap">
                      {p.solvedAt && (
                        <span className="text-retro-green">✓ resolvido</span>
                      )}
                      <span>
                        <Calendar size={10} className="inline mr-0.5" />
                        {humanDueLabel(p.nextReviewAt)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(p);
                        setEditOpen(true);
                      }}
                      className="p-1 text-retro-text-dim hover:text-retro-blue border border-transparent hover:border-retro-border"
                      title="Editar"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(p);
                      }}
                      className="p-1 text-retro-text-dim hover:text-retro-red border border-transparent hover:border-retro-border"
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                    <a
                      href={p.url || undefined}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-retro-text-dim hover:text-retro-blue border border-transparent hover:border-retro-border"
                      title="Abrir no LeetCode"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </aside>

        <section className="paper-detail flex-1 min-w-0 flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-retro-border bg-retro-bgDark flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[12px] text-retro-blue">
                      {selected.id.replace("lc-", "#")}
                    </span>
                    <h2 className="text-retro-text font-semibold text-[15px] truncate">
                      {selected.title}
                    </h2>
                    <RetroBadge tone={difficultyBadge(selected.difficulty)}>
                      {selected.difficulty}
                    </RetroBadge>
                    {selected.url && (
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-retro-blue text-[12px] hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink size={11} />
                        LeetCode
                      </a>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 flex-wrap text-[11.5px] text-retro-comment">
                    <span className="inline-flex items-center gap-1">
                      <Gauge size={11} className="text-retro-orange" />
                      {selected.complexity || "complexidade não informada"}
                    </span>
                    {(selected.timeComplexity || selected.spaceComplexity) && (
                      <span className="text-retro-purple">
                        {selected.timeComplexity ?? selected.complexity ?? "tempo ?"} · {selected.spaceComplexity ?? "espaço ?"}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={11} className="text-retro-blue" />
                      próxima revisão: {humanDueLabel(selected.nextReviewAt)}
                    </span>
                    {selected.solvedAt && (
                      <span className="text-retro-green">✓ resolvido</span>
                    )}
                  </div>
                  {selected.tags.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <Tag size={11} className="text-retro-comment" />
                      {selected.tags.map((t) => (
                        <RetroBadge key={t} tone="blue">
                          {t}
                        </RetroBadge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RetroButton
                    variant="default"
                    icon={<Plus size={13} />}
                    onClick={() => setVariantOpen(true)}
                  >
                    nova abordagem
                  </RetroButton>
                  <RetroButton
                    variant="default"
                    icon={<Pencil size={13} />}
                    onClick={() => setEditOpen(true)}
                  >
                    editar
                  </RetroButton>
                  <RetroButton
                    variant="default"
                    icon={<Trash2 size={13} />}
                    onClick={() => setConfirmDelete(selected)}
                    className="hover:!text-retro-red hover:!border-retro-red/60"
                  >
                    excluir
                  </RetroButton>
                  <RetroButton
                    variant="primary"
                    icon={<Save size={13} />}
                    onClick={handleInlineSave}
                    disabled={!dirty}
                  >
                    salvar alterações
                  </RetroButton>
                </div>
              </div>

              <div className="px-4 py-3 border-b border-retro-border bg-retro-bgDark/30 flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-[13px] font-semibold text-retro-text shrink-0">
                  <Gauge size={14} className="text-retro-orange" />
                  Complexidade
                </label>
                <input
                  value={editComplexity}
                  onChange={(e) => {
                    setEditComplexity(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Ex.: O(n) tempo e O(n) espaço"
                  className="retro-input max-w-xl flex-1 min-w-[240px] !py-1.5"
                />
                <span className="text-[12px] text-retro-comment">Use ⛶ para escrever em tela cheia.</span>
              </div>

              {(selected.strategy || selected.tradeoffs) && (
                <div className="px-4 py-3 border-b border-retro-border bg-retro-bgDark/20 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                  <div><span className="text-retro-comment">estratégia: </span><span className="text-retro-text-dim">{selected.strategy || "não informada"}</span></div>
                  <div><span className="text-retro-comment">trade-offs: </span><span className="text-retro-text-dim">{selected.tradeoffs || "não informados"}</span></div>
                </div>
              )}

              <div className="flex-1 min-h-0 flex flex-col">
                <CodeEditor
                  value={editSolution}
                  language="typescript"
                  filename={`${selected.title.toLowerCase().replace(/\s+/g, "-")}.solution.ts`}
                  readOnly={false}
                  onChange={(v) => {
                    setEditSolution(v);
                    setDirty(true);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-retro-border bg-retro-bgDark/40">
                <RetroCard accent="orange" className="!border-t-0 !border !p-3">
                  <div className="text-[12px] text-retro-comment mb-1">Como usar</div>
                  <ul className="text-[12px] text-retro-text-dim list-disc pl-5 space-y-0.5">
                    <li>
                      Escolha um desafio na lista para ver ou editar a solução.
                    </li>
                    <li>Use “novo problema” para adicionar um desafio.</li>
                    <li>
                      Passe o mouse sobre um item para editar, excluir ou abrir
                      no LeetCode.
                    </li>
                  </ul>
                </RetroCard>
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <FileQuestion
                    size={52}
                    className="text-retro-comment mx-auto mb-4"
                  />
                  <h2 className="text-retro-blue text-lg font-bold mb-1">
                    Escolha um desafio
                  </h2>
                  <p className="text-retro-comment text-[13px]">
                    Selecione um item da lista ou crie um desafio para começar.
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <RetroButton
                      variant="primary"
                      icon={<Plus size={14} />}
                      onClick={() => setCreateOpen(true)}
                    >
                      novo problema
                    </RetroButton>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <RetroModal
        open={variantOpen}
        onClose={() => setVariantOpen(false)}
        title={`Nova abordagem para ${selected?.title ?? ""}`}
        subtitle="Cadastre outra estratégia sem duplicar o enunciado."
        accent="orange"
        size="lg"
        icon={<Plus size={15} />}
        footer={
          <>
            <RetroButton variant="default" onClick={() => setVariantOpen(false)}>cancelar</RetroButton>
            <RetroButton variant="primary" icon={<Save size={13} />} onClick={() => (document.getElementById("lc-variant-form") as HTMLFormElement | null)?.requestSubmit()}>salvar abordagem</RetroButton>
          </>
        }
      >
        <LeetCodeForm key={`variant-${selected?.id ?? "new"}`} formId="lc-variant-form" initial={selected ?? undefined} variantMode onSubmit={handleVariantCreate} />
      </RetroModal>

      <RetroModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo problema"
        subtitle="Adicione o desafio e, se quiser, já comece a solução."
        accent="green"
        size="lg"
        icon={<Plus size={15} />}
        footer={
          <>
            <RetroButton variant="default" onClick={() => setCreateOpen(false)}>
              cancelar
            </RetroButton>
            <RetroButton
              variant="primary"
              icon={<Save size={13} />}
              onClick={() => {
                const form = document.getElementById(
                  "lc-create-form",
                ) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            >
              criar problema
            </RetroButton>
          </>
        }
      >
        <LeetCodeForm formId="lc-create-form" onSubmit={handleCreate} />
      </RetroModal>

      <RetroModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Editar ${selected?.title ?? ""}`}
        subtitle="Ajuste os detalhes e continue de onde parou."
        accent="blue"
        size="lg"
        icon={<Pencil size={15} />}
        footer={
          <>
            <RetroButton variant="default" onClick={() => setEditOpen(false)}>
              cancelar
            </RetroButton>
            <RetroButton
              variant="primary"
              icon={<Save size={13} />}
              onClick={() => {
                const form = document.getElementById(
                  "lc-edit-form",
                ) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            >
              salvar
            </RetroButton>
          </>
        }
      >
        <LeetCodeForm
          formId="lc-edit-form"
          initial={selected ?? undefined}
          onSubmit={handleEditSave}
        />
      </RetroModal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir problema?"
        tone="danger"
        message={`Você realmente quer excluir o problema "${confirmDelete?.title}"?\n\nEsta ação NÃO pode ser desfeita.`}
        confirmLabel="excluir permanentemente"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
