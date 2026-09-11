import { useMemo } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ReviewCounter } from "./ReviewCounter";
import { DailyReviewCard } from "./DailyReviewCard";
import { useFlashcardStore } from "@/store/useFlashcardStore";
import { useLeetCodeStore } from "@/store/useLeetCodeStore";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroBadge } from "@/components/ui/RetroBadge";
import {
  Flame,
  Target,
  TrendingUp,
  PencilLine,
  CalendarDays,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { LeetCodeProblem, Flashcard } from "@core/types";

export function DashboardContent() {
  const dueFC = useFlashcardStore((s) => s.getDueCards());
  const rating = useFlashcardStore((s) => s.getDueCountByRating());
  const dueLC = useLeetCodeStore((s) => s.getDueProblems());
  const allLC = useLeetCodeStore((s) => s.problems);
  const total = dueFC.length + dueLC.length;

  const todayItems = useMemo(() => {
    const arr: (
      | (LeetCodeProblem & { __kind: "leetcode" })
      | (Flashcard & { __kind: "flashcard" })
    )[] = [];
    dueLC.forEach((p) => arr.push({ ...p, __kind: "leetcode" }));
    dueFC.forEach((c) => arr.push({ ...c, __kind: "flashcard" }));
    arr.sort((a, b) => +new Date(a.nextReviewAt) - +new Date(b.nextReviewAt));
    return arr;
  }, [dueLC, dueFC]);

  const streak = 7;
  const today = new Date();
  const solvedToday = Math.min(2, dueLC.length);
  const goalPct =
    total === 0
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            Math.round((solvedToday / Math.max(1, Math.min(5, total))) * 100),
          ),
        );

  const upcomingWeek = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { date: d, key: k };
  });

  const solvedByDifficulty = {
    easy: allLC.filter((p) => p.difficulty === "easy").length,
    medium: allLC.filter((p) => p.difficulty === "medium").length,
    hard: allLC.filter((p) => p.difficulty === "hard").length,
  };

  return (
    <div className="min-h-full p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <section className="retro-card retro-card--tape border-t-[3px] border-t-retro-orange relative overflow-visible mt-3 md:p-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none dashboard-wash"
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-center gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[14px] uppercase tracking-[0.14em] text-retro-comment mb-2">
              <PencilLine size={16} className="text-retro-blue" />
              <span>anotação do dia</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-retro-text leading-tight">
              Olá, <span className="text-retro-blue">coder!</span>{" "}
              <span className="text-retro-text">Hoje é </span>
              <span className="text-retro-orange inline-block rotate-[-1deg]">
                {format(today, "EEEE, dd/MM", { locale: ptBR })}
              </span>
            </h1>
            <p className="text-[17px] md:text-xl text-retro-text-dim mt-3 max-w-2xl leading-relaxed">
              Organize a revisão de hoje começando pelo que está pendente.
              Vá no seu ritmo.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 justify-self-start lg:justify-self-end">
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-retro-panelHover border-2 border-retro-border rounded-wobbly rotate-2">
                <Flame size={14} className="text-retro-orange" />
                <span className="text-[11px] uppercase tracking-widest text-retro-orange font-bold">
                  sequência
                </span>
              </div>
              <div className="mt-1 text-right">
                <span className="text-[26px] font-bold text-retro-orange leading-none">
                  {streak}
                </span>
                <span className="text-[11px] text-retro-text-dim ml-1">
                  dias
                </span>
              </div>
            </div>

            <div className="w-[84px] h-[84px] shrink-0 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-retro-border"
                />
                <path
                  d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${goalPct}, 100`}
                  className="text-retro-green transition-all"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[13px] font-bold text-retro-green">
                  {goalPct}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-retro-text-dim">
                  meta
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Counter Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <ReviewCounter
          kind="overview"
          title="Para hoje"
          subtitle="Flashcards e desafios pendentes."
          count={total}
          tone="green"
          accent="green"
          icon={<Target size={18} />}
          subCounts={[
            { label: "LC", value: dueLC.length, tone: "orange" },
            { label: "FC", value: dueFC.length, tone: "blue" },
          ]}
          goal={`meta diária: ${Math.max(5, total)} revisões`}
        />
        <ReviewCounter
          kind="leetcode"
          title="Desafios"
          subtitle="Desafios para revisar hoje."
          count={dueLC.length}
          tone="orange"
          accent="orange"
          subCounts={[
            {
              label: "easy",
              value: dueLC.filter((p) => p.difficulty === "easy").length,
              tone: "green",
            },
            {
              label: "medium",
              value: dueLC.filter((p) => p.difficulty === "medium").length,
              tone: "yellow",
            },
            {
              label: "hard",
              value: dueLC.filter((p) => p.difficulty === "hard").length,
              tone: "red",
            },
          ]}
        />
        <ReviewCounter
          kind="flashcards"
          title="Flashcards"
          subtitle="Cartões que já estão na hora de rever."
          count={dueFC.length}
          tone="blue"
          accent="blue"
          subCounts={[
            { label: "novos", value: rating.again, tone: "purple" },
            { label: "hard", value: rating.hard, tone: "red" },
            { label: "medium", value: rating.medium, tone: "yellow" },
            { label: "easy", value: rating.easy, tone: "green" },
          ]}
        />
      </section>

      {/* Main 2-col grid */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <DailyReviewCard
            title="Para fazer hoje"
            subtitle="Comece pelo que já está atrasado ou vence hoje."
            accent="orange"
            items={todayItems}
            emptyMsg="Nada pendente por enquanto. Você pode estudar algo novo ou fazer uma pausa."
            max={8}
          />
        </div>

        <div className="space-y-4">
          <RetroCard
            title="Próximos 7 dias"
            accent="yellow"
            icon={<CalendarDays size={15} />}
          >
            <ul className="grid grid-cols-7 gap-1.5 text-center">
              {upcomingWeek.map(({ date, key }) => {
                const isToday = (i: number) => i === 0;
                const n = upcomingWeek.findIndex((w) => w.key === key);
                const base = isToday(n)
                  ? "bg-retro-yellow/20 border-retro-yellow text-retro-yellow"
                  : "bg-retro-panel border-retro-border/70 text-retro-text-dim";
                return (
                  <li
                    key={key}
                    className={`aspect-square border flex flex-col items-center justify-center py-1.5 ${base}`}
                    title={format(date, "dd/MM/yyyy")}
                  >
                    <span className="text-[9px] uppercase tracking-widest">
                      {format(date, "EEE", { locale: ptBR })
                        .slice(0, 3)
                        .replace(".", "")}
                    </span>
                    <span className="text-[14px] font-semibold leading-none mt-0.5">
                      {format(date, "dd")}
                    </span>
                    <span className="mt-1">
                      {isToday(n) ? (
                        total > 0 ? (
                          <CheckCircle2
                            size={11}
                            className="text-retro-green"
                          />
                        ) : (
                          <CheckCircle2
                            size={11}
                            className="text-retro-comment"
                          />
                        )
                      ) : (
                        <Circle size={11} className="opacity-60" />
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </RetroCard>

          <RetroCard
            title="Progresso LeetCode"
            accent="blue"
            icon={<TrendingUp size={15} />}
          >
            <div className="space-y-3">
              {(["easy", "medium", "hard"] as const).map((k) => {
                const v = solvedByDifficulty[k];
                const toneMap = {
                  easy: "green",
                  medium: "yellow",
                  hard: "red",
                } as const;
                const pct = Math.min(
                  100,
                  Math.round(
                    (v /
                      Math.max(
                        1,
                        solvedByDifficulty.easy +
                          solvedByDifficulty.medium +
                          solvedByDifficulty.hard,
                      )) *
                      100,
                  ),
                );
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-[11.5px] mb-1">
                      <RetroBadge tone={toneMap[k]}>
                        {k.toUpperCase()}
                      </RetroBadge>
                      <span className="text-retro-text-dim">
                        {v} resolvidos
                      </span>
                    </div>
                    <div className="h-2 bg-retro-bgDark border border-retro-border overflow-hidden">
                      <div className={`tone-fill tone-${toneMap[k]} h-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </RetroCard>

        </div>
      </section>
    </div>
  );
}
