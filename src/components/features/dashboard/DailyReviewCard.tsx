import {
  CalendarClock,
  Code2,
  Layers,
  FileText,
  Flame,
  CalendarX,
} from "lucide-react";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroButton } from "@/components/ui/RetroButton";
import type {
  LeetCodeProblem,
  Flashcard,
  Article,
  Difficulty,
} from "@core/types";
import { useAppStore } from "@/store/useAppStore";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";

type AnyItem = (LeetCodeProblem | Flashcard | Article) & {
  __kind: "leetcode" | "flashcard" | "article";
};

interface DailyReviewCardProps {
  title: string;
  subtitle: string;
  accent: "green" | "yellow" | "red" | "blue" | "purple" | "orange";
  items: AnyItem[];
  emptyMsg: string;
  max?: number;
}

const KIND_META: Record<
  AnyItem["__kind"],
  { icon: typeof Code2; pageId: "leetcode" | "flashcards" | "articles" }
> = {
  leetcode: { icon: Code2, pageId: "leetcode" },
  flashcard: { icon: Layers, pageId: "flashcards" },
  article: { icon: FileText, pageId: "articles" },
};

function toneForDifficultyOrInterval(
  item: AnyItem,
): "green" | "yellow" | "red" | "orange" | "purple" | "blue" {
  if (item.__kind === "leetcode") {
    const map: Record<Difficulty, "green" | "yellow" | "red"> = {
      easy: "green",
      medium: "yellow",
      hard: "red",
    };
    return map[(item as LeetCodeProblem).difficulty];
  }
  if (item.__kind === "flashcard") {
    const f = item as Flashcard;
    if (f.repetitions === 0) return "purple";
    if (f.interval <= 0) return "red";
    if (f.interval <= 1) return "orange";
    if (f.interval <= 4) return "yellow";
    return "green";
  }
  return "blue";
}

function labelFor(item: AnyItem): string {
  if (item.__kind === "leetcode")
    return (item as LeetCodeProblem).difficulty.toUpperCase();
  if (item.__kind === "flashcard") {
    const f = item as Flashcard;
    if (f.repetitions === 0) return "NOVO";
    if (f.interval <= 0) return "NOVAMENTE";
    if (f.interval <= 1) return "DIFÍCIL";
    if (f.interval <= 4) return "MÉDIO";
    return "FÁCIL";
  }
  return "REVISÃO";
}

function titleOf(item: AnyItem): string {
  if (item.__kind === "flashcard") return (item as Flashcard).question;
  return (item as LeetCodeProblem | Article).title;
}

function tagsOf(item: AnyItem): string[] {
  return "tags" in item ? (item.tags as string[]) : [];
}

export function DailyReviewCard({
  title,
  subtitle,
  accent,
  items,
  emptyMsg,
  max = 6,
}: DailyReviewCardProps) {
  const openTab = useAppStore((s) => s.openTab);
  const show = items.slice(0, max);
  const overflow = items.length - show.length;

  const IconAccent = accent === "green" ? Flame : CalendarClock;

  return (
    <RetroCard
      title={title}
      accent={accent}
      icon={<IconAccent size={15} />}
      right={
        <span className="text-[11px] text-retro-text-dim">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </span>
      }
    >
      <p className="text-[11.5px] text-retro-comment -mt-2 mb-3">{subtitle}</p>

      {show.length === 0 ? (
        <div className="flex items-center gap-3 p-4 border border-dashed border-retro-border bg-retro-bgDark/40">
          <CalendarX size={20} className="text-retro-text-dim shrink-0" />
          <div>
            <p className="text-[13px] text-retro-text-dim">{emptyMsg}</p>
            <p className="text-[11px] text-retro-comment mt-0.5">
              Volte amanhã ou adicione algo novo para estudar.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {show.map((it) => {
            const meta = KIND_META[it.__kind];
            const Icon = meta.icon;
            const tone = toneForDifficultyOrInterval(it);
            const distance = formatDistance(
              new Date(it.nextReviewAt),
              new Date(),
              {
                addSuffix: true,
                locale: ptBR,
              },
            );
            return (
              <li
                key={`${it.__kind}-${it.id}`}
                className="group p-3 border border-retro-border bg-retro-bgDark/40 hover:bg-retro-panelHover transition-colors cursor-pointer"
                onClick={() => openTab(meta.pageId)}
              >
                <div className="flex items-start gap-3">
                  <span className={`rough-circle tone-surface tone-${tone} shrink-0 mt-0.5 p-1.5 border-2 inline-flex`}>
                    <Icon size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-retro-text leading-snug line-clamp-2 group-hover:text-retro-green transition-colors">
                      {titleOf(it)}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <RetroBadge tone={tone}>{labelFor(it)}</RetroBadge>
                        {tagsOf(it)
                          .slice(0, 3)
                          .map((t) => (
                            <RetroBadge key={t} tone="default">
                              {t}
                            </RetroBadge>
                          ))}
                      </div>
                      <span className={`tone-text tone-${tone} text-[11px] inline-flex items-center gap-1`}>
                        <CalendarClock size={11} /> venceu {distance}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(overflow > 0 || show.length > 0) && (
        <div className="mt-3 pt-3 border-t border-retro-border/70 flex items-center justify-between gap-2">
          {overflow > 0 ? (
            <span className="text-[11.5px] text-retro-comment">
              ... +{overflow} {overflow === 1 ? "item" : "itens"} para revisar.
            </span>
          ) : (
            <span />
          )}
          <RetroButton variant="primary" onClick={() => openTab("flashcards")}>
            começar sessão de estudos
          </RetroButton>
        </div>
      )}
    </RetroCard>
  );
}
