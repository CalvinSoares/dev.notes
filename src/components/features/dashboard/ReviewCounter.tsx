import {
  LayoutDashboard,
  Code2,
  Layers,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { PageId } from "@core/types";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { useAppStore } from "@/store/useAppStore";

type Tone =
  | "green"
  | "yellow"
  | "red"
  | "blue"
  | "purple"
  | "orange"
  | "default";

interface ReviewCounterProps {
  kind: PageId | "overview";
  title: string;
  subtitle: string;
  count: number;
  subCounts?: { label: string; value: number; tone: Tone }[];
  tone: Tone;
  accent: Tone;
  icon?: React.ReactNode;
  goal?: string;
}

const ICON_BY_KIND: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard size={18} />,
  leetcode: <Code2 size={18} />,
  flashcards: <Layers size={18} />,
  articles: <FileText size={18} />,
};

export function ReviewCounter({
  kind,
  title,
  subtitle,
  count,
  subCounts,
  tone,
  accent,
  icon,
  goal,
}: ReviewCounterProps) {
  const openTab = useAppStore((s) => s.openTab);
  const pageMap: Partial<Record<string, PageId>> = {
    leetcode: "leetcode",
    flashcards: "flashcards",
    articles: "articles",
  };
  const actionable = !!pageMap[kind];

  return (
    <div
      className={`retro-card border-t-[3px] relative overflow-hidden group cursor-${
        actionable ? "pointer" : "default"
      } tone-${accent}`}
      onClick={actionable ? () => openTab(pageMap[kind]!) : undefined}
    >
      <div
        aria-hidden
        className="rough-blob tone-fill absolute -right-8 -top-8 w-32 h-32 opacity-10 transition-opacity group-hover:opacity-20 rotate-12"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`rough-circle tone-surface tone-${tone} inline-flex p-2 border-2 rotate-[-2deg]`}
            >
              {icon ?? ICON_BY_KIND[kind] ?? <Sparkles size={18} />}
            </span>
            <h3 className="text-[13px] font-semibold text-retro-text tracking-wide">
              {title}
            </h3>
          </div>
          <p className="text-[11.5px] text-retro-comment mt-1">{subtitle}</p>
        </div>

        <div className="text-right shrink-0">
          <div className={`tone-text tone-${tone} text-[32px] font-bold leading-none`}>
            {count}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-retro-text-dim mt-0.5">
            pendente{count === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-retro-border/70 relative">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {subCounts?.map((s) => (
              <RetroBadge key={s.label} tone={s.tone}>
                {s.label}: {s.value}
              </RetroBadge>
            ))}
          </div>
          {actionable ? (
            <span className={`tone-text tone-${tone} inline-flex items-center gap-1 text-[11px] transition-all group-hover:gap-2`}>
              abrir módulo <ArrowRight size={12} />
            </span>
          ) : goal ? (
            <span className="text-[11px] text-retro-comment">{goal}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
