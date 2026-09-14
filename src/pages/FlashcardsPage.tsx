import { useMemo, useState } from "react";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroModal, ConfirmDialog } from "@/components/ui/RetroModal";
import { StudySession } from "@/components/features/flashcards/StudySession";
import { FlashcardForm } from "@/components/features/flashcards/FlashcardForm";
import { StudyPhaseForm } from "@/components/features/flashcards/StudyPhaseForm";
import { FlashcardReader } from "@/components/features/flashcards/FlashcardReader";
import { useFlashcardStore } from "@/store/useFlashcardStore";
import { useLeetCodeStore } from "@/store/useLeetCodeStore";
import { useStudyPhaseStore } from "@/store/useStudyPhaseStore";
import { useAppStore } from "@/store/useAppStore";
import { useQuizStore } from "@/store/useQuizStore";
import type { Flashcard, QuizQuestion, SrsRating, StudyPhase } from "@core/types";
import { humanDueLabel } from "@core/lib/srs-algorithm";
import { getQuizQuestionNumber } from "@core/lib/quiz";
import {
  BookOpenCheck,
  Code2,
  Edit3,
  FileQuestion,
  Layers3,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

type CollectionId = "today" | "all" | string;

export function FlashcardsPage() {
  const cards = useFlashcardStore((state) => state.cards);
  const dueCards = useFlashcardStore((state) => state.getDueCards());
  const addCard = useFlashcardStore((state) => state.addCard);
  const updateCard = useFlashcardStore((state) => state.updateCard);
  const deleteCard = useFlashcardStore((state) => state.deleteCard);
  const reviewCard = useFlashcardStore((state) => state.reviewCard);
  const problems = useLeetCodeStore((state) => state.problems);
  const phases = useStudyPhaseStore((state) => state.phases);
  const addPhase = useStudyPhaseStore((state) => state.addPhase);
  const updatePhase = useStudyPhaseStore((state) => state.updatePhase);
  const deletePhase = useStudyPhaseStore((state) => state.deletePhase);
  const openTab = useAppStore((state) => state.openTab);
  const quizQuestions = useQuizStore((state) => state.questions);

  const [collectionId, setCollectionId] = useState<CollectionId>("today");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [cardBeingEdited, setCardBeingEdited] = useState<Flashcard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  const [phaseFormOpen, setPhaseFormOpen] = useState(false);
  const [phaseBeingEdited, setPhaseBeingEdited] = useState<StudyPhase | null>(null);
  const [phaseToDelete, setPhaseToDelete] = useState<StudyPhase | null>(null);

  const activePhase = useMemo(
    () => phases.find((phase) => phase.id === collectionId) ?? null,
    [collectionId, phases],
  );

  const collectionCards = useMemo(() => {
    if (activePhase) {
      const ids = new Set(activePhase.flashcardIds);
      return cards.filter((card) => ids.has(card.id));
    }
    return collectionId === "all" ? cards : dueCards;
  }, [activePhase, cards, collectionId, dueCards]);

  const filteredCards = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return collectionCards;
    return collectionCards.filter((card) =>
      [card.question, card.answer, card.language, ...card.tags]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(query)),
    );
  }, [collectionCards, search]);

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null;
  const phaseProblems = activePhase
    ? problems.filter((problem) => activePhase.problemIds.includes(problem.id))
    : [];
  const phaseItemCount = activePhase
    ? activePhase.flashcardIds.length + activePhase.problemIds.length
    : 0;

  const collectionTitle = activePhase
    ? activePhase.title
    : collectionId === "all"
      ? "Todos os cartões"
      : "Revisão de hoje";
  const collectionDescription = activePhase
    ? activePhase.description || "Uma fase organizada por você."
    : collectionId === "all"
      ? "Consulte e organize todo o seu material."
      : "Só o que está na hora de revisar, sem distrações.";

  const createCard = async (input: Parameters<typeof addCard>[0]) => {
    const created = await addCard(input);
    setCardFormOpen(false);
    setSelectedCardId(created.id);
  };

  const saveCard = async (input: Parameters<typeof addCard>[0]) => {
    if (!cardBeingEdited) return;
    await updateCard(cardBeingEdited.id, input);
    setCardBeingEdited(null);
  };

  const savePhase = async (input: {
    title: string;
    description?: string;
    flashcardIds: string[];
    problemIds: string[];
  }) => {
    if (phaseBeingEdited) {
      await updatePhase(phaseBeingEdited.id, input);
      setCollectionId(phaseBeingEdited.id);
    } else {
      const created = await addPhase(input);
      setCollectionId(created.id);
    }
    setPhaseFormOpen(false);
    setPhaseBeingEdited(null);
  };

  const removePhase = async () => {
    if (!phaseToDelete) return;
    await deletePhase(phaseToDelete.id);
    if (collectionId === phaseToDelete.id) setCollectionId("today");
    setPhaseToDelete(null);
  };

  return (
    <div className="h-full flex flex-col paper-page">
      <header className="paper-toolbar flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2">
            <BookOpenCheck size={23} className="text-retro-blue" aria-hidden />
            Revisão
          </h1>
          <p className="mt-1 text-[14px] text-retro-text-dim">
            Monte fases por tópico e escolha o que quer estudar em cada uma.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RetroButton
            variant="default"
            icon={<Plus size={15} />}
            onClick={() => {
              setPhaseBeingEdited(null);
              setPhaseFormOpen(true);
            }}
          >
            nova fase
          </RetroButton>
          <RetroButton variant="primary" icon={<Plus size={15} />} onClick={() => setCardFormOpen(true)}>
            novo flashcard
          </RetroButton>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto retro-scrollbar p-3 border-b xl:border-b-0 xl:border-r border-retro-border/60 bg-retro-bgDark">
          <div className="flex items-center justify-between px-2 pb-2">
            <h2 className="text-[14px] font-semibold text-retro-text">Fases de estudo</h2>
            <span className="text-[12px] text-retro-comment">{phases.length}</span>
          </div>
          <nav className="space-y-1" aria-label="Fases de estudo">
            <CollectionButton
              active={collectionId === "today"}
              icon={<Play size={15} />}
              title="Revisar hoje"
              detail={`${dueCards.length} cartões pendentes`}
              onClick={() => setCollectionId("today")}
            />
            <CollectionButton
              active={collectionId === "all"}
              icon={<Layers3 size={15} />}
              title="Todos os cartões"
              detail={`${cards.length} cartões no total`}
              onClick={() => setCollectionId("all")}
            />
            {phases.length > 0 ? (
              <p className="px-2 pt-4 pb-1 text-[12px] font-semibold text-retro-comment">Suas fases</p>
            ) : (
              <div className="mx-2 mt-4 border border-dashed border-retro-border rounded-lg p-3 text-[12px] text-retro-comment">
                <p className="font-semibold text-retro-text-dim">Nenhuma fase criada</p>
                <p className="mt-1 leading-relaxed">Clique em “nova fase” para montar uma seleção de flashcards e desafios.</p>
              </div>
            )}
            {phases.map((phase) => (
              <div key={phase.id} className="group relative">
                <CollectionButton
                  active={collectionId === phase.id}
                  icon={<BookOpenCheck size={15} />}
                  title={phase.title}
                  detail={`${phase.flashcardIds.length} cartões · ${phase.problemIds.length} desafios`}
                  onClick={() => setCollectionId(phase.id)}
                />
                <div className="absolute right-2 top-2 z-20 flex gap-1 rounded-md border border-retro-border bg-retro-bgDark p-0.5">
                  <button
                    type="button"
                    className="p-1.5 text-retro-text-dim hover:text-retro-blue hover:bg-retro-panelHover rounded"
                    aria-label={`Editar fase ${phase.title}`}
                    title="Editar fase"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPhaseBeingEdited(phase);
                      setPhaseFormOpen(true);
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-retro-text-dim hover:text-retro-red hover:bg-retro-panelHover rounded"
                    aria-label={`Excluir fase ${phase.title}`}
                    title="Excluir fase"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPhaseToDelete(phase);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-h-0 flex flex-col">
          <section className="p-4 md:p-5 border-b border-retro-border/60 bg-retro-bgDark">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-[22px] font-semibold text-retro-text">{collectionTitle}</h2>
                <p className="mt-1 text-[14px] text-retro-text-dim">{collectionDescription}</p>
              </div>
              <div className="flex items-center gap-2">
                {activePhase && <span className="text-[13px] text-retro-text-dim">{phaseItemCount} itens na fase</span>}
                <RetroButton
                  variant="primary"
                  icon={<Play size={15} />}
                  disabled={collectionCards.length === 0}
                  onClick={() => setSessionOpen(true)}
                >
                  estudar {collectionCards.length} cartões
                </RetroButton>
              </div>
            </div>
            {activePhase && phaseProblems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-retro-border/60">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="inline-flex items-center gap-2 text-[14px] font-semibold text-retro-text">
                    <Code2 size={16} className="text-retro-orange" /> Desafios nesta fase
                  </h3>
                  <RetroButton variant="ghost" onClick={() => openTab("leetcode")}>abrir desafios</RetroButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  {phaseProblems.map((problem) => (
                    <span key={problem.id} className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] border border-retro-border/60 rounded-lg text-retro-text">
                      {problem.title}
                      <span className="text-retro-comment">{problem.difficulty}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(270px,0.72fr)_minmax(0,1.7fr)]">
            <section className="min-h-0 flex flex-col border-b lg:border-b-0 lg:border-r border-retro-border/60 bg-retro-bgDark">
              <div className="p-3 border-b border-retro-border/60">
                <label className="relative block">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-retro-comment" aria-hidden />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar nesta lista"
                    className="retro-input pl-9"
                    aria-label="Buscar flashcards"
                  />
                </label>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto retro-scrollbar p-2 space-y-1">
                {filteredCards.length > 0 ? filteredCards.map((card) => (
                  <CardListItem
                    key={card.id}
                    card={card}
                    active={card.id === selectedCardId}
                    onClick={() => setSelectedCardId(card.id)}
                    linkedQuestion={card.quizQuestionId ? quizQuestions.find((question) => question.id === card.quizQuestionId) : undefined}
                    questionBank={quizQuestions}
                  />
                )) : (
                  <div className="p-8 text-center">
                    <FileQuestion size={34} className="mx-auto mb-3 text-retro-comment" aria-hidden />
                    <p className="text-[14px] text-retro-text-dim">Nenhum flashcard encontrado aqui.</p>
                  </div>
                )}
              </div>
            </section>

            {selectedCard ? (
              <section className="min-h-0 flex flex-col">
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-retro-border/60 bg-retro-bgDark">
                  <span className="text-[13px] text-retro-text-dim">Próxima revisão: {humanDueLabel(selectedCard.nextReviewAt)}</span>
                  <div className="flex gap-1">
                    <RetroButton variant="ghost" onClick={() => setCardBeingEdited(selectedCard)}><Edit3 size={14} /> editar</RetroButton>
                    <RetroButton variant="ghost" className="hover:!text-retro-red" onClick={() => setCardToDelete(selectedCard)}><Trash2 size={14} /> excluir</RetroButton>
                  </div>
                </div>
                <FlashcardReader card={selectedCard} />
              </section>
            ) : (
              <div className="min-h-0 flex items-center justify-center p-8 bg-retro-bg">
                <div className="max-w-sm text-center">
                  <BookOpenCheck size={44} className="mx-auto mb-4 text-retro-blue" aria-hidden />
                  <h2 className="text-[20px] font-semibold text-retro-text">Escolha um flashcard</h2>
                  <p className="mt-2 text-[14px] text-retro-text-dim">A pergunta e a resposta aparecem abertas aqui para você ler com calma.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {sessionOpen && <StudySession cards={collectionCards} onReview={(id, rating: SrsRating) => reviewCard(id, rating)} onClose={() => setSessionOpen(false)} />}

      <RetroModal
        open={cardFormOpen}
        onClose={() => setCardFormOpen(false)}
        title="Novo flashcard"
        subtitle="Escreva uma pergunta clara e uma resposta que você consiga revisar depois."
        accent="blue"
        size="xl"
        icon={<Plus size={16} />}
        footer={<><RetroButton variant="default" onClick={() => setCardFormOpen(false)}>cancelar</RetroButton><RetroButton variant="primary" onClick={() => (document.getElementById("flashcard-create") as HTMLFormElement | null)?.requestSubmit()}>criar flashcard</RetroButton></>}
      >
        <FlashcardForm formId="flashcard-create" questions={quizQuestions} onSubmit={createCard} />
      </RetroModal>

      <RetroModal
        open={cardBeingEdited !== null}
        onClose={() => setCardBeingEdited(null)}
        title="Editar flashcard"
        subtitle="Atualize o conteúdo sem perder a organização da sua revisão."
        accent="blue"
        size="xl"
        icon={<Pencil size={16} />}
        footer={<><RetroButton variant="default" onClick={() => setCardBeingEdited(null)}>cancelar</RetroButton><RetroButton variant="primary" onClick={() => (document.getElementById("flashcard-edit") as HTMLFormElement | null)?.requestSubmit()}>salvar</RetroButton></>}
      >
        <FlashcardForm formId="flashcard-edit" initial={cardBeingEdited ?? undefined} questions={quizQuestions} onSubmit={saveCard} />
      </RetroModal>

      <RetroModal
        open={phaseFormOpen}
        onClose={() => { setPhaseFormOpen(false); setPhaseBeingEdited(null); }}
        title={phaseBeingEdited ? "Editar fase" : "Nova fase"}
        subtitle="Escolha o material que faz sentido estudar junto."
        accent="purple"
        size="xl"
        icon={<Layers3 size={16} />}
        footer={<><RetroButton variant="default" onClick={() => { setPhaseFormOpen(false); setPhaseBeingEdited(null); }}>cancelar</RetroButton><RetroButton variant="primary" onClick={() => (document.getElementById("study-phase-form") as HTMLFormElement | null)?.requestSubmit()}>{phaseBeingEdited ? "salvar fase" : "criar fase"}</RetroButton></>}
      >
        <StudyPhaseForm formId="study-phase-form" cards={cards} problems={problems} initial={phaseBeingEdited ?? undefined} onSubmit={savePhase} />
      </RetroModal>

      <ConfirmDialog
        open={cardToDelete !== null}
        title="Excluir flashcard?"
        tone="danger"
        message="Este flashcard deixará de fazer parte das suas revisões."
        confirmLabel="excluir flashcard"
        onConfirm={async () => { if (cardToDelete) { await deleteCard(cardToDelete.id); if (selectedCardId === cardToDelete.id) setSelectedCardId(null); } setCardToDelete(null); }}
        onCancel={() => setCardToDelete(null)}
      />
      <ConfirmDialog
        open={phaseToDelete !== null}
        title="Excluir fase?"
        tone="danger"
        message="Os flashcards e desafios continuarão salvos. Apenas a organização desta fase será removida."
        confirmLabel="excluir fase"
        onConfirm={removePhase}
        onCancel={() => setPhaseToDelete(null)}
      />
    </div>
  );
}

function CollectionButton({
  active,
  icon,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors ${active ? "bg-retro-blue/10 border-retro-blue text-retro-text" : "border-transparent hover:bg-retro-panelHover text-retro-text-dim"}`}
      aria-pressed={active}
    >
      <span className="mt-0.5 text-retro-blue">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold leading-snug truncate">{title}</span>
        <span className="block mt-1 text-[12px] text-retro-comment truncate">{detail}</span>
      </span>
    </button>
  );
}

function CardListItem({
  card,
  active,
  linkedQuestion,
  questionBank,
  onClick,
}: {
  card: Flashcard;
  active: boolean;
  linkedQuestion?: QuizQuestion;
  questionBank: QuizQuestion[];
  onClick: () => void;
}) {
  return (
    <div className="group">
      <button
        onClick={onClick}
        className={`w-full text-left p-3 rounded-lg border transition-colors ${active ? "bg-retro-blue/10 border-retro-blue" : "border-transparent hover:bg-retro-panelHover hover:border-retro-border/50"}`}
        aria-pressed={active}
      >
        <span className="block text-[14px] leading-snug font-medium text-retro-text line-clamp-2">{card.question}</span>
        <span className="flex items-center justify-between gap-2 mt-2 text-[12px] text-retro-comment">
          <span className="truncate">{card.tags.slice(0, 2).join(" · ") || card.language || "sem tópico"}</span>
          <span className="shrink-0">{humanDueLabel(card.nextReviewAt)}</span>
        </span>
        {linkedQuestion && (
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-retro-blue">
            <FileQuestion size={12} aria-hidden /> Q{getQuizQuestionNumber(linkedQuestion, questionBank)} vinculada
          </span>
        )}
      </button>
      {linkedQuestion && (
        <div className="hidden group-hover:block -mt-1 rounded-b-lg border border-t-0 border-retro-blue/50 bg-retro-panel p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-retro-blue">
            Prévia da questão vinculada · Q{getQuizQuestionNumber(linkedQuestion, questionBank)}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-retro-text line-clamp-4">{linkedQuestion.statement}</p>
          <p className="mt-2 text-[11px] text-retro-comment">
            {linkedQuestion.examName || "prova"} · {linkedQuestion.topic}
          </p>
        </div>
      )}
    </div>
  );
}
