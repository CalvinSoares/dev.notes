import { useMemo, useState, useEffect } from "react";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroModal, ConfirmDialog } from "@/components/ui/RetroModal";
import { ArticleForm } from "@/components/features/content/ArticleForm";
import { SnippetForm } from "@/components/features/content/SnippetForm";
import { ArticleEditor } from "@/components/features/content/ArticleEditor";
import { useContentStore } from "@/store/useContentStore";
import { useAppStore } from "@/store/useAppStore";
import type { Article, Snippet, SrsRating } from "@core/types";
import { humanDueLabel } from "@core/lib/srs-algorithm";
import {
  FileText,
  FileCode,
  Plus,
  ExternalLink,
  LayoutList,
  Search,
  Pencil,
  Trash2,
  Save,
  FileQuestion,
  Calendar,
  Tag,
  Brain,
  Gauge,
} from "lucide-react";

type SubTab = "articles" | "snippets";

export function ContentPage() {
  const store = useContentStore();
  const {
    articles,
    snippets,
    getDueArticles,
    addArticle,
    updateArticle,
    deleteArticle,
    reviewArticle,
    addSnippet,
    updateSnippet,
    deleteSnippet,
  } = store;
  const due = getDueArticles();

  const active = useAppStore((s) => s.activeTabId);
  const tabs = useAppStore((s) => s.tabs);
  const isArticlesTab =
    tabs.find((t) => t.id === active)?.pageId === "articles";

  const [subTab, setSubTab] = useState<SubTab>(
    isArticlesTab ? "articles" : "snippets",
  );

  useEffect(() => {
    setSubTab(isArticlesTab ? "articles" : "snippets");
  }, [isArticlesTab]);

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null,
  );
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const [createArticleOpen, setCreateArticleOpen] = useState(false);
  const [editArticleOpen, setEditArticleOpen] = useState(false);
  const [confirmDelArticle, setConfirmDelArticle] = useState<Article | null>(
    null,
  );

  const [createSnippetOpen, setCreateSnippetOpen] = useState(false);
  const [editSnippetOpen, setEditSnippetOpen] = useState(false);
  const [confirmDelSnippet, setConfirmDelSnippet] = useState<Snippet | null>(
    null,
  );

  const [articleEditContent, setArticleEditContent] = useState("");
  const [articleEditSummary, setArticleEditSummary] = useState("");
  const [articleDirty, setArticleDirty] = useState(false);

  const selectedArticle = useMemo(
    () => articles.find((a) => a.id === selectedArticleId) ?? null,
    [articles, selectedArticleId],
  );
  const selectedSnippet = useMemo(
    () => snippets.find((s) => s.id === selectedSnippetId) ?? null,
    [snippets, selectedSnippetId],
  );

  useEffect(() => {
    if (selectedArticle) {
      setArticleEditContent(selectedArticle.content ?? "");
      setArticleEditSummary(selectedArticle.summary ?? "");
      setArticleDirty(false);
    }
  }, [selectedArticle?.id]);

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        (a.content ?? "").toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [articles, search]);

  const filteredSnippets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [snippets, search]);

  const selectArticle = (a: Article) => {
    setSelectedArticleId(a.id);
    setSelectedSnippetId(null);
  };

  const selectSnippet = (s: Snippet) => {
    setSelectedSnippetId(s.id);
    setSelectedArticleId(null);
  };

  const handleCreateArticle = async (
    data: Parameters<typeof addArticle>[0],
  ) => {
    const created = await addArticle(data);
    setCreateArticleOpen(false);
    selectArticle(created);
  };

  const handleEditArticleSave = async (data: any) => {
    if (!selectedArticle) return;
    await updateArticle(selectedArticle.id, data);
    setEditArticleOpen(false);
  };

  const handleArticleInlineSave = async () => {
    if (!selectedArticle || !articleDirty) return;
    await updateArticle(selectedArticle.id, {
      summary: articleEditSummary,
      content: articleEditContent,
    });
    setArticleDirty(false);
  };

  const handleDeleteArticle = async () => {
    if (!confirmDelArticle) return;
    await deleteArticle(confirmDelArticle.id);
    if (selectedArticleId === confirmDelArticle.id) setSelectedArticleId(null);
    setConfirmDelArticle(null);
  };

  const handleReviewArticle = async (rating: SrsRating) => {
    if (!selectedArticle) return;
    await reviewArticle(selectedArticle.id, rating);
  };

  const handleCreateSnippet = async (
    data: Parameters<typeof addSnippet>[0],
  ) => {
    const created = await addSnippet(data);
    setCreateSnippetOpen(false);
    selectSnippet(created);
  };

  const handleEditSnippetSave = async (data: any) => {
    if (!selectedSnippet) return;
    await updateSnippet(selectedSnippet.id, data);
    setEditSnippetOpen(false);
  };

  const handleDeleteSnippet = async () => {
    if (!confirmDelSnippet) return;
    await deleteSnippet(confirmDelSnippet.id);
    if (selectedSnippetId === confirmDelSnippet.id) setSelectedSnippetId(null);
    setConfirmDelSnippet(null);
  };

  return (
    <div className="h-full flex flex-col paper-page">
      <div className="paper-toolbar flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-retro-purple text-[15px] font-semibold flex items-center gap-2">
            Leituras & rabiscos
          </h1>
          <p className="text-retro-comment text-[12px] mt-0.5">
            {articles.length} artigos · {snippets.length} snippets ·{" "}
            <span className="text-retro-orange">
              {due.length} artigos para revisar
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
          <div className="flex items-stretch border border-retro-border">
            <button
              onClick={() => setSubTab("articles")}
              className={`px-3 py-1.5 text-[12px] flex items-center gap-1.5 transition-colors ${
                subTab === "articles"
                  ? "bg-retro-panel text-retro-text"
                  : "text-retro-text-dim hover:text-retro-text"
              }`}
            >
              <FileText size={13} /> artigos
            </button>
            <button
              onClick={() => setSubTab("snippets")}
              className={`px-3 py-1.5 text-[12px] flex items-center gap-1.5 border-l border-retro-border transition-colors ${
                subTab === "snippets"
                  ? "bg-retro-panel text-retro-text"
                  : "text-retro-text-dim hover:text-retro-text"
              }`}
            >
              <FileCode size={13} /> snippets
            </button>
          </div>
          <RetroButton
            icon={<Plus size={14} />}
            variant="primary"
            onClick={() =>
              subTab === "articles"
                ? setCreateArticleOpen(true)
                : setCreateSnippetOpen(true)
            }
          >
            novo {subTab === "articles" ? "artigo" : "snippet"}
          </RetroButton>
        </div>
      </div>

      <div className="paper-split flex-1 flex min-h-0">
        <aside className="paper-list w-[340px] shrink-0 overflow-y-auto retro-scrollbar">
          <div className="p-2 text-[11px] uppercase tracking-widest text-retro-comment border-b border-retro-border flex items-center gap-2 sticky top-0 bg-retro-bgDark/80 backdrop-blur-sm z-10">
            <LayoutList size={12} />
            {subTab === "articles"
              ? `artigos (${filteredArticles.length})`
              : `snippets (${filteredSnippets.length})`}
          </div>
          {subTab === "articles" ? (
            filteredArticles.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-retro-comment">
                nenhum artigo encontrado
              </div>
            ) : (
              filteredArticles.map((a) => {
                const active = a.id === selectedArticleId;
                const isDue = due.some((d) => d.id === a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => selectArticle(a)}
                    className={`group px-3 py-2.5 border-b border-retro-border/60 cursor-pointer transition-colors ${
                      active
                        ? "bg-retro-purple/10 border-l-2 border-l-retro-purple"
                        : "hover:bg-retro-panelHover"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-retro-text font-medium text-[13px] line-clamp-2">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-retro-comment line-clamp-2 mt-1">
                          {a.summary}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          {a.tags.slice(0, 3).map((t) => (
                            <RetroBadge key={t} tone="default">
                              {t}
                            </RetroBadge>
                          ))}
                          {isDue && (
                            <RetroBadge tone="orange">revisar</RetroBadge>
                          )}
                        </div>
                        <div className="mt-1.5 text-[10.5px] text-retro-comment flex items-center gap-1">
                          <Calendar size={10} />
                          {humanDueLabel(a.nextReviewAt)} · interval:{" "}
                          {a.interval}d
                        </div>
                      </div>
                      <div className="shrink-0 flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {a.url && (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-retro-text-dim hover:text-retro-blue border border-transparent hover:border-retro-border"
                            title="Abrir URL"
                          >
                            <ExternalLink size={11} />
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectArticle(a);
                            setEditArticleOpen(true);
                          }}
                          className="p-1 text-retro-text-dim hover:text-retro-blue border border-transparent hover:border-retro-border"
                          title="Editar"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelArticle(a);
                          }}
                          className="p-1 text-retro-text-dim hover:text-retro-red border border-transparent hover:border-retro-border"
                          title="Excluir"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : filteredSnippets.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-retro-comment">
              nenhum snippet encontrado
            </div>
          ) : (
            filteredSnippets.map((sn) => {
              const active = sn.id === selectedSnippetId;
              return (
                <div
                  key={sn.id}
                  onClick={() => selectSnippet(sn)}
                  className={`group px-3 py-2.5 border-b border-retro-border/60 cursor-pointer transition-colors ${
                    active
                      ? "bg-retro-blue/10 border-l-2 border-l-retro-blue"
                      : "hover:bg-retro-panelHover"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-retro-text font-medium text-[13px]">
                        {sn.title}
                      </p>
                      {sn.description && (
                        <p className="text-[11px] text-retro-comment line-clamp-1 mt-0.5">
                          {sn.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <RetroBadge tone="blue">{sn.language}</RetroBadge>
                        {sn.tags.slice(0, 2).map((t) => (
                          <RetroBadge key={t} tone="default">
                            {t}
                          </RetroBadge>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectSnippet(sn);
                          setEditSnippetOpen(true);
                        }}
                        className="p-1 text-retro-text-dim hover:text-retro-blue border border-transparent hover:border-retro-border"
                        title="Editar"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelSnippet(sn);
                        }}
                        className="p-1 text-retro-text-dim hover:text-retro-red border border-transparent hover:border-retro-border"
                        title="Excluir"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </aside>

        <section className="paper-detail flex-1 min-w-0 flex flex-col">
          {subTab === "articles" ? (
            selectedArticle ? (
              <>
                <div className="p-4 border-b border-retro-border bg-retro-bgDark flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText size={14} className="text-retro-purple" />
                      <h2 className="text-retro-text font-semibold text-[14.5px] truncate">
                        {selectedArticle.title}
                      </h2>
                      {due.some((d) => d.id === selectedArticle.id) && (
                        <RetroBadge tone="orange">para revisar</RetroBadge>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 flex-wrap text-[11.5px] text-retro-comment">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} />
                        próxima revisão:{" "}
                        {humanDueLabel(selectedArticle.nextReviewAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Gauge size={11} />
                        interval: {selectedArticle.interval}d · ease:{" "}
                        {selectedArticle.easeFactor.toFixed(2)} · reps:{" "}
                        {selectedArticle.repetitions}
                      </span>
                      {selectedArticle.url && (
                        <a
                          href={selectedArticle.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-retro-blue hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink size={11} />
                          fonte
                        </a>
                      )}
                    </div>
                    {selectedArticle.tags.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        <Tag size={11} className="text-retro-comment" />
                        {selectedArticle.tags.map((t) => (
                          <RetroBadge key={t} tone="purple">
                            {t}
                          </RetroBadge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <RetroButton
                      variant="default"
                      icon={<Pencil size={13} />}
                      onClick={() => setEditArticleOpen(true)}
                    >
                      editar
                    </RetroButton>
                    <RetroButton
                      variant="default"
                      icon={<Trash2 size={13} />}
                      onClick={() => setConfirmDelArticle(selectedArticle)}
                      className="hover:!text-retro-red hover:!border-retro-red/60"
                    >
                      excluir
                    </RetroButton>
                    <RetroButton
                      variant="primary"
                      icon={<Save size={13} />}
                      onClick={handleArticleInlineSave}
                      disabled={!articleDirty}
                    >
                      salvar
                    </RetroButton>
                  </div>
                </div>

                {due.some((d) => d.id === selectedArticle.id) && (
                  <div className="px-4 py-3 border-b border-retro-border bg-retro-orange/5 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-[12px]">
                      <Brain size={14} className="text-retro-orange" />
                      <span className="text-retro-orange font-semibold">
                        este artigo está na fila de revisão SRS:
                      </span>
                      <span className="text-retro-comment">
                        classificando-o avança seu intervalo no algoritmo SM-2.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(["again", "hard", "medium", "easy"] as SrsRating[]).map(
                        (r) => (
                          <RetroButton
                            key={r}
                            variant={r === "medium" ? "primary" : "default"}
                            onClick={() => handleReviewArticle(r)}
                            className={
                              r === "again"
                                ? "!border-retro-red/50 !text-retro-red hover:!bg-retro-red/10 !px-2 !py-1"
                                : r === "hard"
                                  ? "!border-retro-orange/50 !text-retro-orange hover:!bg-retro-orange/10 !px-2 !py-1"
                                  : r === "easy"
                                    ? "!border-retro-green/50 !text-retro-green hover:!bg-retro-green/10 !px-2 !py-1"
                                    : "!px-2 !py-1"
                            }
                          >
                            {r}
                          </RetroButton>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 border-b border-retro-border bg-retro-bgDark/30">
                  <RetroCard
                    accent="purple"
                    title="Resumo"
                    icon={<FileText size={13} />}
                  >
                    <textarea
                      value={articleEditSummary}
                      onChange={(e) => {
                        setArticleEditSummary(e.target.value);
                        setArticleDirty(true);
                      }}
                      rows={2}
                      className="retro-input w-full resize-y text-[13px]"
                    />
                  </RetroCard>
                </div>

                <div className="flex-1 min-h-0">
                  <ArticleEditor
                    value={articleEditContent}
                    filename={`${selectedArticle.title
                      .toLowerCase()
                      .replace(/\s+/g, "-")}.md`}
                    onChange={(v) => {
                      setArticleEditContent(v);
                      setArticleDirty(true);
                    }}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                subtitle="artigos"
                onCreate={() => setCreateArticleOpen(true)}
              />
            )
          ) : selectedSnippet ? (
            <>
              <div className="p-4 border-b border-retro-border bg-retro-bgDark flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileCode size={14} className="text-retro-blue" />
                    <h2 className="text-retro-text font-semibold text-[14.5px] truncate">
                      {selectedSnippet.title}
                    </h2>
                    <RetroBadge tone="blue">
                      {selectedSnippet.language}
                    </RetroBadge>
                  </div>
                  {selectedSnippet.description && (
                    <p className="mt-1 text-[12px] text-retro-comment">
                      {selectedSnippet.description}
                    </p>
                  )}
                  {selectedSnippet.tags.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <Tag size={11} className="text-retro-comment" />
                      {selectedSnippet.tags.map((t) => (
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
                    icon={<Pencil size={13} />}
                    onClick={() => setEditSnippetOpen(true)}
                  >
                    editar
                  </RetroButton>
                  <RetroButton
                    variant="default"
                    icon={<Trash2 size={13} />}
                    onClick={() => setConfirmDelSnippet(selectedSnippet)}
                    className="hover:!text-retro-red hover:!border-retro-red/60"
                  >
                    excluir
                  </RetroButton>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <CodeEditor
                  value={selectedSnippet.code}
                  language={selectedSnippet.language as any}
                  filename={`${selectedSnippet.title
                    .toLowerCase()
                    .replace(/\s+/g, "-")}.${selectedSnippet.language}`}
                  readOnly={true}
                />
              </div>
            </>
          ) : (
            <EmptyState
              subtitle="snippets"
              onCreate={() => setCreateSnippetOpen(true)}
            />
          )}
        </section>
      </div>

      <RetroModal
        open={createArticleOpen}
        onClose={() => setCreateArticleOpen(false)}
        title="Novo artigo"
        accent="purple"
        size="xl"
        icon={<FileText size={15} />}
        footer={
          <>
            <RetroButton
              variant="default"
              onClick={() => setCreateArticleOpen(false)}
            >
              cancelar
            </RetroButton>
            <RetroButton
              variant="primary"
              icon={<Save size={13} />}
              onClick={() => {
                const form = document.getElementById(
                  "art-create-form",
                ) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            >
              criar artigo
            </RetroButton>
          </>
        }
      >
        <ArticleForm formId="art-create-form" onSubmit={handleCreateArticle} />
      </RetroModal>

      <RetroModal
        open={editArticleOpen}
        onClose={() => setEditArticleOpen(false)}
        title="editar artigo"
        accent="purple"
        size="xl"
        icon={<Pencil size={15} />}
        footer={
          <>
            <RetroButton
              variant="default"
              onClick={() => setEditArticleOpen(false)}
            >
              cancelar
            </RetroButton>
            <RetroButton
              variant="primary"
              icon={<Save size={13} />}
              onClick={() => {
                const form = document.getElementById(
                  "art-edit-form",
                ) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            >
              salvar
            </RetroButton>
          </>
        }
      >
        <ArticleForm
          formId="art-edit-form"
          initial={selectedArticle ?? undefined}
          onSubmit={handleEditArticleSave}
        />
      </RetroModal>

      <RetroModal
        open={createSnippetOpen}
        onClose={() => setCreateSnippetOpen(false)}
        title="Novo snippet"
        accent="blue"
        size="xl"
        icon={<FileCode size={15} />}
        footer={
          <>
            <RetroButton
              variant="default"
              onClick={() => setCreateSnippetOpen(false)}
            >
              cancelar
            </RetroButton>
            <RetroButton
              variant="primary"
              icon={<Save size={13} />}
              onClick={() => {
                const form = document.getElementById(
                  "sn-create-form",
                ) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            >
              criar snippet
            </RetroButton>
          </>
        }
      >
        <SnippetForm formId="sn-create-form" onSubmit={handleCreateSnippet} />
      </RetroModal>

      <RetroModal
        open={editSnippetOpen}
        onClose={() => setEditSnippetOpen(false)}
        title="editar snippet"
        accent="blue"
        size="xl"
        icon={<Pencil size={15} />}
        footer={
          <>
            <RetroButton
              variant="default"
              onClick={() => setEditSnippetOpen(false)}
            >
              cancelar
            </RetroButton>
            <RetroButton
              variant="primary"
              icon={<Save size={13} />}
              onClick={() => {
                const form = document.getElementById(
                  "sn-edit-form",
                ) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            >
              salvar
            </RetroButton>
          </>
        }
      >
        <SnippetForm
          formId="sn-edit-form"
          initial={selectedSnippet ?? undefined}
          onSubmit={handleEditSnippetSave}
        />
      </RetroModal>

      <ConfirmDialog
        open={confirmDelArticle !== null}
        title="Excluir artigo?"
        tone="danger"
        message={`Você realmente quer excluir o artigo "${confirmDelArticle?.title}"?\n\nEsta ação NÃO pode ser desfeita.`}
        confirmLabel="excluir permanentemente"
        onConfirm={handleDeleteArticle}
        onCancel={() => setConfirmDelArticle(null)}
      />

      <ConfirmDialog
        open={confirmDelSnippet !== null}
        title="Excluir snippet?"
        tone="danger"
        message={`Você realmente quer excluir o snippet "${confirmDelSnippet?.title}"?\n\nEsta ação NÃO pode ser desfeita.`}
        confirmLabel="excluir permanentemente"
        onConfirm={handleDeleteSnippet}
        onCancel={() => setConfirmDelSnippet(null)}
      />
    </div>
  );
}

function EmptyState({
  subtitle,
  onCreate,
}: {
  subtitle: string;
  onCreate: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-retro-border bg-retro-bgDark/40">
        <RetroCard
          accent="purple"
          className="!border-t-0 !border !p-3"
          title="Seu espaço de estudo"
          icon={<Brain size={13} />}
        >
          <ul className="text-[12px] text-retro-text-dim list-disc pl-5 space-y-0.5">
            <li>
              Artigos podem entrar na sua fila de revisão.
            </li>
            <li>
              Trechos de código ficam organizados por linguagem.
            </li>
            <li>Abra uma nota para escrever e acompanhar a prévia.</li>
          </ul>
        </RetroCard>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <FileQuestion size={52} className="text-retro-comment mx-auto mb-4" />
          <h2 className="text-retro-purple text-lg font-bold mb-1">
            Escolha um {subtitle.slice(0, -1)}
          </h2>
          <p className="text-retro-comment text-[13px]">
            Selecione um item da lista ou crie um novo para começar.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <RetroButton
              variant="primary"
              icon={<Plus size={14} />}
              onClick={onCreate}
            >
              + novo {subtitle.slice(0, -1)}
            </RetroButton>
          </div>
        </div>
      </div>
    </div>
  );
}
