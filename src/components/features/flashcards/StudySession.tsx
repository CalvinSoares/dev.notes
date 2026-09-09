import { useMemo, useState } from "react";
import type { Flashcard, SrsRating } from "@core/types";
import { FlipCard } from "./FlipCard";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroBadge } from "@/components/ui/RetroBadge";
import {
  humanNextInterval,
} from "@core/lib/srs-algorithm";
import { X, CheckCircle2, RotateCcw, Brain, Sparkles, Trophy, BarChart3 } from "lucide-react";

interface StudySessionProps {
  cards: Flashcard[];
  onReview: (cardId: string, rating: SrsRating) => Promise<void>;
  onClose: () => void;
}

type SessionStats = Record<SrsRating, number>;

export function StudySession({ cards, onReview, onClose }: StudySessionProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ again: 0, hard: 0, medium: 0, easy: 0 });
  const [rated, setRated] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const current = cards[index];
  const total = cards.length;
  const doneCount = index + (rated.has(current?.id ?? "") ? 1 : 0);
  const progressPct = total > 0 ? Math.min(100, (doneCount / total) * 100) : 0;

  const ratingLabels = useMemo(() => {
    if (!current) return {} as Record<SrsRating, string>;
    const pick = (r: SrsRating) => humanNextInterval(current, r);
    return {
      again: `Again · ${pick("again")}`,
      hard: `Hard · ${pick("hard")}`,
      medium: `Medium · ${pick("medium")}`,
      easy: `Easy · ${pick("easy")}`,
    } as Record<SrsRating, string>;
  }, [current]);

  const handleRate = async (rating: SrsRating) => {
    if (!current || rated.has(current.id)) return;
    const id = current.id;
    setRated((prev) => new Set(prev).add(id));
    setStats((s) => ({ ...s, [rating]: s[rating] + 1 }));
    try {
      await onReview(id, rating);
    } finally {
      setTimeout(() => {
        if (index + 1 >= total) {
          setFinished(true);
        } else {
          setIndex((i) => i + 1);
          setFlipped(false);
        }
      }, 180);
    }
  };

  if (total === 0) {
    return (
      <SessionShell onClose={onClose}>
        <div className="flex-1 flex items-center justify-center p-10 text-center">
          <div>
            <Sparkles size={48} className="text-retro-green mx-auto mb-4" />
            <h2 className="text-retro-green text-xl font-bold mb-2">
              Nenhum cartão para revisar
            </h2>
            <p className="text-retro-comment text-[13px]">
              Não há cartões para revisar no momento.
            </p>
          </div>
        </div>
      </SessionShell>
    );
  }

  if (finished) {
    return (
      <SessionShell onClose={onClose}>
        <div className="flex-1 min-h-0 overflow-y-auto retro-scrollbar">
          <div className="max-w-2xl mx-auto p-8">
            <div className="text-center mb-8">
              <Trophy size={56} className="text-retro-yellow mx-auto mb-4" />
              <h2 className="text-retro-yellow text-2xl font-bold">
                sessão concluída!
              </h2>
              <p className="text-retro-comment text-[13px] mt-2">
                Você revisou {total} cartões. Bom trabalho.
              </p>
            </div>

            <div className="border-2 border-retro-border bg-retro-bgDark p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-retro-blue" />
                <h3 className="text-[14px] font-semibold text-retro-blue uppercase tracking-wider">
                  estatísticas por rating
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBlock tone="red" label="Again" value={stats.again} total={total} icon={<RotateCcw size={14} />} />
                <StatBlock tone="orange" label="Hard" value={stats.hard} total={total} />
                <StatBlock tone="yellow" label="Medium" value={stats.medium} total={total} />
                <StatBlock tone="green" label="Easy" value={stats.easy} total={total} icon={<CheckCircle2 size={14} />} />
              </div>
            </div>

            <div className="border border-retro-border bg-retro-bgDark/50 p-4 mb-8 text-[12.5px] text-retro-text-dim space-y-1">
              <div className="flex justify-between">
                <span className="text-retro-comment">cartões revisados</span>
                <span className="text-retro-text font-semibold">{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-retro-comment">taxa de acerto (med+easy)</span>
                <span className="text-retro-green font-semibold">
                  {total > 0 ? Math.round(((stats.medium + stats.easy) / total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-retro-comment">reposições (again)</span>
                <span className="text-retro-red font-semibold">{stats.again}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <RetroButton variant="primary" onClick={onClose}>
                <Brain size={14} /> voltar ao deck
              </RetroButton>
            </div>
          </div>
        </div>
      </SessionShell>
    );
  }

  return (
    <SessionShell onClose={onClose}>
      <div className="h-12 shrink-0 flex items-center justify-between px-6 border-b border-retro-border bg-retro-bgDark/60">
        <div className="flex items-center gap-3">
          <Brain size={16} className="text-retro-purple" />
          <span className="text-[12px] uppercase tracking-[0.18em] text-retro-comment font-semibold">
            Sessão de revisão
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[13px] text-retro-text">
            <span className="text-retro-green">{Math.min(doneCount, total)}</span>
            <span className="text-retro-comment"> / {total}</span>
          </span>
          <RetroBadge tone="purple">
            #{index + 1}
          </RetroBadge>
        </div>
      </div>

      <div className="h-1 shrink-0 bg-retro-border">
        <div
          className="h-full bg-retro-green transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto retro-scrollbar bg-retro-bg">
        {current && (
          <FlipCard
            card={current}
            flipped={flipped}
            onFlipChange={setFlipped}
          />
        )}
      </div>

      <div className="shrink-0 border-t border-retro-border bg-retro-bgDark p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11.5px] text-retro-comment uppercase tracking-wider">
            {flipped
              ? "como você classificou este cartão?"
              : "revele a resposta antes de classificar"}
          </p>
          {flipped && (
            <RetroButton variant="ghost" onClick={() => setFlipped(false)}>
              <RotateCcw size={12} /> esconder resposta
            </RetroButton>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RatingButton
            tone="red"
            label={ratingLabels.again ?? "Again"}
            disabled={!flipped || rated.has(current?.id ?? "")}
            onClick={() => handleRate("again")}
          />
          <RatingButton
            tone="orange"
            label={ratingLabels.hard ?? "Hard"}
            disabled={!flipped || rated.has(current?.id ?? "")}
            onClick={() => handleRate("hard")}
          />
          <RatingButton
            tone="yellow"
            label={ratingLabels.medium ?? "Medium"}
            disabled={!flipped || rated.has(current?.id ?? "")}
            onClick={() => handleRate("medium")}
          />
          <RatingButton
            tone="green"
            label={ratingLabels.easy ?? "Easy"}
            disabled={!flipped || rated.has(current?.id ?? "")}
            onClick={() => handleRate("easy")}
          />
        </div>
      </div>
    </SessionShell>
  );
}

function SessionShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-retro-bg/95 flex flex-col paper-page">
      <div className="absolute top-3 right-3 z-10">
        <RetroButton variant="ghost" onClick={onClose} className="!px-2 !py-1">
          <X size={16} />
        </RetroButton>
      </div>
      {children}
    </div>
  );
}

function RatingButton({
  tone,
  label,
  onClick,
  disabled,
}: {
  tone: "red" | "orange" | "yellow" | "green";
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const toneMap = {
    red: "bg-retro-red/10 border-retro-red/60 text-retro-red hover:bg-retro-red/22 disabled:bg-retro-red/5 disabled:border-retro-red/20 disabled:text-retro-red/40",
    orange: "bg-retro-orange/10 border-retro-orange/60 text-retro-orange hover:bg-retro-orange/22 disabled:bg-retro-orange/5 disabled:border-retro-orange/20 disabled:text-retro-orange/40",
    yellow: "bg-retro-yellow/10 border-retro-yellow/60 text-retro-yellow hover:bg-retro-yellow/22 disabled:bg-retro-yellow/5 disabled:border-retro-yellow/20 disabled:text-retro-yellow/40",
    green: "bg-retro-green/10 border-retro-green/60 text-retro-green hover:bg-retro-green/22 disabled:bg-retro-green/5 disabled:border-retro-green/20 disabled:text-retro-green/40",
  } as const;
  const [main, sub] = label.split(" · ");
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border-[3px] px-2 py-3 text-[15px] transition-all duration-100 flex flex-col items-center justify-center gap-0.5 select-none disabled:cursor-not-allowed rounded-wobbly shadow-paper enabled:hover:translate-x-[2px] enabled:hover:translate-y-[2px] enabled:hover:shadow-none ${toneMap[tone]}`}
    >
      <span className="font-bold uppercase tracking-wider">{main}</span>
      {sub && <span className="text-[11px] opacity-80">· {sub}</span>}
    </button>
  );
}

function StatBlock({
  tone,
  label,
  value,
  total,
  icon,
}: {
  tone: "red" | "orange" | "yellow" | "green";
  label: string;
  value: number;
  total: number;
  icon?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    red: "border-retro-red/50 bg-retro-red/5",
    orange: "border-retro-orange/50 bg-retro-orange/5",
    yellow: "border-retro-yellow/50 bg-retro-yellow/5",
    green: "border-retro-green/50 bg-retro-green/5",
  };
  const text: Record<string, string> = {
    red: "text-retro-red",
    orange: "text-retro-orange",
    yellow: "text-retro-yellow",
    green: "text-retro-green",
  };
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`border-[3px] ${tones[tone]} p-3 text-center rounded-wobblyMd rotate-[-.4deg]`}>
      <div className="flex items-center justify-center gap-1 mb-2">
        {icon && <span className={text[tone]}>{icon}</span>}
        <span className={`text-[11px] uppercase tracking-widest font-semibold ${text[tone]}`}>
          {label}
        </span>
      </div>
      <div className={`text-3xl font-bold font-mono ${text[tone]}`}>{value}</div>
      <div className="text-[11px] text-retro-comment mt-1">{pct}%</div>
    </div>
  );
}
